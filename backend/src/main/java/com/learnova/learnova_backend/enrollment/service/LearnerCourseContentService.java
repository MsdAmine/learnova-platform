package com.learnova.learnova_backend.enrollment.service;

import com.learnova.learnova_backend.course.dto.CourseContentResponse;
import com.learnova.learnova_backend.course.dto.LessonContentResponse;
import com.learnova.learnova_backend.course.dto.SectionContentResponse;
import com.learnova.learnova_backend.course.entity.Lesson;
import com.learnova.learnova_backend.course.entity.LessonProgress;
import com.learnova.learnova_backend.course.entity.Section;
import com.learnova.learnova_backend.course.repository.LessonProgressRepository;
import com.learnova.learnova_backend.course.repository.LessonRepository;
import com.learnova.learnova_backend.course.repository.SectionRepository;
import com.learnova.learnova_backend.enrollment.entity.Enrollment;
import com.learnova.learnova_backend.enrollment.entity.EnrollmentStatus;
import com.learnova.learnova_backend.enrollment.repository.EnrollmentRepository;
import com.learnova.learnova_backend.profile.entity.LearnerProfile;
import com.learnova.learnova_backend.profile.repository.LearnerProfileRepository;
import com.learnova.learnova_backend.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LearnerCourseContentService {

    private final LearnerProfileRepository learnerProfileRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final SectionRepository sectionRepository;
    private final LessonRepository lessonRepository;
    private final LessonProgressRepository lessonProgressRepository;

    @Transactional(readOnly = true)
    public CourseContentResponse getCourseContentForLearner(Long courseId, CustomUserDetails currentUser) {
        LearnerProfile learnerProfile = learnerProfileRepository.findByUserId(currentUser.getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Learner profile not found"));

        // Treat not-enrolled the same as not-found: a learner must not be able to
        // probe whether a course exists by its id if they are not enrolled in it.
        Enrollment enrollment = enrollmentRepository
                .findByLearnerProfileIdAndCourseId(learnerProfile.getId(), courseId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Course not found"));

        if (enrollment.getStatus() == EnrollmentStatus.CANCELLED) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found");
        }

        // Bulk-fetch all progress records for this learner+course upfront to avoid N+1
        Map<Long, LessonProgress> progressByLessonId = lessonProgressRepository
                .findAllByLearnerProfileIdAndCourseId(learnerProfile.getId(), courseId)
                .stream()
                .collect(Collectors.toMap(lp -> lp.getLesson().getId(), Function.identity()));

        List<SectionContentResponse> sections = sectionRepository
                .findByCourseIdOrderByIdAsc(courseId)
                .stream()
                .map(section -> toSectionResponse(section, progressByLessonId))
                .toList();

        return new CourseContentResponse(
                enrollment.getCourse().getId(),
                enrollment.getCourse().getTitle(),
                sections);
    }

    private SectionContentResponse toSectionResponse(Section section, Map<Long, LessonProgress> progressByLessonId) {
        List<LessonContentResponse> lessons = lessonRepository.findBySectionIdOrderByIdAsc(section.getId())
                .stream()
                .map(lesson -> toLessonResponse(lesson, progressByLessonId.get(lesson.getId())))
                .toList();
        return new SectionContentResponse(section.getId(), section.getTitle(), lessons);
    }

    private LessonContentResponse toLessonResponse(Lesson lesson, LessonProgress progress) {
        boolean completed = progress != null && progress.isCompleted();
        Integer lastPosition = progress == null ? null : progress.getLastPositionSeconds();
        Integer timeSpent = progress == null ? null : progress.getTimeSpentSeconds();
        return new LessonContentResponse(
                lesson.getId(),
                lesson.getTitle(),
                lesson.getContentType(),
                lesson.getTextContent(),
                lesson.getContentUrl(),
                lesson.getDurationSeconds(),
                completed,
                lastPosition,
                timeSpent);
    }
}
