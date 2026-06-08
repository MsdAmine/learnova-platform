package com.learnova.learnova_backend.course.dto;

import com.learnova.learnova_backend.course.entity.QuestionType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record QuestionRequest(
        @NotBlank(message = "Question content cannot be blank") String content,

        @NotNull(message = "Question points weight is required") @Min(value = 1, message = "Points must be at least 1") Integer points,

        @NotNull(message = "Question type is required") QuestionType type) {
}