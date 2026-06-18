package com.learnova.learnova_backend.livesession.controller;

import com.learnova.learnova_backend.livesession.dto.JoinLiveSessionResponse;
import com.learnova.learnova_backend.livesession.dto.LearnerLiveSessionResponse;
import com.learnova.learnova_backend.livesession.service.LearnerLiveSessionService;
import com.learnova.learnova_backend.security.CustomUserDetails;
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
public class LearnerLiveSessionController {

    private final LearnerLiveSessionService learnerLiveSessionService;

    @GetMapping("/live-sessions/upcoming")
    public ResponseEntity<List<LearnerLiveSessionResponse>> listUpcoming(
            @AuthenticationPrincipal CustomUserDetails currentUser) {

        return ResponseEntity.ok(learnerLiveSessionService.listUpcoming(currentUser.getId()));
    }

    @PostMapping("/live-sessions/{sessionId}/join")
    public ResponseEntity<JoinLiveSessionResponse> joinSession(
            @PathVariable Long sessionId,
            @AuthenticationPrincipal CustomUserDetails currentUser) {

        return ResponseEntity.ok(learnerLiveSessionService.joinSession(currentUser.getId(), sessionId));
    }
}
