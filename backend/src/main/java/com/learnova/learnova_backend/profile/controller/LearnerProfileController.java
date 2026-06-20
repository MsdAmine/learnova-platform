package com.learnova.learnova_backend.profile.controller;

import com.learnova.learnova_backend.profile.dto.LearnerProfileResponse;
import com.learnova.learnova_backend.profile.dto.LearnerProfileUpdateRequest;
import com.learnova.learnova_backend.profile.dto.LearningPreferencesResponse;
import com.learnova.learnova_backend.profile.dto.UpdateLearningPreferencesRequest;
import com.learnova.learnova_backend.profile.service.LearnerProfileService;
import com.learnova.learnova_backend.profile.service.LearningPreferencesService;
import com.learnova.learnova_backend.security.CustomUserDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/learner-profile")
@RequiredArgsConstructor
public class LearnerProfileController {

    private final LearnerProfileService learnerProfileService;
    private final LearningPreferencesService learningPreferencesService;

    @GetMapping("/me")
    public LearnerProfileResponse getMyProfile(
            @AuthenticationPrincipal CustomUserDetails currentUser
    ) {
        return learnerProfileService.getMyProfile(currentUser);
    }

    @PatchMapping("/me")
    public LearnerProfileResponse updateMyProfile(
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @Valid @RequestBody LearnerProfileUpdateRequest request
    ) {
        return learnerProfileService.updateMyProfile(currentUser, request);
    }

    @GetMapping("/me/preferences")
    public LearningPreferencesResponse getMyPreferences(
            @AuthenticationPrincipal CustomUserDetails currentUser
    ) {
        return learningPreferencesService.getMyPreferences(currentUser);
    }

    @PutMapping("/me/preferences")
    public LearningPreferencesResponse updateMyPreferences(
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @Valid @RequestBody UpdateLearningPreferencesRequest request
    ) {
        return learningPreferencesService.updateMyPreferences(currentUser, request);
    }
}
