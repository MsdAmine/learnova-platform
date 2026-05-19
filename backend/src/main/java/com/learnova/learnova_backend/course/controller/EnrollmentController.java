package com.learnova.learnova_backend.course.controller;

import com.learnova.learnova_backend.course.dto.EnrollmentResponse;
import com.learnova.learnova_backend.course.dto.LearnerEnrollmentResponse;
import com.learnova.learnova_backend.course.service.EnrollmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;

@RestController
@RequestMapping("/api/v1/enrollments")
@RequiredArgsConstructor
public class EnrollmentController {

    private final EnrollmentService enrollmentService;

    @PostMapping("/course/{courseId}")
    @PreAuthorize("hasRole('LEARNER')")
    public ResponseEntity<EnrollmentResponse> enrollInCourse(@PathVariable Long courseId, Principal principal) {
        String username = principal.getName(); // Extrait l'email configuré dans le token JWT
        EnrollmentResponse response = enrollmentService.enrollLearnerInCourse(username, courseId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/my-courses")
    @PreAuthorize("hasRole('LEARNER')")
    public ResponseEntity<java.util.List<LearnerEnrollmentResponse>> getMyEnrolledCourses(Principal principal) {
        String username = principal.getName(); // Extrait l'email de l'apprenant depuis le token JWT
        java.util.List<LearnerEnrollmentResponse> response = enrollmentService.getEnrolledCoursesForLearner(username);
        return ResponseEntity.ok(response);
    }
}