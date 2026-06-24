package com.learnova.learnova_backend.certificate;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.learnova.learnova_backend.auth.dto.LoginRequest;
import com.learnova.learnova_backend.auth.dto.RegisterRequest;
import com.learnova.learnova_backend.certificate.repository.CertificateRepository;
import com.learnova.learnova_backend.course.entity.AnswerOption;
import com.learnova.learnova_backend.course.entity.Category;
import com.learnova.learnova_backend.course.entity.Course;
import com.learnova.learnova_backend.course.entity.CourseLevel;
import com.learnova.learnova_backend.course.entity.CourseStatus;
import com.learnova.learnova_backend.course.entity.Lesson;
import com.learnova.learnova_backend.course.entity.Question;
import com.learnova.learnova_backend.course.entity.QuestionType;
import com.learnova.learnova_backend.course.entity.Quiz;
import com.learnova.learnova_backend.course.entity.QuizStatus;
import com.learnova.learnova_backend.course.entity.Section;
import com.learnova.learnova_backend.course.repository.AnswerOptionRepository;
import com.learnova.learnova_backend.course.repository.CategoryRepository;
import com.learnova.learnova_backend.course.repository.CourseRepository;
import com.learnova.learnova_backend.course.repository.LessonRepository;
import com.learnova.learnova_backend.course.repository.QuestionRepository;
import com.learnova.learnova_backend.course.repository.QuizRepository;
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

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Covers the assessment-aware certificate eligibility rules: published quizzes
 * must be passed before a certificate can be issued, while draft/archived quizzes
 * and courses without quizzes do not block lesson-based completion.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class CertificateQuizEligibilityIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;
    @Autowired private InstructorProfileRepository instructorProfileRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private CourseRepository courseRepository;
    @Autowired private SectionRepository sectionRepository;
    @Autowired private LessonRepository lessonRepository;
    @Autowired private QuizRepository quizRepository;
    @Autowired private QuestionRepository questionRepository;
    @Autowired private AnswerOptionRepository answerOptionRepository;
    @Autowired private LearnerProfileRepository learnerProfileRepository;
    @Autowired private EnrollmentRepository enrollmentRepository;
    @Autowired private CertificateRepository certificateRepository;

    record QuizSpec(Long quizId, Long questionId, Long correctOptionId, Long wrongOptionId) {}

    record CourseFixture(Course course, List<Long> lessonIds) {}

    // ─── 1. All lessons done + all published quizzes passed → certificate issued ──

    @Test
    void issuesCertificateWhenLessonsCompletedAndQuizPassed() throws Exception {
        CourseFixture f = setupCourse("inst.cq1@test.test", 2);
        QuizSpec quiz = addQuiz(f.course(), QuizStatus.PUBLISHED);
        String token = registerAndLogin("learner.cq1@test.test");
        enrollDirectly(getLearnerProfile("learner.cq1@test.test"), f.course().getId());

        completeAllLessons(token, f.lessonIds());
        passQuiz(token, quiz);

        mockMvc.perform(issue(f.course().getId(), token))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.certificateCode").isNotEmpty());
    }

    // ─── 2. Lessons incomplete → blocked even if quiz passed ──────────────────────

    @Test
    void blocksWhenLessonsIncomplete() throws Exception {
        CourseFixture f = setupCourse("inst.cq2@test.test", 2);
        QuizSpec quiz = addQuiz(f.course(), QuizStatus.PUBLISHED);
        String token = registerAndLogin("learner.cq2@test.test");
        enrollDirectly(getLearnerProfile("learner.cq2@test.test"), f.course().getId());

        passQuiz(token, quiz); // quiz passed but lessons untouched

        var result = mockMvc.perform(issue(f.course().getId(), token))
                .andExpect(status().isConflict())
                .andReturn();
        assertThat(result.getResponse().getErrorMessage())
                .isEqualTo("Complete all lessons before generating a certificate.");
    }

    // ─── 3. Published quiz never attempted → blocked ──────────────────────────────

    @Test
    void blocksWhenPublishedQuizNotAttempted() throws Exception {
        CourseFixture f = setupCourse("inst.cq3@test.test", 2);
        addQuiz(f.course(), QuizStatus.PUBLISHED);
        String token = registerAndLogin("learner.cq3@test.test");
        enrollDirectly(getLearnerProfile("learner.cq3@test.test"), f.course().getId());

        completeAllLessons(token, f.lessonIds());

        var result = mockMvc.perform(issue(f.course().getId(), token))
                .andExpect(status().isConflict())
                .andReturn();
        assertThat(result.getResponse().getErrorMessage())
                .isEqualTo("Pass all published quizzes before generating a certificate.");
    }

    // ─── 4. Published quiz with only failed attempts → blocked ────────────────────

    @Test
    void blocksWhenPublishedQuizOnlyFailed() throws Exception {
        CourseFixture f = setupCourse("inst.cq4@test.test", 2);
        QuizSpec quiz = addQuiz(f.course(), QuizStatus.PUBLISHED);
        String token = registerAndLogin("learner.cq4@test.test");
        enrollDirectly(getLearnerProfile("learner.cq4@test.test"), f.course().getId());

        completeAllLessons(token, f.lessonIds());
        failQuiz(token, quiz);

        var result = mockMvc.perform(issue(f.course().getId(), token))
                .andExpect(status().isConflict())
                .andReturn();
        assertThat(result.getResponse().getErrorMessage())
                .isEqualTo("Pass all published quizzes before generating a certificate.");
    }

    // ─── 5. Failed then later passed attempt → certificate issued ─────────────────

    @Test
    void issuesWhenLaterAttemptPassesAfterFailure() throws Exception {
        CourseFixture f = setupCourse("inst.cq5@test.test", 2);
        QuizSpec quiz = addQuiz(f.course(), QuizStatus.PUBLISHED);
        String token = registerAndLogin("learner.cq5@test.test");
        enrollDirectly(getLearnerProfile("learner.cq5@test.test"), f.course().getId());

        completeAllLessons(token, f.lessonIds());
        failQuiz(token, quiz);
        passQuiz(token, quiz); // retake passes

        mockMvc.perform(issue(f.course().getId(), token))
                .andExpect(status().isCreated());
    }

    // ─── 6. Draft and archived quizzes do not block ───────────────────────────────

    @Test
    void draftAndArchivedQuizzesDoNotBlock() throws Exception {
        CourseFixture f = setupCourse("inst.cq6@test.test", 2);
        addQuiz(f.course(), QuizStatus.DRAFT);
        addQuiz(f.course(), QuizStatus.ARCHIVED);
        String token = registerAndLogin("learner.cq6@test.test");
        enrollDirectly(getLearnerProfile("learner.cq6@test.test"), f.course().getId());

        completeAllLessons(token, f.lessonIds());

        mockMvc.perform(issue(f.course().getId(), token))
                .andExpect(status().isCreated());
    }

    // ─── 7. No published quizzes → lesson completion alone is enough ──────────────

    @Test
    void noPublishedQuizzesAllowsCertificateAfterLessons() throws Exception {
        CourseFixture f = setupCourse("inst.cq7@test.test", 2);
        String token = registerAndLogin("learner.cq7@test.test");
        enrollDirectly(getLearnerProfile("learner.cq7@test.test"), f.course().getId());

        completeAllLessons(token, f.lessonIds());

        mockMvc.perform(issue(f.course().getId(), token))
                .andExpect(status().isCreated());
    }

    // ─── 8. Issuing twice is idempotent, no duplicate row ─────────────────────────

    @Test
    void issuingTwiceReturnsSameCertificateWithoutDuplicate() throws Exception {
        CourseFixture f = setupCourse("inst.cq8@test.test", 2);
        QuizSpec quiz = addQuiz(f.course(), QuizStatus.PUBLISHED);
        String token = registerAndLogin("learner.cq8@test.test");
        LearnerProfile lp = getLearnerProfile("learner.cq8@test.test");
        enrollDirectly(lp, f.course().getId());

        completeAllLessons(token, f.lessonIds());
        passQuiz(token, quiz);

        String first = mockMvc.perform(issue(f.course().getId(), token))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        String firstCode = objectMapper.readTree(first).get("certificateCode").asText();

        mockMvc.perform(issue(f.course().getId(), token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.certificateCode").value(firstCode));

        assertThat(certificateRepository.findByLearnerProfileIdOrderByIssuedAtDesc(lp.getId())).hasSize(1);
    }

    // ─── 9. Multiple published quizzes: passing only one is not enough ────────────

    @Test
    void allPublishedQuizzesMustBePassed() throws Exception {
        CourseFixture f = setupCourse("inst.cq9@test.test", 2);
        QuizSpec quizA = addQuiz(f.course(), QuizStatus.PUBLISHED);
        addQuiz(f.course(), QuizStatus.PUBLISHED); // second quiz left unpassed
        String token = registerAndLogin("learner.cq9@test.test");
        enrollDirectly(getLearnerProfile("learner.cq9@test.test"), f.course().getId());

        completeAllLessons(token, f.lessonIds());
        passQuiz(token, quizA);

        var result = mockMvc.perform(issue(f.course().getId(), token))
                .andExpect(status().isConflict())
                .andReturn();
        assertThat(result.getResponse().getErrorMessage())
                .isEqualTo("Pass all published quizzes before generating a certificate.");
    }

    // ─── 10. Not enrolled → 404, never leaks eligibility details ──────────────────

    @Test
    void notEnrolledCannotIssueCertificate() throws Exception {
        CourseFixture f = setupCourse("inst.cq10@test.test", 2);
        addQuiz(f.course(), QuizStatus.PUBLISHED);
        String token = registerAndLogin("learner.cq10@test.test");

        mockMvc.perform(issue(f.course().getId(), token))
                .andExpect(status().isNotFound());
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────────

    private org.springframework.test.web.servlet.RequestBuilder issue(Long courseId, String token) {
        return post("/api/v1/learner/certificates/course/" + courseId + "/issue")
                .header("Authorization", "Bearer " + token);
    }

    private CourseFixture setupCourse(String instructorEmail, int lessonCount) throws Exception {
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new RegisterRequest("Test Instructor", instructorEmail, "password123"))))
                .andExpect(status().isCreated());

        User instructorUser = userRepository.findByEmailIgnoreCase(instructorEmail).orElseThrow();
        InstructorProfile profile = instructorProfileRepository.save(
                InstructorProfile.builder()
                        .user(instructorUser)
                        .bio("bio")
                        .expertise("expertise")
                        .approvalStatus(InstructorApprovalStatus.APPROVED)
                        .build());

        Category category = categoryRepository.save(Category.builder().name("Cat-" + instructorEmail).build());
        Course course = courseRepository.save(
                Course.builder()
                        .title("Course-" + instructorEmail)
                        .instructorProfile(profile)
                        .category(category)
                        .level(CourseLevel.BEGINNER)
                        .status(CourseStatus.PUBLISHED)
                        .build());

        Section section = sectionRepository.save(Section.builder().title("Section 1").course(course).build());
        List<Long> lessonIds = new ArrayList<>();
        for (int i = 0; i < lessonCount; i++) {
            Lesson lesson = lessonRepository.save(
                    Lesson.builder().title("Lesson " + (i + 1)).section(section).build());
            lessonIds.add(lesson.getId());
        }
        return new CourseFixture(course, lessonIds);
    }

    private QuizSpec addQuiz(Course course, QuizStatus status) {
        Quiz quiz = quizRepository.save(
                Quiz.builder()
                        .title("Quiz " + status)
                        .passingScore(70)
                        .status(status)
                        .course(course)
                        .build());

        Question question = questionRepository.save(
                Question.builder()
                        .quiz(quiz)
                        .content("Q1")
                        .points(10)
                        .type(QuestionType.MULTIPLE_CHOICE)
                        .build());
        quiz.getQuestions().add(question);

        AnswerOption correct = answerOptionRepository.save(
                AnswerOption.builder().question(question).optionText("Correct").isCorrect(true).build());
        AnswerOption wrong = answerOptionRepository.save(
                AnswerOption.builder().question(question).optionText("Wrong").isCorrect(false).build());
        question.getAnswerOptions().add(correct);
        question.getAnswerOptions().add(wrong);

        return new QuizSpec(quiz.getId(), question.getId(), correct.getId(), wrong.getId());
    }

    private void passQuiz(String token, QuizSpec quiz) throws Exception {
        submitAttempt(token, startAttempt(token, quiz.quizId()), quiz, quiz.correctOptionId());
    }

    private void failQuiz(String token, QuizSpec quiz) throws Exception {
        submitAttempt(token, startAttempt(token, quiz.quizId()), quiz, quiz.wrongOptionId());
    }

    private Long startAttempt(String token, Long quizId) throws Exception {
        String response = mockMvc.perform(post("/api/v1/learner/quizzes/{id}/attempts", quizId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(response).get("id").asLong();
    }

    private void submitAttempt(String token, Long attemptId, QuizSpec quiz, Long selectedOptionId) throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "answers", List.of(Map.of(
                        "questionId", quiz.questionId(),
                        "selectedOptionId", selectedOptionId))));
        mockMvc.perform(post("/api/v1/learner/quiz-attempts/{id}/submit", attemptId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk());
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

    private String registerAndLogin(String email) throws Exception {
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new RegisterRequest("Test Learner", email, "password123"))))
                .andExpect(status().isCreated());

        String loginResponse = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest(email, "password123"))))
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
                .build());
    }
}
