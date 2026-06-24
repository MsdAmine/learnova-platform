package com.learnova.learnova_backend.course.dto;

import com.learnova.learnova_backend.course.entity.CourseLevel;
import com.learnova.learnova_backend.course.entity.CourseStatus;

import java.time.Instant;
import java.util.List;

/**
 * Public, learner-facing course detail view: the catalog summary fields plus a safe
 * syllabus preview, derived totals, and public instructor details.
 *
 * <p>Deliberately excludes internal identifiers ({@code instructorProfileId},
 * {@code categoryId}) and enrolled-only lesson content ({@code textContent},
 * {@code contentUrl}). {@code status} will only ever be {@code PUBLISHED} here.
 */
public record CourseDetailResponse(
        Long id,
        String title,
        String description,
        CourseLevel level,
        CourseStatus status,
        String thumbnailUrl,
        String categoryName,
        Instant createdAt,
        PublicInstructorResponse instructor,
        List<PublicSectionPreviewResponse> sections,
        int sectionCount,
        int lessonCount,
        long totalDurationSeconds
) {}
