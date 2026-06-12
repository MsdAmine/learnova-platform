package com.learnova.learnova_backend.course.dto;

import com.learnova.learnova_backend.course.entity.CourseLevel;
import com.learnova.learnova_backend.course.entity.CourseStatus;

import java.time.Instant;

/**
 * Learner-facing, read-only view of a course for the public catalog.
 *
 * <p>Deliberately excludes internal identifiers such as {@code instructorProfileId}
 * and {@code categoryId}; learners only need display data to browse and decide to
 * enroll. {@code status} is included but, per the public catalog contract, will only
 * ever be {@code PUBLISHED} on these endpoints.
 */
public record CourseCatalogResponse(
        Long id,
        String title,
        String description,
        CourseLevel level,
        CourseStatus status,
        String thumbnailUrl,
        String categoryName,
        String instructorName,
        Instant createdAt
) {}
