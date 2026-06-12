package com.learnova.learnova_backend.course.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record QuizRequest(
        @NotBlank(message = "Quiz title is strictly required") @Size(max = 150, message = "Quiz title must not exceed 150 characters") String title,

        String description,

        @NotNull(message = "Passing score is required") @Min(value = 1, message = "Passing score must be at least 1%") @Max(value = 100, message = "Passing score cannot exceed 100%") Integer passingScore,

        Long sectionId) {
}