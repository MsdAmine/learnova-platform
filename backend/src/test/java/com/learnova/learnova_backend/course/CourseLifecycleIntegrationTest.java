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
import com.learnova.learnova_backend.user.entity.Role;
import com.learnova.learnova_backend.user.entity.RoleName;
import com.learnova.learnova_backend.user.entity.User;
import com.learnova.learnova_backend.user.repository.RoleRepository;
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

/**
 * Integration tests for the course lifecycle endpoints:
 *   POST /api/v1/instructor/courses/{courseId}/publish
 *   POST /api/v1/instructor/courses/{courseId}/archive
 *
 * Covers status transitions, catalog visibility, enrollment guards, and
 * access-control rules (401/403, cross-instructor ownership).
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class CourseLifecycleIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;
    @Autowired private RoleRepository roleRepository;
    @Autowired private InstructorProfileRepository instructorProfileRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private CourseRepository courseRepository;

    // ─── 1. Publish own DRAFT course ────────────────────────────────────────────

    @Test
    void instructorCanPublishOwnDraftCourse() throws Exception {
        InstructorContext ctx = setupInstructor("inst.pub1@lifecycle.test");
        Long courseId = createCourse(ctx.profile, CourseStatus.DRAFT);

        mockMvc.perform(post("/api/v1/instructor/courses/{id}/publish", courseId)
                        .header("Authorization", "Bearer " + ctx.token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(courseId))
                .andExpect(jsonPath("$.status").value("PUBLISHED"));
    }

    // ─── 2. Published course appears in public catalog ───────────────────────────

    @Test
    void publishedCourseAppearsInPublicCatalog() throws Exception {
        InstructorContext ctx = setupInstructor("inst.pub2@lifecycle.test");
        Long courseId = createCourse(ctx.profile, CourseStatus.DRAFT);

        mockMvc.perform(post("/api/v1/instructor/courses/{id}/publish", courseId)
                        .header("Authorization", "Bearer " + ctx.token))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/courses"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == " + courseId + ")]").exists())
                .andExpect(jsonPath("$[?(@.id == " + courseId + ")].status").value("PUBLISHED"));
    }

    // ─── 3. Archive own PUBLISHED course ────────────────────────────────────────

    @Test
    void instructorCanArchiveOwnPublishedCourse() throws Exception {
        InstructorContext ctx = setupInstructor("inst.arch1@lifecycle.test");
        Long courseId = createCourse(ctx.profile, CourseStatus.PUBLISHED);

        mockMvc.perform(post("/api/v1/instructor/courses/{id}/archive", courseId)
                        .header("Authorization", "Bearer " + ctx.token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(courseId))
                .andExpect(jsonPath("$.status").value("ARCHIVED"));
    }

    // ─── 4. Archived course disappears from public catalog ───────────────────────

    @Test
    void archivedCourseDisappearsFromPublicCatalog() throws Exception {
        InstructorContext ctx = setupInstructor("inst.arch2@lifecycle.test");
        Long courseId = createCourse(ctx.profile, CourseStatus.PUBLISHED);

        mockMvc.perform(post("/api/v1/instructor/courses/{id}/archive", courseId)
                        .header("Authorization", "Bearer " + ctx.token))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/courses"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == " + courseId + ")]").doesNotExist());
    }

    // ─── 5. Archived course detail returns 404 ───────────────────────────────────

    @Test
    void archivedCourseDetailReturns404() throws Exception {
        InstructorContext ctx = setupInstructor("inst.arch3@lifecycle.test");
        Long courseId = createCourse(ctx.profile, CourseStatus.PUBLISHED);

        mockMvc.perform(post("/api/v1/instructor/courses/{id}/archive", courseId)
                        .header("Authorization", "Bearer " + ctx.token))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/courses/{id}", courseId))
                .andExpect(status().isNotFound());
    }

    // ─── 6. Enrolling in archived course returns 404 ────────────────────────────

    @Test
    void enrollingInArchivedCourseReturns404() throws Exception {
        InstructorContext ctx = setupInstructor("inst.arch4@lifecycle.test");
        Long courseId = createCourse(ctx.profile, CourseStatus.PUBLISHED);

        mockMvc.perform(post("/api/v1/instructor/courses/{id}/archive", courseId)
                        .header("Authorization", "Bearer " + ctx.token))
                .andExpect(status().isOk());

        String learnerToken = registerAndLogin("learner.arch4@lifecycle.test", "password123");

        mockMvc.perform(post("/api/v1/courses/{id}/enroll", courseId)
                        .header("Authorization", "Bearer " + learnerToken))
                .andExpect(status().isNotFound());
    }

    // ─── 7. Learner cannot publish a course → 403 ───────────────────────────────

    @Test
    void learnerCannotPublishCourse() throws Exception {
        InstructorContext ctx = setupInstructor("inst.sec1@lifecycle.test");
        Long courseId = createCourse(ctx.profile, CourseStatus.DRAFT);

        String learnerToken = registerAndLogin("learner.sec1@lifecycle.test", "password123");

        mockMvc.perform(post("/api/v1/instructor/courses/{id}/publish", courseId)
                        .header("Authorization", "Bearer " + learnerToken))
                .andExpect(status().isForbidden());
    }

    // ─── 8. Unauthenticated user cannot publish → 401 ───────────────────────────

    @Test
    void unauthenticatedCannotPublishCourse() throws Exception {
        InstructorContext ctx = setupInstructor("inst.sec2@lifecycle.test");
        Long courseId = createCourse(ctx.profile, CourseStatus.DRAFT);

        mockMvc.perform(post("/api/v1/instructor/courses/{id}/publish", courseId))
                .andExpect(status().isUnauthorized());
    }

    // ─── 9. Instructor cannot publish another instructor's course → 403 ──────────

    @Test
    void instructorCannotPublishAnotherInstructorsCourse() throws Exception {
        InstructorContext owner = setupInstructor("inst.owner@lifecycle.test");
        InstructorContext other = setupInstructor("inst.other@lifecycle.test");
        Long courseId = createCourse(owner.profile, CourseStatus.DRAFT);

        // other instructor tries to publish owner's course
        mockMvc.perform(post("/api/v1/instructor/courses/{id}/publish", courseId)
                        .header("Authorization", "Bearer " + other.token))
                .andExpect(status().isForbidden());
    }

    // ─── 10. Publishing an already PUBLISHED course is idempotent → 200 ──────────

    @Test
    void publishingAlreadyPublishedCourseIsIdempotent() throws Exception {
        InstructorContext ctx = setupInstructor("inst.idem1@lifecycle.test");
        Long courseId = createCourse(ctx.profile, CourseStatus.PUBLISHED);

        mockMvc.perform(post("/api/v1/instructor/courses/{id}/publish", courseId)
                        .header("Authorization", "Bearer " + ctx.token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PUBLISHED"));
    }

    // ─── 11. Archiving an already ARCHIVED course is idempotent → 200 ────────────

    @Test
    void archivingAlreadyArchivedCourseIsIdempotent() throws Exception {
        InstructorContext ctx = setupInstructor("inst.idem2@lifecycle.test");
        Long courseId = createCourse(ctx.profile, CourseStatus.ARCHIVED);

        mockMvc.perform(post("/api/v1/instructor/courses/{id}/archive", courseId)
                        .header("Authorization", "Bearer " + ctx.token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ARCHIVED"));
    }

    // ─── 12. Publishing an ARCHIVED course returns 409 ──────────────────────────

    @Test
    void publishingArchivedCourseReturns409() throws Exception {
        InstructorContext ctx = setupInstructor("inst.arc5@lifecycle.test");
        Long courseId = createCourse(ctx.profile, CourseStatus.ARCHIVED);

        mockMvc.perform(post("/api/v1/instructor/courses/{id}/publish", courseId)
                        .header("Authorization", "Bearer " + ctx.token))
                .andExpect(status().isConflict());
    }

    // ─── Helpers ────────────────────────────────────────────────────────────────

    private record InstructorContext(InstructorProfile profile, String token) {}

    /**
     * Registers a user, grants ROLE_INSTRUCTOR, creates an approved instructor
     * profile, then logs in and returns the JWT together with the profile entity.
     */
    private InstructorContext setupInstructor(String email) throws Exception {
        // Register via HTTP so the learner profile and ROLE_LEARNER are created normally.
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new RegisterRequest("Test Instructor", email, "password123"))))
                .andExpect(status().isCreated());

        User user = userRepository.findByEmailIgnoreCase(email).orElseThrow();

        // Grant ROLE_INSTRUCTOR directly (mirrors what admin approval does).
        Role instructorRole = roleRepository.findByName(RoleName.ROLE_INSTRUCTOR)
                .orElseGet(() -> roleRepository.save(
                        Role.builder().name(RoleName.ROLE_INSTRUCTOR).build()));
        user.addRole(instructorRole);
        userRepository.save(user);

        InstructorProfile profile = instructorProfileRepository.save(
                InstructorProfile.builder()
                        .user(user)
                        .bio("Test bio")
                        .expertise("Test expertise")
                        .approvalStatus(InstructorApprovalStatus.APPROVED)
                        .build());

        String token = login(email, "password123");
        return new InstructorContext(profile, token);
    }

    private Long createCourse(InstructorProfile profile, CourseStatus status) {
        Category category = categoryRepository.save(
                Category.builder()
                        .name("Lifecycle Test – " + profile.getUser().getEmail())
                        .build());

        Course course = courseRepository.save(
                Course.builder()
                        .title("Lifecycle Test Course – " + profile.getUser().getEmail())
                        .instructorProfile(profile)
                        .category(category)
                        .level(CourseLevel.BEGINNER)
                        .status(status)
                        .build());

        return course.getId();
    }

    private String registerAndLogin(String email, String password) throws Exception {
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new RegisterRequest("Test User", email, password))))
                .andExpect(status().isCreated());
        return login(email, password);
    }

    private String login(String email, String password) throws Exception {
        String response = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new LoginRequest(email, password))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode json = objectMapper.readTree(response);
        return json.get("accessToken").asText();
    }
}
