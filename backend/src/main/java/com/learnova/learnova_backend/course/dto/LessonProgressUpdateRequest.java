package com.learnova.learnova_backend.course.dto;

import jakarta.validation.constraints.NotNull;

public record LessonProgressUpdateRequest(
        @NotNull(message = "Completion status must be specified") Boolean isCompleted,

        Integer lastPositionSeconds,

        Integer timeSpentSeconds) {
}