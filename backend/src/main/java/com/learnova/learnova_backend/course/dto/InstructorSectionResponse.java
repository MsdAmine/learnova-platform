package com.learnova.learnova_backend.course.dto;

import java.util.List;

public record InstructorSectionResponse(
        Long id,
        String title,
        List<InstructorLessonResponse> lessons
) {}
