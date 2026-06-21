package com.learnova.learnova_backend.profile.service;

import com.learnova.learnova_backend.course.repository.CategoryRepository;
import com.learnova.learnova_backend.profile.dto.LearningPreferencesResponse;
import com.learnova.learnova_backend.profile.dto.UpdateLearningPreferencesRequest;
import com.learnova.learnova_backend.profile.entity.LearnerProfile;
import com.learnova.learnova_backend.profile.entity.LearningPreference;
import com.learnova.learnova_backend.profile.repository.LearnerProfileRepository;
import com.learnova.learnova_backend.profile.repository.LearningPreferenceRepository;
import com.learnova.learnova_backend.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class LearningPreferencesService {

    private static final int MAX_PREFERRED_CATEGORIES = 8;

    private final LearningPreferenceRepository learningPreferenceRepository;
    private final LearnerProfileRepository learnerProfileRepository;
    private final CategoryRepository categoryRepository;

    @Transactional(readOnly = true)
    public LearningPreferencesResponse getMyPreferences(CustomUserDetails currentUser) {
        LearnerProfile learnerProfile = findLearnerProfile(currentUser);

        return learningPreferenceRepository.findByLearnerProfileId(learnerProfile.getId())
                .map(this::toResponse)
                .orElseGet(this::defaultResponse);
    }

    @Transactional
    public LearningPreferencesResponse updateMyPreferences(
            CustomUserDetails currentUser,
            UpdateLearningPreferencesRequest request
    ) {
        LearnerProfile learnerProfile = findLearnerProfile(currentUser);

        Set<Long> categoryIds = request.preferredCategoryIds() == null
                ? Set.of()
                : new LinkedHashSet<>(request.preferredCategoryIds());

        if (categoryIds.size() > MAX_PREFERRED_CATEGORIES) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "You can select up to " + MAX_PREFERRED_CATEGORIES + " preferred categories"
            );
        }

        if (!categoryIds.isEmpty()) {
            long existingCount = categoryRepository.findAllById(categoryIds).size();
            if (existingCount != categoryIds.size()) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "One or more preferred category IDs do not exist"
                );
            }
        }

        LearningPreference preference = learningPreferenceRepository.findByLearnerProfileId(learnerProfile.getId())
                .orElseGet(() -> LearningPreference.builder().learnerProfile(learnerProfile).build());

        preference.setLearningGoal(request.learningGoal());
        preference.setPreferredLevel(request.preferredLevel());
        preference.setWeeklyGoalMinutes(request.weeklyGoalMinutes());
        preference.getPreferredCategoryIds().clear();
        preference.getPreferredCategoryIds().addAll(categoryIds);

        LearningPreference saved = learningPreferenceRepository.save(preference);
        return toResponse(saved);
    }

    private LearnerProfile findLearnerProfile(CustomUserDetails currentUser) {
        return learnerProfileRepository.findByUserId(currentUser.getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Learner profile not found"
                ));
    }

    private LearningPreferencesResponse defaultResponse() {
        return new LearningPreferencesResponse(null, null, null, List.of(), null);
    }

    private LearningPreferencesResponse toResponse(LearningPreference preference) {
        return new LearningPreferencesResponse(
                preference.getLearningGoal(),
                preference.getPreferredLevel(),
                preference.getWeeklyGoalMinutes(),
                List.copyOf(preference.getPreferredCategoryIds()),
                preference.getUpdatedAt()
        );
    }
}
