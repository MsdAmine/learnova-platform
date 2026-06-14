package com.learnova.learnova_backend.course.dto;

public record LessonContentResponse(
        Long id,
        String title,
        boolean completed,
        Integer lastPositionSeconds,
        Integer timeSpentSeconds) {
}
