package com.learnova.learnova_backend.course.dto;

import java.util.List;

public record LearnerQuizDetailResponse(
        Long id,
        String title,
        String description,
        Integer passingScore,
        Long courseId,
        Long sectionId,
        List<LearnerQuestionResponse> questions) {
}
