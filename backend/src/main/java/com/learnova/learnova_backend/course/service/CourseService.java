package com.learnova.learnova_backend.course.service;

import com.learnova.learnova_backend.course.dto.CourseCatalogResponse;
import com.learnova.learnova_backend.course.dto.CourseRequest;
import com.learnova.learnova_backend.course.dto.CourseResponse;
import com.learnova.learnova_backend.course.dto.CourseUpdateRequest;
import com.learnova.learnova_backend.course.dto.LessonProgressUpdateRequest;
import com.learnova.learnova_backend.course.dto.LessonProgressResponse;
import com.learnova.learnova_backend.course.dto.CourseProgressResponse;
import com.learnova.learnova_backend.course.entity.Course;
import com.learnova.learnova_backend.course.entity.CourseStatus;
import com.learnova.learnova_backend.course.entity.Lesson;
import com.learnova.learnova_backend.course.entity.LessonProgress;
import com.learnova.learnova_backend.course.entity.WishlistItem;
import com.learnova.learnova_backend.course.repository.CategoryRepository;
import com.learnova.learnova_backend.course.repository.CourseRepository;
import com.learnova.learnova_backend.course.repository.LessonRepository;
import com.learnova.learnova_backend.course.repository.WishlistItemRepository;
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

import java.util.List;

@Service
@RequiredArgsConstructor
public class CourseService {

        private final CourseRepository courseRepository;
        private final CategoryRepository categoryRepository;
        private final InstructorProfileRepository instructorProfileRepository;
        private final WishlistItemRepository wishlistRepository;

        // Nouvelles dépendances requises pour l'Issue #58 & #59
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

