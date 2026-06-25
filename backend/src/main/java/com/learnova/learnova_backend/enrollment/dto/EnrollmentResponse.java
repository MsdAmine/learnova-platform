package com.learnova.learnova_backend.enrollment.dto;

import com.learnova.learnova_backend.enrollment.entity.EnrollmentStatus;

import java.time.Instant;

public record EnrollmentResponse(
        Long id,
        Long courseId,
        String courseTitle,
        String instructorName,
        String categoryName,
        String thumbnailUrl,
        EnrollmentStatus status,
        Integer progressPercentage,
        Instant enrolledAt,
        Instant completedAt
) {}
