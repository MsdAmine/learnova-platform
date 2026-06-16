package com.learnova.learnova_backend.course.repository;

import com.learnova.learnova_backend.course.entity.Quiz;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuizRepository extends JpaRepository<Quiz, Long> {

    // Récupérer tous les quiz associés à un cours spécifique
    List<Quiz> findByCourseId(Long courseId);

    // Récupérer tous les quiz d'un cours, triés par id croissant (ordre de création stable)
    List<Quiz> findByCourseIdOrderByIdAsc(Long courseId);

    // Récupérer tous les quiz associés à une section spécifique
    List<Quiz> findBySectionId(Long sectionId);
}