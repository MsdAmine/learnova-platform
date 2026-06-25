package com.learnova.learnova_backend.course.dto;

/**
 * Public, learner-safe view of the instructor teaching a course. Excludes email,
 * approval status, and internal profile/user identifiers.
 */
public record PublicInstructorResponse(
        String displayName,
        String bio,
        String expertise,
        String experience
) {}
