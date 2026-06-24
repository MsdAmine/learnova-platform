package com.learnova.learnova_backend.course.service;

import com.learnova.learnova_backend.course.dto.CourseSuggestionsResponse;
import com.learnova.learnova_backend.course.dto.SuggestedCourseResponse;
import com.learnova.learnova_backend.course.entity.Course;
import com.learnova.learnova_backend.course.entity.CourseLevel;
import com.learnova.learnova_backend.course.entity.CourseStatus;
import com.learnova.learnova_backend.course.repository.CourseRepository;
import com.learnova.learnova_backend.enrollment.repository.EnrollmentRepository;
import com.learnova.learnova_backend.profile.entity.LearnerProfile;
import com.learnova.learnova_backend.profile.entity.LearningGoal;
import com.learnova.learnova_backend.profile.entity.LearningPreference;
import com.learnova.learnova_backend.profile.repository.LearnerProfileRepository;
import com.learnova.learnova_backend.profile.repository.LearningPreferenceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Rules-based, transparent course suggestions for the learner dashboard.
 *
 * <p>This is deliberately <em>not</em> a recommendation engine, ML model, or
 * "smart algorithm": it applies a small, deterministic scoring rule over the
 * learner's saved onboarding preferences and the published catalog.
 *
 * <p>Scoring per eligible course:
 * <ul>
 *   <li>+5 when the course's category is one of the learner's preferred
 *       categories (strongest signal; also yields a match reason).</li>
 *   <li>+3 when the course's level equals the learner's preferred level
 *       ({@code ALL_LEVELS} is treated as "no preference"; also yields a match
 *       reason).</li>
 *   <li>+1 when the course title/description/category contains a safe keyword
 *       derived from the learning goal — a soft ordering nudge only, never the
 *       sole basis for a personalized match, so it adds no (possibly
 *       coincidental) match reason.</li>
 * </ul>
 *
 * <p>A course "qualifies" as personalized only when it has at least one strong
 * (category/level) match. Ties break by newest first, then by id, so the output
 * is stable. When nothing qualifies (no preferences, or no matches), the result
 * is an honest non-personalized fallback of recently-added courses.
 */
@Service
@RequiredArgsConstructor
public class CourseSuggestionService {

    /** Default maximum number of suggestions returned. */
    static final int DEFAULT_LIMIT = 8;

    private static final int CATEGORY_MATCH_SCORE = 5;
    private static final int LEVEL_MATCH_SCORE = 3;
    private static final int GOAL_KEYWORD_SCORE = 1;

    static final String REASON_PERSONALIZED = "Based on your selected interests";
    static final String REASON_FALLBACK = "Explore recently added courses";
    static final String REASON_NO_PREFERENCES = "Complete your preferences to get tailored suggestions";

    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final LearnerProfileRepository learnerProfileRepository;
    private final LearningPreferenceRepository learningPreferenceRepository;

