package com.learnova.learnova_backend.certificate.controller;

import com.learnova.learnova_backend.certificate.dto.CertificateResponse;
import com.learnova.learnova_backend.certificate.service.CertificateService;
import com.learnova.learnova_backend.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/learner/certificates")
@PreAuthorize("hasRole('LEARNER')")
@RequiredArgsConstructor
public class CertificateController {

    private final CertificateService certificateService;

    @PostMapping("/course/{courseId}/issue")
    public ResponseEntity<CertificateResponse> issueCertificate(
            @PathVariable Long courseId,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        return certificateService.issueCertificateForCourse(courseId, currentUser);
    }

    @GetMapping
    public ResponseEntity<List<CertificateResponse>> listMyCertificates(
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        return ResponseEntity.ok(certificateService.listMyCertificates(currentUser));
    }

    @GetMapping("/{certificateId}")
    public ResponseEntity<CertificateResponse> getMyCertificate(
            @PathVariable Long certificateId,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        return ResponseEntity.ok(certificateService.getMyCertificate(certificateId, currentUser));
    }
}
