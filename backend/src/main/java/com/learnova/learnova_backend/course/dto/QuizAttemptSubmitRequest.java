package com.learnova.learnova_backend.course.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record QuizAttemptSubmitRequest(
        @NotEmpty @Valid List<QuizAttemptAnswerRequest> answers) {
}
