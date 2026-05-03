package com.learnova.learnova_backend.profile.repository;

import com.learnova.learnova_backend.profile.entity.InstructorApprovalStatus;
import com.learnova.learnova_backend.profile.entity.InstructorProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InstructorProfileRepository extends JpaRepository<InstructorProfile, Long> {

    Optional<InstructorProfile> findByUserId(Long userId);

    boolean existsByUserId(Long userId);

    List<InstructorProfile> findByApprovalStatus(InstructorApprovalStatus approvalStatus);
}