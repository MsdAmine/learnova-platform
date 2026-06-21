package com.learnova.learnova_backend.course.dto;

import com.learnova.learnova_backend.course.entity.QuizAttemptStatus;

import java.time.Instant;
import java.util.List;

public record QuizAttemptResponse(
        Long id,
        Long quizId,
        QuizAttemptStatus status,
        Instant startedAt,
        Integer earnedPoints,
        Integer totalPoints,
        Integer scorePercentage,
        Boolean passed,
        Instant submittedAt,
        List<QuizAttemptAnswerResultResponse> answerResults) {
}
