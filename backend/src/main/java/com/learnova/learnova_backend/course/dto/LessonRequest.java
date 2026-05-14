package com.learnova.learnova_backend.course.dto;

import com.learnova.learnova_backend.course.entity.LessonContentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

public record LessonRequest(
        @NotBlank(message = "Title is required") String title,
        @NotNull(message = "Position is required") @PositiveOrZero Integer position,
        @NotNull(message = "Content type is required") LessonContentType contentType,
        String contentUrl,
        String textContent) {
}