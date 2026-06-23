package com.learnova.learnova_backend.course.dto;

import com.learnova.learnova_backend.course.entity.LessonContentType;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateLessonRequest(

        @NotBlank(message = "Lesson title is required")
        @Size(max = 200, message = "Lesson title must not exceed 200 characters")
        String title,

        // Nullable: a lesson may be created as a structural placeholder with no
        // body content yet. When present, the content fields below are validated
        // conditionally against the chosen type.
        LessonContentType contentType,

        @Size(max = 20000, message = "Lesson text must not exceed 20000 characters")
        String textContent,

        @Size(max = 2048, message = "Content URL must not exceed 2048 characters")
        String contentUrl,

        @Min(value = 0, message = "Duration must not be negative")
        Integer durationSeconds
) {

    @AssertTrue(message = "Text lessons require body content")
    public boolean isTextContentValid() {
        return LessonContentValidation.isTextContentValid(contentType, textContent);
    }

    @AssertTrue(message = "This content type requires a valid http or https URL")
    public boolean isContentUrlValid() {
        return LessonContentValidation.isContentUrlValid(contentType, contentUrl);
    }
}
