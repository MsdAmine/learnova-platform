package com.learnova.learnova_backend.course.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateSectionRequest(

        @NotBlank(message = "Section title is required")
        @Size(max = 200, message = "Section title must not exceed 200 characters")
        String title
) {}
