package com.learnova.learnova_backend.course.dto;

import com.learnova.learnova_backend.course.entity.QuizStatus;

import java.time.LocalDateTime;
import java.util.List;

public record QuizDetailResponse(
        Long id,
        String title,
        String description,
        Integer passingScore,
        QuizStatus status,
        Long courseId,
        Long sectionId,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        List<QuestionResponse> questions) {
}
