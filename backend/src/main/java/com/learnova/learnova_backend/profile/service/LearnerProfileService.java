package com.learnova.learnova_backend.profile.service;

import com.learnova.learnova_backend.profile.dto.LearnerProfileResponse;
import com.learnova.learnova_backend.profile.dto.LearnerProfileUpdateRequest;
import com.learnova.learnova_backend.profile.entity.LearnerProfile;
import com.learnova.learnova_backend.profile.repository.LearnerProfileRepository;
import com.learnova.learnova_backend.security.CustomUserDetails;
import com.learnova.learnova_backend.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class LearnerProfileService {

    private final LearnerProfileRepository learnerProfileRepository;

    public LearnerProfile createDefaultProfileFor(User user) {
        if (learnerProfileRepository.existsByUserId(user.getId())) {
            throw new IllegalStateException("Learner profile already exists for user");
        }

        LearnerProfile learnerProfile = LearnerProfile.builder()
                .user(user)
                .displayName(user.getFullName())
                .build();

        return learnerProfileRepository.save(learnerProfile);
    }

    @Transactional(readOnly = true)
    public LearnerProfileResponse getMyProfile(CustomUserDetails currentUser) {
        LearnerProfile profile = learnerProfileRepository.findByUserId(currentUser.getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Learner profile not found"
                ));

        return toResponse(profile);
    }

    @Transactional
    public LearnerProfileResponse updateMyProfile(
            CustomUserDetails currentUser,
            LearnerProfileUpdateRequest request
    ) {
        LearnerProfile profile = learnerProfileRepository.findByUserId(currentUser.getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Learner profile not found"
                ));

        if (request.displayName() != null) {
            String trimmed = request.displayName().trim();
            if (trimmed.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Display name must not be blank");
            }
            profile.setDisplayName(trimmed);
        }

        if (request.bio() != null) {
            profile.setBio(normalizeOptional(request.bio()));
        }

        if (request.profileImageUrl() != null) {
            profile.setProfileImageUrl(normalizeOptional(request.profileImageUrl()));
        }

        LearnerProfile saved = learnerProfileRepository.save(profile);
        return toResponse(saved);
    }

    private String normalizeOptional(String value) {
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private LearnerProfileResponse toResponse(LearnerProfile profile) {
        return new LearnerProfileResponse(
                profile.getId(),
                profile.getUser().getId(),
                profile.getDisplayName(),
                profile.getBio(),
                profile.getProfileImageUrl(),
                profile.getCreatedAt(),
                profile.getUpdatedAt()
        );
    }
}