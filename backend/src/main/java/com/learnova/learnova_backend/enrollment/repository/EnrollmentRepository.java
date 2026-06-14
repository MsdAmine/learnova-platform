package com.learnova.learnova_backend.enrollment.repository;

import com.learnova.learnova_backend.enrollment.entity.Enrollment;
import com.learnova.learnova_backend.enrollment.entity.EnrollmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {

    List<Enrollment> findByLearnerProfileId(Long learnerProfileId);

    Optional<Enrollment> findByLearnerProfileIdAndCourseId(Long learnerProfileId, Long courseId);

    boolean existsByLearnerProfileIdAndCourseId(Long learnerProfileId, Long courseId);

    boolean existsByLearnerProfileIdAndCourseIdAndStatusIn(
            Long learnerProfileId, Long courseId, Collection<EnrollmentStatus> statuses);
}
