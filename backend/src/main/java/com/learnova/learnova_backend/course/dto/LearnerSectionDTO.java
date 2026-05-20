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
public class LearnerSectionDTO {
    private Long id;
    private String title;
    private Integer position;
    private List<LearnerLessonDTO> lessons;
}
