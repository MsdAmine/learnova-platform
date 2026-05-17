package com.learnova.learnova_backend.course.service;

import com.learnova.learnova_backend.course.dto.CourseSearchCriteria;
import com.learnova.learnova_backend.course.dto.CourseSummaryResponse;
import com.learnova.learnova_backend.course.dto.PublicCourseDetailResponse;
import com.learnova.learnova_backend.course.dto.PublicSectionDTO;
import com.learnova.learnova_backend.course.dto.PublicLessonDTO;
import com.learnova.learnova_backend.course.entity.Course;
import com.learnova.learnova_backend.course.entity.CourseStatus;
import com.learnova.learnova_backend.course.repository.CourseRepository;
import com.learnova.learnova_backend.course.repository.specification.CourseSpecification;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PublicCourseService {

    private final CourseRepository courseRepository;

    @Transactional(readOnly = true)
    public Page<CourseSummaryResponse> searchPublishedCourses(CourseSearchCriteria criteria, int page, int size) {

        // Handle sorting parameters dynamically - matching your Instant 'createdAt'
        // property
        Sort sort = Sort.by(Sort.Direction.DESC, "createdAt");

        if (criteria.getSortBy() != null) {
            switch (criteria.getSortBy().toLowerCase()) {
                case "title" -> sort = Sort.by(Sort.Direction.ASC, "title");
                case "popular" -> sort = Sort.by(Sort.Direction.DESC, "id"); // Metric placeholder binding
                case "newest" -> sort = Sort.by(Sort.Direction.DESC, "createdAt");
            }
        }

        Pageable pageable = PageRequest.of(page, size, sort);
        Specification<Course> spec = CourseSpecification.filterPublishedCourses(criteria);

        Page<Course> coursePage = courseRepository.findAll(spec, pageable);

        // Map database records cleanly into our concise Summary DTOs
        return coursePage.map(course -> {
            // Safe traversal down the InstructorProfile relation chain to find the name
            String finalInstructorName = "Unknown Instructor";
            if (course.getInstructorProfile() != null && course.getInstructorProfile().getUser() != null) {
                finalInstructorName = course.getInstructorProfile().getUser().getFullName();
            }

            return CourseSummaryResponse.builder()
                    .id(course.getId())
                    .title(course.getTitle())
                    .description(course.getDescription())
                    .categoryName(course.getCategory() != null ? course.getCategory().getName() : "Uncategorized")
                    .level(course.getLevel() != null ? course.getLevel().toString() : "ALL_LEVELS")
                    .thumbnailUrl(course.getThumbnailUrl())
                    .instructorName(finalInstructorName) // Reconciled real schema resolution
                    .ratingPlaceholder(4.5)
                    .enrollmentCountPlaceholder(120)
                    .build();
        });
    }

    @Transactional(readOnly = true)
    public PublicCourseDetailResponse getPublishedCourseDetails(Long id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));

        // Critical Security Guard: Throw FORBIDDEN or NOT_FOUND if the course is not PUBLISHED
        if (course.getStatus() != CourseStatus.PUBLISHED) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: Course is not published");
        }

        // Safe instructor profile extraction
        String instructorName = "Unknown Instructor";
        String instructorBio = "No biography provided.";
        if (course.getInstructorProfile() != null) {
            if (course.getInstructorProfile().getUser() != null) {
                instructorName = course.getInstructorProfile().getUser().getFullName();
            }
            if (course.getInstructorProfile().getBio() != null) {
                instructorBio = course.getInstructorProfile().getBio();
            }
        }

        String categoryName = course.getCategory() != null ? course.getCategory().getName() : "Uncategorized";

        // Map sections and lessons, protecting secret fields (contentUrl, textContent are omitted since they are not in the DTOs)
        List<PublicSectionDTO> publicSections = course.getSections().stream()
                .map(section -> {
                    List<PublicLessonDTO> publicLessons = section.getLessons().stream()
                            .map(lesson -> PublicLessonDTO.builder()
                                    .id(lesson.getId())
                                    .title(lesson.getTitle())
                                    .contentType(lesson.getContentType() != null ? lesson.getContentType().toString() : "TEXT")
                                    .position(lesson.getPosition())
                                    .build())
                            .sorted(Comparator.comparing(PublicLessonDTO::getPosition, Comparator.nullsLast(Comparator.naturalOrder())))
                            .toList();

                    return PublicSectionDTO.builder()
                            .id(section.getId())
                            .title(section.getTitle())
                            .position(section.getPosition())
                            .lessons(publicLessons)
                            .build();
                })
                .sorted(Comparator.comparing(PublicSectionDTO::getPosition, Comparator.nullsLast(Comparator.naturalOrder())))
                .toList();

        int totalSections = publicSections.size();
        int totalLessons = publicSections.stream()
                .mapToInt(s -> s.getLessons().size())
                .sum();

        return PublicCourseDetailResponse.builder()
                .id(course.getId())
                .title(course.getTitle())
                .description(course.getDescription())
                .categoryName(categoryName)
                .level(course.getLevel() != null ? course.getLevel().toString() : "ALL_LEVELS")
                .thumbnailUrl(course.getThumbnailUrl())
                .status(course.getStatus() != null ? course.getStatus().toString() : "PUBLISHED")
                .instructorName(instructorName)
                .instructorBioPlaceholder(instructorBio)
                .totalSections(totalSections)
                .totalLessons(totalLessons)
                .sections(publicSections)
                .build();
    }
}