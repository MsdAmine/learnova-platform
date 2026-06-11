package com.learnova.learnova_backend.enrollment.service;

import com.learnova.learnova_backend.course.entity.Course;
import com.learnova.learnova_backend.course.repository.CourseRepository;
import com.learnova.learnova_backend.enrollment.dto.EnrollmentResponse;
import com.learnova.learnova_backend.enrollment.entity.Enrollment;
import com.learnova.learnova_backend.enrollment.repository.EnrollmentRepository;
import com.learnova.learnova_backend.profile.entity.LearnerProfile;
import com.learnova.learnova_backend.profile.repository.LearnerProfileRepository;
import com.learnova.learnova_backend.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EnrollmentService {

    private final EnrollmentRepository enrollmentRepository;
    private final LearnerProfileRepository learnerProfileRepository;
    private final CourseRepository courseRepository;

    @Transactional
    public EnrollmentResponse enroll(CustomUserDetails currentUser, Long courseId) {
        LearnerProfile learnerProfile = learnerProfileRepository.findByUserId(currentUser.getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Learner profile not found"
                ));

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Course not found"
                ));

        if (enrollmentRepository.existsByLearnerProfileIdAndCourseId(learnerProfile.getId(), courseId)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Already enrolled in this course"
            );
        }

        Enrollment enrollment = Enrollment.builder()
                .learnerProfile(learnerProfile)
                .course(course)
                .build();

        return toResponse(enrollmentRepository.save(enrollment));
    }

    @Transactional(readOnly = true)
    public List<EnrollmentResponse> getMyEnrollments(CustomUserDetails currentUser) {
        LearnerProfile learnerProfile = learnerProfileRepository.findByUserId(currentUser.getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Learner profile not found"
                ));

        return enrollmentRepository.findByLearnerProfileId(learnerProfile.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public EnrollmentResponse getMyEnrollmentByCourse(CustomUserDetails currentUser, Long courseId) {
        LearnerProfile learnerProfile = learnerProfileRepository.findByUserId(currentUser.getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Learner profile not found"
                ));

        Enrollment enrollment = enrollmentRepository
                .findByLearnerProfileIdAndCourseId(learnerProfile.getId(), courseId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Enrollment not found"
                ));

        return toResponse(enrollment);
    }

    private EnrollmentResponse toResponse(Enrollment enrollment) {
        Course course = enrollment.getCourse();
        return new EnrollmentResponse(
                enrollment.getId(),
                course.getId(),
                course.getTitle(),
                course.getInstructorProfile().getUser().getFullName(),
                course.getCategory().getName(),
                enrollment.getStatus(),
                enrollment.getProgressPercentage(),
                enrollment.getEnrolledAt(),
                enrollment.getCompletedAt()
        );
    }
}
