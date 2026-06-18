package com.learnova.learnova_backend.livesession.controller;

import com.learnova.learnova_backend.livesession.dto.CreateLiveSessionRequest;
import com.learnova.learnova_backend.livesession.dto.InstructorLiveSessionResponse;
import com.learnova.learnova_backend.livesession.service.InstructorLiveSessionService;
import com.learnova.learnova_backend.security.CustomUserDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/instructor")
@RequiredArgsConstructor
@PreAuthorize("hasRole('INSTRUCTOR')")
public class InstructorLiveSessionController {

    private final InstructorLiveSessionService instructorLiveSessionService;

    @PostMapping("/courses/{courseId}/live-sessions")
    public ResponseEntity<InstructorLiveSessionResponse> createSession(
            @PathVariable Long courseId,
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @Valid @RequestBody CreateLiveSessionRequest request) {

        InstructorLiveSessionResponse response =
                instructorLiveSessionService.createSession(currentUser, courseId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/live-sessions")
    public ResponseEntity<List<InstructorLiveSessionResponse>> listMySessions(
            @AuthenticationPrincipal CustomUserDetails currentUser) {

        return ResponseEntity.ok(instructorLiveSessionService.listMySessions(currentUser));
    }

    @PostMapping("/live-sessions/{sessionId}/cancel")
    public ResponseEntity<InstructorLiveSessionResponse> cancelSession(
            @PathVariable Long sessionId,
            @AuthenticationPrincipal CustomUserDetails currentUser) {

        return ResponseEntity.ok(instructorLiveSessionService.cancelSession(currentUser, sessionId));
    }
}
