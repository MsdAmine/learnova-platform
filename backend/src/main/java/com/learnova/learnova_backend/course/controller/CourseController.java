package com.learnova.learnova_backend.course.controller;

import com.learnova.learnova_backend.course.dto.CourseRequest;
import com.learnova.learnova_backend.course.dto.CourseResponse;
import com.learnova.learnova_backend.course.dto.CourseUpdateRequest;
import com.learnova.learnova_backend.course.service.CourseService;
import com.learnova.learnova_backend.security.CustomUserDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/instructor/courses")
@RequiredArgsConstructor
public class CourseController {

    private final CourseService courseService;

    @GetMapping
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public List<CourseResponse> listMyCourses(
            @AuthenticationPrincipal CustomUserDetails currentUser
    ) {
        return courseService.listMyCourses(currentUser);
    }

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

    @PostMapping("/{courseId}/publish")
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public CourseResponse publishCourse(
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @PathVariable Long courseId
    ) {
        return courseService.publishCourse(currentUser, courseId);
    }

    @PostMapping("/{courseId}/archive")
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public CourseResponse archiveCourse(
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @PathVariable Long courseId
    ) {
        return courseService.archiveCourse(currentUser, courseId);
    }

    @PostMapping("/{courseId}/thumbnail")
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public CourseResponse uploadThumbnail(
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @PathVariable Long courseId,
            @RequestParam("file") MultipartFile file
    ) {
        return courseService.uploadThumbnail(currentUser, courseId, file);
    }
}