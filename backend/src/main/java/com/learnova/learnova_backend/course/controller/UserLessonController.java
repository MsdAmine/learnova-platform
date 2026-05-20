package com.learnova.learnova_backend.course.controller;

import com.learnova.learnova_backend.course.dto.LessonResponse;
import com.learnova.learnova_backend.course.service.LessonService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/v1/lessons")
@RequiredArgsConstructor
public class UserLessonController {

    private final LessonService lessonService;

    @GetMapping("/{lessonId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<LessonResponse> getLessonDetails(@PathVariable Long lessonId, Principal principal) {
        String username = principal.getName();
        LessonResponse response = lessonService.getLessonDetailsForUser(lessonId, username);
        return ResponseEntity.ok(response);
    }
}