package com.learnova.learnova_backend.course.controller;

import com.learnova.learnova_backend.course.dto.CourseCatalogResponse;
import com.learnova.learnova_backend.course.service.CourseService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Public, read-only course catalog for learners browsing courses before enrolling.
 *
 * <p>These endpoints are unauthenticated (see {@code SecurityConfig}) and expose only
 * {@link com.learnova.learnova_backend.course.entity.CourseStatus#PUBLISHED} courses.
 * Instructor/admin write operations stay under {@code /api/v1/instructor/courses}.
 */
@RestController
@RequestMapping("/api/v1/courses")
@RequiredArgsConstructor
public class CourseCatalogController {

    private final CourseService courseService;

    @GetMapping
    public List<CourseCatalogResponse> listPublishedCourses() {
        return courseService.listPublishedCourses();
    }

    @GetMapping("/{courseId}")
    public CourseCatalogResponse getPublishedCourse(@PathVariable Long courseId) {
        return courseService.getPublishedCourse(courseId);
    }
}
