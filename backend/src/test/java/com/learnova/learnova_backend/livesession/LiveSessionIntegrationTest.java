package com.learnova.learnova_backend.livesession;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.learnova.learnova_backend.auth.dto.LoginRequest;
import com.learnova.learnova_backend.auth.dto.RegisterRequest;
import com.learnova.learnova_backend.course.entity.Category;
import com.learnova.learnova_backend.course.entity.Course;
import com.learnova.learnova_backend.course.entity.CourseLevel;
import com.learnova.learnova_backend.course.entity.CourseStatus;
import com.learnova.learnova_backend.course.repository.CategoryRepository;
import com.learnova.learnova_backend.course.repository.CourseRepository;
import com.learnova.learnova_backend.enrollment.entity.Enrollment;
import com.learnova.learnova_backend.enrollment.entity.EnrollmentStatus;
import com.learnova.learnova_backend.enrollment.repository.EnrollmentRepository;
import com.learnova.learnova_backend.livesession.entity.LiveSession;
import com.learnova.learnova_backend.livesession.entity.LiveSessionStatus;
import com.learnova.learnova_backend.livesession.repository.LiveSessionRepository;
import com.learnova.learnova_backend.livesession.repository.SessionAttendanceRepository;
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

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class LiveSessionIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;
    @Autowired private RoleRepository roleRepository;
    @Autowired private InstructorProfileRepository instructorProfileRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private CourseRepository courseRepository;
    @Autowired private LearnerProfileRepository learnerProfileRepository;
    @Autowired private EnrollmentRepository enrollmentRepository;
    @Autowired private LiveSessionRepository liveSessionRepository;
    @Autowired private SessionAttendanceRepository sessionAttendanceRepository;

    // ─── 1. Instructor can create a session for their own course ─────────────

    @Test
    void instructorCanCreateSessionForOwnCourse() throws Exception {
        Course course = createCourseForNewInstructor("inst.ls1@live.test");
        String token = login("inst.ls1@live.test", "password123");

        mockMvc.perform(post("/api/v1/instructor/courses/{id}/live-sessions", course.getId())
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(sessionBody("Live Q&A", 1, 2)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.courseId").value(course.getId()))
                .andExpect(jsonPath("$.title").value("Live Q&A"))
                .andExpect(jsonPath("$.status").value("SCHEDULED"))
                .andExpect(jsonPath("$.meetingProvider").value("JITSI"))
                .andExpect(jsonPath("$.meetingUrl").value(org.hamcrest.Matchers.startsWith("https://meet.jit.si/")))
                .andExpect(jsonPath("$.meetingRoomName").isNotEmpty());
    }

    // ─── 2. Instructor cannot create a session for another instructor's course ──

    @Test
    void instructorCannotCreateSessionForAnotherInstructorsCourse() throws Exception {
        Course course = createCourseForNewInstructor("inst.ls2.owner@live.test");
        registerInstructor("inst.ls2.other@live.test");
        String otherToken = login("inst.ls2.other@live.test", "password123");

        mockMvc.perform(post("/api/v1/instructor/courses/{id}/live-sessions", course.getId())
                        .header("Authorization", "Bearer " + otherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(sessionBody("Live Q&A", 1, 2)))
                .andExpect(status().isForbidden());
    }

    // ─── 3. Learner sees only sessions for enrolled courses ───────────────────

    @Test
    void learnerSeesOnlySessionsForEnrolledCourses() throws Exception {
        Course enrolledCourse = createCourseForNewInstructor("inst.ls3a@live.test");
        Course otherCourse = createCourseForNewInstructor("inst.ls3b@live.test");

        createScheduledSession(enrolledCourse, "Enrolled Course Session");
        createScheduledSession(otherCourse, "Other Course Session");

        String learnerToken = registerAndLogin("learner.ls3@live.test", "password123");
        enroll("learner.ls3@live.test", enrolledCourse, EnrollmentStatus.ACTIVE);

        mockMvc.perform(get("/api/v1/learner/live-sessions/upcoming")
                        .header("Authorization", "Bearer " + learnerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].title").value("Enrolled Course Session"))
                .andExpect(jsonPath("$[0].courseId").value(enrolledCourse.getId()));
    }

    // ─── 4. Learner without enrollments sees an empty list ────────────────────

    @Test
    void learnerWithNoEnrollmentsSeesEmptyList() throws Exception {
        String learnerToken = registerAndLogin("learner.ls4@live.test", "password123");

        mockMvc.perform(get("/api/v1/learner/live-sessions/upcoming")
                        .header("Authorization", "Bearer " + learnerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    // ─── 5. Learner cannot join a session for a course they are not enrolled in ──

    @Test
    void learnerCannotJoinSessionForNonEnrolledCourse() throws Exception {
        Course course = createCourseForNewInstructor("inst.ls5@live.test");
        LiveSession session = createScheduledSession(course, "Not Enrolled Session");
        String learnerToken = registerAndLogin("learner.ls5@live.test", "password123");

        mockMvc.perform(post("/api/v1/learner/live-sessions/{id}/join", session.getId())
                        .header("Authorization", "Bearer " + learnerToken))
                .andExpect(status().isNotFound());
    }

    // ─── 6. Join records attendance and returns the meeting URL ───────────────

    @Test
    void joinRecordsAttendanceAndReturnsMeetingUrl() throws Exception {
        Course course = createCourseForNewInstructor("inst.ls6@live.test");
        LiveSession session = createScheduledSession(course, "Joinable Session");
        String learnerToken = registerAndLogin("learner.ls6@live.test", "password123");
        LearnerProfile learnerProfile = enroll("learner.ls6@live.test", course, EnrollmentStatus.ACTIVE);

        mockMvc.perform(post("/api/v1/learner/live-sessions/{id}/join", session.getId())
                        .header("Authorization", "Bearer " + learnerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sessionId").value(session.getId()))
                .andExpect(jsonPath("$.meetingUrl").value(session.getMeetingUrl()))
                .andExpect(jsonPath("$.meetingRoomName").value(session.getMeetingRoomName()));

        boolean attendanceRecorded = sessionAttendanceRepository
                .findByLiveSessionIdAndLearnerProfileId(session.getId(), learnerProfile.getId())
                .isPresent();
        assert attendanceRecorded : "Expected attendance to be recorded after join";
    }

    // ─── 7. Duplicate join is idempotent ───────────────────────────────────────

    @Test
    void duplicateJoinIsIdempotent() throws Exception {
        Course course = createCourseForNewInstructor("inst.ls7@live.test");
        LiveSession session = createScheduledSession(course, "Idempotent Join Session");
        String learnerToken = registerAndLogin("learner.ls7@live.test", "password123");
        LearnerProfile learnerProfile = enroll("learner.ls7@live.test", course, EnrollmentStatus.ACTIVE);

        mockMvc.perform(post("/api/v1/learner/live-sessions/{id}/join", session.getId())
                        .header("Authorization", "Bearer " + learnerToken))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/learner/live-sessions/{id}/join", session.getId())
                        .header("Authorization", "Bearer " + learnerToken))
                .andExpect(status().isOk());

        long attendanceCount = sessionAttendanceRepository.findAll().stream()
                .filter(a -> a.getLiveSession().getId().equals(session.getId())
                        && a.getLearnerProfile().getId().equals(learnerProfile.getId()))
                .count();
        assert attendanceCount == 1 : "Expected exactly one attendance record but found " + attendanceCount;
    }

    // ─── 8. Cancelled session cannot be joined ─────────────────────────────────

    @Test
    void cancelledSessionCannotBeJoined() throws Exception {
        Course course = createCourseForNewInstructor("inst.ls8@live.test");
        LiveSession session = createScheduledSession(course, "Cancelled Session");
        session.setStatus(LiveSessionStatus.CANCELLED);
        liveSessionRepository.save(session);

        String learnerToken = registerAndLogin("learner.ls8@live.test", "password123");
        enroll("learner.ls8@live.test", course, EnrollmentStatus.ACTIVE);

        mockMvc.perform(post("/api/v1/learner/live-sessions/{id}/join", session.getId())
                        .header("Authorization", "Bearer " + learnerToken))
                .andExpect(status().isConflict());
    }

    // ─── 9. Instructor can cancel their own scheduled session ──────────────────

    @Test
    void instructorCanCancelOwnSession() throws Exception {
        Course course = createCourseForNewInstructor("inst.ls9@live.test");
        LiveSession session = createScheduledSession(course, "Cancel Me");
        String token = login("inst.ls9@live.test", "password123");

        mockMvc.perform(post("/api/v1/instructor/live-sessions/{id}/cancel", session.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));
    }

    // ─── 10. Unauthenticated requests return 401 ───────────────────────────────

    @Test
    void unauthenticatedCannotCreateSession() throws Exception {
        mockMvc.perform(post("/api/v1/instructor/courses/999/live-sessions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(sessionBody("Session", 1, 2)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void unauthenticatedCannotListUpcomingSessions() throws Exception {
        mockMvc.perform(get("/api/v1/learner/live-sessions/upcoming"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void unauthenticatedCannotJoinSession() throws Exception {
        mockMvc.perform(post("/api/v1/learner/live-sessions/999/join"))
                .andExpect(status().isUnauthorized());
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private String sessionBody(String title, int startHoursFromNow, int endHoursFromNow) throws Exception {
        return objectMapper.writeValueAsString(Map.of(
                "title", title,
                "startTime", Instant.now().plus(startHoursFromNow, ChronoUnit.HOURS).toString(),
                "endTime", Instant.now().plus(endHoursFromNow, ChronoUnit.HOURS).toString()));
    }

    private InstructorProfile registerInstructor(String email) throws Exception {
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

        return instructorProfileRepository.save(
                InstructorProfile.builder()
                        .user(user)
                        .bio("bio")
                        .expertise("expertise")
                        .approvalStatus(InstructorApprovalStatus.APPROVED)
                        .build());
    }

    private Course createCourseForNewInstructor(String instructorEmail) throws Exception {
        InstructorProfile profile = registerInstructor(instructorEmail);

        Category category = categoryRepository.save(
                Category.builder().name("Cat-" + instructorEmail).build());

        return courseRepository.save(
                Course.builder()
                        .title("Course-" + instructorEmail)
                        .instructorProfile(profile)
                        .category(category)
                        .level(CourseLevel.BEGINNER)
                        .status(CourseStatus.PUBLISHED)
                        .build());
    }

    private LiveSession createScheduledSession(Course course, String title) {
        String roomName = "learnova-live-test-" + System.identityHashCode(course) + "-" + title.hashCode();
        return liveSessionRepository.save(
                LiveSession.builder()
                        .course(course)
                        .instructorProfile(course.getInstructorProfile())
                        .title(title)
                        .startTime(Instant.now().plus(1, ChronoUnit.HOURS))
                        .endTime(Instant.now().plus(2, ChronoUnit.HOURS))
                        .meetingRoomName(roomName)
                        .meetingUrl("https://meet.jit.si/" + roomName)
                        .status(LiveSessionStatus.SCHEDULED)
                        .build());
    }

    private LearnerProfile enroll(String learnerEmail, Course course, EnrollmentStatus status) {
        User user = userRepository.findByEmailIgnoreCase(learnerEmail).orElseThrow();
        LearnerProfile profile = learnerProfileRepository.findByUserId(user.getId()).orElseThrow();
        enrollmentRepository.save(Enrollment.builder()
                .learnerProfile(profile)
                .course(course)
                .status(status)
                .build());
        return profile;
    }

    private String registerAndLogin(String email, String password) throws Exception {
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new RegisterRequest("Test Learner", email, password))))
                .andExpect(status().isCreated());
        return login(email, password);
    }

    private String login(String email, String password) throws Exception {
        String response = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest(email, password))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(response).get("accessToken").asText();
    }
}
