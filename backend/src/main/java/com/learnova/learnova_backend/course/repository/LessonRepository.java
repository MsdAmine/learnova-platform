package com.learnova.learnova_backend.course.repository;

import com.learnova.learnova_backend.course.entity.Lesson;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface LessonRepository extends JpaRepository<Lesson, Long> {
    // Compte le nombre total de leçons actives dans un cours donné
    @Query("SELECT COUNT(l) FROM Lesson l WHERE l.section.course.id = :courseId")
    int countTotalLessonsByCourseId(@Param("courseId") Long courseId);
}
