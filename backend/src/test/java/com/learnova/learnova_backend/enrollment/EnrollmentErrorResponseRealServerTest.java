package com.learnova.learnova_backend.enrollment;

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
import com.learnova.learnova_backend.user.entity.User;
import com.learnova.learnova_backend.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Regression coverage for controller-thrown {@link org.springframework.web.server.ResponseStatusException}
 * statuses (404 / 409) under a <strong>real servlet container</strong>.
 *
 * <p>Why a real server and not MockMvc: {@code MockMvc} stops at the resolved handler result and does
 * not perform the container's internal ERROR dispatch to {@code /error}. The 401-masking bug this guards
 * against only manifests during that second dispatch — {@code JwtAuthenticationFilter} extends
 * {@code OncePerRequestFilter}, which skips the ERROR dispatch, leaving an empty SecurityContext. Without
 * {@code /error} being permitted in {@code SecurityConfig}, every controller error status collapsed to 401.
 *
 * <p>This test also asserts the rendered error body never leaks a Java stack trace
 * ({@code server.error.include-stacktrace: never}) while still surfacing a useful message
 * ({@code server.error.include-message: always}).
 *
 * <p>Not {@code @Transactional}: with {@code RANDOM_PORT} the HTTP request is handled on a separate
 * server thread with its own transaction, so a test-thread rollback would neither be seen by the server
 * nor undo its writes. Each test therefore uses isolated data.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class EnrollmentErrorResponseRealServerTest {

    @LocalServerPort private int port;

    @Autowired private TestRestTemplate restTemplate;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;
    @Autowired private InstructorProfileRepository instructorProfileRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private CourseRepository courseRepository;

    // ─── Case 1: missing course → 404, not 401, no stack trace ──────────────────

    @Test
    void enrollingInMissingCourseReturns404WithoutStackTrace() {
        String token = registerAndLogin("rs.learner.404@enroll.test", "password123");

        ResponseEntity<String> response = restTemplate.exchange(
                url("/api/v1/courses/999999/enroll"),
                HttpMethod.POST,
                bearer(token),
                String.class
        );

        assertThat(response.getStatusCode())
                .as("controller-thrown 404 must reach the client, not be masked as 401")
                .isEqualTo(HttpStatus.NOT_FOUND);
        assertNoStackTrace(response.getBody());
        assertThat(response.getBody())
                .as("useful message should still be present")
                .contains("Course not found");
    }

    // ─── Case 2: duplicate enrollment → 409, not 401, no stack trace ────────────

    @Test
    void duplicateEnrollmentReturns409WithoutStackTrace() {
        Long courseId = setupCourse("rs.inst.409@enroll.test");
        String token = registerAndLogin("rs.learner.409@enroll.test", "password123");

        // First enrollment succeeds (201).
        ResponseEntity<String> first = restTemplate.exchange(
                url("/api/v1/courses/" + courseId + "/enroll"),
                HttpMethod.POST,
                bearer(token),
                String.class
        );
        assertThat(first.getStatusCode()).isEqualTo(HttpStatus.CREATED);

        // Second enrollment is the duplicate → 409.
        ResponseEntity<String> second = restTemplate.exchange(
                url("/api/v1/courses/" + courseId + "/enroll"),
                HttpMethod.POST,
                bearer(token),
                String.class
        );

        assertThat(second.getStatusCode())
                .as("duplicate enrollment must surface 409, not be masked as 401")
                .isEqualTo(HttpStatus.CONFLICT);
        assertNoStackTrace(second.getBody());
        assertThat(second.getBody())
                .as("useful message should still be present")
                .contains("Already enrolled in this course");
    }

    // ─── Case 3: security not weakened by permitting /error ─────────────────────

    @Test
    void unauthenticatedEnrollStillReturns401() {
        ResponseEntity<String> response = restTemplate.exchange(
                url("/api/v1/courses/999999/enroll"),
                HttpMethod.POST,
                HttpEntity.EMPTY,
                String.class
        );

        assertThat(response.getStatusCode())
                .as("permitting /error must not let unauthenticated requests through")
                .isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    // ─── Helpers ────────────────────────────────────────────────────────────────

    private void assertNoStackTrace(String body) {
        assertThat(body)
                .as("error body must not leak a Java stack trace")
                .doesNotContain("java.lang")
                .doesNotContain("ResponseStatusException")
                .doesNotContain("at com.")
                .doesNotContain("\"trace\"");
    }

    private String url(String path) {
        return "http://localhost:" + port + path;
    }

    private HttpEntity<Void> bearer(String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        return new HttpEntity<>(headers);
    }

    /**
     * Registers an instructor user via HTTP, then directly persists an approved instructor
     * profile and a published course. These writes commit (no surrounding transaction),
     * which is required because the course must be visible to the separate server thread.
     */
    private Long setupCourse(String instructorEmail) {
        register(instructorEmail, "password123", "Course Instructor");

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
                        .name("Real-Server Enrollment Test – " + instructorEmail)
                        .build()
        );

        Course course = courseRepository.save(
                Course.builder()
                        .title("Real-Server Enrollment Course – " + instructorEmail)
                        .instructorProfile(instructorProfile)
                        .category(category)
                        .level(CourseLevel.BEGINNER)
                        .status(CourseStatus.PUBLISHED)
                        .build()
        );

        return course.getId();
    }

    private String registerAndLogin(String email, String password) {
        register(email, password, "Test User");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        LoginRequest loginRequest = new LoginRequest(email, password);

        ResponseEntity<String> response = restTemplate.postForEntity(
                url("/api/v1/auth/login"),
                new HttpEntity<>(toJson(loginRequest), headers),
                String.class
        );
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);

        try {
            JsonNode json = objectMapper.readTree(response.getBody());
            return json.get("accessToken").asText();
        } catch (Exception e) {
            throw new IllegalStateException("Failed to parse login response", e);
        }
    }

    private void register(String email, String password, String fullName) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        RegisterRequest registerRequest = new RegisterRequest(fullName, email, password);

        ResponseEntity<String> response = restTemplate.postForEntity(
                url("/api/v1/auth/register"),
                new HttpEntity<>(toJson(registerRequest), headers),
                String.class
        );
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to serialize request body", e);
        }
    }
}
