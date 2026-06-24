package com.learnova.learnova_backend.course.dto;

import com.learnova.learnova_backend.course.entity.LessonContentType;

/**
 * Public syllabus preview of a single lesson. Deliberately excludes
 * {@code textContent} and {@code contentUrl} — those are enrolled-learner-only.
 */
public record PublicLessonPreviewResponse(
        Long id,
        String title,
        int position,
        LessonContentType contentType,
        Integer durationSeconds
) {}
