package com.learnova.learnova_backend.course.repository;

import com.learnova.learnova_backend.course.entity.Section;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SectionRepository extends JpaRepository<Section, Long> {

    // Permet de récupérer toutes les sections ordonnées d'un cours spécifique si
    // besoin
    List<Section> findByCourseId(Long courseId);

    List<Section> findByCourseIdOrderByIdAsc(Long courseId);

    // Direct JPQL delete bypasses Section.lessons orphanRemoval cascade,
    // avoiding the TransientObjectException when lesson entities are in session.
    // Call only after lessons (and their progress records) have been removed.
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("DELETE FROM Section s WHERE s.id = :id")
    void deleteByIdDirect(@org.springframework.data.repository.query.Param("id") Long id);
}