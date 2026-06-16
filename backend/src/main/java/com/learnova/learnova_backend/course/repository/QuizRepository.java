package com.learnova.learnova_backend.course.repository;

import com.learnova.learnova_backend.course.entity.Quiz;
import com.learnova.learnova_backend.course.entity.QuizStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuizRepository extends JpaRepository<Quiz, Long> {

    List<Quiz> findByCourseId(Long courseId);

    List<Quiz> findByCourseIdOrderByIdAsc(Long courseId);

    List<Quiz> findBySectionId(Long sectionId);

    List<Quiz> findByCourseIdAndStatusOrderByIdAsc(Long courseId, QuizStatus status);
}