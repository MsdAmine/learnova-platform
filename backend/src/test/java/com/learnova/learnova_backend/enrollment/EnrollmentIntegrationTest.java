package com.learnova.learnova_backend.enrollment;

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
import com.learnova.learnova_backend.profile.entity.InstructorApprovalStatus;
import com.learnova.learnova_backend.profile.entity.InstructorProfile;
import com.learnova.learnova_backend.profile.repository.InstructorProfileRepository;
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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class EnrollmentIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;
    @Autowired private InstructorProfileRepository instructorProfileRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private CourseRepository courseRepository;

    // ─── Test 1 ───────────────────────────────────────────────────────────────

    @Test
    void authenticatedLearnerCanEnrollInExistingCourse() throws Exception {
        Long courseId = setupCourse("inst.t1@enroll.test");
        String token = registerAndLogin("learner.t1@enroll.test", "password123");

        mockMvc.perform(post("/api/v1/courses/" + courseId + "/enroll")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.courseId").value(courseId))
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.progressPercentage").value(0));
    }

    // ─── Test 2 ───────────────────────────────────────────────────────────────

    @Test
    void unauthenticatedUserCannotEnroll() throws Exception {
        Long courseId = setupCourse("inst.t2@enroll.test");

        mockMvc.perform(post("/api/v1/courses/" + courseId + "/enroll"))
                .andExpect(status().isUnauthorized());
    }

    // ─── Test 3 ───────────────────────────────────────────────────────────────

    @Test
    void duplicateEnrollmentIsRejectedWith409() throws Exception {
        Long courseId = setupCourse("inst.t3@enroll.test");
        String token = registerAndLogin("learner.t3@enroll.test", "password123");

        mockMvc.perform(post("/api/v1/courses/" + courseId + "/enroll")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/v1/courses/" + courseId + "/enroll")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isConflict());
    }

    // ─── Test 4 ───────────────────────────────────────────────────────────────

    @Test
    void enrollingInMissingCourseReturns404() throws Exception {
        String token = registerAndLogin("learner.t4@enroll.test", "password123");

        mockMvc.perform(post("/api/v1/courses/999999/enroll")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());
    }

    // ─── Test 5 ───────────────────────────────────────────────────────────────

    @Test
    void learnerCanListOnlyTheirOwnEnrollments() throws Exception {
        Long courseId = setupCourse("inst.t5@enroll.test");
        String token1 = registerAndLogin("learner.t5a@enroll.test", "password123");
        String token2 = registerAndLogin("learner.t5b@enroll.test", "password123");

        mockMvc.perform(post("/api/v1/courses/" + courseId + "/enroll")
                        .header("Authorization", "Bearer " + token1))
                .andExpect(status().isCreated());

        // Learner1 sees exactly one enrollment
        mockMvc.perform(get("/api/v1/learner/enrollments")
                        .header("Authorization", "Bearer " + token1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].courseId").value(courseId));

        // Learner2 has no enrollments
        mockMvc.perform(get("/api/v1/learner/enrollments")
                        .header("Authorization", "Bearer " + token2))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    // ─── Test 6 ───────────────────────────────────────────────────────────────

    @Test
    void learnerCanFetchTheirEnrollmentByCourseId() throws Exception {
        Long courseId = setupCourse("inst.t6@enroll.test");
        String token = registerAndLogin("learner.t6@enroll.test", "password123");

        mockMvc.perform(post("/api/v1/courses/" + courseId + "/enroll")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/v1/learner/enrollments/" + courseId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.courseId").value(courseId))
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.progressPercentage").value(0));
    }

    // ─── Test 7 ───────────────────────────────────────────────────────────────

    @Test
    void fetchingEnrollmentForNotEnrolledCourseReturns404() throws Exception {
        Long courseId = setupCourse("inst.t7@enroll.test");
        String token = registerAndLogin("learner.t7@enroll.test", "password123");

        mockMvc.perform(get("/api/v1/learner/enrollments/" + courseId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());
    }

    // ─── Test 8 ───────────────────────────────────────────────────────────────

    @Test
    void learnerCannotSeeAnotherLearnersEnrollment() throws Exception {
        Long courseId = setupCourse("inst.t8@enroll.test");
        String token1 = registerAndLogin("learner.t8a@enroll.test", "password123");
        String token2 = registerAndLogin("learner.t8b@enroll.test", "password123");

        // Learner1 enrolls
        mockMvc.perform(post("/api/v1/courses/" + courseId + "/enroll")
                        .header("Authorization", "Bearer " + token1))
                .andExpect(status().isCreated());

        // Learner2 cannot fetch learner1's enrollment for that course
        mockMvc.perform(get("/api/v1/learner/enrollments/" + courseId)
                        .header("Authorization", "Bearer " + token2))
                .andExpect(status().isNotFound());
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    /**
     * Registers a user via HTTP (creating their learner profile automatically),
     * then directly inserts an approved instructor profile and a published course
     * linked to that user. Returns the new course ID.
     *
     * All data lives in the same test transaction and is rolled back after each test.
     */
    private Long setupCourse(String instructorEmail) throws Exception {
        RegisterRequest req = new RegisterRequest("Course Instructor", instructorEmail, "password123");
        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated());

        User instructorUser = userRepository.findByEmailIgnoreCase(instructorEmail).orElseThrow();

        InstructorProfile instructorProfile = instructorProfileRepository.save(
                InstructorProfile.builder()
                        .user(instructorUser)
                        .bio("Test instructor bio")
                        .expertise("Test expertise")
                        .approvalStatus(InstructorApprovalStatus.APPROVED)
                        .build()
        );

        Category category = categoryRepository.save(
                Category.builder()
                        .name("Enrollment Test – " + instructorEmail)
                        .build()
        );

        Course course = courseRepository.save(
                Course.builder()
                        .title("Enrollment Test Course – " + instructorEmail)
                        .instructorProfile(instructorProfile)
                        .category(category)
                        .level(CourseLevel.BEGINNER)
                        .status(CourseStatus.PUBLISHED)
                        .build()
        );

        return course.getId();
    }

    private String registerAndLogin(String email, String password) throws Exception {
        RegisterRequest registerRequest = new RegisterRequest("Test User", email, password);
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
