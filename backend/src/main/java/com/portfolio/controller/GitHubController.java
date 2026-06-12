package com.portfolio.controller;

import com.portfolio.service.GitHubService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/github")
public class GitHubController {

    private final GitHubService gitHubService;

    public GitHubController(GitHubService gitHubService) {
        this.gitHubService = gitHubService;
    }

    @GetMapping("/repos")
    public ResponseEntity<?> getRepos() {
        try {
            return ResponseEntity.ok(gitHubService.getPublicRepos());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of("error", "GitHub API 연결 실패", "detail", e.getMessage()));
        }
    }

    @GetMapping("/repos/{name}")
    public ResponseEntity<?> getRepo(@PathVariable String name) {
        try {
            return ResponseEntity.ok(gitHubService.getRepo(name));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "레포를 찾을 수 없습니다.", "detail", e.getMessage()));
        }
    }

    @GetMapping("/summary")
    public ResponseEntity<?> getSummary() {
        try {
            return ResponseEntity.ok(gitHubService.getSummary());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of("error", "GitHub 요약 생성 실패", "detail", e.getMessage()));
        }
    }
}
