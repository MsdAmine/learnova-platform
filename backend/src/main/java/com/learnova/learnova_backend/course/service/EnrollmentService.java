package com.learnova.learnova_backend.course.service;

import com.learnova.learnova_backend.course.dto.EnrollmentResponse;
import com.learnova.learnova_backend.course.dto.LearnerEnrollmentResponse;
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

    @Transactional(readOnly = true)
    public java.util.List<LearnerEnrollmentResponse> getEnrolledCoursesForLearner(String username) {
        // 1. Validation de l'utilisateur connecté
        User user = userRepository.findByEmail(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Authenticated user account not found"));

        // 2. Validation du profil apprenant
        LearnerProfile learnerProfile = learnerProfileRepository.findByUser(user)
                .orElseThrow(
                        () -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Learner profile record not found"));

        // 3. Récupération de l'historique d'inscriptions de l'apprenant via le
        // repository
        return enrollmentRepository.findByLearnerProfile(learnerProfile).stream()
                .map(enrollment -> {
                    Course course = enrollment.getCourse();

                    // Extraction sécurisée des informations de l'instructeur
                    String instructorName = "Unknown Instructor";
                    if (course.getInstructorProfile() != null && course.getInstructorProfile().getUser() != null) {
                        instructorName = course.getInstructorProfile().getUser().getFullName();
                    }

                    // Extraction sécurisée du nom de la catégorie
                    String categoryName = (course.getCategory() != null) ? course.getCategory().getName()
                            : "Uncategorized";

                    // Mapping vers le DTO de réponse
                    return LearnerEnrollmentResponse.builder()
                            .enrollmentId(enrollment.getId())
                            .courseId(course.getId())
                            .title(course.getTitle())
                            .thumbnailUrl(course.getThumbnailUrl())
                            .categoryName(categoryName)
                            .level(course.getLevel() != null ? course.getLevel().toString() : null)
                            .instructorName(instructorName)
                            .enrollmentStatus(enrollment.getStatus().toString())
                            .enrolledAt(enrollment.getEnrolledAt())
                            .progressPercentage(0.0) // Prêt pour l'intégration de la logique de progression
                            .lastAccessedLessonId(null) // Prêt pour le suivi de lecture futur
                            .build();
                })
                .collect(java.util.stream.Collectors.toList());
    }
}