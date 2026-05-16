package com.learnova.learnova_backend.course.dto;

import java.util.List;

public record PublicSectionPreview(
        Long id,
        String title,
        Integer position,
        List<PublicLessonPreview> lessons) {
}