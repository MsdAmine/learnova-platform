package com.learnova.learnova_backend.profile.repository;

import com.learnova.learnova_backend.profile.entity.LearningPreference;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LearningPreferenceRepository extends JpaRepository<LearningPreference, Long> {

    Optional<LearningPreference> findByLearnerProfileId(Long learnerProfileId);
}
