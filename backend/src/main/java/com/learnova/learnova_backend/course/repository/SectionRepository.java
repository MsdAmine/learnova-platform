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
}