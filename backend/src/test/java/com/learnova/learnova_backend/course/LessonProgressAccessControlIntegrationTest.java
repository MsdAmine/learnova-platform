package com.learnova.learnova_backend.course;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.learnova.learnova_backend.auth.dto.LoginRequest;
import com.learnova.learnova_backend.auth.dto.RegisterRequest;
import com.learnova.learnova_backend.course.entity.Category;
import com.learnova.learnova_backend.course.entity.Course;
import com.learnova.learnova_backend.course.entity.CourseLevel;
import com.learnova.learnova_backend.course.entity.CourseStatus;
import com.learnova.learnova_backend.course.entity.Lesson;
import com.learnova.learnova_backend.course.entity.Section;
import com.learnova.learnova_backend.course.repository.CategoryRepository;
import com.learnova.learnova_backend.course.repository.CourseRepository;
import com.learnova.learnova_backend.course.repository.LessonRepository;
import com.learnova.learnova_backend.course.repository.SectionRepository;
import com.learnova.learnova_backend.enrollment.entity.Enrollment;
import com.learnova.learnova_backend.enrollment.entity.EnrollmentStatus;
import com.learnova.learnova_backend.enrollment.repository.EnrollmentRepository;
import com.learnova.learnova_backend.profile.entity.InstructorApprovalStatus;
import com.learnova.learnova_backend.profile.entity.InstructorProfile;
import com.learnova.learnova_backend.profile.entity.LearnerProfile;
import com.learnova.learnova_backend.profile.repository.InstructorProfileRepository;
import com.learnova.learnova_backend.profile.repository.LearnerProfileRepository;
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

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class LessonProgressAccessControlIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;
    @Autowired private InstructorProfileRepository instructorProfileRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private CourseRepository courseRepository;
    @Autowired private SectionRepository sectionRepository;
    @Autowired private LessonRepository lessonRepository;
    @Autowired private LearnerProfileRepository learnerProfileRepository;
    @Autowired private EnrollmentRepository enrollmentRepository;

    // ─── Test 1 ───────────────────────────────────────────────────────────────

    @Test
    void enrolledActiveLearnerCanUpdateLessonProgress() throws Exception {
        Fixture f = buildFixture("inst.ac1@test.test");
        String token = registerAndLogin("learner.ac1@test.test", "password123");
        enrollWithStatus("learner.ac1@test.test", f.course(), EnrollmentStatus.ACTIVE);

        patchProgress(token, f.lesson().getId(), true)
                .andExpect(status().isOk());
    }

    // ─── Test 2 ───────────────────────────────────────────────────────────────

    @Test
    void enrolledActiveLearnerCanReadCourseProgress() throws Exception {
        Fixture f = buildFixture("inst.ac2@test.test");
        String token = registerAndLogin("learner.ac2@test.test", "password123");
        enrollWithStatus("learner.ac2@test.test", f.course(), EnrollmentStatus.ACTIVE);

        mockMvc.perform(get("/api/v1/lessons/course/" + f.course().getId() + "/progress")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }

    // ─── Test 3 ───────────────────────────────────────────────────────────────

    @Test
    void nonEnrolledLearnerCannotUpdateLessonProgress() throws Exception {
        Fixture f = buildFixture("inst.ac3@test.test");
        String token = registerAndLogin("learner.ac3@test.test", "password123");
        // deliberately not enrolling

        patchProgress(token, f.lesson().getId(), true)
                .andExpect(status().isNotFound());
    }

    // ─── Test 4 ───────────────────────────────────────────────────────────────

    @Test
    void nonEnrolledLearnerCannotReadCourseProgress() throws Exception {
        Fixture f = buildFixture("inst.ac4@test.test");
        String token = registerAndLogin("learner.ac4@test.test", "password123");
        // deliberately not enrolling

        mockMvc.perform(get("/api/v1/lessons/course/" + f.course().getId() + "/progress")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());
    }

    // ─── Test 5 ───────────────────────────────────────────────────────────────

    @Test
    void cancelledEnrollmentCannotUpdateLessonProgress() throws Exception {
        Fixture f = buildFixture("inst.ac5@test.test");
        String token = registerAndLogin("learner.ac5@test.test", "password123");
        enrollWithStatus("learner.ac5@test.test", f.course(), EnrollmentStatus.CANCELLED);

        patchProgress(token, f.lesson().getId(), true)
                .andExpect(status().isNotFound());
    }

    // ─── Test 6 ───────────────────────────────────────────────────────────────

    @Test
    void learnerACannotUpdateProgressForCourseThatOnlyLearnerBIsEnrolledIn() throws Exception {
        Fixture f = buildFixture("inst.ac6@test.test");
        String tokenA = registerAndLogin("learner.ac6a@test.test", "password123");
        registerAndLogin("learner.ac6b@test.test", "password123");
        // Only learner B is enrolled
        enrollWithStatus("learner.ac6b@test.test", f.course(), EnrollmentStatus.ACTIVE);

        patchProgress(tokenA, f.lesson().getId(), true)
                .andExpect(status().isNotFound());
    }

    // ─── Test 7 ───────────────────────────────────────────────────────────────

    @Test
    void unauthenticatedRequestToUpdateLessonProgressReturns401() throws Exception {
        Fixture f = buildFixture("inst.ac7@test.test");
        String body = objectMapper.writeValueAsString(Map.of("isCompleted", true));

        mockMvc.perform(patch("/api/v1/lessons/" + f.lesson().getId() + "/progress")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isUnauthorized());
    }

    // ─── Test 8 ───────────────────────────────────────────────────────────────

    @Test
    void unauthenticatedRequestToReadCourseProgressReturns401() throws Exception {
        Fixture f = buildFixture("inst.ac8@test.test");

        mockMvc.perform(get("/api/v1/lessons/course/" + f.course().getId() + "/progress"))
                .andExpect(status().isUnauthorized());
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    record Fixture(Course course, Lesson lesson) {}

    private Fixture buildFixture(String instructorEmail) throws Exception {
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new RegisterRequest("Access Instructor", instructorEmail, "password123"))))
                .andExpect(status().isCreated());

        User instructorUser = userRepository.findByEmailIgnoreCase(instructorEmail).orElseThrow();
        InstructorProfile instructorProfile = instructorProfileRepository.save(
                InstructorProfile.builder()
                        .user(instructorUser)
                        .bio("AC test bio")
                        .expertise("AC test expertise")
                        .approvalStatus(InstructorApprovalStatus.APPROVED)
                        .build());

        Category category = categoryRepository.save(
                Category.builder().name("AC Test – " + instructorEmail).build());

        Course course = courseRepository.save(
                Course.builder()
                        .title("AC Test Course – " + instructorEmail)
                        .instructorProfile(instructorProfile)
                        .category(category)
                        .level(CourseLevel.BEGINNER)
                        .status(CourseStatus.PUBLISHED)
                        .build());

        Section section = sectionRepository.save(
                Section.builder().title("Section 1").course(course).build());

        Lesson lesson = lessonRepository.save(
                Lesson.builder().title("Lesson 1").section(section).build());

        return new Fixture(course, lesson);
    }

    private LearnerProfile enrollWithStatus(String learnerEmail, Course course, EnrollmentStatus status) {
        User learnerUser = userRepository.findByEmailIgnoreCase(learnerEmail).orElseThrow();
        LearnerProfile learnerProfile = learnerProfileRepository.findByUserId(learnerUser.getId()).orElseThrow();
        enrollmentRepository.save(Enrollment.builder()
                .learnerProfile(learnerProfile)
                .course(course)
                .status(status)
                .build());
        return learnerProfile;
    }

    private org.springframework.test.web.servlet.ResultActions patchProgress(
            String token, Long lessonId, boolean completed) throws Exception {
        String body = objectMapper.writeValueAsString(Map.of("isCompleted", completed));
        return mockMvc.perform(patch("/api/v1/lessons/" + lessonId + "/progress")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(body));
    }

    private String registerAndLogin(String email, String password) throws Exception {
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new RegisterRequest("Test Learner", email, password))))
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
