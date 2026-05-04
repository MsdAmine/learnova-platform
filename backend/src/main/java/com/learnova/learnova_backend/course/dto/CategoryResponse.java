package com.learnova.learnova_backend.course.dto;

import java.time.Instant;

public record CategoryResponse(
        Long id,
        String name,
        String description,
        Instant createdAt
) {}