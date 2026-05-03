package com.learnova.learnova_backend.profile.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record InstructorProfileRequest(

        @NotBlank(message = "Bio is required")
        @Size(max = 1000, message = "Bio must not exceed 1000 characters")
        String bio,

        @NotBlank(message = "Expertise is required")
        @Size(max = 500, message = "Expertise must not exceed 500 characters")
        String expertise,

        @Size(max = 1000, message = "Experience must not exceed 1000 characters")
        String experience,

        @Size(max = 1000, message = "Motivation must not exceed 1000 characters")
        String motivation
) {
}