package com.learnova.learnova_backend.course.dto;

import com.learnova.learnova_backend.course.entity.QuestionType;

import java.util.List;

public record LearnerQuestionResponse(
        Long id,
        String content,
        Integer points,
        QuestionType type,
        List<LearnerAnswerOptionResponse> answerOptions) {
}
