package com.learnova.learnova_backend.profile.service;

import com.learnova.learnova_backend.profile.dto.InstructorProfileRequest;
import com.learnova.learnova_backend.profile.dto.InstructorProfileResponse;
import com.learnova.learnova_backend.profile.entity.InstructorApprovalStatus;
import com.learnova.learnova_backend.profile.entity.InstructorProfile;
import com.learnova.learnova_backend.profile.repository.InstructorProfileRepository;
import com.learnova.learnova_backend.security.CustomUserDetails;
import com.learnova.learnova_backend.user.entity.User;
import com.learnova.learnova_backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class InstructorProfileService {

    private final InstructorProfileRepository instructorProfileRepository;
    private final UserRepository userRepository;

    @Transactional
    public InstructorProfileResponse requestInstructorProfile(
            CustomUserDetails currentUser,
            InstructorProfileRequest request
    ) {
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));

        if (instructorProfileRepository.existsByUserId(user.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Instructor profile request already exists"
            );
        }

        InstructorProfile instructorProfile = InstructorProfile.builder()
                .user(user)
                .bio(request.bio().trim())
                .expertise(request.expertise().trim())
                .experience(normalizeOptional(request.experience()))
                .motivation(normalizeOptional(request.motivation()))
                .approvalStatus(InstructorApprovalStatus.PENDING)
                .build();

        InstructorProfile savedProfile = instructorProfileRepository.save(instructorProfile);

        return toResponse(savedProfile);
    }

    @Transactional(readOnly = true)
    public InstructorProfileResponse getMyInstructorProfile(CustomUserDetails currentUser) {
        InstructorProfile instructorProfile = instructorProfileRepository.findByUserId(currentUser.getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Instructor profile request not found"
                ));

        return toResponse(instructorProfile);
    }

    private String normalizeOptional(String value) {
        if (value == null || value.trim().isBlank()) {
            return null;
        }

        return value.trim();
    }

    private InstructorProfileResponse toResponse(InstructorProfile instructorProfile) {
        User user = instructorProfile.getUser();

        return new InstructorProfileResponse(
                instructorProfile.getId(),
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                instructorProfile.getBio(),
                instructorProfile.getExpertise(),
                instructorProfile.getExperience(),
                instructorProfile.getMotivation(),
                instructorProfile.getApprovalStatus(),
                instructorProfile.getRejectionReason(),
                instructorProfile.getRequestedAt(),
                instructorProfile.getReviewedAt()
        );
    }
}