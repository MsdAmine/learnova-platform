package com.learnova.learnova_backend.auth.dto;

import com.learnova.learnova_backend.user.entity.AccountStatus;
import com.learnova.learnova_backend.user.entity.RoleName;

import java.time.Instant;
import java.util.Set;

public record RegisterResponse(
        Long id,
        String fullName,
        String email,
        AccountStatus accountStatus,
        Set<RoleName> roles,
        Instant createdAt
) {
}