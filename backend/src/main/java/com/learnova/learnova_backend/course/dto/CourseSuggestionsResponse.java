package com.learnova.learnova_backend.course.dto;

import java.util.List;

/**
 * Wrapper for the learner course-suggestions endpoint.
 *
 * <p>{@code personalized} is {@code true} only when at least one returned course
 * matches the learner's saved preferences (preferred category or level). When it
 * is {@code false}, {@code courses} is a transparent, recently-added fallback —
 * never fabricated personalization. {@code reason} is a short, honest explanation
 * of the basis the UI can surface verbatim.
 */
public record CourseSuggestionsResponse(
        boolean personalized,
        String reason,
        List<SuggestedCourseResponse> courses
) {}
