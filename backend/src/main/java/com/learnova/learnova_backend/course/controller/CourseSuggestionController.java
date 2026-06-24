package com.learnova.learnova_backend.course.controller;

import com.learnova.learnova_backend.course.dto.CourseSuggestionsResponse;
import com.learnova.learnova_backend.course.service.CourseSuggestionService;
import com.learnova.learnova_backend.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Learner-scoped, rules-based course suggestions for the dashboard.
 *
 * <p>The learner is always resolved from the authenticated principal — there is
 * no learner-id path/query/body parameter, so a learner can only ever receive
 * their own suggestions.
 */
@RestController
@RequestMapping("/api/v1/learner/course-suggestions")
@RequiredArgsConstructor
@PreAuthorize("hasRole('LEARNER')")
public class CourseSuggestionController {

    private final CourseSuggestionService courseSuggestionService;

    @GetMapping
    public CourseSuggestionsResponse getMySuggestions(
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        return courseSuggestionService.getSuggestions(currentUser.getId());
    }
}
