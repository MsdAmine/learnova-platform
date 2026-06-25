package com.learnova.learnova_backend.course.repository;

import com.learnova.learnova_backend.course.entity.QuizAttempt;
import com.learnova.learnova_backend.course.entity.QuizAttemptStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, Long> {

    Optional<QuizAttempt> findByIdAndLearnerProfileId(Long id, Long learnerProfileId);

    Optional<QuizAttempt> findByLearnerProfileIdAndQuizIdAndStatus(
            Long learnerProfileId, Long quizId, QuizAttemptStatus status);

    List<QuizAttempt> findByLearnerProfileIdAndQuizIdOrderByStartedAtDesc(
            Long learnerProfileId, Long quizId);

    // True if the learner has at least one submitted attempt that passed this quiz.
    // Used for certificate eligibility: in-progress and failed-only attempts do not count.
    boolean existsByLearnerProfileIdAndQuizIdAndStatusAndPassedTrue(
            Long learnerProfileId, Long quizId, QuizAttemptStatus status);
}
