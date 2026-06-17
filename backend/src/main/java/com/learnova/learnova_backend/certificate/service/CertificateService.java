package com.learnova.learnova_backend.certificate.service;

import com.learnova.learnova_backend.certificate.dto.CertificateResponse;
import com.learnova.learnova_backend.certificate.entity.Certificate;
import com.learnova.learnova_backend.certificate.repository.CertificateRepository;
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

    @Transactional
    public ResponseEntity<CertificateResponse> issueCertificateForCourse(Long courseId, CustomUserDetails userDetails) {
        LearnerProfile learnerProfile = learnerProfileRepository.findByUserId(userDetails.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Learner profile not found"));

        Enrollment enrollment = enrollmentRepository.findByLearnerProfileIdAndCourseId(learnerProfile.getId(), courseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Enrollment not found"));

        if (enrollment.getStatus() != EnrollmentStatus.COMPLETED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Course not yet completed");
        }

        Optional<Certificate> existing = certificateRepository.findByEnrollmentId(enrollment.getId());
        if (existing.isPresent()) {
            return ResponseEntity.ok(toResponse(existing.get()));
        }

        Certificate certificate = Certificate.builder()
                .certificateCode(UUID.randomUUID().toString())
                .learnerProfile(learnerProfile)
                .course(enrollment.getCourse())
                .enrollment(enrollment)
                .build();

        Certificate saved = certificateRepository.save(certificate);
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(saved));
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
