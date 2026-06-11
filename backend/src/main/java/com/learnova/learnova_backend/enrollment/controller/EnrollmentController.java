package com.learnova.learnova_backend.enrollment.controller;

import com.learnova.learnova_backend.enrollment.dto.EnrollmentResponse;
import com.learnova.learnova_backend.enrollment.service.EnrollmentService;
import com.learnova.learnova_backend.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class EnrollmentController {

    private final EnrollmentService enrollmentService;

    @PostMapping("/api/v1/courses/{courseId}/enroll")
    @ResponseStatus(HttpStatus.CREATED)
    public EnrollmentResponse enroll(
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @PathVariable Long courseId
    ) {
        return enrollmentService.enroll(currentUser, courseId);
    }

    @GetMapping("/api/v1/learner/enrollments")
    public List<EnrollmentResponse> getMyEnrollments(
            @AuthenticationPrincipal CustomUserDetails currentUser
    ) {
        return enrollmentService.getMyEnrollments(currentUser);
    }

    @GetMapping("/api/v1/learner/enrollments/{courseId}")
    public EnrollmentResponse getMyEnrollmentByCourse(
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @PathVariable Long courseId
    ) {
        return enrollmentService.getMyEnrollmentByCourse(currentUser, courseId);
    }
}
