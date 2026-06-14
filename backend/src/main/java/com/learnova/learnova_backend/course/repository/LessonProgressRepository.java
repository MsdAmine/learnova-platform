package com.learnova.learnova_backend.course.repository;

import com.learnova.learnova_backend.course.entity.LessonProgress;
import com.learnova.learnova_backend.course.entity.Lesson;
import com.learnova.learnova_backend.profile.entity.LearnerProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface LessonProgressRepository extends JpaRepository<LessonProgress, Long> {

    // Récupérer la progression pour un apprenant et une leçon spécifique
    Optional<LessonProgress> findByLearnerProfileAndLesson(LearnerProfile learnerProfile, Lesson lesson);

    // Vérifier si un enregistrement de progression existe déjà
    boolean existsByLearnerProfileAndLesson(LearnerProfile learnerProfile, Lesson lesson);

    // Récupère toutes les progressions d'un apprenant pour un cours en un seul aller-retour (évite N+1)
    @Query("SELECT lp FROM LessonProgress lp WHERE lp.learnerProfile.id = :learnerProfileId AND lp.lesson.section.course.id = :courseId")
    List<LessonProgress> findAllByLearnerProfileIdAndCourseId(
            @Param("learnerProfileId") Long learnerProfileId,
            @Param("courseId") Long courseId);

    // Compte le nombre de leçons validées par un apprenant pour un cours spécifique
    @Query("SELECT COUNT(lp) FROM LessonProgress lp " +
            "WHERE lp.learnerProfile = :learnerProfile " +
            "AND lp.lesson.section.course.id = :courseId " +
            "AND lp.isCompleted = true")
    int countCompletedLessonsByLearnerAndCourse(@Param("learnerProfile") LearnerProfile learnerProfile,
            @Param("courseId") Long courseId);

    // Direct JPQL deletes used before lesson/section removal to satisfy FK constraints
    // without touching the Hibernate session state (no clearAutomatically).
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("DELETE FROM LessonProgress lp WHERE lp.lesson.id = :lessonId")
    void deleteByLessonId(@org.springframework.data.repository.query.Param("lessonId") Long lessonId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("DELETE FROM LessonProgress lp WHERE lp.lesson.section.id = :sectionId")
    void deleteBySectionId(@org.springframework.data.repository.query.Param("sectionId") Long sectionId);

    void deleteByLessonIdIn(Collection<Long> lessonIds);

}