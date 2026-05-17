package com.learnova.learnova_backend.course.controller;

import com.learnova.learnova_backend.course.dto.CourseSearchCriteria;
import com.learnova.learnova_backend.course.dto.CourseSummaryResponse;
import com.learnova.learnova_backend.course.dto.PublicCourseDetailResponse;
import com.learnova.learnova_backend.course.service.PublicCourseService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/public/courses")
@RequiredArgsConstructor
public class PublicCourseController {

    private final PublicCourseService publicCourseService;

    @GetMapping
    public ResponseEntity<Page<CourseSummaryResponse>> getPublishedCourses(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String level,
            @RequestParam(required = false) String instructorName,
            @RequestParam(required = false) String sortBy,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {

        CourseSearchCriteria criteria = CourseSearchCriteria.builder()
                .keyword(keyword)
                .categoryId(categoryId)
                .level(level)
                .instructorName(instructorName)
                .sortBy(sortBy)
                .build();

        Page<CourseSummaryResponse> results = publicCourseService.searchPublishedCourses(criteria, page, size);
        return ResponseEntity.ok(results);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PublicCourseDetailResponse> getPublishedCourseDetails(@PathVariable Long id) {
        PublicCourseDetailResponse response = publicCourseService.getPublishedCourseDetails(id);
        return ResponseEntity.ok(response);
    }
}