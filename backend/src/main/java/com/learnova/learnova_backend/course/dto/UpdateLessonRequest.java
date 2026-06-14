package com.learnova.learnova_backend.course.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateLessonRequest(

        @NotBlank(message = "Lesson title is required")
        @Size(max = 200, message = "Lesson title must not exceed 200 characters")
        String title
) {}
