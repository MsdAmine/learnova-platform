package com.learnova.learnova_backend.course.dto;

import com.learnova.learnova_backend.course.entity.CourseLevel;
import java.util.List;

public record PublicCourseDetailResponse(
        Long id,
        String title,
        String description,
        CourseLevel level,
        String thumbnailUrl,
        Long categoryId,
        String categoryName,
        String instructorName,
        List<PublicSectionPreview> sections) {
}