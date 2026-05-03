package com.learnova.learnova_backend.profile.dto;

import com.learnova.learnova_backend.profile.entity.InstructorApprovalStatus;

import java.time.Instant;

public record InstructorProfileResponse(
        Long id,
        Long userId,
        String fullName,
        String email,
        String bio,
        String expertise,
        String experience,
        String motivation,
        InstructorApprovalStatus approvalStatus,
        String rejectionReason,
        Instant requestedAt,
        Instant reviewedAt
) {
}