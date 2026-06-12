package com.portfolio.model;

import java.util.List;
import java.util.Map;

public record GithubSummary(
        int totalRepos,
        int totalStars,
        Map<String, Integer> languageCount,
        List<RepoDto> topRepos,
        List<RepoDto> recentRepos
) {}
