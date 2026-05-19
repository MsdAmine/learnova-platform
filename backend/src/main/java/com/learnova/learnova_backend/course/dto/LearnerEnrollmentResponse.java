package com.learnova.learnova_backend.course.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LearnerEnrollmentResponse {
    private Long enrollmentId;
    private Long courseId;
    private String title;
    private String thumbnailUrl;
    private String categoryName;
    private String level;
    private String instructorName;
    private String enrollmentStatus;
    private Instant enrolledAt;
    private Double progressPercentage;
    private Long lastAccessedLessonId;
}