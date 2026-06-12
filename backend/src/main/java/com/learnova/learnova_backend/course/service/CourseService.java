package com.learnova.learnova_backend.course.service;

import com.learnova.learnova_backend.course.dto.CourseCatalogResponse;
import com.learnova.learnova_backend.course.dto.CourseRequest;
import com.learnova.learnova_backend.course.dto.CourseResponse;
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
import com.learnova.learnova_backend.course.dto.CourseUpdateRequest;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CourseService {

    private final CourseRepository courseRepository;
    private final CategoryRepository categoryRepository;
    private final InstructorProfileRepository instructorProfileRepository;

    @Transactional
    public CourseResponse createCourse(CustomUserDetails currentUser, CourseRequest request) {
        InstructorProfile instructorProfile = instructorProfileRepository
                .findByUserId(currentUser.getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "Instructor profile not found"
                ));

        if (instructorProfile.getApprovalStatus() != InstructorApprovalStatus.APPROVED) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Your instructor profile is not approved yet"
            );
        }

        var category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Category not found"
                ));

        if (courseRepository.existsByTitleIgnoreCaseAndInstructorProfileId(
                request.title().trim(), instructorProfile.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "You already have a course with this title"
            );
        }

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

    /**
     * Public catalog listing: only {@link CourseStatus#PUBLISHED} courses are visible.
     * Drafts and archived courses are never exposed through this read path.
     */
    @Transactional(readOnly = true)
    public List<CourseCatalogResponse> listPublishedCourses() {
        return courseRepository.findByStatus(CourseStatus.PUBLISHED)
                .stream()
                .map(this::toCatalogResponse)
                .toList();
    }

    /**
     * Public catalog detail. A non-existent course and a non-published course are
     * indistinguishable to the public: both yield 404, so drafts cannot be probed by id.
     */
    @Transactional(readOnly = true)
    public CourseCatalogResponse getPublishedCourse(Long courseId) {
        Course course = courseRepository.findById(courseId)
                .filter(c -> c.getStatus() == CourseStatus.PUBLISHED)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Course not found"
                ));
        return toCatalogResponse(course);
    }

    private CourseCatalogResponse toCatalogResponse(Course course) {
        return new CourseCatalogResponse(
                course.getId(),
                course.getTitle(),
                course.getDescription(),
                course.getLevel(),
                course.getStatus(),
                course.getThumbnailUrl(),
                course.getCategory().getName(),
                course.getInstructorProfile().getUser().getFullName(),
                course.getCreatedAt()
        );
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
                course.getUpdatedAt()
        );
    }

    @Transactional
    public CourseResponse updateCourse(
            CustomUserDetails currentUser,
            Long courseId,
            CourseUpdateRequest request
    ) {
        InstructorProfile instructorProfile = instructorProfileRepository
                .findByUserId(currentUser.getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "Instructor profile not found"
                ));

        if (instructorProfile.getApprovalStatus() != InstructorApprovalStatus.APPROVED) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Your instructor profile is not approved yet"
            );
        }

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Course not found"
                ));

        if (!course.getInstructorProfile().getId().equals(instructorProfile.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You are not the owner of this course"
            );
        }

        if (course.getStatus() == CourseStatus.ARCHIVED) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Archived courses cannot be updated"
            );
        }

        if (request.title() != null && !request.title().isBlank()) {
            String newTitle = request.title().trim();
            if (!newTitle.equalsIgnoreCase(course.getTitle()) &&
                    courseRepository.existsByTitleIgnoreCaseAndInstructorProfileId(
                            newTitle, instructorProfile.getId())) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "You already have a course with this title"
                );
            }
            course.setTitle(newTitle);
        }

        if (request.description() != null) {
            course.setDescription(request.description().trim());
        }

        if (request.level() != null) {
            course.setLevel(request.level());
        }

        if (request.thumbnailUrl() != null) {
            course.setThumbnailUrl(request.thumbnailUrl().trim());
        }

        if (request.categoryId() != null) {
            var category = categoryRepository.findById(request.categoryId())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND,
                            "Category not found"
                    ));
            course.setCategory(category);
        }

        return toResponse(courseRepository.save(course));
    }
}