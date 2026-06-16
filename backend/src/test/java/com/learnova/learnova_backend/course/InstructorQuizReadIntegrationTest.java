package com.learnova.learnova_backend.course;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.learnova.learnova_backend.auth.dto.LoginRequest;
import com.learnova.learnova_backend.auth.dto.RegisterRequest;
import com.learnova.learnova_backend.course.entity.*;
import com.learnova.learnova_backend.course.repository.*;
import com.learnova.learnova_backend.profile.entity.InstructorApprovalStatus;
import com.learnova.learnova_backend.profile.entity.InstructorProfile;
import com.learnova.learnova_backend.profile.repository.InstructorProfileRepository;
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
class InstructorQuizReadIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;
    @Autowired private RoleRepository roleRepository;
    @Autowired private InstructorProfileRepository instructorProfileRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private CourseRepository courseRepository;
    @Autowired private QuizRepository quizRepository;
    @Autowired private QuestionRepository questionRepository;
    @Autowired private AnswerOptionRepository answerOptionRepository;

    // ─── 1. List quizzes — happy path ─────────────────────────────────────────

    @Test
    void instructorCanListQuizzesForOwnCourse() throws Exception {
        InstructorContext ctx = setupInstructor("inst.qr1@quiz.test");
        Long courseId = createCourse(ctx.profile, CourseStatus.DRAFT);
        createQuiz(courseId, ctx.profile, "Quiz Alpha", QuizStatus.DRAFT);
        createQuiz(courseId, ctx.profile, "Quiz Beta", QuizStatus.PUBLISHED);

        mockMvc.perform(get("/api/v1/instructor/courses/{id}/quizzes", courseId)
                        .header("Authorization", "Bearer " + ctx.token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].title").value("Quiz Alpha"))
                .andExpect(jsonPath("$[1].title").value("Quiz Beta"))
                .andExpect(jsonPath("$[0].courseId").value(courseId));
    }

    // ─── 2. List includes all statuses ────────────────────────────────────────

    @Test
    void listIncludesAllStatuses() throws Exception {
        InstructorContext ctx = setupInstructor("inst.qr2@quiz.test");
        Long courseId = createCourse(ctx.profile, CourseStatus.DRAFT);
        createQuiz(courseId, ctx.profile, "Draft Quiz", QuizStatus.DRAFT);
        createQuiz(courseId, ctx.profile, "Published Quiz", QuizStatus.PUBLISHED);
        createQuiz(courseId, ctx.profile, "Archived Quiz", QuizStatus.ARCHIVED);

        mockMvc.perform(get("/api/v1/instructor/courses/{id}/quizzes", courseId)
                        .header("Authorization", "Bearer " + ctx.token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(3))
                .andExpect(jsonPath("$[0].status").value("DRAFT"))
                .andExpect(jsonPath("$[1].status").value("PUBLISHED"))
                .andExpect(jsonPath("$[2].status").value("ARCHIVED"));
    }

    // ─── 3. List returns empty array for course with no quizzes ───────────────

    @Test
    void listReturnsEmptyArrayForCourseWithNoQuizzes() throws Exception {
        InstructorContext ctx = setupInstructor("inst.qr3@quiz.test");
        Long courseId = createCourse(ctx.profile, CourseStatus.DRAFT);

        mockMvc.perform(get("/api/v1/instructor/courses/{id}/quizzes", courseId)
                        .header("Authorization", "Bearer " + ctx.token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    // ─── 4. Quiz detail — happy path with questions and options ───────────────

    @Test
    void instructorCanFetchOwnQuizDetailWithQuestionsAndOptions() throws Exception {
        InstructorContext ctx = setupInstructor("inst.qr4@quiz.test");
        Long courseId = createCourse(ctx.profile, CourseStatus.DRAFT);
        Quiz quiz = createQuiz(courseId, ctx.profile, "Knowledge Check", QuizStatus.DRAFT);
        Question q = createQuestion(quiz, "What is Java?", 2);
        createAnswerOption(q, "A programming language", true);
        createAnswerOption(q, "A coffee brand", false);

        mockMvc.perform(get("/api/v1/instructor/courses/quizzes/{id}", quiz.getId())
                        .header("Authorization", "Bearer " + ctx.token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(quiz.getId()))
                .andExpect(jsonPath("$.title").value("Knowledge Check"))
                .andExpect(jsonPath("$.status").value("DRAFT"))
                .andExpect(jsonPath("$.courseId").value(courseId))
                .andExpect(jsonPath("$.questions.length()").value(1))
                .andExpect(jsonPath("$.questions[0].content").value("What is Java?"))
                .andExpect(jsonPath("$.questions[0].points").value(2))
                .andExpect(jsonPath("$.questions[0].answerOptions.length()").value(2))
                .andExpect(jsonPath("$.questions[0].answerOptions[0].optionText").value("A programming language"))
                .andExpect(jsonPath("$.questions[0].answerOptions[0].isCorrect").value(true))
                .andExpect(jsonPath("$.questions[0].answerOptions[1].isCorrect").value(false));
    }

    // ─── 5. Quiz detail — zero questions ──────────────────────────────────────

    @Test
    void quizDetailWithZeroQuestionsReturnsEmptyArray() throws Exception {
        InstructorContext ctx = setupInstructor("inst.qr5@quiz.test");
        Long courseId = createCourse(ctx.profile, CourseStatus.DRAFT);
        Quiz quiz = createQuiz(courseId, ctx.profile, "Empty Quiz", QuizStatus.DRAFT);

        mockMvc.perform(get("/api/v1/instructor/courses/quizzes/{id}", quiz.getId())
                        .header("Authorization", "Bearer " + ctx.token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.questions.length()").value(0));
    }

    // ─── 6. Quiz detail — question with zero options ──────────────────────────

    @Test
    void quizDetailWithQuestionButNoOptionsReturnsEmptyOptionsArray() throws Exception {
        InstructorContext ctx = setupInstructor("inst.qr6@quiz.test");
        Long courseId = createCourse(ctx.profile, CourseStatus.DRAFT);
        Quiz quiz = createQuiz(courseId, ctx.profile, "Partial Quiz", QuizStatus.DRAFT);
        createQuestion(quiz, "Question with no options yet", 1);

        mockMvc.perform(get("/api/v1/instructor/courses/quizzes/{id}", quiz.getId())
                        .header("Authorization", "Bearer " + ctx.token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.questions.length()").value(1))
                .andExpect(jsonPath("$.questions[0].answerOptions.length()").value(0));
    }

    // ─── 7. Cross-instructor list access → 403 ────────────────────────────────

    @Test
    void crossInstructorListAccessForbidden() throws Exception {
        InstructorContext owner = setupInstructor("inst.qr7owner@quiz.test");
        InstructorContext other = setupInstructor("inst.qr7other@quiz.test");
        Long courseId = createCourse(owner.profile, CourseStatus.DRAFT);

        mockMvc.perform(get("/api/v1/instructor/courses/{id}/quizzes", courseId)
                        .header("Authorization", "Bearer " + other.token))
                .andExpect(status().isForbidden());
    }

    // ─── 8. Cross-instructor detail access → 403 ──────────────────────────────

    @Test
    void crossInstructorDetailAccessForbidden() throws Exception {
        InstructorContext owner = setupInstructor("inst.qr8owner@quiz.test");
        InstructorContext other = setupInstructor("inst.qr8other@quiz.test");
        Long courseId = createCourse(owner.profile, CourseStatus.DRAFT);
        Quiz quiz = createQuiz(courseId, owner.profile, "Private Quiz", QuizStatus.DRAFT);

        mockMvc.perform(get("/api/v1/instructor/courses/quizzes/{id}", quiz.getId())
                        .header("Authorization", "Bearer " + other.token))
                .andExpect(status().isForbidden());
    }

    // ─── 9. Learner access → 403 ──────────────────────────────────────────────

    @Test
    void learnerCannotListQuizzes() throws Exception {
        InstructorContext ctx = setupInstructor("inst.qr9@quiz.test");
        Long courseId = createCourse(ctx.profile, CourseStatus.DRAFT);
        String learnerToken = registerAndLogin("learner.qr9@quiz.test", "password123");

        mockMvc.perform(get("/api/v1/instructor/courses/{id}/quizzes", courseId)
                        .header("Authorization", "Bearer " + learnerToken))
                .andExpect(status().isForbidden());
    }

    // ─── 10. Unauthenticated → 401 ────────────────────────────────────────────

    @Test
    void unauthenticatedCannotListQuizzes() throws Exception {
        mockMvc.perform(get("/api/v1/instructor/courses/999/quizzes"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void unauthenticatedCannotFetchQuizDetail() throws Exception {
        mockMvc.perform(get("/api/v1/instructor/courses/quizzes/999"))
                .andExpect(status().isUnauthorized());
    }

    // ─── 11. Not found → 404 ──────────────────────────────────────────────────

    @Test
    void unknownCourseReturns404OnList() throws Exception {
        InstructorContext ctx = setupInstructor("inst.qr11a@quiz.test");

        mockMvc.perform(get("/api/v1/instructor/courses/999999/quizzes")
                        .header("Authorization", "Bearer " + ctx.token))
                .andExpect(status().isNotFound());
    }

    @Test
    void unknownQuizReturns404OnDetail() throws Exception {
        InstructorContext ctx = setupInstructor("inst.qr11b@quiz.test");

        mockMvc.perform(get("/api/v1/instructor/courses/quizzes/999999")
                        .header("Authorization", "Bearer " + ctx.token))
                .andExpect(status().isNotFound());
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

    private Quiz createQuiz(Long courseId, InstructorProfile profile, String title, QuizStatus status) {
        Course course = courseRepository.findById(courseId).orElseThrow();
        return quizRepository.save(
                Quiz.builder()
                        .title(title)
                        .passingScore(70)
                        .status(status)
                        .course(course)
                        .build());
    }

    private Question createQuestion(Quiz quiz, String content, int points) {
        Question question = questionRepository.save(
                Question.builder()
                        .quiz(quiz)
                        .content(content)
                        .points(points)
                        .type(QuestionType.MULTIPLE_CHOICE)
                        .build());
        // Maintain the inverse side of the bidirectional association so the L1 cache
        // stays coherent when the service fetches the quiz in the same transaction.
        quiz.getQuestions().add(question);
        return question;
    }

    private void createAnswerOption(Question question, String text, boolean isCorrect) {
        AnswerOption option = answerOptionRepository.save(
                AnswerOption.builder()
                        .question(question)
                        .optionText(text)
                        .isCorrect(isCorrect)
                        .build());
        question.getAnswerOptions().add(option);
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
