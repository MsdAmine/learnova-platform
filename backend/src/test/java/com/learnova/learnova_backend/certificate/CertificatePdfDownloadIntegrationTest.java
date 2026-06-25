package com.learnova.learnova_backend.certificate;

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
import com.learnova.learnova_backend.profile.entity.InstructorApprovalStatus;
import com.learnova.learnova_backend.profile.entity.InstructorProfile;
import com.learnova.learnova_backend.profile.repository.InstructorProfileRepository;
import com.learnova.learnova_backend.user.entity.Role;
import com.learnova.learnova_backend.user.entity.RoleName;
import com.learnova.learnova_backend.user.entity.User;
import com.learnova.learnova_backend.user.repository.RoleRepository;
import com.learnova.learnova_backend.user.repository.UserRepository;
import com.lowagie.text.pdf.PdfReader;
import com.lowagie.text.pdf.parser.PdfTextExtractor;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class CertificatePdfDownloadIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;
    @Autowired private RoleRepository roleRepository;
    @Autowired private InstructorProfileRepository instructorProfileRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private CourseRepository courseRepository;
    @Autowired private SectionRepository sectionRepository;
    @Autowired private LessonRepository lessonRepository;

    record CourseFixture(Long courseId, List<Long> lessonIds) {}

    // ─── Test 1 ───────────────────────────────────────────────────────────────

    @Test
    void ownerCanDownloadCertificatePdf() throws Exception {
        CourseFixture f = setupCourse("inst.pdf1@test.test", "password123", 1, 2);
        String learnerToken = registerAndLogin("learner.pdf1@test.test", "password123");
        enroll(learnerToken, f.courseId());
        completeAllLessons(learnerToken, f.lessonIds());

        String issueResponse = mockMvc.perform(
                        post("/api/v1/learner/certificates/course/" + f.courseId() + "/issue")
                                .header("Authorization", "Bearer " + learnerToken))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        var issued = objectMapper.readTree(issueResponse);
        Long certificateId = issued.get("id").asLong();
        String certificateCode = issued.get("certificateCode").asText();
        String learnerName = issued.get("learnerName").asText();
        String courseTitle = issued.get("courseTitle").asText();

        byte[] pdfBytes = mockMvc.perform(get("/api/v1/learner/certificates/" + certificateId + "/pdf")
                        .header("Authorization", "Bearer " + learnerToken))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_PDF))
                .andExpect(header().string("Content-Disposition",
                        "attachment; filename=\"learnova-certificate-" + certificateCode + ".pdf\""))
                .andReturn().getResponse().getContentAsByteArray();

        assertThat(pdfBytes).isNotEmpty();
        assertThat(new String(pdfBytes, 0, 4, StandardCharsets.US_ASCII)).isEqualTo("%PDF");

        PdfReader reader = new PdfReader(pdfBytes);
        assertThat(reader.getNumberOfPages()).isEqualTo(1);
        String text = new PdfTextExtractor(reader).getTextFromPage(1);
        reader.close();

        assertThat(text).contains(learnerName);
        assertThat(text).contains(courseTitle);
        assertThat(text).contains(certificateCode);
    }

    // ─── Test 2 ───────────────────────────────────────────────────────────────

    @Test
    void learnerCannotDownloadAnotherLearnersCertificatePdf() throws Exception {
        CourseFixture f = setupCourse("inst.pdf2@test.test", "password123", 1, 2);
        String learner1Token = registerAndLogin("learner1.pdf2@test.test", "password123");
        String learner2Token = registerAndLogin("learner2.pdf2@test.test", "password123");
        enroll(learner1Token, f.courseId());
        completeAllLessons(learner1Token, f.lessonIds());

        String issueResponse = mockMvc.perform(
                        post("/api/v1/learner/certificates/course/" + f.courseId() + "/issue")
                                .header("Authorization", "Bearer " + learner1Token))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        Long certificateId = objectMapper.readTree(issueResponse).get("id").asLong();

        mockMvc.perform(get("/api/v1/learner/certificates/" + certificateId + "/pdf")
                        .header("Authorization", "Bearer " + learner2Token))
                .andExpect(status().isNotFound());
    }

    // ─── Test 3 ───────────────────────────────────────────────────────────────

    @Test
    void missingCertificatePdfReturns404() throws Exception {
        String token = registerAndLogin("learner.pdf3@test.test", "password123");
        mockMvc.perform(get("/api/v1/learner/certificates/999999/pdf")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());
    }

    // ─── Test 4 ───────────────────────────────────────────────────────────────

    @Test
    void unauthenticatedPdfDownloadReturns401() throws Exception {
        mockMvc.perform(get("/api/v1/learner/certificates/1/pdf"))
                .andExpect(status().isUnauthorized());
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
                        .bio("Cert PDF test bio")
                        .expertise("Cert PDF test expertise")
                        .approvalStatus(InstructorApprovalStatus.APPROVED)
                        .build());

        Category category = categoryRepository.save(
                Category.builder().name("Cert PDF Test – " + instructorEmail).build());
        Course course = courseRepository.save(
                Course.builder()
                        .title("Cert PDF Test Course – " + instructorEmail)
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

    private void enroll(String token, Long courseId) throws Exception {
        mockMvc.perform(post("/api/v1/courses/" + courseId + "/enroll")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isCreated());
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
}
