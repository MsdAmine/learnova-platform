package com.learnova.learnova_backend.course.dto;

import com.learnova.learnova_backend.course.entity.LessonContentType;

public record LessonContentResponse(
        Long id,
        String title,
        LessonContentType contentType,
        String textContent,
        String contentUrl,
        Integer durationSeconds,
        boolean completed,
        Integer lastPositionSeconds,
        Integer timeSpentSeconds) {
}
