package com.learnova.learnova_backend.course.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseSearchCriteria {
    private String keyword;
    private Long categoryId;
    private String level;
    private String instructorName;
    private String sortBy;
}