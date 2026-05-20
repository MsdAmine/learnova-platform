package com.learnova.learnova_backend.course.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LearnerLessonDTO {
    private Long id;
    private String title;
    private Integer position;
    private String contentType;
    private String contentUrl;
    private String textContent;
    @Builder.Default
    private Boolean isCompleted = false;
}
