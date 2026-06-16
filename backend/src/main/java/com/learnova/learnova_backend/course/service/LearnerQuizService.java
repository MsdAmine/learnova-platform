package com.learnova.learnova_backend.course.service;

import com.learnova.learnova_backend.course.dto.*;
import com.learnova.learnova_backend.course.entity.*;
import com.learnova.learnova_backend.course.repository.QuizAttemptAnswerRepository;
import com.learnova.learnova_backend.course.repository.QuizAttemptRepository;
import com.learnova.learnova_backend.course.repository.QuizRepository;
import com.learnova.learnova_backend.enrollment.entity.EnrollmentStatus;
import com.learnova.learnova_backend.enrollment.repository.EnrollmentRepository;
import com.learnova.learnova_backend.profile.entity.LearnerProfile;
import com.learnova.learnova_backend.profile.repository.LearnerProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LearnerQuizService {

    private final QuizRepository quizRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final QuizAttemptAnswerRepository quizAttemptAnswerRepository;
    private final LearnerProfileRepository learnerProfileRepository;
    private final EnrollmentRepository enrollmentRepository;

    private static final List<EnrollmentStatus> ACTIVE_STATUSES =
            List.of(EnrollmentStatus.ACTIVE, EnrollmentStatus.COMPLETED);

    @Transactional(readOnly = true)
    public List<LearnerQuizSummaryResponse> listPublishedQuizzes(Long userId, Long courseId) {
        LearnerProfile learnerProfile = resolveLearnerProfile(userId);
        checkEnrollment(learnerProfile.getId(), courseId);

        return quizRepository.findByCourseIdAndStatusOrderByIdAsc(courseId, QuizStatus.PUBLISHED)
                .stream()
                .map(quiz -> new LearnerQuizSummaryResponse(
                        quiz.getId(),
                        quiz.getTitle(),
                        quiz.getDescription(),
                        quiz.getPassingScore(),
                        quiz.getCourse().getId(),
                        quiz.getSection() != null ? quiz.getSection().getId() : null))
                .toList();
    }

    @Transactional(readOnly = true)
    public LearnerQuizDetailResponse getQuizForTaking(Long userId, Long quizId) {
        Quiz quiz = resolvePublishedQuiz(quizId);
        LearnerProfile learnerProfile = resolveLearnerProfile(userId);
        checkEnrollment(learnerProfile.getId(), quiz.getCourse().getId());

        List<LearnerQuestionResponse> questions = quiz.getQuestions().stream()
                .map(q -> new LearnerQuestionResponse(
                        q.getId(),
                        q.getContent(),
                        q.getPoints(),
                        q.getType(),
                        q.getAnswerOptions().stream()
                                .map(o -> new LearnerAnswerOptionResponse(o.getId(), o.getOptionText()))
                                .toList()))
                .toList();

        return new LearnerQuizDetailResponse(
                quiz.getId(),
                quiz.getTitle(),
                quiz.getDescription(),
                quiz.getPassingScore(),
                quiz.getCourse().getId(),
                quiz.getSection() != null ? quiz.getSection().getId() : null,
                questions);
    }

    @Transactional
    public QuizAttemptResponse startOrResumeAttempt(Long userId, Long quizId) {
        Quiz quiz = resolvePublishedQuiz(quizId);
        LearnerProfile learnerProfile = resolveLearnerProfile(userId);
        checkEnrollment(learnerProfile.getId(), quiz.getCourse().getId());

        Optional<QuizAttempt> existing = quizAttemptRepository
                .findByLearnerProfileIdAndQuizIdAndStatus(
                        learnerProfile.getId(), quizId, QuizAttemptStatus.IN_PROGRESS);
        if (existing.isPresent()) {
            return toAttemptResponse(existing.get(), List.of());
        }

        QuizAttempt attempt = QuizAttempt.builder()
                .learnerProfile(learnerProfile)
                .quiz(quiz)
                .status(QuizAttemptStatus.IN_PROGRESS)
                .build();
        return toAttemptResponse(quizAttemptRepository.save(attempt), List.of());
    }

    @Transactional
    public QuizAttemptResponse submitAttempt(Long userId, Long attemptId, QuizAttemptSubmitRequest request) {
        LearnerProfile learnerProfile = resolveLearnerProfile(userId);

        QuizAttempt attempt = quizAttemptRepository
                .findByIdAndLearnerProfileId(attemptId, learnerProfile.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Attempt not found"));

        if (attempt.getStatus() == QuizAttemptStatus.SUBMITTED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Attempt already submitted");
        }

        Quiz quiz = attempt.getQuiz();
        List<Question> questions = quiz.getQuestions();

        Map<Long, Question> questionMap = questions.stream()
                .collect(Collectors.toMap(Question::getId, q -> q));

        Map<Long, Map<Long, AnswerOption>> questionOptionMap = new HashMap<>();
        for (Question q : questions) {
            Map<Long, AnswerOption> optionMap = q.getAnswerOptions().stream()
                    .collect(Collectors.toMap(AnswerOption::getId, o -> o));
            questionOptionMap.put(q.getId(), optionMap);
        }

        List<QuizAttemptAnswerRequest> answers = request.answers();

        Set<Long> answeredIds = new HashSet<>();
        for (QuizAttemptAnswerRequest a : answers) {
            if (!answeredIds.add(a.questionId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Duplicate answer for question: " + a.questionId());
            }
        }

        if (!answeredIds.equals(questionMap.keySet())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Answer set does not match quiz questions");
        }

        for (QuizAttemptAnswerRequest a : answers) {
            Map<Long, AnswerOption> optionsForQuestion = questionOptionMap.get(a.questionId());
            if (!optionsForQuestion.containsKey(a.selectedOptionId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Answer option does not belong to the specified question");
            }
        }

        int totalPoints = questions.stream().mapToInt(Question::getPoints).sum();
        if (totalPoints == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Quiz has no scoreable points");
        }

        int earnedPoints = 0;
        List<QuizAttemptAnswerResultResponse> results = new ArrayList<>();

        for (QuizAttemptAnswerRequest a : answers) {
            Question question = questionMap.get(a.questionId());
            AnswerOption selectedOption = questionOptionMap.get(a.questionId()).get(a.selectedOptionId());
            boolean correct = Boolean.TRUE.equals(selectedOption.getIsCorrect());
            int points = correct ? question.getPoints() : 0;
            earnedPoints += points;

            quizAttemptAnswerRepository.save(QuizAttemptAnswer.builder()
                    .attempt(attempt)
                    .question(question)
                    .selectedOption(selectedOption)
                    .correct(correct)
                    .earnedPoints(points)
                    .build());

            results.add(new QuizAttemptAnswerResultResponse(
                    a.questionId(), a.selectedOptionId(), correct, points));
        }

        int scorePercentage = (earnedPoints * 100) / totalPoints;
        boolean passed = scorePercentage >= quiz.getPassingScore();
        Instant now = Instant.now();

        attempt.setStatus(QuizAttemptStatus.SUBMITTED);
        attempt.setEarnedPoints(earnedPoints);
        attempt.setTotalPoints(totalPoints);
        attempt.setScorePercentage(scorePercentage);
        attempt.setPassed(passed);
        attempt.setSubmittedAt(now);
        quizAttemptRepository.save(attempt);

        return new QuizAttemptResponse(
                attempt.getId(), quiz.getId(), QuizAttemptStatus.SUBMITTED,
                earnedPoints, totalPoints, scorePercentage, passed, now, results);
    }

    @Transactional(readOnly = true)
    public QuizAttemptResponse getAttemptResult(Long userId, Long attemptId) {
        LearnerProfile learnerProfile = resolveLearnerProfile(userId);

        QuizAttempt attempt = quizAttemptRepository
                .findByIdAndLearnerProfileId(attemptId, learnerProfile.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Attempt not found"));

        List<QuizAttemptAnswerResultResponse> results = quizAttemptAnswerRepository
                .findByAttemptId(attemptId)
                .stream()
                .map(a -> new QuizAttemptAnswerResultResponse(
                        a.getQuestion().getId(),
                        a.getSelectedOption().getId(),
                        a.getCorrect(),
                        a.getEarnedPoints()))
                .toList();

        return toAttemptResponse(attempt, results);
    }

    private LearnerProfile resolveLearnerProfile(Long userId) {
        return learnerProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Learner profile not found"));
    }

    private void checkEnrollment(Long learnerProfileId, Long courseId) {
        boolean enrolled = enrollmentRepository.existsByLearnerProfileIdAndCourseIdAndStatusIn(
                learnerProfileId, courseId, ACTIVE_STATUSES);
        if (!enrolled) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found");
        }
    }

    private Quiz resolvePublishedQuiz(Long quizId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Quiz not found"));
        if (quiz.getStatus() != QuizStatus.PUBLISHED) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Quiz not found");
        }
        return quiz;
    }

    private QuizAttemptResponse toAttemptResponse(QuizAttempt attempt,
                                                   List<QuizAttemptAnswerResultResponse> results) {
        return new QuizAttemptResponse(
                attempt.getId(),
                attempt.getQuiz().getId(),
                attempt.getStatus(),
                attempt.getEarnedPoints(),
                attempt.getTotalPoints(),
                attempt.getScorePercentage(),
                attempt.getPassed(),
                attempt.getSubmittedAt(),
                results);
    }
}
