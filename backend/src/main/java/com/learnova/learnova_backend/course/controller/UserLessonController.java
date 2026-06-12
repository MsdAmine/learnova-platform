package com.learnova.learnova_backend.course.controller;

import com.learnova.learnova_backend.course.dto.LessonProgressUpdateRequest;
import com.learnova.learnova_backend.course.dto.LessonProgressResponse;
import com.learnova.learnova_backend.course.dto.CourseProgressResponse;
import com.learnova.learnova_backend.course.service.CourseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/v1/lessons")
@RequiredArgsConstructor
public class UserLessonController {

    private final CourseService courseService;

    @PatchMapping("/{lessonId}/progress")
    @PreAuthorize("hasRole('LEARNER')")
    public ResponseEntity<LessonProgressResponse> updateLessonProgress(
            @PathVariable Long lessonId,
            Principal principal,
            @Valid @RequestBody LessonProgressUpdateRequest request) {

        LessonProgressResponse response = courseService.updateLessonProgress(
                lessonId,
                principal.getName(),
                request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/course/{courseId}/progress")
    @PreAuthorize("hasRole('LEARNER')")
    public ResponseEntity<CourseProgressResponse> getCourseProgress(
            @PathVariable Long courseId,
            Principal principal) {

        CourseProgressResponse response = courseService.calculateCourseProgress(
                courseId,
                principal.getName());
        return ResponseEntity.ok(response);
    }
}