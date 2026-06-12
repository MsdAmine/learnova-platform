package com.learnova.learnova_backend.course.dto;

import com.learnova.learnova_backend.course.entity.QuizStatus;
import java.time.LocalDateTime;

public record QuizResponse(
        Long id,
        String title,
        String description,
        Integer passingScore,
        QuizStatus status,
        Long courseId,
        Long sectionId,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {
}