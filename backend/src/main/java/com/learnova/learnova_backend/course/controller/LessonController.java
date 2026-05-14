package com.learnova.learnova_backend.course.controller;

import com.learnova.learnova_backend.course.dto.LessonRequest;
import com.learnova.learnova_backend.course.dto.LessonResponse;
import com.learnova.learnova_backend.course.service.LessonService;
import com.learnova.learnova_backend.security.CustomUserDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/instructor/courses/{courseId}/sections/{sectionId}/lessons")
@RequiredArgsConstructor
public class LessonController {

    private final LessonService lessonService;

    @GetMapping
    public List<LessonResponse> getLessons(@PathVariable Long sectionId) {
        return lessonService.getSectionLessons(sectionId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public LessonResponse createLesson(
            @PathVariable Long courseId,
            @PathVariable Long sectionId,
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @Valid @RequestBody LessonRequest request) {
        return lessonService.createLesson(courseId, sectionId, currentUser.getId(), request);
    }

    @PutMapping("/{lessonId}")
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public LessonResponse updateLesson(
            @PathVariable Long courseId,
            @PathVariable Long sectionId,
            @PathVariable Long lessonId,
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @Valid @RequestBody LessonRequest request) {
        return lessonService.updateLesson(courseId, sectionId, lessonId, currentUser.getId(), request);
    }

    @DeleteMapping("/{lessonId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public void deleteLesson(
            @PathVariable Long courseId,
            @PathVariable Long sectionId,
            @PathVariable Long lessonId,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        lessonService.deleteLesson(courseId, sectionId, lessonId, currentUser.getId());
    }
}