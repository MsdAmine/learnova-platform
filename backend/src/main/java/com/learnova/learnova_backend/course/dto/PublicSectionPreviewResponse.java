package com.learnova.learnova_backend.course.dto;

import java.util.List;

/** Public syllabus preview of a single section, with its ordered lesson previews. */
public record PublicSectionPreviewResponse(
        Long id,
        String title,
        int position,
        List<PublicLessonPreviewResponse> lessons
) {}
