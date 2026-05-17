package com.learnova.learnova_backend.course.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicCourseDetailResponse {
        private Long id;
        private String title;
        private String description;
        private String categoryName;
        private String level;
        private String thumbnailUrl;
        private String status;
        private String instructorName;
        private String instructorBioPlaceholder;
        private Integer totalSections;
        private Integer totalLessons;
        private List<PublicSectionDTO> sections;
}