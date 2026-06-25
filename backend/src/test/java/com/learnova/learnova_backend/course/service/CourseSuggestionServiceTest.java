package com.learnova.learnova_backend.course.service;

import com.learnova.learnova_backend.course.dto.CourseSuggestionsResponse;
import com.learnova.learnova_backend.course.dto.SuggestedCourseResponse;
import com.learnova.learnova_backend.course.entity.Category;
import com.learnova.learnova_backend.course.entity.Course;
import com.learnova.learnova_backend.course.entity.CourseLevel;
import com.learnova.learnova_backend.course.entity.CourseStatus;
import com.learnova.learnova_backend.course.repository.CourseRepository;
import com.learnova.learnova_backend.enrollment.entity.Enrollment;
import com.learnova.learnova_backend.enrollment.repository.EnrollmentRepository;
import com.learnova.learnova_backend.profile.entity.InstructorProfile;
import com.learnova.learnova_backend.profile.entity.LearnerProfile;
import com.learnova.learnova_backend.profile.entity.LearningGoal;
import com.learnova.learnova_backend.profile.entity.LearningPreference;
import com.learnova.learnova_backend.profile.repository.LearnerProfileRepository;
import com.learnova.learnova_backend.profile.repository.LearningPreferenceRepository;
import com.learnova.learnova_backend.user.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

/**
 * Unit tests for the deterministic scoring/fallback rules in
 * {@link CourseSuggestionService}, with all repositories mocked so the rules are
 * verified in isolation from the seeded demo catalog.
 */
@ExtendWith(MockitoExtension.class)
class CourseSuggestionServiceTest {

    private static final Long USER_ID = 99L;
    private static final Long LEARNER_PROFILE_ID = 7L;

    @Mock private CourseRepository courseRepository;
    @Mock private EnrollmentRepository enrollmentRepository;
    @Mock private LearnerProfileRepository learnerProfileRepository;
    @Mock private LearningPreferenceRepository learningPreferenceRepository;

    @InjectMocks private CourseSuggestionService service;

    private InstructorProfile instructor;
    private Category dataCategory;
    private Category cookingCategory;

    @BeforeEach
    void setUp() {
        User instructorUser = User.builder().id(1L).fullName("Ada Lovelace").build();
        instructor = InstructorProfile.builder().id(1L).user(instructorUser).build();
        dataCategory = Category.builder().id(10L).name("Data Analytics").build();
        cookingCategory = Category.builder().id(20L).name("Cooking").build();

        LearnerProfile learnerProfile = LearnerProfile.builder().id(LEARNER_PROFILE_ID).build();
        // Lenient: the not-found test resolves a different user id and never
        // reaches these stubs.
        lenient().when(learnerProfileRepository.findByUserId(USER_ID))
                .thenReturn(Optional.of(learnerProfile));
        lenient().when(enrollmentRepository.findByLearnerProfileId(LEARNER_PROFILE_ID))
                .thenReturn(List.of());
    }

