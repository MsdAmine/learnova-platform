package com.learnova.learnova_backend.course.dto;

import com.learnova.learnova_backend.course.entity.QuestionType;
import java.util.List;

public record QuestionResponse(
        Long id,
        String content,
        Integer points,
        QuestionType type,
        List<AnswerOptionResponse> answerOptions) {
}