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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class WishlistIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;
    @Autowired private InstructorProfileRepository instructorProfileRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private CourseRepository courseRepository;

    // ─── Test 1 ───────────────────────────────────────────────────────────────

    @Test
    void statusReturnsSavedTrueForSavedCourse() throws Exception {
        Long courseId = setupCourse("inst.w1@wishlist.test");
        String token = registerAndLogin("learner.w1@wishlist.test", "password123");

        mockMvc.perform(post("/api/v1/wishlist/course/" + courseId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/v1/wishlist/course/" + courseId + "/status")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.courseId").value(courseId))
                .andExpect(jsonPath("$.saved").value(true));
    }

    // ─── Test 2 ───────────────────────────────────────────────────────────────

    @Test
    void statusReturnsSavedFalseForUnsavedCourse() throws Exception {
        Long courseId = setupCourse("inst.w2@wishlist.test");
        String token = registerAndLogin("learner.w2@wishlist.test", "password123");

        mockMvc.perform(get("/api/v1/wishlist/course/" + courseId + "/status")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.courseId").value(courseId))
                .andExpect(jsonPath("$.saved").value(false));
    }

    // ─── Test 3 ───────────────────────────────────────────────────────────────

    @Test
    void statusRequiresAuthentication() throws Exception {
        Long courseId = setupCourse("inst.w3@wishlist.test");

        mockMvc.perform(get("/api/v1/wishlist/course/" + courseId + "/status"))
                .andExpect(status().isUnauthorized());
    }

    // ─── Test 4 ───────────────────────────────────────────────────────────────

    @Test
    void statusDoesNotLeakAcrossLearners() throws Exception {
        Long courseId = setupCourse("inst.w4@wishlist.test");
        String token1 = registerAndLogin("learner.w4a@wishlist.test", "password123");
        String token2 = registerAndLogin("learner.w4b@wishlist.test", "password123");

        mockMvc.perform(post("/api/v1/wishlist/course/" + courseId)
                        .header("Authorization", "Bearer " + token1))
                .andExpect(status().isCreated());

        // Learner2 never saved this course; the status endpoint resolves the
        // learner from the authenticated principal, never from a request param,
        // so learner2 cannot observe learner1's saved state.
        mockMvc.perform(get("/api/v1/wishlist/course/" + courseId + "/status")
                        .header("Authorization", "Bearer " + token2))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.saved").value(false));
    }

    // ─── Test 5 ───────────────────────────────────────────────────────────────

    @Test
    void addToWishlistTwiceReturns409() throws Exception {
        Long courseId = setupCourse("inst.w5@wishlist.test");
        String token = registerAndLogin("learner.w5@wishlist.test", "password123");

        mockMvc.perform(post("/api/v1/wishlist/course/" + courseId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/v1/wishlist/course/" + courseId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isConflict());
    }

    // ─── Test 6 ───────────────────────────────────────────────────────────────

    @Test
    void removeFromWishlistDropsTheCourseFromStatus() throws Exception {
        Long courseId = setupCourse("inst.w6@wishlist.test");
        String token = registerAndLogin("learner.w6@wishlist.test", "password123");

        mockMvc.perform(post("/api/v1/wishlist/course/" + courseId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isCreated());

        mockMvc.perform(delete("/api/v1/wishlist/course/" + courseId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/wishlist/course/" + courseId + "/status")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.saved").value(false));
    }

    // ─── Test 7 ───────────────────────────────────────────────────────────────

    @Test
    void enrollingRemovesTheCourseFromWishlist() throws Exception {
        Long courseId = setupCourse("inst.w7@wishlist.test");
        String token = registerAndLogin("learner.w7@wishlist.test", "password123");

        mockMvc.perform(post("/api/v1/wishlist/course/" + courseId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/v1/courses/" + courseId + "/enroll")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/v1/wishlist/course/" + courseId + "/status")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.saved").value(false));
    }

    // ─── Test 8 ───────────────────────────────────────────────────────────────

    @Test
    void enrollingWithoutASavedCourseStillSucceeds() throws Exception {
        Long courseId = setupCourse("inst.w8@wishlist.test");
        String token = registerAndLogin("learner.w8@wishlist.test", "password123");

        // The course was never saved; enrollment must not fail when there is
        // nothing to remove from the wishlist.
        mockMvc.perform(post("/api/v1/courses/" + courseId + "/enroll")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isCreated());
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

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
                        .name("Wishlist Test – " + instructorEmail)
                        .build()
        );

        Course course = courseRepository.save(
                Course.builder()
                        .title("Wishlist Test Course – " + instructorEmail)
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
