package com.learnova.learnova_backend.course.repository;

import com.learnova.learnova_backend.course.entity.QuizAttemptAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuizAttemptAnswerRepository extends JpaRepository<QuizAttemptAnswer, Long> {

    List<QuizAttemptAnswer> findByAttemptId(Long attemptId);
}
