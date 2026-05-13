package com.learnova.learnova_backend.course.dto;

import com.learnova.learnova_backend.course.entity.CourseLevel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CourseUpdateRequest(
        @NotBlank(message = "Title is required") @Size(max = 200, message = "Title must be under 200 characters") String title,

        @Size(max = 2000, message = "Description must be under 2000 characters") String description,

        @NotNull(message = "Category ID is required") Long categoryId,

        @NotNull(message = "Level is required") CourseLevel level,

        @Size(max = 500, message = "Thumbnail URL must be under 500 characters") String thumbnailUrl) {
}