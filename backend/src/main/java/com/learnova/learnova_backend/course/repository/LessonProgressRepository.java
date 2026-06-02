package com.learnova.learnova_backend.course.repository;

import com.learnova.learnova_backend.course.entity.LessonProgress;
import com.learnova.learnova_backend.course.entity.Lesson;
import com.learnova.learnova_backend.profile.entity.LearnerProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LessonProgressRepository extends JpaRepository<LessonProgress, Long> {

    // Récupérer la progression pour un apprenant et une leçon spécifique
    Optional<LessonProgress> findByLearnerProfileAndLesson(LearnerProfile learnerProfile, Lesson lesson);

    // Vérifier si un enregistrement de progression existe déjà
    boolean existsByLearnerProfileAndLesson(LearnerProfile learnerProfile, Lesson lesson);

    // Compte le nombre de leçons validées par un apprenant pour un cours spécifique
    @Query("SELECT COUNT(lp) FROM LessonProgress lp " +
            "WHERE lp.learnerProfile = :learnerProfile " +
            "AND lp.lesson.section.course.id = :courseId " +
            "AND lp.isCompleted = true")
    int countCompletedLessonsByLearnerAndCourse(@Param("learnerProfile") LearnerProfile learnerProfile,
            @Param("courseId") Long courseId);

}