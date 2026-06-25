package com.learnova.learnova_backend.course.dto;

import com.learnova.learnova_backend.course.entity.CourseLevel;

import java.time.Instant;
import java.util.List;

/**
 * A single recommended course for the learner dashboard "Recommended for you"
 * section.
 *
 * <p>Carries only the display fields a dashboard card needs. Internal scoring
 * values are never exposed — only human-readable {@code matchReasons} (e.g.
 * "Matches your interest in Data Analytics") that explain, transparently, why a
 * course was suggested. An empty {@code matchReasons} list means the course is a
 * non-personalized, recently-added fallback.
 */
public record SuggestedCourseResponse(
        Long id,
        String title,
        String description,
        String categoryName,
        CourseLevel level,
        String thumbnailUrl,
        String instructorName,
        Instant createdAt,
        List<String> matchReasons
) {}
