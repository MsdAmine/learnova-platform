package com.learnova.learnova_backend.course.dto;

public record CourseProgressResponse(
        Long courseId,
        int totalLessons,
        int completedLessons,
        int progressPercentage,
        boolean isFullyCompleted) {
}