package com.portfolio.service;

import com.portfolio.model.GithubSummary;
import com.portfolio.model.RepoDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class GitHubService {

    private static final Logger log = LoggerFactory.getLogger(GitHubService.class);
    private final RestTemplate restTemplate;

    @Value("${github.username}")
    private String username;

    @Value("${github.token:}")
    private String token;

    public GitHubService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public List<RepoDto> getPublicRepos() {
        String url = "https://api.github.com/users/" + username
                + "/repos?sort=updated&per_page=100";

        ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                new HttpEntity<>(buildHeaders()),
                new ParameterizedTypeReference<>() {}
        );

        List<Map<String, Object>> raw = response.getBody();
        if (raw == null) return List.of();

        log.info("GitHub API 응답 레포 수: {}", raw.size());
        raw.forEach(r -> log.info("  레포: {} (fork={})", r.get("name"), r.get("fork")));

        List<RepoDto> result = new ArrayList<>();
        for (Map<String, Object> r : raw) {
            try {
                result.add(mapToDto(r, null));
            } catch (Exception e) {
                log.error("mapToDto 실패 - name={}, error={}", r.get("name"), e.getMessage(), e);
            }
        }
        return result;
    }

    public RepoDto getRepo(String repoName) {
        String url = "https://api.github.com/repos/" + username + "/" + repoName;
        ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                new HttpEntity<>(buildHeaders()),
                new ParameterizedTypeReference<>() {}
        );
        Map<String, Object> raw = response.getBody();
        if (raw == null) throw new RuntimeException("레포를 찾을 수 없습니다.");

        // language가 없으면 /languages API로 보완
        if (raw.get("language") == null) {
            String topLang = fetchTopLanguage(repoName);
            if (topLang != null) {
                raw = new HashMap<>(raw);
                raw.put("language", topLang);
            }
        }

        String readme = fetchReadme(repoName);
        return mapToDto(raw, readme);
    }

    private String fetchTopLanguage(String repoName) {
        try {
            String url = "https://api.github.com/repos/" + username + "/" + repoName + "/languages";
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    new HttpEntity<>(buildHeaders()),
                    new ParameterizedTypeReference<>() {}
            );
            Map<String, Object> langs = response.getBody();
            if (langs == null || langs.isEmpty()) return null;
            // 바이트 수가 가장 많은 언어 반환
            return langs.entrySet().stream()
                    .max(Comparator.comparingLong(e -> ((Number) e.getValue()).longValue()))
                    .map(Map.Entry::getKey)
                    .orElse(null);
        } catch (Exception e) {
            return null;
        }
    }

    private String fetchReadme(String repoName) {
        try {
            String url = "https://api.github.com/repos/" + username + "/" + repoName + "/readme";
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    new HttpEntity<>(buildHeaders()),
                    new ParameterizedTypeReference<>() {}
            );
            Map<String, Object> body = response.getBody();
            if (body == null) return null;

            String encoded = (String) body.get("content");
            if (encoded == null) return null;

            // GitHub API는 base64(줄바꿈 포함)로 반환
            byte[] decoded = Base64.getMimeDecoder().decode(encoded);
            String text = new String(decoded, StandardCharsets.UTF_8);

            // 마크다운 헤더/특수문자 제거 후 앞부분만 추출
            String plain = text
                    .replaceAll("(?m)^#+\\s*", "")      // ## 헤더 제거
                    .replaceAll("!\\[.*?\\]\\(.*?\\)", "") // 이미지 링크 제거
                    .replaceAll("\\[(.+?)\\]\\(.*?\\)", "$1") // 링크 텍스트만 남기기
                    .replaceAll("`{1,3}[^`]*`{1,3}", "")  // 코드블록 제거
                    .replaceAll("(?m)^[-*>]\\s*", "")     // 목록/인용 기호 제거
                    .replaceAll("\\n{3,}", "\n\n")         // 과도한 빈 줄 축소
                    .trim();

            return plain.length() > 300 ? plain.substring(0, 300) + "…" : plain;

        } catch (HttpClientErrorException.NotFound e) {
            return null;
        } catch (Exception e) {
            return null;
        }
    }

    public GithubSummary getSummary() {
        List<RepoDto> repos = getPublicRepos();

        int totalStars = repos.stream()
                .mapToInt(RepoDto::stars)
                .sum();

        Map<String, Integer> languageCount = repos.stream()
                .filter(r -> r.language() != null && !r.language().isBlank())
                .collect(Collectors.groupingBy(RepoDto::language, Collectors.summingInt(r -> 1)))
                .entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        Map.Entry::getValue,
                        (e1, e2) -> e1,
                        LinkedHashMap::new
                ));

        List<RepoDto> topRepos = repos.stream()
                .sorted(Comparator.comparingInt(RepoDto::stars).reversed())
                .limit(4)
                .toList();

        List<RepoDto> recentRepos = repos.stream()
                .limit(5)
                .toList();

        return new GithubSummary(repos.size(), totalStars, languageCount, topRepos, recentRepos);
    }

    private RepoDto mapToDto(Map<String, Object> r, String readme) {
        return new RepoDto(
                ((Number) r.get("id")).longValue(),
                (String) r.get("name"),
                (String) r.getOrDefault("description", ""),
                (String) r.get("html_url"),
                (String) r.getOrDefault("homepage", ""),
                (String) r.getOrDefault("language", ""),
                (List<String>) r.getOrDefault("topics", List.of()),
                ((Number) r.getOrDefault("stargazers_count", 0)).intValue(),
                (String) r.get("updated_at"),
                readme
        );
    }

    private HttpHeaders buildHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Accept", "application/vnd.github.v3+json");
        headers.set("X-GitHub-Api-Version", "2022-11-28");
        if (token != null && !token.isBlank()) {
            headers.set("Authorization", "Bearer " + token);
        }
        return headers;
    }
}
