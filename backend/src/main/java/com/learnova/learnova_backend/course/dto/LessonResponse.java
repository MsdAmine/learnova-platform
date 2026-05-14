package com.learnova.learnova_backend.course.dto;

import com.learnova.learnova_backend.course.entity.LessonContentType;

public record LessonResponse(
        Long id,
        String title,
        Integer position,
        LessonContentType contentType,
        String contentUrl,
        String textContent,
        Long sectionId) {
}