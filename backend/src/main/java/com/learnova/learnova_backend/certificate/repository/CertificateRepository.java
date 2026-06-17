package com.learnova.learnova_backend.certificate.repository;

import com.learnova.learnova_backend.certificate.entity.Certificate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CertificateRepository extends JpaRepository<Certificate, Long> {

    Optional<Certificate> findByEnrollmentId(Long enrollmentId);

    boolean existsByEnrollmentId(Long enrollmentId);

    List<Certificate> findByLearnerProfileIdOrderByIssuedAtDesc(Long learnerProfileId);

    Optional<Certificate> findByIdAndLearnerProfileId(Long id, Long learnerProfileId);
}
