package com.learnova.learnova_backend.course.dto;

public record SectionResponse(
        Long id,
        String title,
        Integer position,
        Long courseId) {
}