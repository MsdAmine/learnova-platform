package com.learnova.learnova_backend.course.service;

import com.learnova.learnova_backend.course.dto.*;
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
import com.learnova.learnova_backend.file.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CourseService {

        private final CourseRepository courseRepository;
        private final CategoryRepository categoryRepository;
        private final InstructorProfileRepository instructorProfileRepository;
        private final SectionRepository sectionRepository;
        private final FileStorageService fileStorageService;

        public Course validateAndGetCourseOwnership(Long courseId, Long userId) {
                Course course = courseRepository.findById(courseId)
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                                                "Course not found"));

                if (!course.getInstructorProfile().getUser().getId().equals(userId)) {
                        throw new ResponseStatusException(
                                        HttpStatus.FORBIDDEN,
                                        "Access Denied: You do not own this course");
                }
                return course;
        }

        @Transactional(readOnly = true)
        public Page<CourseResponse> getInstructorCourses(CustomUserDetails currentUser, Pageable pageable) {
                InstructorProfile instructor = getInstructorProfile(currentUser.getId());
                return courseRepository.findByInstructorProfileId(instructor.getId(), pageable)
                                .map(this::toResponse);
        }

        @Transactional(readOnly = true)
        public CourseResponse getInstructorCourse(Long courseId, CustomUserDetails currentUser) {
                Course course = validateAndGetCourseOwnership(courseId, currentUser.getId());
                return toResponse(course);
        }

        // --- NEW PUBLIC BROWSING METHODS ---

        @Transactional(readOnly = true)
        public Page<CourseResponse> getPublicCourses(Pageable pageable) {
                return courseRepository.findByStatus(CourseStatus.PUBLISHED, pageable)
                                .map(this::toResponse);
        }

        @Transactional(readOnly = true)
        public PublicCourseDetailResponse getPublicCourseDetail(Long courseId) {
                Course course = courseRepository.findByIdAndStatus(courseId, CourseStatus.PUBLISHED)
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                                                "Course not found or is not available publicly"));

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

                List<PublicSectionDTO> publicSections = course.getSections().stream()
                                .map(section -> {
                                        List<PublicLessonDTO> publicLessons = section.getLessons().stream()
                                                        .map(lesson -> PublicLessonDTO.builder()
                                                                        .id(lesson.getId())
                                                                        .title(lesson.getTitle())
                                                                        .contentType(lesson.getContentType() != null ? lesson.getContentType().toString() : "TEXT")
                                                                        .position(lesson.getPosition())
                                                                        .build())
                                                        .sorted(java.util.Comparator.comparing(PublicLessonDTO::getPosition, java.util.Comparator.nullsLast(java.util.Comparator.naturalOrder())))
                                                        .collect(Collectors.toList());

                                        return PublicSectionDTO.builder()
                                                        .id(section.getId())
                                                        .title(section.getTitle())
                                                        .position(section.getPosition())
                                                        .lessons(publicLessons)
                                                        .build();
                                })
                                .sorted(java.util.Comparator.comparing(PublicSectionDTO::getPosition, java.util.Comparator.nullsLast(java.util.Comparator.naturalOrder())))
                                .collect(Collectors.toList());

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

        // --- EXISTING MUTATION METHODS ---

        @Transactional
        public CourseResponse createCourse(CustomUserDetails currentUser, CourseRequest request) {
                InstructorProfile instructorProfile = getInstructorProfile(currentUser.getId());

                if (instructorProfile.getApprovalStatus() != InstructorApprovalStatus.APPROVED) {
                        throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                                        "Your instructor profile is not approved yet");
                }

                if (courseRepository.existsByTitleIgnoreCaseAndInstructorProfileId(request.title().trim(),
                                instructorProfile.getId())) {
                        throw new ResponseStatusException(HttpStatus.CONFLICT,
                                        "You already have a course with this title");
                }

                var category = categoryRepository.findById(request.categoryId())
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
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
                Course course = validateAndGetCourseOwnership(courseId, currentUser.getId());

                var category = categoryRepository.findById(request.categoryId())
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
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
                Course course = validateAndGetCourseOwnership(courseId, currentUser.getId());

                if (course.getInstructorProfile().getApprovalStatus() != InstructorApprovalStatus.APPROVED) {
                        throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                                        "Instructor must be approved to publish courses");
                }

                validatePublishingRequirements(course);

                course.setStatus(CourseStatus.PUBLISHED);
                return toResponse(courseRepository.save(course));
        }

        @Transactional
        public CourseResponse archiveCourse(Long courseId, CustomUserDetails currentUser) {
                Course course = validateAndGetCourseOwnership(courseId, currentUser.getId());
                course.setStatus(CourseStatus.ARCHIVED);
                return toResponse(courseRepository.save(course));
        }

        @Transactional
        public String uploadThumbnail(Long courseId, CustomUserDetails currentUser, MultipartFile file) {
                Course course = validateAndGetCourseOwnership(courseId, currentUser.getId());

                if (course.getThumbnailUrl() != null) {
                        fileStorageService.deleteFile(course.getThumbnailUrl());
                }

                String filePath = fileStorageService.storeFile(file, "courses/" + courseId + "/thumbnail");
                course.setThumbnailUrl(filePath);
                courseRepository.save(course);
                return filePath;
        }

        @Transactional
        public CourseResponse deactivateCourse(Long courseId) {
                Course course = courseRepository.findById(courseId)
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                                                "Course not found"));
                course.setStatus(CourseStatus.DEACTIVATED);
                return toResponse(courseRepository.save(course));
        }

        private void validatePublishingRequirements(Course course) {
                if (course.getDescription() == null || course.getDescription().isBlank()) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Course must have a description");
                }

                List<Section> sections = sectionRepository.findByCourseId(course.getId());
                if (sections.isEmpty()) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                                        "Course must have at least one section");
                }

                boolean hasLessons = sections.stream()
                                .anyMatch(s -> s.getLessons() != null && !s.getLessons().isEmpty());

                if (!hasLessons) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                                        "Course must have at least one lesson");
                }
        }

        private InstructorProfile getInstructorProfile(Long userId) {
                return instructorProfileRepository.findByUserId(userId)
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN,
                                                "Instructor profile not found"));
        }

        public CourseResponse toResponse(Course course) {
                long sectionCount = course.getSections() != null ? course.getSections().size() : 0;
                long lessonCount = course.getSections() != null ? course.getSections().stream()
                                .filter(section -> section.getLessons() != null)
                                .mapToLong(section -> section.getLessons().size())
                                .sum() : 0;

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
                                sectionCount,
                                lessonCount,
                                course.getCreatedAt(),
                                course.getUpdatedAt());
        }
}