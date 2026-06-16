package com.learnova.learnova_backend.course.controller;

import com.learnova.learnova_backend.course.dto.AnswerOptionRequest;
import com.learnova.learnova_backend.course.dto.AnswerOptionResponse;
import com.learnova.learnova_backend.course.dto.QuestionRequest;
import com.learnova.learnova_backend.course.dto.QuestionResponse;
import com.learnova.learnova_backend.course.dto.QuizDetailResponse;
import com.learnova.learnova_backend.course.dto.QuizRequest;
import com.learnova.learnova_backend.course.dto.QuizResponse;
import com.learnova.learnova_backend.course.dto.QuizUpdateRequest;

import java.util.List;
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

    @GetMapping("/{courseId}/quizzes")
    public ResponseEntity<List<QuizResponse>> listQuizzesForCourse(
            @PathVariable Long courseId,
            @AuthenticationPrincipal CustomUserDetails currentUser) {

        return ResponseEntity.ok(quizService.listQuizzesForCourse(currentUser, courseId));
    }

    @GetMapping("/quizzes/{quizId}")
    public ResponseEntity<QuizDetailResponse> getQuizDetail(
            @PathVariable Long quizId,
            @AuthenticationPrincipal CustomUserDetails currentUser) {

        return ResponseEntity.ok(quizService.getQuizDetail(currentUser, quizId));
    }

    @PostMapping("/{courseId}/quizzes")
    public ResponseEntity<QuizResponse> createQuiz(
            @PathVariable Long courseId,
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @Valid @RequestBody QuizRequest request) {

        QuizResponse response = quizService.createQuiz(currentUser, courseId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/quizzes/{quizId}")
    public ResponseEntity<QuizResponse> updateQuiz(
            @PathVariable Long quizId,
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @Valid @RequestBody QuizUpdateRequest request) {

        QuizResponse response = quizService.updateQuiz(currentUser, quizId, request);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/quizzes/{quizId}/publish")
    public ResponseEntity<QuizResponse> publishQuiz(
            @PathVariable Long quizId,
            @AuthenticationPrincipal CustomUserDetails currentUser) {

        QuizResponse response = quizService.publishQuiz(currentUser, quizId);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/quizzes/{quizId}/archive")
    public ResponseEntity<QuizResponse> archiveQuiz(
            @PathVariable Long quizId,
            @AuthenticationPrincipal CustomUserDetails currentUser) {

        QuizResponse response = quizService.archiveQuiz(currentUser, quizId);
        return ResponseEntity.ok(response);
    }

    // --- GESTION DES QUESTIONS ---

    @PostMapping("/quizzes/{quizId}/questions")
    public ResponseEntity<QuestionResponse> addQuestion(
            @PathVariable Long quizId,
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @Valid @RequestBody QuestionRequest request) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(quizService.addQuestionToQuiz(currentUser, quizId, request));
    }

    @PutMapping("/questions/{questionId}")
    public ResponseEntity<QuestionResponse> updateQuestion(
            @PathVariable Long questionId,
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @Valid @RequestBody QuestionRequest request) {

        return ResponseEntity.ok(quizService.updateQuestion(currentUser, questionId, request));
    }

    @DeleteMapping("/questions/{questionId}")
    public ResponseEntity<Void> deleteQuestion(
            @PathVariable Long questionId,
            @AuthenticationPrincipal CustomUserDetails currentUser) {

        quizService.deleteQuestion(currentUser, questionId);
        return ResponseEntity.noContent().build();
    }

    // --- GESTION DES OPTIONS DE RÉPONSE ---

    @PostMapping("/questions/{questionId}/options")
    public ResponseEntity<AnswerOptionResponse> addAnswerOption(
            @PathVariable Long questionId,
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @Valid @RequestBody AnswerOptionRequest request) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(quizService.addOptionToQuestion(currentUser, questionId, request));
    }

    @PutMapping("/options/{optionId}")
    public ResponseEntity<AnswerOptionResponse> updateAnswerOption(
            @PathVariable Long optionId,
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @Valid @RequestBody AnswerOptionRequest request) {

        return ResponseEntity.ok(quizService.updateAnswerOption(currentUser, optionId, request));
    }

    @DeleteMapping("/options/{optionId}")
    public ResponseEntity<Void> deleteAnswerOption(
            @PathVariable Long optionId,
            @AuthenticationPrincipal CustomUserDetails currentUser) {

        quizService.deleteAnswerOption(currentUser, optionId);
        return ResponseEntity.noContent().build();
    }
}