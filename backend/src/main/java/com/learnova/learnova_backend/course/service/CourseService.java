package com.learnova.learnova_backend.course.service;

import com.learnova.learnova_backend.course.dto.CourseRequest;
import com.learnova.learnova_backend.course.dto.CourseResponse;
import com.learnova.learnova_backend.course.dto.CourseUpdateRequest;
import com.learnova.learnova_backend.course.dto.LessonProgressUpdateRequest;
import com.learnova.learnova_backend.course.dto.LessonProgressResponse;
import com.learnova.learnova_backend.course.entity.Course;
import com.learnova.learnova_backend.course.entity.CourseStatus;
import com.learnova.learnova_backend.course.entity.Lesson;
import com.learnova.learnova_backend.course.entity.LessonProgress;
import com.learnova.learnova_backend.course.repository.CategoryRepository;
import com.learnova.learnova_backend.course.repository.CourseRepository;
import com.learnova.learnova_backend.course.repository.LessonRepository;
import com.learnova.learnova_backend.course.repository.LessonProgressRepository;
import com.learnova.learnova_backend.profile.entity.InstructorApprovalStatus;
import com.learnova.learnova_backend.profile.entity.InstructorProfile;
import com.learnova.learnova_backend.profile.entity.LearnerProfile;
import com.learnova.learnova_backend.profile.repository.InstructorProfileRepository;
import com.learnova.learnova_backend.profile.repository.LearnerProfileRepository;
import com.learnova.learnova_backend.user.entity.User;
import com.learnova.learnova_backend.user.repository.UserRepository;
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

        // Nouvelles dépendances requises pour l'Issue #58
        private final LessonRepository lessonRepository;
        private final UserRepository userRepository;
        private final LearnerProfileRepository learnerProfileRepository;
        private final LessonProgressRepository lessonProgressRepository;
        private final CourseAccessService courseAccessService;

        @Transactional
        public CourseResponse createCourse(CustomUserDetails currentUser, CourseRequest request) {
                InstructorProfile instructorProfile = instructorProfileRepository
                                .findByUserId(currentUser.getId())
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.FORBIDDEN,
                                                "Instructor profile not found"));

                if (instructorProfile.getApprovalStatus() != InstructorApprovalStatus.APPROVED) {
                        throw new ResponseStatusException(
                                        HttpStatus.FORBIDDEN,
                                        "Your instructor profile is not approved yet");
                }

                var category = categoryRepository.findById(request.categoryId())
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.NOT_FOUND,
                                                "Category not found"));

                if (courseRepository.existsByTitleIgnoreCaseAndInstructorProfileId(
                                request.title().trim(), instructorProfile.getId())) {
                        throw new ResponseStatusException(
                                        HttpStatus.CONFLICT,
                                        "You already have a course with this title");
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

        @Transactional
        public CourseResponse updateCourse(
                        CustomUserDetails currentUser,
                        Long courseId,
                        CourseUpdateRequest request) {
                InstructorProfile instructorProfile = instructorProfileRepository
                                .findByUserId(currentUser.getId())
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.FORBIDDEN,
                                                "Instructor profile not found"));

                if (instructorProfile.getApprovalStatus() != InstructorApprovalStatus.APPROVED) {
                        throw new ResponseStatusException(
                                        HttpStatus.FORBIDDEN,
                                        "Your instructor profile is not approved yet");
                }

                Course course = courseRepository.findById(courseId)
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.NOT_FOUND,
                                                "Course not found"));

                if (!course.getInstructorProfile().getId().equals(instructorProfile.getId())) {
                        throw new ResponseStatusException(
                                        HttpStatus.FORBIDDEN,
                                        "You are not the owner of this course");
                }

                if (course.getStatus() == CourseStatus.ARCHIVED) {
                        throw new ResponseStatusException(
                                        HttpStatus.CONFLICT,
                                        "Archived courses cannot be updated");
                }

                if (request.title() != null && !request.title().isBlank()) {
                        String newTitle = request.title().trim();
                        if (!newTitle.equalsIgnoreCase(course.getTitle()) &&
                                        courseRepository.existsByTitleIgnoreCaseAndInstructorProfileId(
                                                        newTitle, instructorProfile.getId())) {
                                throw new ResponseStatusException(
                                                HttpStatus.CONFLICT,
                                                "You already have a course with this title");
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
                                                        "Category not found"));
                        course.setCategory(category);
                }

                return toResponse(courseRepository.save(course));
        }

        // --- LOGIQUE MÉTIER DE L'ISSUE #58 ---
        @Transactional
        public LessonProgressResponse updateLessonProgress(Long lessonId, String username,
                        LessonProgressUpdateRequest request) {

                // 1. Validation de l'existence de la leçon
                Lesson lesson = lessonRepository.findById(lessonId)
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                                                "Target lesson record not found"));

                // 2. Récupération du cours via le squelette de l'entité
                if (lesson.getSection() == null || lesson.getSection().getCourse() == null) {
                        throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                                        "Lesson structure mapping configuration is missing");
                }
                Course course = lesson.getSection().getCourse();

                // 3. Récupération du contexte utilisateur et du profil apprenant
                User user = userRepository.findByEmailIgnoreCase(username)
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                                                "User entity context not found"));

                LearnerProfile learnerProfile = learnerProfileRepository.findByUserId(user.getId())
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN,
                                                "Authenticated user does not possess an active Learner Profile"));

                // 4. Contrôle de l'inscription au cours via le CourseAccessService
                boolean hasAccess = courseAccessService.canUserAccessCourseContent(username, course);
                if (!hasAccess) {
                        throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                                        "Access denied. You must be enrolled in this course to log progress details.");
                }

                // 5. Stratégie d'Upsert sécurisée pour la progression
                LessonProgress progress = lessonProgressRepository.findByLearnerProfileAndLesson(learnerProfile, lesson)
                                .orElseGet(() -> LessonProgress.builder()
                                                .learnerProfile(learnerProfile)
                                                .lesson(lesson)
                                                .isCompleted(false)
                                                .build());

                // 6. Application des mutations de valeurs de tracking
                progress.setCompleted(request.isCompleted());
                if (request.lastPositionSeconds() != null) {
                        progress.setLastPositionSeconds(request.lastPositionSeconds());
                }
                if (request.timeSpentSeconds() != null) {
                        progress.setTimeSpentSeconds(request.timeSpentSeconds());
                }

                LessonProgress savedProgress = lessonProgressRepository.save(progress);

                return new LessonProgressResponse(
                                savedProgress.getId(),
                                savedProgress.getLearnerProfile().getId(),
                                savedProgress.getLesson().getId(),
                                savedProgress.isCompleted(),
                                savedProgress.getLastPositionSeconds(),
                                savedProgress.getTimeSpentSeconds(),
                                savedProgress.getUpdatedAt());
        }
}