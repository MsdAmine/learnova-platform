package com.learnova.learnova_backend.course;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.learnova.learnova_backend.auth.dto.LoginRequest;
import com.learnova.learnova_backend.auth.dto.RegisterRequest;
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
import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class LearnerQuizIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;
    @Autowired private InstructorProfileRepository instructorProfileRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private CourseRepository courseRepository;
    @Autowired private QuizRepository quizRepository;
    @Autowired private QuestionRepository questionRepository;
    @Autowired private AnswerOptionRepository answerOptionRepository;
    @Autowired private LearnerProfileRepository learnerProfileRepository;
    @Autowired private EnrollmentRepository enrollmentRepository;

    // ─── 1. Enrolled learner lists published quizzes ──────────────────────────

    @Test
    void enrolledLearnerListsPublishedQuizzes() throws Exception {
        QuizFixture f = buildFixture("inst.lq1@quiz.test");
        String learnerToken = registerAndLogin("learner.lq1@quiz.test", "password123");
        enroll("learner.lq1@quiz.test", f.course(), EnrollmentStatus.ACTIVE);

        mockMvc.perform(get("/api/v1/learner/courses/{id}/quizzes", f.course().getId())
                        .header("Authorization", "Bearer " + learnerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(f.quiz().getId()))
                .andExpect(jsonPath("$[0].title").value("Test Quiz"))
                .andExpect(jsonPath("$[0].passingScore").value(70))
                .andExpect(jsonPath("$[0].courseId").value(f.course().getId()));
    }

    // ─── 2. List excludes DRAFT and ARCHIVED quizzes ──────────────────────────

    @Test
    void listExcludesDraftAndArchivedQuizzes() throws Exception {
        QuizFixture f = buildFixture("inst.lq2@quiz.test");
        createMinimalQuiz(f.course(), "Draft Quiz", QuizStatus.DRAFT);
        createMinimalQuiz(f.course(), "Archived Quiz", QuizStatus.ARCHIVED);
        String learnerToken = registerAndLogin("learner.lq2@quiz.test", "password123");
        enroll("learner.lq2@quiz.test", f.course(), EnrollmentStatus.ACTIVE);

        mockMvc.perform(get("/api/v1/learner/courses/{id}/quizzes", f.course().getId())
                        .header("Authorization", "Bearer " + learnerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].title").value("Test Quiz"));
    }

    // ─── 3. Not enrolled learner cannot list quizzes ──────────────────────────

    @Test
    void notEnrolledLearnerCannotListQuizzes() throws Exception {
        QuizFixture f = buildFixture("inst.lq3@quiz.test");
        String learnerToken = registerAndLogin("learner.lq3@quiz.test", "password123");

        mockMvc.perform(get("/api/v1/learner/courses/{id}/quizzes", f.course().getId())
                        .header("Authorization", "Bearer " + learnerToken))
                .andExpect(status().isNotFound());
    }

    // ─── 4. Enrolled learner fetches quiz detail ───────────────────────────────

    @Test
    void enrolledLearnerFetchesPublishedQuizDetail() throws Exception {
        QuizFixture f = buildFixture("inst.lq4@quiz.test");
        String learnerToken = registerAndLogin("learner.lq4@quiz.test", "password123");
        enroll("learner.lq4@quiz.test", f.course(), EnrollmentStatus.ACTIVE);

        mockMvc.perform(get("/api/v1/learner/quizzes/{id}", f.quiz().getId())
                        .header("Authorization", "Bearer " + learnerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(f.quiz().getId()))
                .andExpect(jsonPath("$.title").value("Test Quiz"))
                .andExpect(jsonPath("$.passingScore").value(70))
                .andExpect(jsonPath("$.questions.length()").value(2))
                .andExpect(jsonPath("$.questions[0].answerOptions.length()").value(2));
    }

    // ─── 5. Quiz detail does not expose isCorrect ─────────────────────────────

    @Test
    void quizDetailDoesNotExposeIsCorrect() throws Exception {
        QuizFixture f = buildFixture("inst.lq5@quiz.test");
        String learnerToken = registerAndLogin("learner.lq5@quiz.test", "password123");
        enroll("learner.lq5@quiz.test", f.course(), EnrollmentStatus.ACTIVE);

        mockMvc.perform(get("/api/v1/learner/quizzes/{id}", f.quiz().getId())
                        .header("Authorization", "Bearer " + learnerToken))
                .andExpect(status().isOk())
                .andExpect(content().string(not(containsString("isCorrect"))));
    }

    // ─── 6. Learner cannot fetch DRAFT quiz ───────────────────────────────────

    @Test
    void learnerCannotFetchDraftQuiz() throws Exception {
        QuizFixture f = buildFixture("inst.lq6@quiz.test");
        Quiz draftQuiz = createMinimalQuiz(f.course(), "Draft Quiz", QuizStatus.DRAFT);
        String learnerToken = registerAndLogin("learner.lq6@quiz.test", "password123");
        enroll("learner.lq6@quiz.test", f.course(), EnrollmentStatus.ACTIVE);

        mockMvc.perform(get("/api/v1/learner/quizzes/{id}", draftQuiz.getId())
                        .header("Authorization", "Bearer " + learnerToken))
                .andExpect(status().isNotFound());
    }

    // ─── 7. Not enrolled learner cannot fetch quiz detail ─────────────────────

    @Test
    void notEnrolledLearnerCannotFetchQuizDetail() throws Exception {
        QuizFixture f = buildFixture("inst.lq7@quiz.test");
        String learnerToken = registerAndLogin("learner.lq7@quiz.test", "password123");

        mockMvc.perform(get("/api/v1/learner/quizzes/{id}", f.quiz().getId())
                        .header("Authorization", "Bearer " + learnerToken))
                .andExpect(status().isNotFound());
    }

    // ─── 8. Start attempt creates IN_PROGRESS attempt ─────────────────────────

    @Test
    void startAttemptCreatesInProgressAttempt() throws Exception {
        QuizFixture f = buildFixture("inst.lq8@quiz.test");
        String learnerToken = registerAndLogin("learner.lq8@quiz.test", "password123");
        enroll("learner.lq8@quiz.test", f.course(), EnrollmentStatus.ACTIVE);

        mockMvc.perform(post("/api/v1/learner/quizzes/{id}/attempts", f.quiz().getId())
                        .header("Authorization", "Bearer " + learnerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.quizId").value(f.quiz().getId()))
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"))
                .andExpect(jsonPath("$.scorePercentage").doesNotExist())
                .andExpect(jsonPath("$.answerResults").isArray())
                .andExpect(jsonPath("$.answerResults").isEmpty());
    }

    // ─── 9. Starting again reuses existing IN_PROGRESS attempt ────────────────

    @Test
    void startingAgainReusesExistingInProgressAttempt() throws Exception {
        QuizFixture f = buildFixture("inst.lq9@quiz.test");
        String learnerToken = registerAndLogin("learner.lq9@quiz.test", "password123");
        enroll("learner.lq9@quiz.test", f.course(), EnrollmentStatus.ACTIVE);

        String firstResponse = mockMvc.perform(post("/api/v1/learner/quizzes/{id}/attempts", f.quiz().getId())
                        .header("Authorization", "Bearer " + learnerToken))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        String secondResponse = mockMvc.perform(post("/api/v1/learner/quizzes/{id}/attempts", f.quiz().getId())
                        .header("Authorization", "Bearer " + learnerToken))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        Long firstId = objectMapper.readTree(firstResponse).get("id").asLong();
        Long secondId = objectMapper.readTree(secondResponse).get("id").asLong();
        assert firstId.equals(secondId) : "Expected same attempt id but got " + firstId + " vs " + secondId;
    }

    // ─── 10. Submit all correct answers → score 100, passed true ──────────────

    @Test
    void submitAllCorrectAnswersScores100AndPassed() throws Exception {
        QuizFixture f = buildFixture("inst.lq10@quiz.test");
        String learnerToken = registerAndLogin("learner.lq10@quiz.test", "password123");
        enroll("learner.lq10@quiz.test", f.course(), EnrollmentStatus.ACTIVE);

        Long attemptId = startAttempt(learnerToken, f.quiz().getId());

        String submitBody = objectMapper.writeValueAsString(Map.of(
                "answers", List.of(
                        Map.of("questionId", f.q1().getId(), "selectedOptionId", f.q1Correct().getId()),
                        Map.of("questionId", f.q2().getId(), "selectedOptionId", f.q2Correct().getId())
                )));

        mockMvc.perform(post("/api/v1/learner/quiz-attempts/{id}/submit", attemptId)
                        .header("Authorization", "Bearer " + learnerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(submitBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUBMITTED"))
                .andExpect(jsonPath("$.scorePercentage").value(100))
                .andExpect(jsonPath("$.passed").value(true))
                .andExpect(jsonPath("$.earnedPoints").value(10))
                .andExpect(jsonPath("$.totalPoints").value(10));
    }

    // ─── 11. Submit all wrong answers → score 0, passed false ─────────────────

    @Test
    void submitAllWrongAnswersScores0AndFailed() throws Exception {
        QuizFixture f = buildFixture("inst.lq11@quiz.test");
        String learnerToken = registerAndLogin("learner.lq11@quiz.test", "password123");
        enroll("learner.lq11@quiz.test", f.course(), EnrollmentStatus.ACTIVE);

        Long attemptId = startAttempt(learnerToken, f.quiz().getId());

        String submitBody = objectMapper.writeValueAsString(Map.of(
                "answers", List.of(
                        Map.of("questionId", f.q1().getId(), "selectedOptionId", f.q1Wrong().getId()),
                        Map.of("questionId", f.q2().getId(), "selectedOptionId", f.q2Wrong().getId())
                )));

        mockMvc.perform(post("/api/v1/learner/quiz-attempts/{id}/submit", attemptId)
                        .header("Authorization", "Bearer " + learnerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(submitBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUBMITTED"))
                .andExpect(jsonPath("$.scorePercentage").value(0))
                .andExpect(jsonPath("$.passed").value(false))
                .andExpect(jsonPath("$.earnedPoints").value(0))
                .andExpect(jsonPath("$.totalPoints").value(10));
    }

    // ─── 12. Submit mixed answers → correct partial score ─────────────────────

    @Test
    void submitMixedAnswersProducesCorrectPartialScore() throws Exception {
        // q1=4pts correct, q2=6pts wrong → earned=4, total=10, score=40, passed=false (passingScore=70)
        QuizFixture f = buildFixture("inst.lq12@quiz.test");
        String learnerToken = registerAndLogin("learner.lq12@quiz.test", "password123");
        enroll("learner.lq12@quiz.test", f.course(), EnrollmentStatus.ACTIVE);

        Long attemptId = startAttempt(learnerToken, f.quiz().getId());

        String submitBody = objectMapper.writeValueAsString(Map.of(
                "answers", List.of(
                        Map.of("questionId", f.q1().getId(), "selectedOptionId", f.q1Correct().getId()),
                        Map.of("questionId", f.q2().getId(), "selectedOptionId", f.q2Wrong().getId())
                )));

        mockMvc.perform(post("/api/v1/learner/quiz-attempts/{id}/submit", attemptId)
                        .header("Authorization", "Bearer " + learnerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(submitBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.earnedPoints").value(4))
                .andExpect(jsonPath("$.totalPoints").value(10))
                .andExpect(jsonPath("$.scorePercentage").value(40))
                .andExpect(jsonPath("$.passed").value(false));
    }

    // ─── 13. Submit answer results include per-question breakdown ─────────────

    @Test
    void submitReturnsPerQuestionAnswerResults() throws Exception {
        QuizFixture f = buildFixture("inst.lq13@quiz.test");
        String learnerToken = registerAndLogin("learner.lq13@quiz.test", "password123");
        enroll("learner.lq13@quiz.test", f.course(), EnrollmentStatus.ACTIVE);

        Long attemptId = startAttempt(learnerToken, f.quiz().getId());

        String submitBody = objectMapper.writeValueAsString(Map.of(
                "answers", List.of(
                        Map.of("questionId", f.q1().getId(), "selectedOptionId", f.q1Correct().getId()),
                        Map.of("questionId", f.q2().getId(), "selectedOptionId", f.q2Wrong().getId())
                )));

        mockMvc.perform(post("/api/v1/learner/quiz-attempts/{id}/submit", attemptId)
                        .header("Authorization", "Bearer " + learnerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(submitBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.answerResults.length()").value(2));
    }

    // ─── 14. Submit missing answer → 400 ──────────────────────────────────────

    @Test
    void submitMissingAnswerReturns400() throws Exception {
        QuizFixture f = buildFixture("inst.lq14@quiz.test");
        String learnerToken = registerAndLogin("learner.lq14@quiz.test", "password123");
        enroll("learner.lq14@quiz.test", f.course(), EnrollmentStatus.ACTIVE);

        Long attemptId = startAttempt(learnerToken, f.quiz().getId());

        // Only answering one of two questions
        String submitBody = objectMapper.writeValueAsString(Map.of(
                "answers", List.of(
                        Map.of("questionId", f.q1().getId(), "selectedOptionId", f.q1Correct().getId())
                )));

        mockMvc.perform(post("/api/v1/learner/quiz-attempts/{id}/submit", attemptId)
                        .header("Authorization", "Bearer " + learnerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(submitBody))
                .andExpect(status().isBadRequest());
    }

    // ─── 15. Submit invalid option for question → 400 ─────────────────────────

    @Test
    void submitOptionBelongingToWrongQuestionReturns400() throws Exception {
        QuizFixture f = buildFixture("inst.lq15@quiz.test");
        String learnerToken = registerAndLogin("learner.lq15@quiz.test", "password123");
        enroll("learner.lq15@quiz.test", f.course(), EnrollmentStatus.ACTIVE);

        Long attemptId = startAttempt(learnerToken, f.quiz().getId());

        // Swap options: q1's option used for q2 answer
        String submitBody = objectMapper.writeValueAsString(Map.of(
                "answers", List.of(
                        Map.of("questionId", f.q1().getId(), "selectedOptionId", f.q1Correct().getId()),
                        Map.of("questionId", f.q2().getId(), "selectedOptionId", f.q1Wrong().getId()) // q1's option for q2
                )));

        mockMvc.perform(post("/api/v1/learner/quiz-attempts/{id}/submit", attemptId)
                        .header("Authorization", "Bearer " + learnerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(submitBody))
                .andExpect(status().isBadRequest());
    }

    // ─── 16. Submit duplicate question in request → 400 ──────────────────────

    @Test
    void submitDuplicateQuestionReturns400() throws Exception {
        QuizFixture f = buildFixture("inst.lq16@quiz.test");
        String learnerToken = registerAndLogin("learner.lq16@quiz.test", "password123");
        enroll("learner.lq16@quiz.test", f.course(), EnrollmentStatus.ACTIVE);

        Long attemptId = startAttempt(learnerToken, f.quiz().getId());

        // Send q1 twice (duplicate), covering total count of 2 questions
        String submitBody = objectMapper.writeValueAsString(Map.of(
                "answers", List.of(
                        Map.of("questionId", f.q1().getId(), "selectedOptionId", f.q1Correct().getId()),
                        Map.of("questionId", f.q1().getId(), "selectedOptionId", f.q1Wrong().getId())
                )));

        mockMvc.perform(post("/api/v1/learner/quiz-attempts/{id}/submit", attemptId)
                        .header("Authorization", "Bearer " + learnerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(submitBody))
                .andExpect(status().isBadRequest());
    }

    // ─── 17. Submit already-submitted attempt → 409 ───────────────────────────

    @Test
    void submitAlreadySubmittedAttemptReturns409() throws Exception {
        QuizFixture f = buildFixture("inst.lq17@quiz.test");
        String learnerToken = registerAndLogin("learner.lq17@quiz.test", "password123");
        enroll("learner.lq17@quiz.test", f.course(), EnrollmentStatus.ACTIVE);

        Long attemptId = startAttempt(learnerToken, f.quiz().getId());
        String submitBody = allCorrectBody(f);

        mockMvc.perform(post("/api/v1/learner/quiz-attempts/{id}/submit", attemptId)
                        .header("Authorization", "Bearer " + learnerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(submitBody))
                .andExpect(status().isOk());

        // Second submit
        mockMvc.perform(post("/api/v1/learner/quiz-attempts/{id}/submit", attemptId)
                        .header("Authorization", "Bearer " + learnerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(submitBody))
                .andExpect(status().isConflict());
    }

    // ─── 18. Learner cannot access another learner's attempt → 404 ────────────

    @Test
    void learnerCannotAccessAnotherLearnersAttempt() throws Exception {
        QuizFixture f = buildFixture("inst.lq18@quiz.test");
        String tokenA = registerAndLogin("learner.lq18a@quiz.test", "password123");
        registerAndLogin("learner.lq18b@quiz.test", "password123");
        enroll("learner.lq18a@quiz.test", f.course(), EnrollmentStatus.ACTIVE);
        enroll("learner.lq18b@quiz.test", f.course(), EnrollmentStatus.ACTIVE);

        Long attemptIdA = startAttempt(tokenA, f.quiz().getId());

        // Learner B tries to access Learner A's attempt
        String tokenB = login("learner.lq18b@quiz.test", "password123");
        mockMvc.perform(get("/api/v1/learner/quiz-attempts/{id}", attemptIdA)
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isNotFound());
    }

    // ─── 19. Get attempt result for submitted attempt ─────────────────────────

    @Test
    void getAttemptResultReturnsSubmittedAttemptWithResults() throws Exception {
        QuizFixture f = buildFixture("inst.lq19@quiz.test");
        String learnerToken = registerAndLogin("learner.lq19@quiz.test", "password123");
        enroll("learner.lq19@quiz.test", f.course(), EnrollmentStatus.ACTIVE);

        Long attemptId = startAttempt(learnerToken, f.quiz().getId());
        mockMvc.perform(post("/api/v1/learner/quiz-attempts/{id}/submit", attemptId)
                        .header("Authorization", "Bearer " + learnerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(allCorrectBody(f)))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/learner/quiz-attempts/{id}", attemptId)
                        .header("Authorization", "Bearer " + learnerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUBMITTED"))
                .andExpect(jsonPath("$.scorePercentage").value(100))
                .andExpect(jsonPath("$.answerResults.length()").value(2));
    }

    // ─── 20. Unauthenticated access → 401 ────────────────────────────────────

    @Test
    void unauthenticatedCannotListQuizzes() throws Exception {
        mockMvc.perform(get("/api/v1/learner/courses/999/quizzes"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void unauthenticatedCannotStartAttempt() throws Exception {
        mockMvc.perform(post("/api/v1/learner/quizzes/999/attempts"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void unauthenticatedCannotSubmitAttempt() throws Exception {
        mockMvc.perform(post("/api/v1/learner/quiz-attempts/999/submit")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized());
    }

    // ─── 21. Cancelled enrollment → 404 ──────────────────────────────────────

    @Test
    void cancelledEnrollmentCannotListQuizzes() throws Exception {
        QuizFixture f = buildFixture("inst.lq21@quiz.test");
        String learnerToken = registerAndLogin("learner.lq21@quiz.test", "password123");
        enroll("learner.lq21@quiz.test", f.course(), EnrollmentStatus.CANCELLED);

        mockMvc.perform(get("/api/v1/learner/courses/{id}/quizzes", f.course().getId())
                        .header("Authorization", "Bearer " + learnerToken))
                .andExpect(status().isNotFound());
    }

    @Test
    void cancelledEnrollmentCannotStartAttempt() throws Exception {
        QuizFixture f = buildFixture("inst.lq22@quiz.test");
        String learnerToken = registerAndLogin("learner.lq22@quiz.test", "password123");
        enroll("learner.lq22@quiz.test", f.course(), EnrollmentStatus.CANCELLED);

        mockMvc.perform(post("/api/v1/learner/quizzes/{id}/attempts", f.quiz().getId())
                        .header("Authorization", "Bearer " + learnerToken))
                .andExpect(status().isNotFound());
    }

    // ─── 22. Completed enrollment can still access quizzes ───────────────────

    @Test
    void completedEnrollmentCanListQuizzes() throws Exception {
        QuizFixture f = buildFixture("inst.lq23@quiz.test");
        String learnerToken = registerAndLogin("learner.lq23@quiz.test", "password123");
        enroll("learner.lq23@quiz.test", f.course(), EnrollmentStatus.COMPLETED);

        mockMvc.perform(get("/api/v1/learner/courses/{id}/quizzes", f.course().getId())
                        .header("Authorization", "Bearer " + learnerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    record QuizFixture(
            Course course, Quiz quiz,
            Question q1, Question q2,
            AnswerOption q1Correct, AnswerOption q1Wrong,
            AnswerOption q2Correct, AnswerOption q2Wrong) {}

    private QuizFixture buildFixture(String instructorEmail) throws Exception {
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

        Category category = categoryRepository.save(
                Category.builder().name("Cat-" + instructorEmail).build());

        Course course = courseRepository.save(
                Course.builder()
                        .title("Course-" + instructorEmail)
                        .instructorProfile(profile)
                        .category(category)
                        .level(CourseLevel.BEGINNER)
                        .status(CourseStatus.PUBLISHED)
                        .build());

        Quiz quiz = quizRepository.save(
                Quiz.builder()
                        .title("Test Quiz")
                        .passingScore(70)
                        .status(QuizStatus.PUBLISHED)
                        .course(course)
                        .build());

        // q1 = 4 points, q2 = 6 points → total = 10
        Question q1 = questionRepository.save(
                Question.builder()
                        .quiz(quiz)
                        .content("Question 1")
                        .points(4)
                        .type(QuestionType.MULTIPLE_CHOICE)
                        .build());
        quiz.getQuestions().add(q1);

        Question q2 = questionRepository.save(
                Question.builder()
                        .quiz(quiz)
                        .content("Question 2")
                        .points(6)
                        .type(QuestionType.MULTIPLE_CHOICE)
                        .build());
        quiz.getQuestions().add(q2);

        AnswerOption q1Correct = answerOptionRepository.save(
                AnswerOption.builder().question(q1).optionText("Correct A").isCorrect(true).build());
        AnswerOption q1Wrong = answerOptionRepository.save(
                AnswerOption.builder().question(q1).optionText("Wrong A").isCorrect(false).build());
        q1.getAnswerOptions().add(q1Correct);
        q1.getAnswerOptions().add(q1Wrong);

        AnswerOption q2Correct = answerOptionRepository.save(
                AnswerOption.builder().question(q2).optionText("Correct B").isCorrect(true).build());
        AnswerOption q2Wrong = answerOptionRepository.save(
                AnswerOption.builder().question(q2).optionText("Wrong B").isCorrect(false).build());
        q2.getAnswerOptions().add(q2Correct);
        q2.getAnswerOptions().add(q2Wrong);

        return new QuizFixture(course, quiz, q1, q2, q1Correct, q1Wrong, q2Correct, q2Wrong);
    }

    private Quiz createMinimalQuiz(Course course, String title, QuizStatus status) {
        return quizRepository.save(
                Quiz.builder()
                        .title(title)
                        .passingScore(70)
                        .status(status)
                        .course(course)
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

    private Long startAttempt(String token, Long quizId) throws Exception {
        String response = mockMvc.perform(post("/api/v1/learner/quizzes/{id}/attempts", quizId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(response).get("id").asLong();
    }

    private String allCorrectBody(QuizFixture f) throws Exception {
        return objectMapper.writeValueAsString(Map.of(
                "answers", List.of(
                        Map.of("questionId", f.q1().getId(), "selectedOptionId", f.q1Correct().getId()),
                        Map.of("questionId", f.q2().getId(), "selectedOptionId", f.q2Correct().getId())
                )));
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
