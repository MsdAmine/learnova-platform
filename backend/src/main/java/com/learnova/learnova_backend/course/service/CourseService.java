package com.learnova.learnova_backend.course.service;

import com.learnova.learnova_backend.course.dto.CourseRequest;
import com.learnova.learnova_backend.course.dto.CourseResponse;
import com.learnova.learnova_backend.course.dto.CourseUpdateRequest;
import com.learnova.learnova_backend.course.entity.Course;
import com.learnova.learnova_backend.course.entity.CourseStatus;
import com.learnova.learnova_backend.course.repository.CategoryRepository;
import com.learnova.learnova_backend.course.repository.CourseRepository;
import com.learnova.learnova_backend.profile.entity.InstructorApprovalStatus;
import com.learnova.learnova_backend.profile.entity.InstructorProfile;
import com.learnova.learnova_backend.profile.repository.InstructorProfileRepository;
import com.learnova.learnova_backend.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class CourseService {

        private final CourseRepository courseRepository;
        private final CategoryRepository categoryRepository;
        private final InstructorProfileRepository instructorProfileRepository;

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
                // 1. Fetch course or 404
                Course course = courseRepository.findById(courseId)
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.NOT_FOUND,
                                                "Course not found"));

                // 2. Validate Ownership (Ensure the instructor owns this course)
                if (!course.getInstructorProfile().getUser().getId().equals(currentUser.getId())) {
                        throw new ResponseStatusException(
                                        HttpStatus.FORBIDDEN,
                                        "You do not have permission to update this course");
                }

                // 3. Fetch Category or 404
                var category = categoryRepository.findById(request.categoryId())
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.NOT_FOUND,
                                                "Category not found"));

                // 4. Update fields
                course.setTitle(request.title().trim());
                course.setDescription(request.description() != null ? request.description().trim() : null);
                course.setCategory(category);
                course.setLevel(request.level());
                course.setThumbnailUrl(request.thumbnailUrl() != null ? request.thumbnailUrl().trim() : null);

                return toResponse(courseRepository.save(course));
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