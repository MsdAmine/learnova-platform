package com.learnova.learnova_backend.course.dto;

public record WishlistStatusResponse(
        Long courseId,
        boolean saved) {
}
