package com.learnova.learnova_backend.course.dto;

import com.learnova.learnova_backend.course.entity.LessonContentType;

public record PublicLessonPreview(
        Long id,
        String title,
        Integer position,
        LessonContentType contentType) {
}