    @Test
    void missingLearnerProfileThrowsNotFound() {
        when(learnerProfileRepository.findByUserId(12345L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getSuggestions(12345L))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Learner profile not found");
    }

    @Test
    void noPublishedCoursesYieldsEmptyNonPersonalizedResponse() {
        when(courseRepository.findByStatus(CourseStatus.PUBLISHED)).thenReturn(List.of());
        when(learningPreferenceRepository.findByLearnerProfileId(LEARNER_PROFILE_ID))
                .thenReturn(Optional.empty());

        CourseSuggestionsResponse response = service.getSuggestions(USER_ID);

        assertThat(response.personalized()).isFalse();
        assertThat(response.reason()).isEqualTo("Complete your preferences to get tailored suggestions");
        assertThat(response.courses()).isEmpty();
    }

    @Test
    void noPreferencesWithPublishedCoursesYieldsRecentlyAddedFallback() {
        Course older = course(1L, "Older", dataCategory, CourseLevel.BEGINNER, daysAgo(5));
        Course newer = course(2L, "Newer", cookingCategory, CourseLevel.ADVANCED, daysAgo(1));
        when(courseRepository.findByStatus(CourseStatus.PUBLISHED)).thenReturn(List.of(older, newer));
        when(learningPreferenceRepository.findByLearnerProfileId(LEARNER_PROFILE_ID))
                .thenReturn(Optional.empty());

        CourseSuggestionsResponse response = service.getSuggestions(USER_ID);

        assertThat(response.personalized()).isFalse();
        assertThat(response.reason()).isEqualTo("Explore recently added courses");
        // Newest first, and no fabricated match reasons.
        assertThat(response.courses()).extracting(SuggestedCourseResponse::id).containsExactly(2L, 1L);
        assertThat(response.courses()).allSatisfy(c -> assertThat(c.matchReasons()).isEmpty());
    }

    @Test
    void categoryAndLevelMatchesRankAboveCategoryOnly() {
        Course categoryOnly = course(1L, "Advanced Data", dataCategory, CourseLevel.ADVANCED, daysAgo(1));
        Course categoryAndLevel = course(2L, "Beginner Data", dataCategory, CourseLevel.BEGINNER, daysAgo(3));
        Course noMatch = course(3L, "Cooking", cookingCategory, CourseLevel.ADVANCED, daysAgo(1));
        when(courseRepository.findByStatus(CourseStatus.PUBLISHED))
                .thenReturn(List.of(categoryOnly, categoryAndLevel, noMatch));
        when(learningPreferenceRepository.findByLearnerProfileId(LEARNER_PROFILE_ID))
                .thenReturn(Optional.of(preference(Set.of(dataCategory.getId()), CourseLevel.BEGINNER, null)));

        CourseSuggestionsResponse response = service.getSuggestions(USER_ID);

        assertThat(response.personalized()).isTrue();
        assertThat(response.reason()).isEqualTo("Based on your selected interests");
        // categoryAndLevel (8) ranks above categoryOnly (5); non-matching course is dropped.
        assertThat(response.courses()).extracting(SuggestedCourseResponse::id).containsExactly(2L, 1L);
        assertThat(response.courses().get(0).matchReasons())
                .containsExactly("Matches your interest in Data Analytics", "Matches your preferred level");
        assertThat(response.courses().get(1).matchReasons())
                .containsExactly("Matches your interest in Data Analytics");
    }

    @Test
    void allLevelsPreferenceIsTreatedAsNoLevelSignal() {
        Course course = course(1L, "Beginner Data", dataCategory, CourseLevel.BEGINNER, daysAgo(1));
        when(courseRepository.findByStatus(CourseStatus.PUBLISHED)).thenReturn(List.of(course));
        when(learningPreferenceRepository.findByLearnerProfileId(LEARNER_PROFILE_ID))
                .thenReturn(Optional.of(preference(Set.of(dataCategory.getId()), CourseLevel.ALL_LEVELS, null)));

        CourseSuggestionsResponse response = service.getSuggestions(USER_ID);

        assertThat(response.courses().get(0).matchReasons())
                .containsExactly("Matches your interest in Data Analytics");
    }

    @Test
    void goalKeywordBreaksTiesButAddsNoMatchReason() {
        // Both share category (+5). One title contains the "career" goal keyword (+1),
        // so it ranks first, but the keyword never surfaces as a match reason.
        Course plain = course(1L, "Data Foundations", dataCategory, CourseLevel.ADVANCED, daysAgo(1));
        Course careerOriented = course(2L, "Data for Career Growth", dataCategory, CourseLevel.ADVANCED, daysAgo(1));
        when(courseRepository.findByStatus(CourseStatus.PUBLISHED)).thenReturn(List.of(plain, careerOriented));
        when(learningPreferenceRepository.findByLearnerProfileId(LEARNER_PROFILE_ID))
                .thenReturn(Optional.of(preference(Set.of(dataCategory.getId()), null, LearningGoal.CAREER_GROWTH)));

        CourseSuggestionsResponse response = service.getSuggestions(USER_ID);

        assertThat(response.courses()).extracting(SuggestedCourseResponse::id).containsExactly(2L, 1L);
        assertThat(response.courses().get(0).matchReasons())
                .containsExactly("Matches your interest in Data Analytics");
    }

    @Test
    void enrolledCoursesAreExcluded() {
        Course enrolled = course(1L, "Enrolled Data", dataCategory, CourseLevel.BEGINNER, daysAgo(1));
        Course available = course(2L, "Available Data", dataCategory, CourseLevel.BEGINNER, daysAgo(1));
        when(courseRepository.findByStatus(CourseStatus.PUBLISHED)).thenReturn(List.of(enrolled, available));
        when(enrollmentRepository.findByLearnerProfileId(LEARNER_PROFILE_ID))
                .thenReturn(List.of(Enrollment.builder().course(enrolled).build()));
        when(learningPreferenceRepository.findByLearnerProfileId(LEARNER_PROFILE_ID))
                .thenReturn(Optional.of(preference(Set.of(dataCategory.getId()), null, null)));

        CourseSuggestionsResponse response = service.getSuggestions(USER_ID);

        assertThat(response.courses()).extracting(SuggestedCourseResponse::id).containsExactly(2L);
    }

    @Test
    void preferencesWithoutAnyMatchFallBackToRecentlyAdded() {
        Course course = course(1L, "Cooking", cookingCategory, CourseLevel.ADVANCED, daysAgo(1));
        when(courseRepository.findByStatus(CourseStatus.PUBLISHED)).thenReturn(List.of(course));
        // Learner prefers a category not present in the catalog, level null.
        when(learningPreferenceRepository.findByLearnerProfileId(LEARNER_PROFILE_ID))
                .thenReturn(Optional.of(preference(Set.of(999L), null, null)));

        CourseSuggestionsResponse response = service.getSuggestions(USER_ID);

        assertThat(response.personalized()).isFalse();
        assertThat(response.reason()).isEqualTo("Explore recently added courses");
        assertThat(response.courses()).extracting(SuggestedCourseResponse::id).containsExactly(1L);
    }

    @Test
    void resultIsCappedAtDefaultLimit() {
        List<Course> many = new java.util.ArrayList<>();
        for (long i = 1; i <= 12; i++) {
            many.add(course(i, "Data " + i, dataCategory, CourseLevel.BEGINNER, daysAgo((int) i)));
        }
        when(courseRepository.findByStatus(CourseStatus.PUBLISHED)).thenReturn(many);
        when(learningPreferenceRepository.findByLearnerProfileId(LEARNER_PROFILE_ID))
                .thenReturn(Optional.of(preference(Set.of(dataCategory.getId()), null, null)));

        CourseSuggestionsResponse response = service.getSuggestions(USER_ID);

        assertThat(response.courses()).hasSize(CourseSuggestionService.DEFAULT_LIMIT);
    }

    // ─── Helpers ────────────────────────────────────────────────────────────────────

    private Course course(Long id, String title, Category category, CourseLevel level, Instant createdAt) {
        return Course.builder()
                .id(id)
                .title(title)
                .description("A course about " + title)
                .category(category)
                .level(level)
                .instructorProfile(instructor)
                .status(CourseStatus.PUBLISHED)
                .createdAt(createdAt)
                .build();
    }

    private LearningPreference preference(Set<Long> categoryIds, CourseLevel level, LearningGoal goal) {
        LearningPreference preference = LearningPreference.builder()
                .preferredLevel(level)
                .learningGoal(goal)
                .build();
        preference.getPreferredCategoryIds().addAll(categoryIds);
        return preference;
    }

    private static Instant daysAgo(int days) {
        return Instant.now().minus(days, ChronoUnit.DAYS);
    }
}
