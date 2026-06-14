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
 * Integration tests for GET /api/v1/instructor/courses.
 *
 * Verifies that an approved instructor sees all their own courses (DRAFT,
 * PUBLISHED, ARCHIVED), that another instructor's courses are invisible,
 * and that access-control rules (401/403) are enforced.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class InstructorCourseListIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;
    @Autowired private RoleRepository roleRepository;
    @Autowired private InstructorProfileRepository instructorProfileRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private CourseRepository courseRepository;

    private static final String LIST_URL = "/api/v1/instructor/courses";

    // ─── 1. Approved instructor can list own courses ─────────────────────────────

    @Test
    void approvedInstructorCanListOwnCourses() throws Exception {
        InstructorContext ctx = setupInstructor("inst.list1@list.test");
        createCourse(ctx.profile, "Course A", CourseStatus.DRAFT);
        createCourse(ctx.profile, "Course B", CourseStatus.PUBLISHED);

        mockMvc.perform(get(LIST_URL)
                        .header("Authorization", "Bearer " + ctx.token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[?(@.title == 'Course A')]").exists())
                .andExpect(jsonPath("$[?(@.title == 'Course B')]").exists());
    }

    // ─── 2. List includes DRAFT, PUBLISHED, and ARCHIVED courses ────────────────

    @Test
    void listIncludesAllStatuses() throws Exception {
        InstructorContext ctx = setupInstructor("inst.list2@list.test");
        createCourse(ctx.profile, "Draft Course", CourseStatus.DRAFT);
        createCourse(ctx.profile, "Published Course", CourseStatus.PUBLISHED);
        createCourse(ctx.profile, "Archived Course", CourseStatus.ARCHIVED);

        mockMvc.perform(get(LIST_URL)
                        .header("Authorization", "Bearer " + ctx.token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(3))
                .andExpect(jsonPath("$[?(@.status == 'DRAFT')]").exists())
                .andExpect(jsonPath("$[?(@.status == 'PUBLISHED')]").exists())
                .andExpect(jsonPath("$[?(@.status == 'ARCHIVED')]").exists());
    }

    // ─── 3. List does not include courses from another instructor ────────────────

    @Test
    void listDoesNotIncludeOtherInstructorsCourses() throws Exception {
        InstructorContext owner = setupInstructor("inst.owner@list.test");
        InstructorContext other = setupInstructor("inst.other@list.test");
        createCourse(owner.profile, "Owner's Course", CourseStatus.PUBLISHED);

        mockMvc.perform(get(LIST_URL)
                        .header("Authorization", "Bearer " + other.token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    // ─── 4. Learner cannot list instructor courses → 403 ────────────────────────

    @Test
    void learnerCannotListInstructorCourses() throws Exception {
        String learnerToken = registerAndLogin("learner.list4@list.test", "password123");

        mockMvc.perform(get(LIST_URL)
                        .header("Authorization", "Bearer " + learnerToken))
                .andExpect(status().isForbidden());
    }

    // ─── 5. Unauthenticated cannot list instructor courses → 401 ────────────────

    @Test
    void unauthenticatedCannotListInstructorCourses() throws Exception {
        mockMvc.perform(get(LIST_URL))
                .andExpect(status().isUnauthorized());
    }

    // ─── 6. Empty list returns 200 with [] ──────────────────────────────────────

    @Test
    void emptyListReturns200WithEmptyArray() throws Exception {
        InstructorContext ctx = setupInstructor("inst.empty@list.test");

        mockMvc.perform(get(LIST_URL)
                        .header("Authorization", "Bearer " + ctx.token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    // ─── 7. Response DTO fields are correct ─────────────────────────────────────

    @Test
    void responseContainsExpectedFields() throws Exception {
        InstructorContext ctx = setupInstructor("inst.fields@list.test");
        createCourse(ctx.profile, "Field Check Course", CourseStatus.DRAFT);

        mockMvc.perform(get(LIST_URL)
                        .header("Authorization", "Bearer " + ctx.token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").exists())
                .andExpect(jsonPath("$[0].title").value("Field Check Course"))
                .andExpect(jsonPath("$[0].status").value("DRAFT"))
                .andExpect(jsonPath("$[0].level").exists())
                .andExpect(jsonPath("$[0].categoryId").exists())
                .andExpect(jsonPath("$[0].categoryName").exists())
                .andExpect(jsonPath("$[0].instructorProfileId").exists())
                .andExpect(jsonPath("$[0].instructorName").exists())
                .andExpect(jsonPath("$[0].createdAt").exists())
                .andExpect(jsonPath("$[0].updatedAt").exists());
    }

    // ─── Helpers ────────────────────────────────────────────────────────────────

    private record InstructorContext(InstructorProfile profile, String token) {}

    private InstructorContext setupInstructor(String email) throws Exception {
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new RegisterRequest("Test Instructor", email, "password123"))))
                .andExpect(status().isCreated());

        User user = userRepository.findByEmailIgnoreCase(email).orElseThrow();

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

    private void createCourse(InstructorProfile profile, String title, CourseStatus status) {
        Category category = categoryRepository.save(
                Category.builder()
                        .name("List Test Cat – " + title)
                        .build());

        courseRepository.save(
                Course.builder()
                        .title(title)
                        .instructorProfile(profile)
                        .category(category)
                        .level(CourseLevel.BEGINNER)
                        .status(status)
                        .build());
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
