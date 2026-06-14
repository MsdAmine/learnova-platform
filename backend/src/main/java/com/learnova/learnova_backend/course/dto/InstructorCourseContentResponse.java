package com.learnova.learnova_backend.course.dto;

import java.util.List;

public record InstructorCourseContentResponse(
        Long courseId,
        String courseTitle,
        List<InstructorSectionResponse> sections
) {}
