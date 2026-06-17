package com.learnova.learnova_backend.certificate;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.learnova.learnova_backend.auth.dto.LoginRequest;
import com.learnova.learnova_backend.auth.dto.RegisterRequest;
import com.learnova.learnova_backend.certificate.repository.CertificateRepository;
import com.learnova.learnova_backend.course.entity.*;
import com.learnova.learnova_backend.course.repository.*;
import com.learnova.learnova_backend.enrollment.entity.Enrollment;
import com.learnova.learnova_backend.enrollment.entity.EnrollmentStatus;
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
import java.util.Map;

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
    @Autowired private CertificateRepository certificateRepository;

    // ─── Test 1 ───────────────────────────────────────────────────────────────

    @Test
    void completedLearnerCanIssueCertificate() throws Exception {
        CourseFixture f = setupCourse("inst.cert1@test.test", 1, 2);
        String token = registerAndLogin("learner.cert1@test.test", "password123");
        LearnerProfile learnerProfile = getLearnerProfile("learner.cert1@test.test");
        enrollDirectly(learnerProfile, f.courseId());
        completeAllLessons(token, f.lessonIds());

        mockMvc.perform(post("/api/v1/learner/certificates/course/" + f.courseId() + "/issue")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.certificateCode").isNotEmpty())
                .andExpect(jsonPath("$.courseId").value(f.courseId()))
                .andExpect(jsonPath("$.learnerName").isNotEmpty())
                .andExpect(jsonPath("$.instructorName").isNotEmpty());
    }

    // ─── Test 2 ───────────────────────────────────────────────────────────────

    @Test
    void issuingTwiceIsIdempotent() throws Exception {
        CourseFixture f = setupCourse("inst.cert2@test.test", 1, 2);
        String token = registerAndLogin("learner.cert2@test.test", "password123");
        LearnerProfile learnerProfile = getLearnerProfile("learner.cert2@test.test");
        enrollDirectly(learnerProfile, f.courseId());
        completeAllLessons(token, f.lessonIds());

        String firstResponse = mockMvc.perform(post("/api/v1/learner/certificates/course/" + f.courseId() + "/issue")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String firstCode = objectMapper.readTree(firstResponse).get("certificateCode").asText();

        String secondResponse = mockMvc.perform(post("/api/v1/learner/certificates/course/" + f.courseId() + "/issue")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        String secondCode = objectMapper.readTree(secondResponse).get("certificateCode").asText();
        assertThat(secondCode).isEqualTo(firstCode);
    }

    // ─── Test 3 ───────────────────────────────────────────────────────────────

    @Test
    void incompleteEnrollmentCannotIssueCertificate() throws Exception {
        CourseFixture f = setupCourse("inst.cert3@test.test", 1, 2);
        String token = registerAndLogin("learner.cert3@test.test", "password123");
        LearnerProfile learnerProfile = getLearnerProfile("learner.cert3@test.test");
        enrollDirectly(learnerProfile, f.courseId());

        mockMvc.perform(post("/api/v1/learner/certificates/course/" + f.courseId() + "/issue")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isConflict());
    }

    // ─── Test 4 ───────────────────────────────────────────────────────────────

    @Test
    void noEnrollmentCannotIssueCertificate() throws Exception {
        CourseFixture f = setupCourse("inst.cert4@test.test", 1, 2);
        String token = registerAndLogin("learner.cert4@test.test", "password123");

        mockMvc.perform(post("/api/v1/learner/certificates/course/" + f.courseId() + "/issue")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());
    }

    // ─── Test 5 ───────────────────────────────────────────────────────────────

    @Test
    void learnerListsOnlyOwnCertificates() throws Exception {
        CourseFixture f = setupCourse("inst.cert5@test.test", 1, 2);

        String token1 = registerAndLogin("learner.cert5a@test.test", "password123");
        LearnerProfile learner1 = getLearnerProfile("learner.cert5a@test.test");
        enrollDirectly(learner1, f.courseId());
        completeAllLessons(token1, f.lessonIds());
        mockMvc.perform(post("/api/v1/learner/certificates/course/" + f.courseId() + "/issue")
                        .header("Authorization", "Bearer " + token1))
                .andExpect(status().isCreated());

        String token2 = registerAndLogin("learner.cert5b@test.test", "password123");
        LearnerProfile learner2 = getLearnerProfile("learner.cert5b@test.test");
        enrollDirectly(learner2, f.courseId());

        mockMvc.perform(get("/api/v1/learner/certificates")
                        .header("Authorization", "Bearer " + token2))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    // ─── Test 6 ───────────────────────────────────────────────────────────────

    @Test
    void learnerCannotFetchAnotherLearnersCertificate() throws Exception {
        CourseFixture f = setupCourse("inst.cert6@test.test", 1, 2);

        String token1 = registerAndLogin("learner.cert6a@test.test", "password123");
        LearnerProfile learner1 = getLearnerProfile("learner.cert6a@test.test");
        enrollDirectly(learner1, f.courseId());
        completeAllLessons(token1, f.lessonIds());

        String issueResponse = mockMvc.perform(post("/api/v1/learner/certificates/course/" + f.courseId() + "/issue")
                        .header("Authorization", "Bearer " + token1))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        long certificateId = objectMapper.readTree(issueResponse).get("id").asLong();

        String token2 = registerAndLogin("learner.cert6b@test.test", "password123");

        mockMvc.perform(get("/api/v1/learner/certificates/" + certificateId)
                        .header("Authorization", "Bearer " + token2))
                .andExpect(status().isNotFound());
    }

    // ─── Test 7 ───────────────────────────────────────────────────────────────

    @Test
    void unauthenticatedIssueReturns401() throws Exception {
        mockMvc.perform(post("/api/v1/learner/certificates/course/1/issue"))
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
        CourseFixture f = setupCourse("inst.cert11@test.test", 1, 2);

        String token1 = registerAndLogin("learner.cert11a@test.test", "password123");
        LearnerProfile learner1 = getLearnerProfile("learner.cert11a@test.test");
        enrollDirectly(learner1, f.courseId());
        completeAllLessons(token1, f.lessonIds());

        String token2 = registerAndLogin("learner.cert11b@test.test", "password123");
        LearnerProfile learner2 = getLearnerProfile("learner.cert11b@test.test");
        enrollDirectly(learner2, f.courseId());
        completeAllLessons(token2, f.lessonIds());

        String response1 = mockMvc.perform(post("/api/v1/learner/certificates/course/" + f.courseId() + "/issue")
                        .header("Authorization", "Bearer " + token1))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String response2 = mockMvc.perform(post("/api/v1/learner/certificates/course/" + f.courseId() + "/issue")
                        .header("Authorization", "Bearer " + token2))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String code1 = objectMapper.readTree(response1).get("certificateCode").asText();
        String code2 = objectMapper.readTree(response2).get("certificateCode").asText();

        assertThat(code1).isNotNull();
        assertThat(code2).isNotNull();
        assertThat(code1).isNotEqualTo(code2);
    }

    // ─── Test 12 ──────────────────────────────────────────────────────────────

    @Test
    void endToEndLessonProgressTriggersCertificateIssuance() throws Exception {
        CourseFixture f = setupCourse("inst.cert12@test.test", 1, 2);
        String token = registerAndLogin("learner.cert12@test.test", "password123");

        mockMvc.perform(post("/api/v1/courses/" + f.courseId() + "/enroll")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isCreated());

        completeAllLessons(token, f.lessonIds());

        mockMvc.perform(post("/api/v1/learner/certificates/course/" + f.courseId() + "/issue")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isCreated());
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    record CourseFixture(Long courseId, List<Long> lessonIds) {}

    private CourseFixture setupCourse(String instructorEmail, int sectionCount, int lessonsPerSection)
            throws Exception {
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new RegisterRequest("Test Instructor", instructorEmail, "password123"))))
                .andExpect(status().isCreated());

        User instructorUser = userRepository.findByEmailIgnoreCase(instructorEmail).orElseThrow();

        Role instructorRole = roleRepository.findByName(RoleName.ROLE_INSTRUCTOR)
                .orElseGet(() -> roleRepository.save(Role.builder().name(RoleName.ROLE_INSTRUCTOR).build()));
        instructorUser.addRole(instructorRole);
        userRepository.save(instructorUser);

        InstructorProfile instructorProfile = instructorProfileRepository.save(
                InstructorProfile.builder()
                        .user(instructorUser)
                        .bio("Certificate test bio")
                        .expertise("Certificate test expertise")
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

    private LearnerProfile getLearnerProfile(String email) {
        User user = userRepository.findByEmailIgnoreCase(email).orElseThrow();
        return learnerProfileRepository.findByUserId(user.getId()).orElseThrow();
    }

    private void enrollDirectly(LearnerProfile learnerProfile, Long courseId) {
        Course course = courseRepository.findById(courseId).orElseThrow();
        enrollmentRepository.save(Enrollment.builder()
                .learnerProfile(learnerProfile)
                .course(course)
                .status(EnrollmentStatus.ACTIVE)
                .build());
    }

    private void completeAllLessons(String token, List<Long> lessonIds) throws Exception {
        String body = objectMapper.writeValueAsString(Map.of("isCompleted", true));
        for (Long lessonId : lessonIds) {
            mockMvc.perform(patch("/api/v1/lessons/" + lessonId + "/progress")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(body))
                    .andExpect(status().isOk());
        }
    }
}
