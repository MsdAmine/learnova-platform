package com.learnova.learnova_backend.course.dto;

import jakarta.validation.constraints.NotNull;

public record QuizAttemptAnswerRequest(
        @NotNull Long questionId,
        @NotNull Long selectedOptionId) {
}
