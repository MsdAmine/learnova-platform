package com.learnova.learnova_backend.auth.dto;

import com.learnova.learnova_backend.profile.entity.ProfileType;
import com.learnova.learnova_backend.user.entity.AccountStatus;
import com.learnova.learnova_backend.user.entity.RoleName;

import java.util.Set;

public record CurrentUserResponse(
        Long id,
        String fullName,
        String email,
        AccountStatus accountStatus,
        Set<RoleName> roles,
        Set<ProfileType> availableProfiles,
        String instructorApprovalStatus,
        Boolean learnerOnboardingCompleted
) {
}