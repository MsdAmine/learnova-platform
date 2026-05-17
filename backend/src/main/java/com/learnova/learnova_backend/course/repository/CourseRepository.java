package com.learnova.learnova_backend.course.repository;

import com.learnova.learnova_backend.course.entity.Course;
import com.learnova.learnova_backend.course.entity.CourseStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;

public interface CourseRepository extends JpaRepository<Course, Long>, JpaSpecificationExecutor<Course> {
    Page<Course> findByInstructorProfileId(Long instructorProfileId, Pageable pageable);

    // For Public Listing
    Page<Course> findByStatus(CourseStatus status, Pageable pageable);

    // For Public Detailed View validation
    Optional<Course> findByIdAndStatus(Long id, CourseStatus status);

    List<Course> findByCategoryId(Long categoryId);

    boolean existsByTitleIgnoreCaseAndInstructorProfileId(String title, Long instructorProfileId);
}