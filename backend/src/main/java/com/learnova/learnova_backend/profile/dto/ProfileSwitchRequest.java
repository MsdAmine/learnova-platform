package com.learnova.learnova_backend.profile.dto;

import com.learnova.learnova_backend.profile.entity.ProfileType;
import jakarta.validation.constraints.NotNull;

public record ProfileSwitchRequest(

        @NotNull(message = "Profile type is required")
        ProfileType profileType
) {
}