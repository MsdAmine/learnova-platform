package com.learnova.learnova_backend.profile.service;

import com.learnova.learnova_backend.profile.entity.LearnerProfile;
import com.learnova.learnova_backend.profile.repository.LearnerProfileRepository;
import com.learnova.learnova_backend.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

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
}