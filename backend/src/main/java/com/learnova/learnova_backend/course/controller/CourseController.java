package com.learnova.learnova_backend.course.controller;

import com.learnova.learnova_backend.course.dto.CourseRequest;
import com.learnova.learnova_backend.course.dto.CourseResponse;
import com.learnova.learnova_backend.course.service.CourseService;
import com.learnova.learnova_backend.security.CustomUserDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import com.learnova.learnova_backend.course.dto.CourseUpdateRequest;

@RestController
@RequestMapping("/api/v1/instructor/courses")
@RequiredArgsConstructor
public class CourseController {

    private final CourseService courseService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public CourseResponse createCourse(
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @Valid @RequestBody CourseRequest request
    ) {
        return courseService.createCourse(currentUser, request);
    }

    @PatchMapping("/{courseId}")
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public CourseResponse updateCourse(
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @PathVariable Long courseId,
            @Valid @RequestBody CourseUpdateRequest request
    ) {
        return courseService.updateCourse(currentUser, courseId, request);
    }
}