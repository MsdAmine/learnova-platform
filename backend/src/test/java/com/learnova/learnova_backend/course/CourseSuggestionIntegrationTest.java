package com.learnova.learnova_backend.course;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.learnova.learnova_backend.auth.dto.LoginRequest;
import com.learnova.learnova_backend.auth.dto.RegisterRequest;
import com.learnova.learnova_backend.course.entity.Category;
import com.learnova.learnova_backend.course.entity.Course;
import com.learnova.learnova_backend.course.entity.CourseLevel;
import com.learnova.learnova_backend.course.entity.CourseStatus;
import com.learnova.learnova_backend.course.repository.CategoryRepository;
import com.learnova.learnova_backend.course.repository.CourseRepository;
import com.learnova.learnova_backend.enrollment.entity.Enrollment;
import com.learnova.learnova_backend.enrollment.entity.EnrollmentStatus;
import com.learnova.learnova_backend.enrollment.repository.EnrollmentRepository;
import com.learnova.learnova_backend.profile.entity.InstructorApprovalStatus;
import com.learnova.learnova_backend.profile.entity.InstructorProfile;
import com.learnova.learnova_backend.profile.entity.LearnerProfile;
import com.learnova.learnova_backend.profile.entity.LearningGoal;
import com.learnova.learnova_backend.profile.entity.LearningPreference;
import com.learnova.learnova_backend.profile.repository.InstructorProfileRepository;
import com.learnova.learnova_backend.profile.repository.LearnerProfileRepository;
import com.learnova.learnova_backend.profile.repository.LearningPreferenceRepository;
import com.learnova.learnova_backend.user.entity.User;
import com.learnova.learnova_backend.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Covers {@code GET /api/v1/learner/course-suggestions}: rules-based,
 * learner-scoped course suggestions. The endpoint resolves the learner from the
 * token, exposes only PUBLISHED non-enrolled courses, ranks by preference match,
 * and falls back honestly when nothing matches.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class CourseSuggestionIntegrationTest {

    private static final String URL = "/api/v1/learner/course-suggestions";

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;
    @Autowired private InstructorProfileRepository instructorProfileRepository;
    @Autowired private LearnerProfileRepository learnerProfileRepository;
    @Autowired private LearningPreferenceRepository learningPreferenceRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private CourseRepository courseRepository;
    @Autowired private EnrollmentRepository enrollmentRepository;

    // ─── Auth ────────────────────────────────────────────────────────────────────

    @Test
    void unauthenticatedRequestIsRejected() throws Exception {
        mockMvc.perform(get(URL))
                .andExpect(status().isUnauthorized());
    }

    // ─── Personalized matching ────────────────────────────────────────────────────

    @Test
    void learnerWithPreferredCategoryReceivesMatchingPublishedCourses() throws Exception {
        InstructorProfile instructor = createInstructor("inst.match@suggest.test");
        Category preferred = saveCategory("Data Analytics");
        Category other = saveCategory("Cooking");

        Long matchId = createCourse(instructor, preferred, CourseLevel.BEGINNER,
                CourseStatus.PUBLISHED, "Analytics 101").getId();
        createCourse(instructor, other, CourseLevel.BEGINNER,
                CourseStatus.PUBLISHED, "Cooking 101");

        String token = registerLearner("learner.match@suggest.test");
        setPreferences("learner.match@suggest.test",
                Set.of(preferred.getId()), null, null);

        mockMvc.perform(get(URL).header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.personalized").value(true))
                .andExpect(jsonPath("$.reason").value("Based on your selected interests"))
                .andExpect(jsonPath("$.courses[?(@.id == " + matchId + ")]").exists())
                .andExpect(jsonPath("$.courses[?(@.id == " + matchId + ")].matchReasons[0]")
                        .value("Matches your interest in ST-Data Analytics"));
    }

    @Test
    void preferredLevelBoostsRankingAboveCategoryOnlyMatch() throws Exception {
        InstructorProfile instructor = createInstructor("inst.rank@suggest.test");
        Category preferred = saveCategory("Web Development");

        // Both share the preferred category (+5). Only one also matches the
        // preferred level (+3), so it must rank first.
        Long categoryOnlyId = createCourse(instructor, preferred, CourseLevel.ADVANCED,
                CourseStatus.PUBLISHED, "Advanced Web").getId();
        Long categoryAndLevelId = createCourse(instructor, preferred, CourseLevel.BEGINNER,
                CourseStatus.PUBLISHED, "Beginner Web").getId();

        String token = registerLearner("learner.rank@suggest.test");
        setPreferences("learner.rank@suggest.test",
                Set.of(preferred.getId()), CourseLevel.BEGINNER, null);

        mockMvc.perform(get(URL).header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.personalized").value(true))
                .andExpect(jsonPath("$.courses[0].id").value(categoryAndLevelId))
                .andExpect(jsonPath("$.courses[1].id").value(categoryOnlyId));
    }

    // ─── Exclusions ───────────────────────────────────────────────────────────────

    @Test
    void enrolledCoursesAreExcludedEvenWhenTheyMatch() throws Exception {
        InstructorProfile instructor = createInstructor("inst.enrolled@suggest.test");
        Category preferred = saveCategory("Machine Learning");

        Course enrolled = createCourse(instructor, preferred, CourseLevel.BEGINNER,
                CourseStatus.PUBLISHED, "ML Enrolled");
        Long availableId = createCourse(instructor, preferred, CourseLevel.BEGINNER,
                CourseStatus.PUBLISHED, "ML Available").getId();

        String token = registerLearner("learner.enrolled@suggest.test");
        LearnerProfile learner = learnerProfileFor("learner.enrolled@suggest.test");
        setPreferences("learner.enrolled@suggest.test",
                Set.of(preferred.getId()), null, null);
        enroll(learner, enrolled, EnrollmentStatus.ACTIVE);

        mockMvc.perform(get(URL).header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.courses[?(@.id == " + enrolled.getId() + ")]").doesNotExist())
                .andExpect(jsonPath("$.courses[?(@.id == " + availableId + ")]").exists());
    }

    @Test
    void draftAndArchivedCoursesAreNeverSuggested() throws Exception {
        InstructorProfile instructor = createInstructor("inst.status@suggest.test");
        Category preferred = saveCategory("Cybersecurity");

        Long draftId = createCourse(instructor, preferred, CourseLevel.BEGINNER,
                CourseStatus.DRAFT, "Security Draft").getId();
        Long archivedId = createCourse(instructor, preferred, CourseLevel.BEGINNER,
                CourseStatus.ARCHIVED, "Security Archived").getId();
        Long publishedId = createCourse(instructor, preferred, CourseLevel.BEGINNER,
                CourseStatus.PUBLISHED, "Security Published").getId();

        String token = registerLearner("learner.status@suggest.test");
        setPreferences("learner.status@suggest.test",
                Set.of(preferred.getId()), null, null);

        mockMvc.perform(get(URL).header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.courses[?(@.id == " + draftId + ")]").doesNotExist())
                .andExpect(jsonPath("$.courses[?(@.id == " + archivedId + ")]").doesNotExist())
                .andExpect(jsonPath("$.courses[?(@.id == " + publishedId + ")]").exists());
    }

    // ─── Fallback ─────────────────────────────────────────────────────────────────

    @Test
    void learnerWithNoPreferencesGetsNonPersonalizedFallback() throws Exception {
        InstructorProfile instructor = createInstructor("inst.fallback@suggest.test");
        Category category = saveCategory("Photography");
        Long publishedId = createCourse(instructor, category, CourseLevel.BEGINNER,
                CourseStatus.PUBLISHED, "Photography Basics").getId();

        String token = registerLearner("learner.fallback@suggest.test");

        // This course was created during the test, so it is the newest published
        // course and sorts to the front of the recency-ordered fallback list.
        mockMvc.perform(get(URL).header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.personalized").value(false))
                .andExpect(jsonPath("$.reason").value("Explore recently added courses"))
                .andExpect(jsonPath("$.courses[0].id").value(publishedId))
                .andExpect(jsonPath("$.courses[0].matchReasons").isEmpty());
    }

    // The genuinely-empty branch (no eligible published courses → "Complete your
    // preferences to get tailored suggestions") cannot be exercised here because
    // the DemoCourseSeeder commits published courses at startup. It is covered by
    // CourseSuggestionServiceTest with mocked repositories instead.

    // ─── Privacy / isolation ────────────────────────────────────────────────────────

    @Test
    void responseExposesNoInternalScoreField() throws Exception {
        InstructorProfile instructor = createInstructor("inst.noscore@suggest.test");
        Category preferred = saveCategory("DevOps");
        createCourse(instructor, preferred, CourseLevel.BEGINNER, CourseStatus.PUBLISHED, "DevOps Intro");

        String token = registerLearner("learner.noscore@suggest.test");
        setPreferences("learner.noscore@suggest.test", Set.of(preferred.getId()), null, null);

        mockMvc.perform(get(URL).header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.courses[0].score").doesNotExist())
                .andExpect(jsonPath("$.courses[0].instructorProfileId").doesNotExist())
                .andExpect(jsonPath("$.courses[0].categoryId").doesNotExist());
    }

    @Test
    void suggestionsAreScopedToTheAuthenticatedLearner() throws Exception {
        InstructorProfile instructor = createInstructor("inst.isolation@suggest.test");
        Category catA = saveCategory("Finance");
        Category catB = saveCategory("Design");
        Long financeId = createCourse(instructor, catA, CourseLevel.BEGINNER,
                CourseStatus.PUBLISHED, "Finance 101").getId();
        Long designId = createCourse(instructor, catB, CourseLevel.BEGINNER,
                CourseStatus.PUBLISHED, "Design 101").getId();

        String tokenA = registerLearner("learner.iso-a@suggest.test");
        setPreferences("learner.iso-a@suggest.test", Set.of(catA.getId()), null, null);

        String tokenB = registerLearner("learner.iso-b@suggest.test");
        setPreferences("learner.iso-b@suggest.test", Set.of(catB.getId()), null, null);

        mockMvc.perform(get(URL).header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.courses[0].id").value(financeId));

        mockMvc.perform(get(URL).header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.courses[0].id").value(designId));
    }

    // ─── Helpers ────────────────────────────────────────────────────────────────────

    private InstructorProfile createInstructor(String email) throws Exception {
        RegisterRequest req = new RegisterRequest("Course Instructor", email, "password123");
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated());

        User user = userRepository.findByEmailIgnoreCase(email).orElseThrow();
        return instructorProfileRepository.save(
                InstructorProfile.builder()
                        .user(user)
                        .bio("Test instructor bio")
                        .expertise("Test expertise")
                        .approvalStatus(InstructorApprovalStatus.APPROVED)
                        .build());
    }

    private Category saveCategory(String name) {
        // Prefix to avoid colliding with the demo categories the seeder commits
        // at startup (unique name constraint).
        return categoryRepository.save(Category.builder().name("ST-" + name).build());
    }

    private Course createCourse(InstructorProfile instructor, Category category,
                                CourseLevel level, CourseStatus status, String title) {
        return courseRepository.save(
                Course.builder()
                        .title(title)
                        .description("A course about " + title)
                        .instructorProfile(instructor)
                        .category(category)
                        .level(level)
                        .status(status)
                        .build());
    }

    private void enroll(LearnerProfile learner, Course course, EnrollmentStatus status) {
        enrollmentRepository.save(
                Enrollment.builder()
                        .learnerProfile(learner)
                        .course(course)
                        .status(status)
                        .build());
    }

    private LearnerProfile learnerProfileFor(String email) {
        User user = userRepository.findByEmailIgnoreCase(email).orElseThrow();
        return learnerProfileRepository.findByUserId(user.getId()).orElseThrow();
    }

    private void setPreferences(String email, Set<Long> categoryIds,
                                CourseLevel level, LearningGoal goal) {
        LearnerProfile learner = learnerProfileFor(email);
        LearningPreference preference = learningPreferenceRepository
                .findByLearnerProfileId(learner.getId())
                .orElseGet(() -> LearningPreference.builder().learnerProfile(learner).build());
        preference.setPreferredLevel(level);
        preference.setLearningGoal(goal);
        preference.getPreferredCategoryIds().clear();
        if (categoryIds != null) {
            preference.getPreferredCategoryIds().addAll(categoryIds);
        }
        learningPreferenceRepository.save(preference);
    }

    private String registerLearner(String email) throws Exception {
        String password = "password123";
        RegisterRequest registerRequest = new RegisterRequest("Test Learner", email, password);
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated());

        LoginRequest loginRequest = new LoginRequest(email, password);
        String loginResponse = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode json = objectMapper.readTree(loginResponse);
        return json.get("accessToken").asText();
    }
}
