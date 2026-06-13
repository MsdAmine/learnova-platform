package com.learnova.learnova_backend.course.dto;

import java.util.List;

public record SectionContentResponse(
        Long id,
        String title,
        List<LessonContentResponse> lessons) {
}
