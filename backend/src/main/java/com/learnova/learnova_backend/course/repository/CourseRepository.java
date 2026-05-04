package com.learnova.learnova_backend.course.repository;

import com.learnova.learnova_backend.course.entity.Course;
import com.learnova.learnova_backend.course.entity.CourseStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CourseRepository extends JpaRepository<Course, Long> {

    List<Course> findByInstructorProfileId(Long instructorProfileId);

    List<Course> findByStatus(CourseStatus status);

    List<Course> findByCategoryId(Long categoryId);

    boolean existsByTitleIgnoreCaseAndInstructorProfileId(String title, Long instructorProfileId);
}