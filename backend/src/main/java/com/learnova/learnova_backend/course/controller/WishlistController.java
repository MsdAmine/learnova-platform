package com.learnova.learnova_backend.course.controller;

import com.learnova.learnova_backend.course.dto.CourseResponse;
import com.learnova.learnova_backend.course.dto.WishlistStatusResponse;
import com.learnova.learnova_backend.course.service.CourseService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/v1/wishlist")
@RequiredArgsConstructor
@PreAuthorize("hasRole('LEARNER')") // Verrouillage global au rôle LEARNER pour ce contrôleur
public class WishlistController {

    private final CourseService courseService;

    @GetMapping
    public ResponseEntity<Page<CourseResponse>> getMyWishlist(
            Principal principal,
            @PageableDefault(size = 10) Pageable pageable) {

        Page<CourseResponse> wishlistPage = courseService.getLearnerWishlist(principal.getName(), pageable);
        return ResponseEntity.ok(wishlistPage);
    }

    @GetMapping("/course/{courseId}/status")
    public ResponseEntity<WishlistStatusResponse> getWishlistStatus(
            @PathVariable Long courseId,
            Principal principal) {

        WishlistStatusResponse status = courseService.getWishlistStatus(courseId, principal.getName());
        return ResponseEntity.ok(status);
    }

    @PostMapping("/course/{courseId}")
    public ResponseEntity<Void> addToWishlist(
            @PathVariable Long courseId,
            Principal principal) {

        courseService.addCourseToWishlist(courseId, principal.getName());
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @DeleteMapping("/course/{courseId}")
    public ResponseEntity<Void> removeFromWishlist(
            @PathVariable Long courseId,
            Principal principal) {

        courseService.removeCourseFromWishlist(courseId, principal.getName());
        return ResponseEntity.noContent().build();
    }
}