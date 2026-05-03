package com.learnova.learnova_backend.profile.controller;

import com.learnova.learnova_backend.profile.dto.InstructorProfileRejectionRequest;
import com.learnova.learnova_backend.profile.dto.InstructorProfileResponse;
import com.learnova.learnova_backend.profile.service.InstructorProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/instructor-profiles")
@RequiredArgsConstructor
public class AdminInstructorProfileController {

    private final InstructorProfileService instructorProfileService;

    @GetMapping("/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public List<InstructorProfileResponse> getPendingInstructorProfiles() {
        return instructorProfileService.getPendingInstructorProfiles();
    }

    @PostMapping("/{profileId}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public InstructorProfileResponse approveInstructorProfile(
            @PathVariable Long profileId
    ) {
        return instructorProfileService.approveInstructorProfile(profileId);
    }

    @PostMapping("/{profileId}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public InstructorProfileResponse rejectInstructorProfile(
            @PathVariable Long profileId,
            @Valid @RequestBody InstructorProfileRejectionRequest request
    ) {
        return instructorProfileService.rejectInstructorProfile(profileId, request);
    }
}