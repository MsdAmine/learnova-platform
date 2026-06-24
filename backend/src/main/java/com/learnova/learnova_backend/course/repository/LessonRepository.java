package com.learnova.learnova_backend.course.repository;

import com.learnova.learnova_backend.course.entity.Lesson;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface LessonRepository extends JpaRepository<Lesson, Long> {
    // Compte le nombre total de leçons actives dans un cours donné
    @Query("SELECT COUNT(l) FROM Lesson l WHERE l.section.course.id = :courseId")
    int countTotalLessonsByCourseId(@Param("courseId") Long courseId);

    List<Lesson> findBySectionIdOrderByIdAsc(Long sectionId);

    // Ordered by section then lesson id, so callers can group by section without N+1 queries.
    @Query("SELECT l FROM Lesson l WHERE l.section.course.id = :courseId ORDER BY l.section.id ASC, l.id ASC")
    List<Lesson> findByCourseIdOrderBySectionIdAscIdAsc(@Param("courseId") Long courseId);

    // Bulk JPQL delete: call only after LessonProgress records are removed.
    // No clearAutomatically — the session retains stale entries but subsequent
    // collection queries still hit DB and return correct post-delete results.
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("DELETE FROM Lesson l WHERE l.section.id = :sectionId")
    void deleteBySectionId(@org.springframework.data.repository.query.Param("sectionId") Long sectionId);
}
