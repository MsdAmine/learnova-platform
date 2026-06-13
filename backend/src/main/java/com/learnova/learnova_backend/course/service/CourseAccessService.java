package com.learnova.learnova_backend.course.service;

import com.learnova.learnova_backend.course.entity.Course;
import com.learnova.learnova_backend.enrollment.entity.EnrollmentStatus;
import com.learnova.learnova_backend.enrollment.repository.EnrollmentRepository;
import com.learnova.learnova_backend.profile.repository.LearnerProfileRepository;
import com.learnova.learnova_backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CourseAccessService {

    private final UserRepository userRepository;
    private final LearnerProfileRepository learnerProfileRepository;
    private final EnrollmentRepository enrollmentRepository;

    private static final List<EnrollmentStatus> ACTIVE_STATUSES =
            List.of(EnrollmentStatus.ACTIVE, EnrollmentStatus.COMPLETED);

    public boolean canUserAccessCourseContent(String username, Course course) {
        return userRepository.findByEmailIgnoreCase(username)
                .flatMap(user -> learnerProfileRepository.findByUserId(user.getId()))
                .map(learnerProfile -> enrollmentRepository.existsByLearnerProfileIdAndCourseIdAndStatusIn(
                        learnerProfile.getId(), course.getId(), ACTIVE_STATUSES))
                .orElse(false);
    }
}
