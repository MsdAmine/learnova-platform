package com.learnova.learnova_backend.course.dto;

import java.util.List;

public record CourseContentResponse(
        Long courseId,
        String courseTitle,
        List<SectionContentResponse> sections) {
}
