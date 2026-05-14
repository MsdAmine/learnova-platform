package com.learnova.learnova_backend.course.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

public record SectionRequest(
        @NotBlank(message = "Title is required") String title,
        @NotNull(message = "Position is required") @PositiveOrZero Integer position) {
}