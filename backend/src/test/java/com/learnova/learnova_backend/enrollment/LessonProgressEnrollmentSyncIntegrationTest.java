package com.learnova.learnova_backend.enrollment;

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

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class LessonProgressEnrollmentSyncIntegrationTest {

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
    void markingOneLessonCompleteUpdatesEnrollmentProgressPercentage() throws Exception {
        CourseFixture f = setupCourse("inst.sync1@test.test", 1, 2);
        String token = registerAndLogin("learner.sync1@test.test", "password123");
        LearnerProfile learnerProfile = enrollDirectly("learner.sync1@test.test", f.course());

        patchLessonProgress(token, f.lessons().get(0).getId(), true);

        Enrollment enrollment = enrollmentRepository
                .findByLearnerProfileIdAndCourseId(learnerProfile.getId(), f.course().getId())
                .orElseThrow();
        assertThat(enrollment.getProgressPercentage()).isEqualTo(50);
        assertThat(enrollment.getStatus()).isEqualTo(EnrollmentStatus.ACTIVE);
        assertThat(enrollment.getCompletedAt()).isNull();
    }

    // ─── Test 2 ───────────────────────────────────────────────────────────────

    @Test
    void completingAllLessonsSetsProgressPercentageTo100() throws Exception {
        CourseFixture f = setupCourse("inst.sync2@test.test", 1, 2);
        String token = registerAndLogin("learner.sync2@test.test", "password123");
        LearnerProfile learnerProfile = enrollDirectly("learner.sync2@test.test", f.course());

        patchLessonProgress(token, f.lessons().get(0).getId(), true);
        patchLessonProgress(token, f.lessons().get(1).getId(), true);

        Enrollment enrollment = enrollmentRepository
                .findByLearnerProfileIdAndCourseId(learnerProfile.getId(), f.course().getId())
                .orElseThrow();
        assertThat(enrollment.getProgressPercentage()).isEqualTo(100);
    }

    // ─── Test 3 ───────────────────────────────────────────────────────────────

    @Test
    void completingAllLessonsMarksEnrollmentAsCompletedWithCompletedAt() throws Exception {
        CourseFixture f = setupCourse("inst.sync3@test.test", 1, 2);
        String token = registerAndLogin("learner.sync3@test.test", "password123");
        LearnerProfile learnerProfile = enrollDirectly("learner.sync3@test.test", f.course());

        patchLessonProgress(token, f.lessons().get(0).getId(), true);
        patchLessonProgress(token, f.lessons().get(1).getId(), true);

        Enrollment enrollment = enrollmentRepository
                .findByLearnerProfileIdAndCourseId(learnerProfile.getId(), f.course().getId())
                .orElseThrow();
        assertThat(enrollment.getStatus()).isEqualTo(EnrollmentStatus.COMPLETED);
        assertThat(enrollment.getCompletedAt()).isNotNull();
    }

    // ─── Test 4 ───────────────────────────────────────────────────────────────

    @Test
    void progressCalculationCountsLessonsAcrossMultipleSections() throws Exception {
        // 2 sections × 2 lessons = 4 total; completing 1 → 25%
        CourseFixture f = setupCourse("inst.sync4@test.test", 2, 2);
        String token = registerAndLogin("learner.sync4@test.test", "password123");
        LearnerProfile learnerProfile = enrollDirectly("learner.sync4@test.test", f.course());

        patchLessonProgress(token, f.lessons().get(0).getId(), true);

        Enrollment enrollment = enrollmentRepository
                .findByLearnerProfileIdAndCourseId(learnerProfile.getId(), f.course().getId())
                .orElseThrow();
        assertThat(enrollment.getProgressPercentage()).isEqualTo(25);
    }

    // ─── Test 5 ───────────────────────────────────────────────────────────────

    @Test
    void progressUpdateForOneLearnerDoesNotAffectAnotherLearnersEnrollment() throws Exception {
        CourseFixture f = setupCourse("inst.sync5@test.test", 1, 2);
        String token1 = registerAndLogin("learner.sync5a@test.test", "password123");
        String token2 = registerAndLogin("learner.sync5b@test.test", "password123");
        LearnerProfile learner1 = enrollDirectly("learner.sync5a@test.test", f.course());
        LearnerProfile learner2 = enrollDirectly("learner.sync5b@test.test", f.course());

        patchLessonProgress(token1, f.lessons().get(0).getId(), true);
        patchLessonProgress(token1, f.lessons().get(1).getId(), true);

        Enrollment enrollment1 = enrollmentRepository
                .findByLearnerProfileIdAndCourseId(learner1.getId(), f.course().getId())
                .orElseThrow();
        Enrollment enrollment2 = enrollmentRepository
                .findByLearnerProfileIdAndCourseId(learner2.getId(), f.course().getId())
                .orElseThrow();

        assertThat(enrollment1.getProgressPercentage()).isEqualTo(100);
        assertThat(enrollment2.getProgressPercentage()).isEqualTo(0);
        assertThat(enrollment2.getStatus()).isEqualTo(EnrollmentStatus.ACTIVE);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    record CourseFixture(Course course, List<Section> sections, List<Lesson> lessons) {}

    private CourseFixture setupCourse(String instructorEmail, int sectionCount, int lessonsPerSection)
            throws Exception {
        RegisterRequest req = new RegisterRequest("Sync Instructor", instructorEmail, "password123");
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated());

        User instructorUser = userRepository.findByEmailIgnoreCase(instructorEmail).orElseThrow();
        InstructorProfile instructorProfile = instructorProfileRepository.save(
                InstructorProfile.builder()
                        .user(instructorUser)
                        .bio("Sync test bio")
                        .expertise("Sync test expertise")
                        .approvalStatus(InstructorApprovalStatus.APPROVED)
                        .build());

        Category category = categoryRepository.save(
                Category.builder().name("Sync Test – " + instructorEmail).build());

        Course course = courseRepository.save(
                Course.builder()
                        .title("Sync Test Course – " + instructorEmail)
                        .instructorProfile(instructorProfile)
                        .category(category)
                        .level(CourseLevel.BEGINNER)
                        .status(CourseStatus.PUBLISHED)
                        .build());

        List<Section> sections = new ArrayList<>();
        List<Lesson> lessons = new ArrayList<>();
        for (int s = 0; s < sectionCount; s++) {
            Section section = sectionRepository.save(
                    Section.builder().title("Section " + (s + 1)).course(course).build());
            sections.add(section);
            for (int l = 0; l < lessonsPerSection; l++) {
                Lesson lesson = lessonRepository.save(
                        Lesson.builder().title("Lesson " + (l + 1)).section(section).build());
                lessons.add(lesson);
            }
        }

        return new CourseFixture(course, sections, lessons);
    }

    private LearnerProfile enrollDirectly(String learnerEmail, Course course) {
        User learnerUser = userRepository.findByEmailIgnoreCase(learnerEmail).orElseThrow();
        LearnerProfile learnerProfile = learnerProfileRepository.findByUserId(learnerUser.getId()).orElseThrow();
        enrollmentRepository.save(Enrollment.builder()
                .learnerProfile(learnerProfile)
                .course(course)
                .build());
        return learnerProfile;
    }

    private void patchLessonProgress(String token, Long lessonId, boolean completed) throws Exception {
        String body = objectMapper.writeValueAsString(Map.of("isCompleted", completed));
        mockMvc.perform(patch("/api/v1/lessons/" + lessonId + "/progress")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk());
    }

    private String registerAndLogin(String email, String password) throws Exception {
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
