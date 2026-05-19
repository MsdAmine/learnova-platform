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
public class EnrollmentResponse {
    private Long id;
    private Long courseId;
    private String courseTitle;
    private String status;
    private Instant enrolledAt;
    private String accessSummary;
}