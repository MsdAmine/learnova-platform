package com.learnova.learnova_backend.course.controller;

import com.learnova.learnova_backend.course.dto.*;
import com.learnova.learnova_backend.course.service.InstructorCourseContentService;
import com.learnova.learnova_backend.security.CustomUserDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/instructor/courses")
@RequiredArgsConstructor
public class InstructorCourseContentController {

    private final InstructorCourseContentService service;

    @GetMapping("/{courseId}/content")
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public InstructorCourseContentResponse getCourseContent(
            @PathVariable Long courseId,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        return service.getCourseContent(courseId, currentUser);
    }

    @PostMapping("/{courseId}/sections")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public InstructorSectionResponse createSection(
            @PathVariable Long courseId,
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @Valid @RequestBody CreateSectionRequest request) {
        return service.createSection(courseId, request, currentUser);
    }

    @PatchMapping("/sections/{sectionId}")
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public InstructorSectionResponse updateSection(
            @PathVariable Long sectionId,
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @Valid @RequestBody UpdateSectionRequest request) {
        return service.updateSection(sectionId, request, currentUser);
    }

    @DeleteMapping("/sections/{sectionId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public void deleteSection(
            @PathVariable Long sectionId,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        service.deleteSection(sectionId, currentUser);
    }

    @PostMapping("/sections/{sectionId}/lessons")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public InstructorLessonResponse createLesson(
            @PathVariable Long sectionId,
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @Valid @RequestBody CreateLessonRequest request) {
        return service.createLesson(sectionId, request, currentUser);
    }

    @PatchMapping("/lessons/{lessonId}")
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public InstructorLessonResponse updateLesson(
            @PathVariable Long lessonId,
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @Valid @RequestBody UpdateLessonRequest request) {
        return service.updateLesson(lessonId, request, currentUser);
    }

    @DeleteMapping("/lessons/{lessonId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public void deleteLesson(
            @PathVariable Long lessonId,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        service.deleteLesson(lessonId, currentUser);
    }
}
