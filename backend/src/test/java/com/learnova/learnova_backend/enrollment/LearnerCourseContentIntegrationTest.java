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
import com.learnova.learnova_backend.course.entity.LessonProgress;
import com.learnova.learnova_backend.course.entity.Section;
import com.learnova.learnova_backend.course.repository.CategoryRepository;
import com.learnova.learnova_backend.course.repository.CourseRepository;
import com.learnova.learnova_backend.course.repository.LessonProgressRepository;
import com.learnova.learnova_backend.course.repository.LessonRepository;
import com.learnova.learnova_backend.course.repository.SectionRepository;
import com.learnova.learnova_backend.enrollment.entity.Enrollment;
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

import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class LearnerCourseContentIntegrationTest {

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
    @Autowired private LessonProgressRepository lessonProgressRepository;

    // ─── Test 1 ───────────────────────────────────────────────────────────────

    @Test
    void enrolledLearnerCanFetchCourseContent() throws Exception {
        CourseWithStructure cs = setupCourseWithStructure("inst.c1@content.test", 1, 1);
        String token = registerAndLogin("learner.c1@content.test", "password123");
        enrollDirectly("learner.c1@content.test", cs.course());

        mockMvc.perform(get("/api/v1/learner/courses/" + cs.course().getId() + "/content")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.courseId").value(cs.course().getId()))
                .andExpect(jsonPath("$.courseTitle").value(cs.course().getTitle()))
                .andExpect(jsonPath("$.sections.length()").value(1))
                .andExpect(jsonPath("$.sections[0].lessons.length()").value(1));
    }

    // ─── Test 2 ───────────────────────────────────────────────────────────────

    @Test
    void sectionsAndLessonsReturnedInIdAscendingOrder() throws Exception {
        CourseWithStructure cs = setupCourseWithStructure("inst.c2@content.test", 2, 2);
        String token = registerAndLogin("learner.c2@content.test", "password123");
        enrollDirectly("learner.c2@content.test", cs.course());

        mockMvc.perform(get("/api/v1/learner/courses/" + cs.course().getId() + "/content")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sections.length()").value(2))
                .andExpect(jsonPath("$.sections[0].id").value(cs.sections().get(0).getId()))
                .andExpect(jsonPath("$.sections[1].id").value(cs.sections().get(1).getId()))
                .andExpect(jsonPath("$.sections[0].lessons[0].id").value(cs.lessons().get(0).getId()))
                .andExpect(jsonPath("$.sections[0].lessons[1].id").value(cs.lessons().get(1).getId()));
    }

    // ─── Test 3 ───────────────────────────────────────────────────────────────

    @Test
    void lessonWithNoProgressRecordReturnsCompletedFalse() throws Exception {
        CourseWithStructure cs = setupCourseWithStructure("inst.c3@content.test", 1, 1);
        String token = registerAndLogin("learner.c3@content.test", "password123");
        enrollDirectly("learner.c3@content.test", cs.course());

        mockMvc.perform(get("/api/v1/learner/courses/" + cs.course().getId() + "/content")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sections[0].lessons[0].completed").value(false));
    }

    // ─── Test 4 ───────────────────────────────────────────────────────────────

    @Test
    void lessonWithCompletedProgressReturnsCompletedTrue() throws Exception {
        CourseWithStructure cs = setupCourseWithStructure("inst.c4@content.test", 1, 1);
        String token = registerAndLogin("learner.c4@content.test", "password123");
        LearnerProfile learnerProfile = enrollDirectly("learner.c4@content.test", cs.course());

        Lesson lesson = cs.lessons().get(0);
        lessonProgressRepository.save(LessonProgress.builder()
                .learnerProfile(learnerProfile)
                .lesson(lesson)
                .isCompleted(true)
                .lastPositionSeconds(120)
                .timeSpentSeconds(300)
                .build());

        mockMvc.perform(get("/api/v1/learner/courses/" + cs.course().getId() + "/content")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sections[0].lessons[0].completed").value(true))
                .andExpect(jsonPath("$.sections[0].lessons[0].lastPositionSeconds").value(120))
                .andExpect(jsonPath("$.sections[0].lessons[0].timeSpentSeconds").value(300));
    }

    // ─── Test 5 ───────────────────────────────────────────────────────────────

    @Test
    void unenrolledLearnerGets404() throws Exception {
        CourseWithStructure cs = setupCourseWithStructure("inst.c5@content.test", 1, 1);
        String token = registerAndLogin("learner.c5@content.test", "password123");
        // deliberately not enrolling

        mockMvc.perform(get("/api/v1/learner/courses/" + cs.course().getId() + "/content")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());
    }

    // ─── Test 6 ───────────────────────────────────────────────────────────────

    @Test
    void missingCourseGets404() throws Exception {
        String token = registerAndLogin("learner.c6@content.test", "password123");

        mockMvc.perform(get("/api/v1/learner/courses/999999/content")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());
    }

    // ─── Test 7 ───────────────────────────────────────────────────────────────

    @Test
    void unauthenticatedRequestGets401() throws Exception {
        CourseWithStructure cs = setupCourseWithStructure("inst.c7@content.test", 1, 1);

        mockMvc.perform(get("/api/v1/learner/courses/" + cs.course().getId() + "/content"))
                .andExpect(status().isUnauthorized());
    }

    // ─── Test 8 ───────────────────────────────────────────────────────────────

    @Test
    void learnerCannotAccessAnotherLearnersEnrolledCourse() throws Exception {
        CourseWithStructure cs = setupCourseWithStructure("inst.c8@content.test", 1, 1);
        String token1 = registerAndLogin("learner.c8a@content.test", "password123");
        String token2 = registerAndLogin("learner.c8b@content.test", "password123");
        enrollDirectly("learner.c8a@content.test", cs.course());
        // learner2 is NOT enrolled; they should not be able to fetch content

        mockMvc.perform(get("/api/v1/learner/courses/" + cs.course().getId() + "/content")
                        .header("Authorization", "Bearer " + token2))
                .andExpect(status().isNotFound());
    }

    // ─── Test 9 ───────────────────────────────────────────────────────────────

    @Test
    void enrolledLearnerCanAccessArchivedCourseContent() throws Exception {
        CourseWithStructure cs = setupCourseWithStructure("inst.c9@content.test", 1, 1, CourseStatus.PUBLISHED);
        String token = registerAndLogin("learner.c9@content.test", "password123");
        enrollDirectly("learner.c9@content.test", cs.course());

        // Archive the course after enrollment
        cs.course().setStatus(CourseStatus.ARCHIVED);
        courseRepository.save(cs.course());

        // Enrolled learner must still be able to fetch content from archived course
        mockMvc.perform(get("/api/v1/learner/courses/" + cs.course().getId() + "/content")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.courseId").value(cs.course().getId()));
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    record CourseWithStructure(Course course, List<Section> sections, List<Lesson> lessons) {}

    private CourseWithStructure setupCourseWithStructure(
            String instructorEmail, int sectionCount, int lessonsPerSection) throws Exception {
        return setupCourseWithStructure(instructorEmail, sectionCount, lessonsPerSection, CourseStatus.PUBLISHED);
    }

    private CourseWithStructure setupCourseWithStructure(
            String instructorEmail, int sectionCount, int lessonsPerSection, CourseStatus status) throws Exception {
        RegisterRequest req = new RegisterRequest("Course Instructor", instructorEmail, "password123");
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated());

        User instructorUser = userRepository.findByEmailIgnoreCase(instructorEmail).orElseThrow();
        InstructorProfile instructorProfile = instructorProfileRepository.save(
                InstructorProfile.builder()
                        .user(instructorUser)
                        .bio("Test bio")
                        .expertise("Test expertise")
                        .approvalStatus(InstructorApprovalStatus.APPROVED)
                        .build());

        Category category = categoryRepository.save(
                Category.builder().name("Content Test – " + instructorEmail).build());

        Course course = courseRepository.save(
                Course.builder()
                        .title("Content Test Course – " + instructorEmail)
                        .instructorProfile(instructorProfile)
                        .category(category)
                        .level(CourseLevel.BEGINNER)
                        .status(status)
                        .build());

        List<Section> sections = new java.util.ArrayList<>();
        List<Lesson> lessons = new java.util.ArrayList<>();
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

        return new CourseWithStructure(course, sections, lessons);
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
