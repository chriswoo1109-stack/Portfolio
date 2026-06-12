package com.portfolio.model;

import java.util.List;

public record RepoDto(
        Long id,
        String name,
        String description,
        String url,
        String homepage,
        String language,
        List<String> topics,
        Integer stars,
        String updatedAt,
        String readme
) {}
