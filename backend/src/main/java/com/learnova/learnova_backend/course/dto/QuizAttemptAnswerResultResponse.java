package com.learnova.learnova_backend.course.dto;

public record QuizAttemptAnswerResultResponse(
        Long questionId,
        Long selectedOptionId,
        Boolean correct,
        Integer earnedPoints) {
}
