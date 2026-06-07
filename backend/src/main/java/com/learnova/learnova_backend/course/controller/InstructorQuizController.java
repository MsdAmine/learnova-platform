package com.learnova.learnova_backend.course.controller;

import com.learnova.learnova_backend.course.dto.QuizRequest;
import com.learnova.learnova_backend.course.dto.QuizResponse;
import com.learnova.learnova_backend.course.service.QuizService;
import com.learnova.learnova_backend.security.CustomUserDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/instructor/courses")
@RequiredArgsConstructor
@PreAuthorize("hasRole('INSTRUCTOR')") // Sécurisation obligatoire de l'accès au niveau classe
public class InstructorQuizController {

    private final QuizService quizService;

    @PostMapping("/{courseId}/quizzes")
    public ResponseEntity<QuizResponse> createQuiz(
            @PathVariable Long courseId,
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @Valid @RequestBody QuizRequest request) {

        QuizResponse response = quizService.createQuiz(currentUser, courseId, request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }
}