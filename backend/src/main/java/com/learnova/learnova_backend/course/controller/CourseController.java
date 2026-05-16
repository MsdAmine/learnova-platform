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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.data.domain.Sort;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class CourseController {

    private final CourseService courseService;

    // --- Instructor Endpoints ---

    @GetMapping("/instructor/courses")
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public Page<CourseResponse> getMyCourses(
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return courseService.getInstructorCourses(currentUser, pageable);
    }

    @PostMapping("/instructor/courses")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public CourseResponse createCourse(
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @Valid @RequestBody CourseRequest request) {
        return courseService.createCourse(currentUser, request);
    }

    @PutMapping("/instructor/courses/{id}")
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public CourseResponse updateCourse(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @Valid @RequestBody CourseUpdateRequest request) {
        return courseService.updateCourse(id, currentUser, request);
    }

    @PatchMapping("/instructor/courses/{id}/publish")
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public CourseResponse publishCourse(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        return courseService.publishCourse(id, currentUser);
    }

    @PatchMapping("/instructor/courses/{id}/archive")
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public CourseResponse archiveCourse(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        return courseService.archiveCourse(id, currentUser);
    }

    @PostMapping("/instructor/courses/{id}/thumbnail")
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public String uploadThumbnail(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @RequestParam("file") MultipartFile file) {
        return courseService.uploadThumbnail(id, currentUser, file);
    }

    // --- Admin Endpoints ---

    @PatchMapping("/admin/courses/{id}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    public CourseResponse deactivateCourse(@PathVariable Long id) {
        return courseService.deactivateCourse(id);
    }
}