package com.learnova.learnova_backend.course.dto;

public record AnswerOptionResponse(
        Long id,
        String optionText,
        Boolean isCorrect) {
}