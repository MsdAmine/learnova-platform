package com.learnova.learnova_backend.profile.service;

import com.learnova.learnova_backend.profile.entity.InstructorApprovalStatus;
import com.learnova.learnova_backend.profile.entity.ProfileType;
import com.learnova.learnova_backend.profile.repository.InstructorProfileRepository;
import com.learnova.learnova_backend.profile.repository.LearnerProfileRepository;
import com.learnova.learnova_backend.user.entity.RoleName;
import com.learnova.learnova_backend.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.EnumSet;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ProfileAccessService {

    private final LearnerProfileRepository learnerProfileRepository;
    private final InstructorProfileRepository instructorProfileRepository;

    public Set<ProfileType> resolveAvailableProfiles(User user) {
        Set<ProfileType> availableProfiles = EnumSet.noneOf(ProfileType.class);

        if (hasLearnerAccess(user)) {
            availableProfiles.add(ProfileType.LEARNER);
        }

        if (hasInstructorAccess(user)) {
            availableProfiles.add(ProfileType.INSTRUCTOR);
        }

        return availableProfiles;
    }

    public boolean canUseProfile(User user, ProfileType profileType) {
        return resolveAvailableProfiles(user).contains(profileType);
    }

    private boolean hasLearnerAccess(User user) {
        boolean hasLearnerRole = user.getRoles()
                .stream()
                .anyMatch(role -> role.getName() == RoleName.ROLE_LEARNER);

        return hasLearnerRole && learnerProfileRepository.existsByUserId(user.getId());
    }

    private boolean hasInstructorAccess(User user) {
        boolean hasInstructorRole = user.getRoles()
                .stream()
                .anyMatch(role -> role.getName() == RoleName.ROLE_INSTRUCTOR);

        boolean hasApprovedInstructorProfile = instructorProfileRepository.findByUserId(user.getId())
                .map(profile -> profile.getApprovalStatus() == InstructorApprovalStatus.APPROVED)
                .orElse(false);

        return hasInstructorRole && hasApprovedInstructorProfile;
    }
}