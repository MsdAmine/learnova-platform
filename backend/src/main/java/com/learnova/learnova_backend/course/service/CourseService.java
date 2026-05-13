package com.learnova.learnova_backend.course.service;

import com.learnova.learnova_backend.course.dto.CourseRequest;
import com.learnova.learnova_backend.course.dto.CourseResponse;
import com.learnova.learnova_backend.course.dto.CourseUpdateRequest;
import com.learnova.learnova_backend.course.entity.Course;
import com.learnova.learnova_backend.course.entity.CourseStatus;
import com.learnova.learnova_backend.course.entity.Section;
import com.learnova.learnova_backend.course.repository.CategoryRepository;
import com.learnova.learnova_backend.course.repository.CourseRepository;
import com.learnova.learnova_backend.course.repository.SectionRepository;
import com.learnova.learnova_backend.profile.entity.InstructorApprovalStatus;
import com.learnova.learnova_backend.profile.entity.InstructorProfile;
import com.learnova.learnova_backend.profile.repository.InstructorProfileRepository;
import com.learnova.learnova_backend.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CourseService {

        private final CourseRepository courseRepository;
        private final CategoryRepository categoryRepository;
        private final InstructorProfileRepository instructorProfileRepository;
        private final SectionRepository sectionRepository;

        @Transactional
        public CourseResponse createCourse(CustomUserDetails currentUser, CourseRequest request) {
                InstructorProfile instructorProfile = getInstructorProfile(currentUser.getId());

                if (instructorProfile.getApprovalStatus() != InstructorApprovalStatus.APPROVED) {
                        throw new ResponseStatusException(
                                        HttpStatus.FORBIDDEN,
                                        "Your instructor profile is not approved yet");
                }

                if (courseRepository.existsByTitleIgnoreCaseAndInstructorProfileId(
                                request.title().trim(), instructorProfile.getId())) {
                        throw new ResponseStatusException(
                                        HttpStatus.CONFLICT,
                                        "You already have a course with this title");
                }

                var category = categoryRepository.findById(request.categoryId())
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.NOT_FOUND,
                                                "Category not found"));

                Course course = Course.builder()
                                .instructorProfile(instructorProfile)
                                .category(category)
                                .title(request.title().trim())
                                .description(request.description() != null ? request.description().trim() : null)
                                .level(request.level())
                                .thumbnailUrl(request.thumbnailUrl() != null ? request.thumbnailUrl().trim() : null)
                                .status(CourseStatus.DRAFT)
                                .build();

                return toResponse(courseRepository.save(course));
        }

        @Transactional
        public CourseResponse updateCourse(Long courseId, CustomUserDetails currentUser, CourseUpdateRequest request) {
                Course course = findCourseById(courseId);
                validateCourseOwnership(course, currentUser);

                var category = categoryRepository.findById(request.categoryId())
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.NOT_FOUND,
                                                "Category not found"));

                course.setTitle(request.title().trim());
                course.setDescription(request.description() != null ? request.description().trim() : null);
                course.setCategory(category);
                course.setLevel(request.level());
                course.setThumbnailUrl(request.thumbnailUrl() != null ? request.thumbnailUrl().trim() : null);

                return toResponse(courseRepository.save(course));
        }

        @Transactional
        public CourseResponse publishCourse(Long courseId, CustomUserDetails currentUser) {
                Course course = findCourseById(courseId);
                validateCourseOwnership(course, currentUser);

                // Ensure instructor is still approved
                if (course.getInstructorProfile().getApprovalStatus() != InstructorApprovalStatus.APPROVED) {
                        throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                                        "Instructor must be approved to publish courses");
                }

                // Validate Minimum Publishing Requirements
                if (course.getDescription() == null || course.getDescription().isBlank()) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                                        "Course must have a description before publishing");
                }

                List<Section> sections = sectionRepository.findByCourseId(courseId);
                if (sections.isEmpty()) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                                        "Course must have at least one section before publishing");
                }

                boolean hasLessons = sections.stream()
                                .anyMatch(s -> s.getLessons() != null && !s.getLessons().isEmpty());

                if (!hasLessons) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                                        "Course must have at least one lesson before publishing");
                }

                course.setStatus(CourseStatus.PUBLISHED);
                return toResponse(courseRepository.save(course));
        }

        private Course findCourseById(Long courseId) {
                return courseRepository.findById(courseId)
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.NOT_FOUND,
                                                "Course not found"));
        }

        private void validateCourseOwnership(Course course, CustomUserDetails currentUser) {
                if (!course.getInstructorProfile().getUser().getId().equals(currentUser.getId())) {
                        throw new ResponseStatusException(
                                        HttpStatus.FORBIDDEN,
                                        "You do not have permission to modify this course");
                }
        }

        private InstructorProfile getInstructorProfile(Long userId) {
                return instructorProfileRepository.findByUserId(userId)
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.FORBIDDEN,
                                                "Instructor profile not found"));
        }

        public CourseResponse toResponse(Course course) {
                return new CourseResponse(
                                course.getId(),
                                course.getTitle(),
                                course.getDescription(),
                                course.getLevel(),
                                course.getStatus(),
                                course.getThumbnailUrl(),
                                course.getCategory().getId(),
                                course.getCategory().getName(),
                                course.getInstructorProfile().getId(),
                                course.getInstructorProfile().getUser().getFullName(),
                                course.getCreatedAt(),
                                course.getUpdatedAt());
        }
}