    /** Newest first, then highest id — fully deterministic recency order. */
    private static final Comparator<Course> RECENCY_ORDER =
            Comparator.comparing(Course::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder()))
                    .reversed()
                    .thenComparing(Comparator.comparing(Course::getId).reversed());

    @Transactional(readOnly = true)
    public CourseSuggestionsResponse getSuggestions(Long userId) {
        LearnerProfile learnerProfile = learnerProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Learner profile not found"));

        Set<Long> enrolledCourseIds = enrollmentRepository.findByLearnerProfileId(learnerProfile.getId())
                .stream()
                .map(enrollment -> enrollment.getCourse().getId())
                .collect(Collectors.toSet());

        List<Course> candidates = courseRepository.findByStatus(CourseStatus.PUBLISHED)
                .stream()
                .filter(course -> !enrolledCourseIds.contains(course.getId()))
                .toList();

        LearningPreference preference = learningPreferenceRepository
                .findByLearnerProfileId(learnerProfile.getId())
                .orElse(null);

        List<ScoredCourse> matched = new ArrayList<>();
        for (Course course : candidates) {
            ScoredCourse scored = score(course, preference);
            if (!scored.reasons().isEmpty()) {
                matched.add(scored);
            }
        }

        if (!matched.isEmpty()) {
            List<SuggestedCourseResponse> courses = matched.stream()
                    .sorted(MATCHED_ORDER)
                    .limit(DEFAULT_LIMIT)
                    .map(scored -> toResponse(scored.course(), scored.reasons()))
                    .toList();
            return new CourseSuggestionsResponse(true, REASON_PERSONALIZED, courses);
        }

        // Fallback: recently-added published courses, explicitly not personalized.
        List<SuggestedCourseResponse> fallback = candidates.stream()
                .sorted(RECENCY_ORDER)
                .limit(DEFAULT_LIMIT)
                .map(course -> toResponse(course, List.of()))
                .toList();

        String reason = fallback.isEmpty() ? REASON_NO_PREFERENCES : REASON_FALLBACK;
        return new CourseSuggestionsResponse(false, reason, fallback);
    }

    private ScoredCourse score(Course course, LearningPreference preference) {
        if (preference == null) {
            return new ScoredCourse(course, 0, List.of());
        }

        int score = 0;
        List<String> reasons = new ArrayList<>();

        Set<Long> preferredCategoryIds = preference.getPreferredCategoryIds();
        if (preferredCategoryIds != null
                && course.getCategory() != null
                && preferredCategoryIds.contains(course.getCategory().getId())) {
            score += CATEGORY_MATCH_SCORE;
            reasons.add("Matches your interest in " + course.getCategory().getName());
        }

        CourseLevel preferredLevel = preference.getPreferredLevel();
        if (preferredLevel != null
                && preferredLevel != CourseLevel.ALL_LEVELS
                && preferredLevel == course.getLevel()) {
            score += LEVEL_MATCH_SCORE;
            reasons.add("Matches your preferred level");
        }

        String keyword = goalKeyword(preference.getLearningGoal());
        if (keyword != null && containsKeyword(course, keyword)) {
            score += GOAL_KEYWORD_SCORE;
        }

        return new ScoredCourse(course, score, reasons);
    }

    private SuggestedCourseResponse toResponse(Course course, List<String> matchReasons) {
        return new SuggestedCourseResponse(
                course.getId(),
                course.getTitle(),
                course.getDescription(),
                course.getCategory() != null ? course.getCategory().getName() : null,
                course.getLevel(),
                course.getThumbnailUrl(),
                course.getInstructorProfile().getUser().getFullName(),
                course.getCreatedAt(),
                matchReasons);
    }

    /** Maps a learning goal to a single safe, lower-case keyword, or null. */
    private static String goalKeyword(LearningGoal goal) {
        if (goal == null) {
            return null;
        }
        return switch (goal) {
            case CAREER_GROWTH -> "career";
            case SKILL_UP -> "skill";
            case ACADEMIC -> "academic";
            case HOBBY -> "hobby";
            case NOT_SURE -> null;
        };
    }

    private static boolean containsKeyword(Course course, String keyword) {
        String categoryName = course.getCategory() != null ? course.getCategory().getName() : "";
        String haystack = (safe(course.getTitle()) + " "
                + safe(course.getDescription()) + " "
                + safe(categoryName)).toLowerCase(Locale.ROOT);
        return haystack.contains(keyword);
    }

    private static String safe(String value) {
        return value == null ? "" : value;
    }

    /** Highest score first, then newest, then highest id — stable ordering. */
    private static final Comparator<ScoredCourse> MATCHED_ORDER =
            Comparator.comparingInt(ScoredCourse::score).reversed()
                    .thenComparing(scored -> scored.course().getCreatedAt(),
                            Comparator.nullsLast(Comparator.reverseOrder()))
                    .thenComparing(scored -> scored.course().getId(), Comparator.reverseOrder());

    private record ScoredCourse(Course course, int score, List<String> reasons) {
    }
}
