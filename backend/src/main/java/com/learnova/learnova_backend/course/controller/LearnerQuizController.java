package com.learnova.learnova_backend.course.controller;

import com.learnova.learnova_backend.course.dto.*;
import com.learnova.learnova_backend.course.service.LearnerQuizService;
import com.learnova.learnova_backend.security.CustomUserDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/learner")
@RequiredArgsConstructor
@PreAuthorize("hasRole('LEARNER')")
public class LearnerQuizController {

    private final LearnerQuizService learnerQuizService;

    @GetMapping("/courses/{courseId}/quizzes")
    public ResponseEntity<List<LearnerQuizSummaryResponse>> listQuizzes(
            @PathVariable Long courseId,
            @AuthenticationPrincipal CustomUserDetails currentUser) {

        return ResponseEntity.ok(
                learnerQuizService.listPublishedQuizzes(currentUser.getId(), courseId));
    }

    @GetMapping("/quizzes/{quizId}")
    public ResponseEntity<LearnerQuizDetailResponse> getQuizDetail(
            @PathVariable Long quizId,
            @AuthenticationPrincipal CustomUserDetails currentUser) {

        return ResponseEntity.ok(
                learnerQuizService.getQuizForTaking(currentUser.getId(), quizId));
    }

    @PostMapping("/quizzes/{quizId}/attempts")
    public ResponseEntity<QuizAttemptResponse> startAttempt(
            @PathVariable Long quizId,
            @AuthenticationPrincipal CustomUserDetails currentUser) {

        return ResponseEntity.ok(
                learnerQuizService.startOrResumeAttempt(currentUser.getId(), quizId));
    }

    @PostMapping("/quiz-attempts/{attemptId}/submit")
    public ResponseEntity<QuizAttemptResponse> submitAttempt(
            @PathVariable Long attemptId,
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @Valid @RequestBody QuizAttemptSubmitRequest request) {

        return ResponseEntity.ok(
                learnerQuizService.submitAttempt(currentUser.getId(), attemptId, request));
    }

    @GetMapping("/quiz-attempts/{attemptId}")
    public ResponseEntity<QuizAttemptResponse> getAttemptResult(
            @PathVariable Long attemptId,
            @AuthenticationPrincipal CustomUserDetails currentUser) {

        return ResponseEntity.ok(
                learnerQuizService.getAttemptResult(currentUser.getId(), attemptId));
    }
}
