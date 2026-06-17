package com.learnova.learnova_backend.certificate;

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
import com.learnova.learnova_backend.enrollment.repository.EnrollmentRepository;
import com.learnova.learnova_backend.profile.entity.InstructorApprovalStatus;
import com.learnova.learnova_backend.profile.entity.InstructorProfile;
import com.learnova.learnova_backend.profile.entity.LearnerProfile;
import com.learnova.learnova_backend.profile.repository.InstructorProfileRepository;
import com.learnova.learnova_backend.profile.repository.LearnerProfileRepository;
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

import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class CertificateIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;
    @Autowired private RoleRepository roleRepository;
    @Autowired private InstructorProfileRepository instructorProfileRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private CourseRepository courseRepository;
    @Autowired private SectionRepository sectionRepository;
    @Autowired private LessonRepository lessonRepository;
    @Autowired private LearnerProfileRepository learnerProfileRepository;
    @Autowired private EnrollmentRepository enrollmentRepository;

    record CourseFixture(Long courseId, List<Long> lessonIds) {}

    // ─── Test 1 ───────────────────────────────────────────────────────────────

    @Test
    void completedLearnerCanIssueCertificate() throws Exception {
        CourseFixture f = setupCourse("inst.cert1@test.test", "password123", 1, 2);
        String learnerToken = registerAndLogin("learner.cert1@test.test", "password123");
        LearnerProfile lp = getLearnerProfile("learner.cert1@test.test");
        enrollDirectly(lp, f.courseId());
        completeAllLessons(learnerToken, f.lessonIds());

        mockMvc.perform(post("/api/v1/learner/certificates/course/" + f.courseId() + "/issue")
                        .header("Authorization", "Bearer " + learnerToken))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.certificateCode").isNotEmpty())
                .andExpect(jsonPath("$.courseId").value(f.courseId()))
                .andExpect(jsonPath("$.learnerName").isNotEmpty())
                .andExpect(jsonPath("$.instructorName").isNotEmpty());
    }

    // ─── Test 2 ───────────────────────────────────────────────────────────────

    @Test
    void issuingTwiceIsIdempotent() throws Exception {
        CourseFixture f = setupCourse("inst.cert2@test.test", "password123", 1, 2);
        String learnerToken = registerAndLogin("learner.cert2@test.test", "password123");
        LearnerProfile lp = getLearnerProfile("learner.cert2@test.test");
        enrollDirectly(lp, f.courseId());
        completeAllLessons(learnerToken, f.lessonIds());

        String firstResponse = mockMvc.perform(
                        post("/api/v1/learner/certificates/course/" + f.courseId() + "/issue")
                                .header("Authorization", "Bearer " + learnerToken))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        String firstCode = objectMapper.readTree(firstResponse).get("certificateCode").asText();

        mockMvc.perform(post("/api/v1/learner/certificates/course/" + f.courseId() + "/issue")
                        .header("Authorization", "Bearer " + learnerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.certificateCode").value(firstCode));
    }

    // ─── Test 3 ───────────────────────────────────────────────────────────────

    @Test
    void incompleteEnrollmentCannotIssueCertificate() throws Exception {
        CourseFixture f = setupCourse("inst.cert3@test.test", "password123", 1, 2);
        String learnerToken = registerAndLogin("learner.cert3@test.test", "password123");
        LearnerProfile lp = getLearnerProfile("learner.cert3@test.test");
        enrollDirectly(lp, f.courseId());

        mockMvc.perform(post("/api/v1/learner/certificates/course/" + f.courseId() + "/issue")
                        .header("Authorization", "Bearer " + learnerToken))
                .andExpect(status().isConflict());
    }

    // ─── Test 4 ───────────────────────────────────────────────────────────────

    @Test
    void noEnrollmentCannotIssueCertificate() throws Exception {
        CourseFixture f = setupCourse("inst.cert4@test.test", "password123", 1, 2);
        String learnerToken = registerAndLogin("learner.cert4@test.test", "password123");

        mockMvc.perform(post("/api/v1/learner/certificates/course/" + f.courseId() + "/issue")
                        .header("Authorization", "Bearer " + learnerToken))
                .andExpect(status().isNotFound());
    }

    // ─── Test 5 ───────────────────────────────────────────────────────────────

    @Test
    void learnerListsOnlyOwnCertificates() throws Exception {
        CourseFixture f = setupCourse("inst.cert5@test.test", "password123", 1, 2);
        String learner1Token = registerAndLogin("learner1.cert5@test.test", "password123");
        String learner2Token = registerAndLogin("learner2.cert5@test.test", "password123");

        LearnerProfile lp1 = getLearnerProfile("learner1.cert5@test.test");
        enrollDirectly(lp1, f.courseId());
        completeAllLessons(learner1Token, f.lessonIds());
        mockMvc.perform(post("/api/v1/learner/certificates/course/" + f.courseId() + "/issue")
                        .header("Authorization", "Bearer " + learner1Token))
                .andExpect(status().isCreated());

        LearnerProfile lp2 = getLearnerProfile("learner2.cert5@test.test");
        enrollDirectly(lp2, f.courseId());

        mockMvc.perform(get("/api/v1/learner/certificates")
                        .header("Authorization", "Bearer " + learner2Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$").isEmpty());
    }

    // ─── Test 6 ───────────────────────────────────────────────────────────────

    @Test
    void learnerCannotFetchAnotherLearnersCertificate() throws Exception {
        CourseFixture f = setupCourse("inst.cert6@test.test", "password123", 1, 2);
        String learner1Token = registerAndLogin("learner1.cert6@test.test", "password123");
        String learner2Token = registerAndLogin("learner2.cert6@test.test", "password123");

        LearnerProfile lp1 = getLearnerProfile("learner1.cert6@test.test");
        enrollDirectly(lp1, f.courseId());
        completeAllLessons(learner1Token, f.lessonIds());
        String issueResponse = mockMvc.perform(
                        post("/api/v1/learner/certificates/course/" + f.courseId() + "/issue")
                                .header("Authorization", "Bearer " + learner1Token))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        Long certificateId = objectMapper.readTree(issueResponse).get("id").asLong();

        mockMvc.perform(get("/api/v1/learner/certificates/" + certificateId)
                        .header("Authorization", "Bearer " + learner2Token))
                .andExpect(status().isNotFound());
    }

    // ─── Test 7 ───────────────────────────────────────────────────────────────

    @Test
    void unauthenticatedIssueReturns401() throws Exception {
        CourseFixture f = setupCourse("inst.cert7@test.test", "password123", 1, 1);
        mockMvc.perform(post("/api/v1/learner/certificates/course/" + f.courseId() + "/issue"))
                .andExpect(status().isUnauthorized());
    }

    // ─── Test 8 ───────────────────────────────────────────────────────────────

    @Test
    void unauthenticatedListReturns401() throws Exception {
        mockMvc.perform(get("/api/v1/learner/certificates"))
                .andExpect(status().isUnauthorized());
    }

    // ─── Test 9 ───────────────────────────────────────────────────────────────

    @Test
    void unauthenticatedDetailReturns401() throws Exception {
        mockMvc.perform(get("/api/v1/learner/certificates/999"))
                .andExpect(status().isUnauthorized());
    }

    // ─── Test 10 ──────────────────────────────────────────────────────────────

    @Test
    void detailForNonExistentCertificateReturns404() throws Exception {
        String token = registerAndLogin("learner.cert10@test.test", "password123");
        mockMvc.perform(get("/api/v1/learner/certificates/999999")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());
    }

    // ─── Test 11 ──────────────────────────────────────────────────────────────

    @Test
    void certificateCodesAreUniqueAcrossLearners() throws Exception {
        CourseFixture f = setupCourse("inst.cert11@test.test", "password123", 1, 2);
        String learner1Token = registerAndLogin("learner1.cert11@test.test", "password123");
        String learner2Token = registerAndLogin("learner2.cert11@test.test", "password123");

        LearnerProfile lp1 = getLearnerProfile("learner1.cert11@test.test");
        LearnerProfile lp2 = getLearnerProfile("learner2.cert11@test.test");
        enrollDirectly(lp1, f.courseId());
        enrollDirectly(lp2, f.courseId());
        completeAllLessons(learner1Token, f.lessonIds());
        completeAllLessons(learner2Token, f.lessonIds());

        String response1 = mockMvc.perform(
                        post("/api/v1/learner/certificates/course/" + f.courseId() + "/issue")
                                .header("Authorization", "Bearer " + learner1Token))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        String response2 = mockMvc.perform(
                        post("/api/v1/learner/certificates/course/" + f.courseId() + "/issue")
                                .header("Authorization", "Bearer " + learner2Token))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String code1 = objectMapper.readTree(response1).get("certificateCode").asText();
        String code2 = objectMapper.readTree(response2).get("certificateCode").asText();

        assertThat(code1).isNotNull().isNotEmpty();
        assertThat(code2).isNotNull().isNotEmpty();
        assertThat(code1).isNotEqualTo(code2);
    }

    // ─── Test 12 ──────────────────────────────────────────────────────────────

    @Test
    void endToEndLessonProgressTriggersCertificateIssuance() throws Exception {
        CourseFixture f = setupCourse("inst.cert12@test.test", "password123", 1, 2);
        String learnerToken = registerAndLogin("learner.cert12@test.test", "password123");

        mockMvc.perform(post("/api/v1/courses/" + f.courseId() + "/enroll")
                        .header("Authorization", "Bearer " + learnerToken))
                .andExpect(status().isCreated());

        completeAllLessons(learnerToken, f.lessonIds());

        mockMvc.perform(post("/api/v1/learner/certificates/course/" + f.courseId() + "/issue")
                        .header("Authorization", "Bearer " + learnerToken))
                .andExpect(status().isCreated());
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private CourseFixture setupCourse(String instructorEmail, String instructorPassword,
                                      int sectionCount, int lessonsPerSection) throws Exception {
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new RegisterRequest("Test Instructor", instructorEmail, instructorPassword))))
                .andExpect(status().isCreated());

        User instructorUser = userRepository.findByEmailIgnoreCase(instructorEmail).orElseThrow();
        Role instructorRole = roleRepository.findByName(RoleName.ROLE_INSTRUCTOR)
                .orElseGet(() -> roleRepository.save(Role.builder().name(RoleName.ROLE_INSTRUCTOR).build()));
        instructorUser.addRole(instructorRole);
        userRepository.save(instructorUser);

        InstructorProfile instructorProfile = instructorProfileRepository.save(
                InstructorProfile.builder()
                        .user(instructorUser)
                        .bio("Cert test bio")
                        .expertise("Cert test expertise")
                        .approvalStatus(InstructorApprovalStatus.APPROVED)
                        .build());

        Category category = categoryRepository.save(
                Category.builder().name("Cert Test – " + instructorEmail).build());
        Course course = courseRepository.save(
                Course.builder()
                        .title("Cert Test Course – " + instructorEmail)
                        .instructorProfile(instructorProfile)
                        .category(category)
                        .level(CourseLevel.BEGINNER)
                        .status(CourseStatus.PUBLISHED)
                        .build());

        List<Long> lessonIds = new ArrayList<>();
        for (int s = 0; s < sectionCount; s++) {
            Section section = sectionRepository.save(
                    Section.builder().title("Section " + (s + 1)).course(course).build());
            for (int l = 0; l < lessonsPerSection; l++) {
                Lesson lesson = lessonRepository.save(
                        Lesson.builder().title("Lesson " + (l + 1)).section(section).build());
                lessonIds.add(lesson.getId());
            }
        }
        return new CourseFixture(course.getId(), lessonIds);
    }

    private String registerAndLogin(String email, String password) throws Exception {
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new RegisterRequest("Test Learner", email, password))))
                .andExpect(status().isCreated());

        String loginResponse = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest(email, password))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        return objectMapper.readTree(loginResponse).get("accessToken").asText();
    }

    private void enrollDirectly(LearnerProfile learnerProfile, Long courseId) {
        Course course = courseRepository.findById(courseId).orElseThrow();
        enrollmentRepository.save(Enrollment.builder()
                .learnerProfile(learnerProfile)
                .course(course)
                .build());
    }

    private void completeAllLessons(String token, List<Long> lessonIds) throws Exception {
        for (Long lessonId : lessonIds) {
            mockMvc.perform(patch("/api/v1/lessons/" + lessonId + "/progress")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"isCompleted\":true}"))
                    .andExpect(status().isOk());
        }
    }

    private LearnerProfile getLearnerProfile(String email) {
        User user = userRepository.findByEmailIgnoreCase(email).orElseThrow();
        return learnerProfileRepository.findByUserId(user.getId()).orElseThrow();
    }
}
