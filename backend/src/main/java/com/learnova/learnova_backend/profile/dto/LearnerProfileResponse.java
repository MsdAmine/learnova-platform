package com.learnova.learnova_backend.profile.dto;

import java.time.Instant;

public record LearnerProfileResponse(
        Long id,
        Long userId,
        String displayName,
        String bio,
        String profileImageUrl,
        Instant createdAt,
        Instant updatedAt
) {
}
