package com.learnova.learnova_backend.profile.dto;

import jakarta.validation.constraints.Size;

public record LearnerProfileUpdateRequest(

        @Size(max = 150, message = "Display name must not exceed 150 characters")
        String displayName,

        @Size(max = 500, message = "Bio must not exceed 500 characters")
        String bio,

        @Size(max = 500, message = "Profile image URL must not exceed 500 characters")
        String profileImageUrl
) {
}
