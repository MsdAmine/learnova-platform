package com.learnova.learnova_backend.profile.service;

import com.learnova.learnova_backend.profile.dto.InstructorProfileRequest;
import com.learnova.learnova_backend.profile.dto.InstructorProfileResponse;
import com.learnova.learnova_backend.profile.dto.InstructorProfileUpdateRequest;
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
import com.learnova.learnova_backend.profile.dto.InstructorProfileRejectionRequest;
import com.learnova.learnova_backend.user.entity.Role;
import com.learnova.learnova_backend.user.entity.RoleName;
import com.learnova.learnova_backend.user.repository.RoleRepository;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class InstructorProfileService {

    private final InstructorProfileRepository instructorProfileRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    @Transactional
    public InstructorProfileResponse requestInstructorProfile(
            CustomUserDetails currentUser,
            InstructorProfileRequest request
    ) {
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

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

    @Transactional
    public InstructorProfileResponse updateMyProfile(
            CustomUserDetails currentUser,
            InstructorProfileUpdateRequest request
    ) {
        InstructorProfile instructorProfile = instructorProfileRepository.findByUserId(currentUser.getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Instructor profile not found"
                ));

        if (request.bio() != null) {
            String trimmed = request.bio().trim();
            if (trimmed.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bio must not be blank");
            }
            instructorProfile.setBio(trimmed);
        }

        if (request.expertise() != null) {
            String trimmed = request.expertise().trim();
            if (trimmed.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Expertise must not be blank");
            }
            instructorProfile.setExpertise(trimmed);
        }

        if (request.experience() != null) {
            instructorProfile.setExperience(normalizeOptional(request.experience()));
        }

        if (request.motivation() != null) {
            instructorProfile.setMotivation(normalizeOptional(request.motivation()));
        }

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

    @Transactional(readOnly = true)
    public List<InstructorProfileResponse> getPendingInstructorProfiles() {
        return instructorProfileRepository.findByApprovalStatus(InstructorApprovalStatus.PENDING)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public InstructorProfileResponse approveInstructorProfile(Long profileId) {
        InstructorProfile instructorProfile = instructorProfileRepository.findById(profileId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Instructor profile request not found"
                ));

        if (instructorProfile.getApprovalStatus() == InstructorApprovalStatus.APPROVED) {
            return toResponse(instructorProfile);
        }

        instructorProfile.setApprovalStatus(InstructorApprovalStatus.APPROVED);
        instructorProfile.setRejectionReason(null);
        instructorProfile.setReviewedAt(Instant.now());

        Role instructorRole = getOrCreateRole(RoleName.ROLE_INSTRUCTOR);
        instructorProfile.getUser().addRole(instructorRole);

        InstructorProfile savedProfile = instructorProfileRepository.save(instructorProfile);

        return toResponse(savedProfile);
    }

    @Transactional
    public InstructorProfileResponse rejectInstructorProfile(
            Long profileId,
            InstructorProfileRejectionRequest request
    ) {
        InstructorProfile instructorProfile = instructorProfileRepository.findById(profileId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Instructor profile request not found"
                ));

        instructorProfile.setApprovalStatus(InstructorApprovalStatus.REJECTED);
        instructorProfile.setRejectionReason(request.rejectionReason().trim());
        instructorProfile.setReviewedAt(Instant.now());

        InstructorProfile savedProfile = instructorProfileRepository.save(instructorProfile);

        return toResponse(savedProfile);
    }

    private Role getOrCreateRole(RoleName roleName) {
        return roleRepository.findByName(roleName)
                .orElseGet(() -> roleRepository.save(
                        Role.builder()
                                .name(roleName)
                                .build()
                ));
    }
}