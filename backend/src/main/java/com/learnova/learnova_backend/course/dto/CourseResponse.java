package com.learnova.learnova_backend.course.dto;

import com.learnova.learnova_backend.course.entity.CourseLevel;
import com.learnova.learnova_backend.course.entity.CourseStatus;

import java.time.Instant;

public record CourseResponse(
        Long id,
        String title,
        String description,
        CourseLevel level,
        CourseStatus status,
        String thumbnailUrl,
        Long categoryId,
        String categoryName,
        Long instructorProfileId,
        String instructorName,
        Instant createdAt,
        Instant updatedAt
) {}