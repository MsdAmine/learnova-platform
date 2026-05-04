package com.learnova.learnova_backend.course.dto;

import com.learnova.learnova_backend.course.entity.CourseLevel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CourseRequest(

        @NotBlank(message = "Title is required")
        @Size(max = 200, message = "Title must not exceed 200 characters")
        String title,

        @Size(max = 2000, message = "Description must not exceed 2000 characters")
        String description,

        @NotNull(message = "Category is required")
        Long categoryId,

        @NotNull(message = "Level is required")
        CourseLevel level,

        @Size(max = 500, message = "Thumbnail URL must not exceed 500 characters")
        String thumbnailUrl
) {}