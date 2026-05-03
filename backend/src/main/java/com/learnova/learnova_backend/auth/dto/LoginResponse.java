package com.learnova.learnova_backend.auth.dto;

import com.learnova.learnova_backend.user.entity.AccountStatus;
import com.learnova.learnova_backend.user.entity.RoleName;

import java.util.Set;

public record LoginResponse(
        String accessToken,
        String tokenType,
        Long userId,
        String fullName,
        String email,
        AccountStatus accountStatus,
        Set<RoleName> roles
) {
}