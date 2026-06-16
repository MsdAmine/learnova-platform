package com.learnova.learnova_backend.course.repository;

import com.learnova.learnova_backend.course.entity.QuizAttempt;
import com.learnova.learnova_backend.course.entity.QuizAttemptStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, Long> {

    Optional<QuizAttempt> findByIdAndLearnerProfileId(Long id, Long learnerProfileId);

    Optional<QuizAttempt> findByLearnerProfileIdAndQuizIdAndStatus(
            Long learnerProfileId, Long quizId, QuizAttemptStatus status);
}
