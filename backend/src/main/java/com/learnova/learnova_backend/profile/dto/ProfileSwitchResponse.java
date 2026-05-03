package com.learnova.learnova_backend.profile.dto;

import com.learnova.learnova_backend.profile.entity.ProfileType;

import java.util.Set;

public record ProfileSwitchResponse(
        ProfileType activeProfile,
        Set<ProfileType> availableProfiles
) {
}