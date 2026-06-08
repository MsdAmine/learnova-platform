package com.learnova.learnova_backend.course.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record AnswerOptionRequest(
        @NotBlank(message = "Option text cannot be blank") String optionText,

        @NotNull(message = "You must explicitly specify if this answer option is correct") Boolean isCorrect) {
}