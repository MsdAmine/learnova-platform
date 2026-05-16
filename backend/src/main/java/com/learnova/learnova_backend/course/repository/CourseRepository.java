package com.learnova.learnova_backend.course.repository;

import com.learnova.learnova_backend.course.entity.Course;
import com.learnova.learnova_backend.course.entity.CourseStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.domain.Page;

import java.util.List;

public interface CourseRepository extends JpaRepository<Course, Long> {

    Page<Course> findByInstructorProfileId(Long instructorProfileId, Pageable pageable);

    List<Course> findByStatus(CourseStatus status);

    List<Course> findByCategoryId(Long categoryId);

    boolean existsByTitleIgnoreCaseAndInstructorProfileId(String title, Long instructorProfileId);
}