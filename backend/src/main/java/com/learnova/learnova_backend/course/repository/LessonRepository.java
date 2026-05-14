package com.learnova.learnova_backend.course.repository;

import com.learnova.learnova_backend.course.entity.Lesson;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface LessonRepository extends JpaRepository<Lesson, Long> {
    List<Lesson> findBySectionIdOrderByPositionAsc(Long sectionId);
}