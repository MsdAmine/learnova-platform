package com.learnova.learnova_backend.certificate.service;

import com.learnova.learnova_backend.certificate.dto.CertificateResponse;
import com.learnova.learnova_backend.certificate.entity.Certificate;
import com.learnova.learnova_backend.certificate.repository.CertificateRepository;
import com.learnova.learnova_backend.course.entity.Quiz;
import com.learnova.learnova_backend.course.entity.QuizAttemptStatus;
import com.learnova.learnova_backend.course.entity.QuizStatus;
import com.learnova.learnova_backend.course.repository.QuizAttemptRepository;
import com.learnova.learnova_backend.course.repository.QuizRepository;
import com.learnova.learnova_backend.enrollment.entity.Enrollment;
import com.learnova.learnova_backend.enrollment.entity.EnrollmentStatus;
import com.learnova.learnova_backend.enrollment.repository.EnrollmentRepository;
import com.learnova.learnova_backend.profile.entity.LearnerProfile;
import com.learnova.learnova_backend.profile.repository.LearnerProfileRepository;
import com.learnova.learnova_backend.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CertificateService {

    private final LearnerProfileRepository learnerProfileRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final CertificateRepository certificateRepository;
    private final QuizRepository quizRepository;
    private final QuizAttemptRepository quizAttemptRepository;

    @Transactional
    public ResponseEntity<CertificateResponse> issueCertificateForCourse(Long courseId, CustomUserDetails userDetails) {
        LearnerProfile learnerProfile = learnerProfileRepository.findByUserId(userDetails.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Learner profile not found"));

        Enrollment enrollment = enrollmentRepository.findByLearnerProfileIdAndCourseId(learnerProfile.getId(), courseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Enrollment not found"));

        // Idempotency first: an already-issued certificate is returned as-is, without
        // re-running eligibility — issuing one must never be retroactively invalidated.
        Optional<Certificate> existing = certificateRepository.findByEnrollmentId(enrollment.getId());
        if (existing.isPresent()) {
            return ResponseEntity.ok(toResponse(existing.get()));
        }

        validateCertificateEligibility(learnerProfile, enrollment);

        Certificate cert = Certificate.builder()
                .learnerProfile(learnerProfile)
                .course(enrollment.getCourse())
                .enrollment(enrollment)
                .certificateCode(UUID.randomUUID().toString())
                .build();
        Certificate saved = certificateRepository.save(cert);
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(saved));
    }

    /**
     * A certificate represents genuine completion and assessment success. It may be
     * issued only when:
     * <ul>
     *   <li>every lesson is finished — the enrollment reaches COMPLETED only when
     *       lesson progress hits 100%, so the status is the lesson-completion gate; and</li>
     *   <li>every PUBLISHED quiz on the course has at least one submitted, passed
     *       attempt. DRAFT/ARCHIVED quizzes never block; in-progress and failed-only
     *       attempts do not count, but a later passed attempt satisfies the rule.</li>
     * </ul>
     * If the course has no published quizzes, lesson completion alone is enough.
     */
    private void validateCertificateEligibility(LearnerProfile learnerProfile, Enrollment enrollment) {
        if (enrollment.getStatus() != EnrollmentStatus.COMPLETED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Complete all lessons before generating a certificate.");
        }

        Long courseId = enrollment.getCourse().getId();
        List<Quiz> publishedQuizzes =
                quizRepository.findByCourseIdAndStatusOrderByIdAsc(courseId, QuizStatus.PUBLISHED);
        for (Quiz quiz : publishedQuizzes) {
            boolean passed = quizAttemptRepository
                    .existsByLearnerProfileIdAndQuizIdAndStatusAndPassedTrue(
                            learnerProfile.getId(), quiz.getId(), QuizAttemptStatus.SUBMITTED);
            if (!passed) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Pass all published quizzes before generating a certificate.");
            }
        }
    }

    @Transactional(readOnly = true)
    public List<CertificateResponse> listMyCertificates(CustomUserDetails userDetails) {
        LearnerProfile learnerProfile = learnerProfileRepository.findByUserId(userDetails.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Learner profile not found"));

        return certificateRepository.findByLearnerProfileIdOrderByIssuedAtDesc(learnerProfile.getId())
                .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public CertificateResponse getMyCertificate(Long certificateId, CustomUserDetails userDetails) {
        LearnerProfile learnerProfile = learnerProfileRepository.findByUserId(userDetails.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Learner profile not found"));

        Certificate cert = certificateRepository.findByIdAndLearnerProfileId(certificateId, learnerProfile.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Certificate not found"));

        return toResponse(cert);
    }

    private CertificateResponse toResponse(Certificate cert) {
        return new CertificateResponse(
                cert.getId(),
                cert.getCertificateCode(),
                cert.getCourse().getId(),
                cert.getCourse().getTitle(),
                cert.getCourse().getInstructorProfile().getUser().getFullName(),
                cert.getLearnerProfile().getDisplayName(),
                cert.getIssuedAt()
        );
    }
}
