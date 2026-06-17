package com.learnova.learnova_backend.profile.controller;

import com.learnova.learnova_backend.profile.dto.InstructorProfileRequest;
import com.learnova.learnova_backend.profile.dto.InstructorProfileResponse;
import com.learnova.learnova_backend.profile.dto.InstructorProfileUpdateRequest;
import com.learnova.learnova_backend.profile.service.InstructorProfileService;
import com.learnova.learnova_backend.security.CustomUserDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/instructor-profile")
@RequiredArgsConstructor
public class InstructorProfileController {

    private final InstructorProfileService instructorProfileService;

    @PostMapping("/request")
    @ResponseStatus(HttpStatus.CREATED)
    public InstructorProfileResponse requestInstructorProfile(
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @Valid @RequestBody InstructorProfileRequest request
    ) {
        return instructorProfileService.requestInstructorProfile(currentUser, request);
    }

    @GetMapping("/me")
    public InstructorProfileResponse getMyInstructorProfile(
            @AuthenticationPrincipal CustomUserDetails currentUser
    ) {
        return instructorProfileService.getMyInstructorProfile(currentUser);
    }

    @PatchMapping("/me")
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public InstructorProfileResponse updateMyProfile(
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @Valid @RequestBody InstructorProfileUpdateRequest request
    ) {
        return instructorProfileService.updateMyProfile(currentUser, request);
    }
}