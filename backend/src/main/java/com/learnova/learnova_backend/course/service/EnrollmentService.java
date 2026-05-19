package com.learnova.learnova_backend.course.service;

import com.learnova.learnova_backend.course.dto.EnrollmentResponse;
import com.learnova.learnova_backend.course.entity.Course;
import com.learnova.learnova_backend.course.entity.CourseStatus;
import com.learnova.learnova_backend.course.entity.Enrollment;
import com.learnova.learnova_backend.course.entity.EnrollmentStatus;
import com.learnova.learnova_backend.course.repository.CourseRepository;
import com.learnova.learnova_backend.course.repository.EnrollmentRepository;
import com.learnova.learnova_backend.profile.entity.LearnerProfile;
import com.learnova.learnova_backend.profile.repository.LearnerProfileRepository;
import com.learnova.learnova_backend.user.entity.User;
import com.learnova.learnova_backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class EnrollmentService {

    private final EnrollmentRepository enrollmentRepository;
    private final CourseRepository courseRepository;
    private final LearnerProfileRepository learnerProfileRepository;
    private final UserRepository userRepository;

    @Transactional
    public EnrollmentResponse enrollLearnerInCourse(String username, Long courseId) {
        // 1. Validation de l'utilisateur principal connecté
        User user = userRepository.findByEmail(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Authenticated user account not found"));

        // 2. Validation de l'existence du profil apprenant
        LearnerProfile learnerProfile = learnerProfileRepository.findByUser(user)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "A learner profile is required to enroll in courses"));

        // 3. Validation de l'existence du cours cible
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Target course not found"));

        // 4. Contrainte de sécurité : Seuls les cours publiés acceptent des
        // inscriptions publiques
        if (course.getStatus() != CourseStatus.PUBLISHED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot enroll in an unpublished course");
        }

        // 5. Prévention des doublons : Vérification de l'historique d'inscription
        // existant
        boolean alreadyEnrolled = enrollmentRepository.existsByLearnerProfileAndCourse(learnerProfile, course);
        if (alreadyEnrolled) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You are already enrolled in this course");
        }

        // 6. Persistance du lien d'inscription
        Enrollment enrollment = Enrollment.builder()
                .learnerProfile(learnerProfile)
                .course(course)
                .status(EnrollmentStatus.ENROLLED)
                .build();

        Enrollment savedEnrollment = enrollmentRepository.save(enrollment);

        // Null-safe instructor name extraction from the Course object graph
        String instructorName = "Unknown Instructor";
        if (course.getInstructorProfile() != null && course.getInstructorProfile().getUser() != null) {
            instructorName = course.getInstructorProfile().getUser().getFullName();
        }

        // 7. Génération du rapport d'accès
        return EnrollmentResponse.builder()
                .id(savedEnrollment.getId())
                .courseId(course.getId())
                .courseTitle(course.getTitle())
                .status(savedEnrollment.getStatus().toString())
                .enrolledAt(savedEnrollment.getEnrolledAt())
                .accessSummary("Enrollment processed successfully. Dynamic structure clearance granted.")
                .build();
    }
}