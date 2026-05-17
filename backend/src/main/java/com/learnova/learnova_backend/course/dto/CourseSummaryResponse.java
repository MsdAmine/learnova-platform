package com.learnova.learnova_backend.course.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseSummaryResponse {
    private Long id;
    private String title;
    private String description;
    private String categoryName;
    private String level;
    private String thumbnailUrl;
    private String instructorName;
    private Double ratingPlaceholder; // Core requirement placeholder for future review engine
    private Integer enrollmentCountPlaceholder; // Core requirement placeholder for future metrics
    private LocalDateTime createdAt;
}