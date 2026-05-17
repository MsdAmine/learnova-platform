package com.learnova.learnova_backend.course.repository.specification;

import com.learnova.learnova_backend.course.dto.CourseSearchCriteria;
import com.learnova.learnova_backend.course.entity.Course;
import com.learnova.learnova_backend.course.entity.CourseLevel;
import com.learnova.learnova_backend.course.entity.CourseStatus;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import java.util.ArrayList;
import java.util.List;

public class CourseSpecification {

    public static Specification<Course> filterPublishedCourses(CourseSearchCriteria criteria) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Rule 1: FIXED SECURITY CONSTRAINT - Compare direct Enum constants instead of
            // raw strings
            predicates.add(criteriaBuilder.equal(root.get("status"), CourseStatus.PUBLISHED));

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

            // Filter 4: FIXED Course Level Filter - Safely convert incoming String to
            // CourseLevel Enum
            if (criteria.getLevel() != null && !criteria.getLevel().isBlank()) {
                try {
                    CourseLevel targetLevel = CourseLevel.valueOf(criteria.getLevel().toUpperCase());
                    predicates.add(criteriaBuilder.equal(root.get("level"), targetLevel));
                } catch (IllegalArgumentException e) {
                    // Fail-safe: Skip filtering if an invalid level string is passed by the client
                }
            }

            // Filter 5: Instructor Name Match (Traverses Course -> InstructorProfile ->
            // User)
            if (criteria.getInstructorName() != null && !criteria.getInstructorName().isBlank()) {
                String pattern = "%" + criteria.getInstructorName().toLowerCase() + "%";
                predicates.add(criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("instructorProfile").get("user").get("fullName")), pattern));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}