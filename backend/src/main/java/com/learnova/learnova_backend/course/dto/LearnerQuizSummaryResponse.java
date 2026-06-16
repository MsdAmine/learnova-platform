package com.learnova.learnova_backend.course.dto;

public record LearnerQuizSummaryResponse(
        Long id,
        String title,
        String description,
        Integer passingScore,
        Long courseId,
        Long sectionId) {
}
