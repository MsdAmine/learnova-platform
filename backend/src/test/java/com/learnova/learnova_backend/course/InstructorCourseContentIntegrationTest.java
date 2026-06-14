package com.learnova.learnova_backend.course;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.learnova.learnova_backend.auth.dto.LoginRequest;
import com.learnova.learnova_backend.auth.dto.RegisterRequest;
import com.learnova.learnova_backend.course.dto.CreateLessonRequest;
import com.learnova.learnova_backend.course.dto.CreateSectionRequest;
import com.learnova.learnova_backend.course.dto.UpdateLessonRequest;
import com.learnova.learnova_backend.course.dto.UpdateSectionRequest;
import com.learnova.learnova_backend.course.entity.*;
import com.learnova.learnova_backend.course.repository.*;
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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class InstructorCourseContentIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;
    @Autowired private RoleRepository roleRepository;
    @Autowired private InstructorProfileRepository instructorProfileRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private CourseRepository courseRepository;
    @Autowired private SectionRepository sectionRepository;
    @Autowired private LessonRepository lessonRepository;
    @Autowired private LessonProgressRepository lessonProgressRepository;
    @Autowired private LearnerProfileRepository learnerProfileRepository;
    @Autowired private EnrollmentRepository enrollmentRepository;

    // ─── 1. Create section ────────────────────────────────────────────────────

    @Test
    void instructorCanCreateSectionForOwnCourse() throws Exception {
        InstructorContext ctx = setupInstructor("inst.sc1@content.test");
        Long courseId = createCourse(ctx.profile, CourseStatus.DRAFT);

        CreateSectionRequest req = new CreateSectionRequest("Introduction");

        mockMvc.perform(post("/api/v1/instructor/courses/{id}/sections", courseId)
                        .header("Authorization", "Bearer " + ctx.token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("Introduction"))
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.lessons").isArray());
    }

    // ─── 2. Create lesson ─────────────────────────────────────────────────────

    @Test
    void instructorCanCreateLessonUnderOwnSection() throws Exception {
        InstructorContext ctx = setupInstructor("inst.sc2@content.test");
        Long courseId = createCourse(ctx.profile, CourseStatus.DRAFT);
        Long sectionId = createSectionViaApi(courseId, "Chapter 1", ctx.token);

        CreateLessonRequest req = new CreateLessonRequest("What is Spring Boot?");

        mockMvc.perform(post("/api/v1/instructor/courses/sections/{id}/lessons", sectionId)
                        .header("Authorization", "Bearer " + ctx.token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("What is Spring Boot?"))
                .andExpect(jsonPath("$.id").isNumber());
    }

    // ─── 3. GET content returns created structure ─────────────────────────────

    @Test
    void instructorContentGetReturnsCreatedStructure() throws Exception {
        InstructorContext ctx = setupInstructor("inst.sc3@content.test");
        Long courseId = createCourse(ctx.profile, CourseStatus.DRAFT);
        Long sectionId = createSectionViaApi(courseId, "Section One", ctx.token);
        createLessonViaApi(sectionId, "Lesson One", ctx.token);
        createLessonViaApi(sectionId, "Lesson Two", ctx.token);

        mockMvc.perform(get("/api/v1/instructor/courses/{id}/content", courseId)
                        .header("Authorization", "Bearer " + ctx.token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.courseId").value(courseId))
                .andExpect(jsonPath("$.sections.length()").value(1))
                .andExpect(jsonPath("$.sections[0].title").value("Section One"))
                .andExpect(jsonPath("$.sections[0].lessons.length()").value(2))
                .andExpect(jsonPath("$.sections[0].lessons[0].title").value("Lesson One"))
                .andExpect(jsonPath("$.sections[0].lessons[1].title").value("Lesson Two"));
    }

    // ─── 4. Learner content endpoint sees instructor-created content ──────────

    @Test
    void learnerContentEndpointSeesInstructorCreatedContent() throws Exception {
        InstructorContext ctx = setupInstructor("inst.sc4@content.test");
        Long courseId = createCourse(ctx.profile, CourseStatus.PUBLISHED);
        Long sectionId = createSectionViaApi(courseId, "API Section", ctx.token);
        createLessonViaApi(sectionId, "API Lesson", ctx.token);

        String learnerToken = registerAndLogin("learner.sc4@content.test", "password123");
        enrollDirectly("learner.sc4@content.test", courseId);

        mockMvc.perform(get("/api/v1/learner/courses/{id}/content", courseId)
                        .header("Authorization", "Bearer " + learnerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sections.length()").value(1))
                .andExpect(jsonPath("$.sections[0].title").value("API Section"))
                .andExpect(jsonPath("$.sections[0].lessons[0].title").value("API Lesson"));
    }

    // ─── 5. Update section ────────────────────────────────────────────────────

    @Test
    void instructorCanUpdateOwnSection() throws Exception {
        InstructorContext ctx = setupInstructor("inst.sc5@content.test");
        Long courseId = createCourse(ctx.profile, CourseStatus.DRAFT);
        Long sectionId = createSectionViaApi(courseId, "Old Title", ctx.token);

        UpdateSectionRequest req = new UpdateSectionRequest("New Title");

        mockMvc.perform(patch("/api/v1/instructor/courses/sections/{id}", sectionId)
                        .header("Authorization", "Bearer " + ctx.token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("New Title"))
                .andExpect(jsonPath("$.id").value(sectionId));
    }

    // ─── 6. Update lesson ─────────────────────────────────────────────────────

    @Test
    void instructorCanUpdateOwnLesson() throws Exception {
        InstructorContext ctx = setupInstructor("inst.sc6@content.test");
        Long courseId = createCourse(ctx.profile, CourseStatus.DRAFT);
        Long sectionId = createSectionViaApi(courseId, "Section", ctx.token);
        Long lessonId = createLessonViaApi(sectionId, "Old Lesson Title", ctx.token);

        UpdateLessonRequest req = new UpdateLessonRequest("New Lesson Title");

        mockMvc.perform(patch("/api/v1/instructor/courses/lessons/{id}", lessonId)
                        .header("Authorization", "Bearer " + ctx.token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("New Lesson Title"))
                .andExpect(jsonPath("$.id").value(lessonId));
    }

    // ─── 7. Learner cannot create section → 403 ──────────────────────────────

    @Test
    void learnerCannotCreateSection() throws Exception {
        InstructorContext ctx = setupInstructor("inst.sc7@content.test");
        Long courseId = createCourse(ctx.profile, CourseStatus.DRAFT);
        String learnerToken = registerAndLogin("learner.sc7@content.test", "password123");

        CreateSectionRequest req = new CreateSectionRequest("Unauthorized Section");

        mockMvc.perform(post("/api/v1/instructor/courses/{id}/sections", courseId)
                        .header("Authorization", "Bearer " + learnerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());
    }

    // ─── 8. Unauthenticated cannot create section → 401 ─────────────────────

    @Test
    void unauthenticatedCannotCreateSection() throws Exception {
        InstructorContext ctx = setupInstructor("inst.sc8@content.test");
        Long courseId = createCourse(ctx.profile, CourseStatus.DRAFT);

        mockMvc.perform(post("/api/v1/instructor/courses/{id}/sections", courseId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Section\"}"))
                .andExpect(status().isUnauthorized());
    }

    // ─── 9. Cross-instructor ownership → 403 ─────────────────────────────────

    @Test
    void instructorCannotManageAnotherInstructorsCourseContent() throws Exception {
        InstructorContext owner = setupInstructor("inst.sc9owner@content.test");
        InstructorContext other = setupInstructor("inst.sc9other@content.test");
        Long courseId = createCourse(owner.profile, CourseStatus.DRAFT);

        CreateSectionRequest req = new CreateSectionRequest("Stolen Section");

        mockMvc.perform(post("/api/v1/instructor/courses/{id}/sections", courseId)
                        .header("Authorization", "Bearer " + other.token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());
    }

    // ─── 10. Archived course mutation rejected → 409 ─────────────────────────

    @Test
    void archivedCourseContentMutationIsRejected() throws Exception {
        InstructorContext ctx = setupInstructor("inst.sc10@content.test");
        Long courseId = createCourse(ctx.profile, CourseStatus.ARCHIVED);

        CreateSectionRequest req = new CreateSectionRequest("Should Fail");

        mockMvc.perform(post("/api/v1/instructor/courses/{id}/sections", courseId)
                        .header("Authorization", "Bearer " + ctx.token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isConflict());
    }

    // ─── 11. Delete lesson ────────────────────────────────────────────────────

    @Test
    void instructorCanDeleteOwnLesson() throws Exception {
        InstructorContext ctx = setupInstructor("inst.sc11@content.test");
        Long courseId = createCourse(ctx.profile, CourseStatus.DRAFT);
        Long sectionId = createSectionViaApi(courseId, "Section", ctx.token);
        Long lessonId = createLessonViaApi(sectionId, "To Delete", ctx.token);

        mockMvc.perform(delete("/api/v1/instructor/courses/lessons/{id}", lessonId)
                        .header("Authorization", "Bearer " + ctx.token))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/instructor/courses/{id}/content", courseId)
                        .header("Authorization", "Bearer " + ctx.token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sections[0].lessons.length()").value(0));
    }

    // ─── 12. Delete section cascades to lessons ───────────────────────────────

    @Test
    void instructorCanDeleteOwnSection() throws Exception {
        InstructorContext ctx = setupInstructor("inst.sc12@content.test");
        Long courseId = createCourse(ctx.profile, CourseStatus.DRAFT);
        Long sectionId = createSectionViaApi(courseId, "Section To Delete", ctx.token);
        createLessonViaApi(sectionId, "Lesson A", ctx.token);
        createLessonViaApi(sectionId, "Lesson B", ctx.token);

        mockMvc.perform(delete("/api/v1/instructor/courses/sections/{id}", sectionId)
                        .header("Authorization", "Bearer " + ctx.token))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/instructor/courses/{id}/content", courseId)
                        .header("Authorization", "Bearer " + ctx.token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sections.length()").value(0));
    }

    // ─── 13. Learner content reflects section deletion ────────────────────────

    @Test
    void learnerContentAfterSectionDeletionShowsCorrectContent() throws Exception {
        InstructorContext ctx = setupInstructor("inst.sc13@content.test");
        Long courseId = createCourse(ctx.profile, CourseStatus.PUBLISHED);
        Long keepSectionId = createSectionViaApi(courseId, "Keep", ctx.token);
        Long deleteSectionId = createSectionViaApi(courseId, "Delete Me", ctx.token);
        createLessonViaApi(keepSectionId, "Lesson Keep", ctx.token);
        createLessonViaApi(deleteSectionId, "Lesson Gone", ctx.token);

        String learnerToken = registerAndLogin("learner.sc13@content.test", "password123");
        enrollDirectly("learner.sc13@content.test", courseId);

        // Verify learner sees 2 sections before deletion
        mockMvc.perform(get("/api/v1/learner/courses/{id}/content", courseId)
                        .header("Authorization", "Bearer " + learnerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sections.length()").value(2));

        // Instructor deletes one section
        mockMvc.perform(delete("/api/v1/instructor/courses/sections/{id}", deleteSectionId)
                        .header("Authorization", "Bearer " + ctx.token))
                .andExpect(status().isNoContent());

        // Learner now sees only the remaining section
        mockMvc.perform(get("/api/v1/learner/courses/{id}/content", courseId)
                        .header("Authorization", "Bearer " + learnerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sections.length()").value(1))
                .andExpect(jsonPath("$.sections[0].title").value("Keep"));
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

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
                        .bio("Bio")
                        .expertise("Expertise")
                        .approvalStatus(InstructorApprovalStatus.APPROVED)
                        .build());

        String token = login(email, "password123");
        return new InstructorContext(profile, token);
    }

    private Long createCourse(InstructorProfile profile, CourseStatus status) {
        Category category = categoryRepository.save(
                Category.builder().name("Cat – " + profile.getUser().getEmail()).build());
        Course course = courseRepository.save(
                Course.builder()
                        .title("Course – " + profile.getUser().getEmail())
                        .instructorProfile(profile)
                        .category(category)
                        .level(CourseLevel.BEGINNER)
                        .status(status)
                        .build());
        return course.getId();
    }

    private Long createSectionViaApi(Long courseId, String title, String token) throws Exception {
        CreateSectionRequest req = new CreateSectionRequest(title);
        String response = mockMvc.perform(post("/api/v1/instructor/courses/{id}/sections", courseId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(response).get("id").asLong();
    }

    private Long createLessonViaApi(Long sectionId, String title, String token) throws Exception {
        CreateLessonRequest req = new CreateLessonRequest(title);
        String response = mockMvc.perform(post("/api/v1/instructor/courses/sections/{id}/lessons", sectionId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(response).get("id").asLong();
    }

    private void enrollDirectly(String learnerEmail, Long courseId) {
        User learnerUser = userRepository.findByEmailIgnoreCase(learnerEmail).orElseThrow();
        LearnerProfile learnerProfile = learnerProfileRepository.findByUserId(learnerUser.getId()).orElseThrow();
        Course course = courseRepository.findById(courseId).orElseThrow();
        enrollmentRepository.save(Enrollment.builder()
                .learnerProfile(learnerProfile)
                .course(course)
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
                        .content(objectMapper.writeValueAsString(new LoginRequest(email, password))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        JsonNode json = objectMapper.readTree(response);
        return json.get("accessToken").asText();
    }
}