        /**
         * Public catalog listing: only {@link CourseStatus#PUBLISHED} courses are
         * visible. Drafts and archived courses are never exposed through this read path.
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
         * indistinguishable to the public: both yield 404, so drafts cannot be probed by
         * id.
         */
        @Transactional(readOnly = true)
        public CourseCatalogResponse getPublishedCourse(Long courseId) {
                Course course = courseRepository.findById(courseId)
                                .filter(c -> c.getStatus() == CourseStatus.PUBLISHED)
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.NOT_FOUND, "Course not found"));
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
                                course.getCreatedAt());
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

        // --- LOGIQUE MÉTIER DE L'ISSUE #59 ---
        @Transactional(readOnly = true)
        public CourseProgressResponse calculateCourseProgress(Long courseId, String username) {

                // 1. Validation de l'existence du cours
                Course course = courseRepository.findById(courseId)
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                                                "Target course context not found"));

                // 2. Récupération du profil utilisateur et de son profil apprenant
                User user = userRepository.findByEmailIgnoreCase(username)
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                                                "User authentication context not found"));

                LearnerProfile learnerProfile = learnerProfileRepository.findByUserId(user.getId())
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN,
                                                "User profile is missing an active Learner assignment"));

                // 3. Contrôle des droits d'accès
                boolean hasAccess = courseAccessService.canUserAccessCourseContent(username, course);
                if (!hasAccess) {
                        throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                                        "Access denied. You must be actively enrolled to view progress records.");
                }

                // 4. Extraction du volume total de leçons du cours
                int totalLessons = lessonRepository.countTotalLessonsByCourseId(courseId);

                // Cas limite : Si le cours est vide, la progression vaut 0% (Évite la division
                // par 0)
                if (totalLessons == 0) {
                        return new CourseProgressResponse(courseId, 0, 0, 0, false);
                }

                // 5. Calcul de la formule de pourcentage
                int completedLessons = lessonProgressRepository.countCompletedLessonsByLearnerAndCourse(learnerProfile,
                                courseId);
                int progressPercentage = (completedLessons * 100) / totalLessons;

                // Garde-fou de sécurité pour l'indice de complétion
                if (progressPercentage > 100) {
                        progressPercentage = 100;
                }

                boolean isFullyCompleted = (progressPercentage == 100);

                return new CourseProgressResponse(
                                courseId,
                                totalLessons,
                                completedLessons,
                                progressPercentage,
                                isFullyCompleted);
        }

        @Transactional(readOnly = true)
        public List<CourseResponse> listMyCourses(CustomUserDetails currentUser) {
                InstructorProfile instructorProfile = resolveApprovedInstructorProfile(currentUser);
                return courseRepository
                                .findByInstructorProfileIdOrderByUpdatedAtDesc(instructorProfile.getId())
                                .stream()
                                .map(this::toResponse)
                                .toList();
        }

        @Transactional
        public CourseResponse publishCourse(CustomUserDetails currentUser, Long courseId) {
                InstructorProfile instructorProfile = resolveApprovedInstructorProfile(currentUser);
                Course course = resolveOwnedCourse(instructorProfile, courseId);

                if (course.getStatus() == CourseStatus.PUBLISHED) {
                        return toResponse(course);
                }

                if (course.getStatus() == CourseStatus.ARCHIVED) {
                        throw new ResponseStatusException(HttpStatus.CONFLICT,
                                        "Archived courses cannot be published. Create a new course instead.");
                }

                course.setStatus(CourseStatus.PUBLISHED);
                return toResponse(courseRepository.save(course));
        }

        @Transactional
        public CourseResponse archiveCourse(CustomUserDetails currentUser, Long courseId) {
                InstructorProfile instructorProfile = resolveApprovedInstructorProfile(currentUser);
                Course course = resolveOwnedCourse(instructorProfile, courseId);

                if (course.getStatus() == CourseStatus.ARCHIVED) {
                        return toResponse(course);
                }

                course.setStatus(CourseStatus.ARCHIVED);
                return toResponse(courseRepository.save(course));
        }

        private InstructorProfile resolveApprovedInstructorProfile(CustomUserDetails currentUser) {
                InstructorProfile instructorProfile = instructorProfileRepository
                                .findByUserId(currentUser.getId())
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.FORBIDDEN, "Instructor profile not found"));

                if (instructorProfile.getApprovalStatus() != InstructorApprovalStatus.APPROVED) {
                        throw new ResponseStatusException(
                                        HttpStatus.FORBIDDEN, "Your instructor profile is not approved yet");
                }

                return instructorProfile;
        }

        private Course resolveOwnedCourse(InstructorProfile instructorProfile, Long courseId) {
                Course course = courseRepository.findById(courseId)
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.NOT_FOUND, "Course not found"));

                if (!course.getInstructorProfile().getId().equals(instructorProfile.getId())) {
                        throw new ResponseStatusException(
                                        HttpStatus.FORBIDDEN, "You are not the owner of this course");
                }

                return course;
        }

        @Transactional
        public void addCourseToWishlist(Long courseId, String username) {
                // 1. Validation de l'existence du cours
                Course course = courseRepository.findById(courseId)
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                                                "Target course context not found"));

                // 2. Extraction du profil apprenant connecté via ton pattern habituel
                User user = userRepository.findByEmailIgnoreCase(username)
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                                                "User authentication context not found"));

                LearnerProfile learnerProfile = learnerProfileRepository.findByUserId(user.getId())
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN,
                                                "User profile is missing an active Learner assignment"));

                // 3. Empêcher les doublons
                if (wishlistRepository.existsByLearnerProfileAndCourse(learnerProfile, course)) {
                        throw new ResponseStatusException(HttpStatus.CONFLICT,
                                        "This course is already present inside your wishlist");
                }

                // 4. Construction et persistance
                WishlistItem item = WishlistItem.builder()
                                .learnerProfile(learnerProfile)
                                .course(course)
                                .build();

                wishlistRepository.save(item);
        }

        @Transactional
        public void removeCourseFromWishlist(Long courseId, String username) {
                // 1. Validation de l'existence du cours
                Course course = courseRepository.findById(courseId)
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                                                "Target course context not found"));

                // 2. Extraction du profil apprenant connecté
                User user = userRepository.findByEmailIgnoreCase(username)
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                                                "User authentication context not found"));

                LearnerProfile learnerProfile = learnerProfileRepository.findByUserId(user.getId())
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN,
                                                "User profile is missing an active Learner assignment"));

                // 3. Récupération de la ligne d'association
                WishlistItem item = wishlistRepository.findByLearnerProfileAndCourse(learnerProfile, course)
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                                                "This course was not found inside your wishlist"));

                // 4. Suppression physique de la ligne
                wishlistRepository.delete(item);
        }

        @Transactional(readOnly = true)
        public org.springframework.data.domain.Page<CourseResponse> getLearnerWishlist(String username,
                        org.springframework.data.domain.Pageable pageable) {
                // 1. Extraction du profil apprenant
                User user = userRepository.findByEmailIgnoreCase(username)
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                                                "User authentication context not found"));

                LearnerProfile learnerProfile = learnerProfileRepository.findByUserId(user.getId())
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN,
                                                "User profile is missing an active Learner assignment"));

                // 2. Récupération paginée et mapping propre vers CourseResponse via ta méthode
                // réutilisable toResponse
                return wishlistRepository.findByLearnerProfile(learnerProfile, pageable)
                                .map(wishlistItem -> this.toResponse(wishlistItem.getCourse()));
        }
}
