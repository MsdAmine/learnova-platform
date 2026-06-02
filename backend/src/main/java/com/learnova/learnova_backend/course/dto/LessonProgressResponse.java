package com.learnova.learnova_backend.course.dto;

import java.time.LocalDateTime;

public record LessonProgressResponse(
        Long id,
        Long learnerProfileId,
        Long lessonId,
        boolean isCompleted,
        Integer lastPositionSeconds,
        Integer timeSpentSeconds,
        LocalDateTime updatedAt) {
}