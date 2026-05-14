package com.learnova.learnova_backend.course.repository;

import com.learnova.learnova_backend.course.entity.Section;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SectionRepository extends JpaRepository<Section, Long> {
    List<Section> findByCourseId(Long courseId);

    long countByCourseId(Long courseId);

    List<Section> findByCourseIdOrderByPositionAsc(Long courseId);
}