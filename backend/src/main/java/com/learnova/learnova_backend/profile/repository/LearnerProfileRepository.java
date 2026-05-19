package com.learnova.learnova_backend.profile.repository;

import com.learnova.learnova_backend.profile.entity.LearnerProfile;
import com.learnova.learnova_backend.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LearnerProfileRepository extends JpaRepository<LearnerProfile, Long> {

    Optional<LearnerProfile> findByUser(User user);

    Optional<LearnerProfile> findByUserId(Long userId);

    boolean existsByUserId(Long userId);
}