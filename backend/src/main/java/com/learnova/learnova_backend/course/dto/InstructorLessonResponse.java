package com.learnova.learnova_backend.course.dto;

import com.learnova.learnova_backend.course.entity.LessonContentType;

public record InstructorLessonResponse(
        Long id,
        String title,
        LessonContentType contentType,
        String textContent,
        String contentUrl,
        Integer durationSeconds
) {}
