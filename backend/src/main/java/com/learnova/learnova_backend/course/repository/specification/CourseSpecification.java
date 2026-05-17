package com.learnova.learnova_backend.course.repository.specification;

import com.learnova.learnova_backend.course.dto.CourseSearchCriteria;
import com.learnova.learnova_backend.course.entity.Course;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import java.util.ArrayList;
import java.util.List;

public class CourseSpecification {

    public static Specification<Course> filterPublishedCourses(CourseSearchCriteria criteria) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Rule 1: CRITICAL SECURITY CONSTRAINT - Force output to ONLY include PUBLISHED
            // courses
            // Assuming your enum or field name is 'status' (e.g., CourseStatus.PUBLISHED or
            // String "PUBLISHED")
            // Adjust the field name below if your course entity uses something like
            // 'courseStatus' or a string.
            predicates.add(criteriaBuilder.equal(root.get("status"), "PUBLISHED"));

            // Filter 2: Keyword search across Title and Description
            if (criteria.getKeyword() != null && !criteria.getKeyword().isBlank()) {
                String pattern = "%" + criteria.getKeyword().toLowerCase() + "%";
                Predicate titleMatch = criteriaBuilder.like(criteriaBuilder.lower(root.get("title")), pattern);
                Predicate descriptionMatch = criteriaBuilder.like(criteriaBuilder.lower(root.get("description")),
                        pattern);
                predicates.add(criteriaBuilder.or(titleMatch, descriptionMatch));
            }

            // Filter 3: Exact Category ID Match
            if (criteria.getCategoryId() != null) {
                predicates.add(criteriaBuilder.equal(root.get("category").get("id"), criteria.getCategoryId()));
            }

            // Filter 4: Course Level Filter
            if (criteria.getLevel() != null && !criteria.getLevel().isBlank()) {
                predicates.add(criteriaBuilder.equal(root.get("level"), criteria.getLevel()));
            }

            // Filter 5: Instructor Name Match (Traverses the User relationship)
            if (criteria.getInstructorName() != null && !criteria.getInstructorName().isBlank()) {
                String pattern = "%" + criteria.getInstructorName().toLowerCase() + "%";
                predicates.add(criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("instructorProfile").get("user").get("fullName")), pattern));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}