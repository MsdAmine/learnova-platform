package com.learnova.learnova_backend.course.controller;

import com.learnova.learnova_backend.course.dto.SectionRequest;
import com.learnova.learnova_backend.course.dto.SectionResponse;
import com.learnova.learnova_backend.course.service.SectionService;
import com.learnova.learnova_backend.security.CustomUserDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/instructor/courses/{courseId}/sections")
@RequiredArgsConstructor
public class SectionController {

    private final SectionService sectionService;

    @GetMapping
    public List<SectionResponse> getSections(@PathVariable Long courseId) {
        return sectionService.getCourseSections(courseId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public SectionResponse createSection(
            @PathVariable Long courseId,
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @Valid @RequestBody SectionRequest request) {
        return sectionService.createSection(courseId, currentUser.getId(), request);
    }

    @PutMapping("/{sectionId}")
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public SectionResponse updateSection(
            @PathVariable Long courseId,
            @PathVariable Long sectionId,
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @Valid @RequestBody SectionRequest request) {
        return sectionService.updateSection(courseId, sectionId, currentUser.getId(), request);
    }

    @DeleteMapping("/{sectionId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public void deleteSection(
            @PathVariable Long courseId,
            @PathVariable Long sectionId,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        sectionService.deleteSection(courseId, sectionId, currentUser.getId());
    }
}