package com.learnova.learnova_backend.enrollment.controller;

import com.learnova.learnova_backend.course.dto.CourseContentResponse;
import com.learnova.learnova_backend.enrollment.dto.EnrollmentResponse;
import com.learnova.learnova_backend.enrollment.service.EnrollmentService;
import com.learnova.learnova_backend.enrollment.service.LearnerCourseContentService;
import com.learnova.learnova_backend.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class EnrollmentController {

    private final EnrollmentService enrollmentService;
    private final LearnerCourseContentService learnerCourseContentService;

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

    @GetMapping("/api/v1/learner/courses/{courseId}/content")
    public ResponseEntity<CourseContentResponse> getCourseContent(
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @PathVariable Long courseId
    ) {
        return ResponseEntity.ok(learnerCourseContentService.getCourseContentForLearner(courseId, currentUser));
    }
}
