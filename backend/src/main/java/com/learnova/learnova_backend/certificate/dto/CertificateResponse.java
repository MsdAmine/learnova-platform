package com.learnova.learnova_backend.certificate.dto;

import java.time.Instant;

public record CertificateResponse(
        Long id,
        String certificateCode,
        Long courseId,
        String courseTitle,
        String instructorName,
        String learnerName,
        Instant issuedAt
) {}
