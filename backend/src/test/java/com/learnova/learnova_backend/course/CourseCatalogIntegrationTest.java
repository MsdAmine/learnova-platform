package com.learnova.learnova_backend.course;

import com.fasterxml.jackson.databind.ObjectMapper;
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

/**
 * Covers the public, read-only course catalog: {@code GET /api/v1/courses} and
 * {@code GET /api/v1/courses/{id}}. These endpoints are unauthenticated and must
 * expose only PUBLISHED courses — drafts stay invisible to the public.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class CourseCatalogIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;
    @Autowired private InstructorProfileRepository instructorProfileRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private CourseRepository courseRepository;

    // ─── Test 1: list is public and contains published courses ──────────────────

    @Test
    void publicUserCanListPublishedCourses() throws Exception {
        Long publishedId = setupCourse("inst.cat1@catalog.test", CourseStatus.PUBLISHED);

        // No Authorization header → endpoint must still be reachable.
        mockMvc.perform(get("/api/v1/courses"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == " + publishedId + ")]").exists())
                .andExpect(jsonPath("$[?(@.id == " + publishedId + ")].status").value("PUBLISHED"));
    }

    // ─── Test 2: list never leaks draft courses ─────────────────────────────────

    @Test
    void publicListExcludesDraftCourses() throws Exception {
        Long draftId = setupCourse("inst.cat2@catalog.test", CourseStatus.DRAFT);

        mockMvc.perform(get("/api/v1/courses"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == " + draftId + ")]").doesNotExist());
    }

    // ─── Test 3: detail of a published course is public ─────────────────────────

    @Test
    void publicUserCanFetchPublishedCourseDetail() throws Exception {
        Long publishedId = setupCourse("inst.cat3@catalog.test", CourseStatus.PUBLISHED);

        mockMvc.perform(get("/api/v1/courses/" + publishedId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(publishedId))
                .andExpect(jsonPath("$.status").value("PUBLISHED"))
                .andExpect(jsonPath("$.instructorName").value("Course Instructor"))
                // Learner-safe DTO must not leak internal identifiers.
                .andExpect(jsonPath("$.instructorProfileId").doesNotExist())
                .andExpect(jsonPath("$.categoryId").doesNotExist());
    }

    // ─── Test 4: draft detail is hidden behind a 404 ────────────────────────────

    @Test
    void publicUserCannotFetchDraftCourseDetail() throws Exception {
        Long draftId = setupCourse("inst.cat4@catalog.test", CourseStatus.DRAFT);

        // A draft must be indistinguishable from a missing course: 404, not 200/403.
        mockMvc.perform(get("/api/v1/courses/" + draftId))
                .andExpect(status().isNotFound());
    }

    // ─── Test 5: missing course detail is a 404 ─────────────────────────────────

    @Test
    void fetchingMissingCourseDetailReturns404() throws Exception {
        mockMvc.perform(get("/api/v1/courses/999999"))
                .andExpect(status().isNotFound());
    }

    // ─── Helpers ────────────────────────────────────────────────────────────────

    /**
     * Registers an instructor user via HTTP (auto-creating a learner profile), then
     * directly persists an approved instructor profile, a category, and a course with
     * the requested status. All writes live in the test transaction and roll back.
     */
    private Long setupCourse(String instructorEmail, CourseStatus status) throws Exception {
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
                        .name("Catalog Test – " + instructorEmail)
                        .build()
        );

        Course course = courseRepository.save(
                Course.builder()
                        .title("Catalog Test Course – " + instructorEmail)
                        .instructorProfile(instructorProfile)
                        .category(category)
                        .level(CourseLevel.BEGINNER)
                        .status(status)
                        .build()
        );

        return course.getId();
    }
}
