package com.learnova.learnova_backend.profile.controller;

import com.learnova.learnova_backend.profile.dto.ProfileSwitchRequest;
import com.learnova.learnova_backend.profile.dto.ProfileSwitchResponse;
import com.learnova.learnova_backend.profile.service.ProfileSwitchService;
import com.learnova.learnova_backend.security.CustomUserDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/profile")
@RequiredArgsConstructor
public class ProfileSwitchController {

    private final ProfileSwitchService profileSwitchService;

    @PostMapping("/switch")
    public ProfileSwitchResponse switchProfile(
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @Valid @RequestBody ProfileSwitchRequest request
    ) {
        return profileSwitchService.switchProfile(currentUser, request);
    }
}