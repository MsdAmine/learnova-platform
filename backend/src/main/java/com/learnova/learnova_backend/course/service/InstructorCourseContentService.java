package com.learnova.learnova_backend.course.service;

import com.learnova.learnova_backend.course.dto.*;
import com.learnova.learnova_backend.course.entity.*;
import com.learnova.learnova_backend.course.repository.*;
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
public class InstructorCourseContentService {

    private final InstructorProfileRepository instructorProfileRepository;
    private final CourseRepository courseRepository;
    private final SectionRepository sectionRepository;
    private final LessonRepository lessonRepository;
    private final LessonProgressRepository lessonProgressRepository;

    @Transactional(readOnly = true)
    public InstructorCourseContentResponse getCourseContent(Long courseId, CustomUserDetails currentUser) {
        InstructorProfile instructor = resolveApprovedInstructorProfile(currentUser);
        Course course = resolveOwnedCourse(instructor, courseId);

        List<InstructorSectionResponse> sections = sectionRepository
                .findByCourseIdOrderByIdAsc(courseId)
                .stream()
                .map(this::toSectionResponse)
                .toList();

        return new InstructorCourseContentResponse(course.getId(), course.getTitle(), sections);
    }

    @Transactional
    public InstructorSectionResponse createSection(Long courseId, CreateSectionRequest request,
            CustomUserDetails currentUser) {
        InstructorProfile instructor = resolveApprovedInstructorProfile(currentUser);
        Course course = resolveOwnedCourse(instructor, courseId);
        rejectIfArchived(course);

        Section section = sectionRepository.save(
                Section.builder().title(request.title().trim()).course(course).build());

        return new InstructorSectionResponse(section.getId(), section.getTitle(), List.of());
    }

    @Transactional
    public InstructorSectionResponse updateSection(Long sectionId, UpdateSectionRequest request,
            CustomUserDetails currentUser) {
        InstructorProfile instructor = resolveApprovedInstructorProfile(currentUser);
        Section section = resolveSectionForInstructor(instructor, sectionId);
        rejectIfArchived(section.getCourse());

        section.setTitle(request.title().trim());
        sectionRepository.save(section);

        return toSectionResponse(section);
    }

    @Transactional
    public void deleteSection(Long sectionId, CustomUserDetails currentUser) {
        InstructorProfile instructor = resolveApprovedInstructorProfile(currentUser);
        Section section = resolveSectionForInstructor(instructor, sectionId);
        rejectIfArchived(section.getCourse());

        // Delete in FK-safe order via direct JPQL, bypassing the Section → Lesson
        // orphanRemoval cascade that causes TransientObjectException when lesson entities
        // are already in the Hibernate session.  Session cache retains stale references
        // but subsequent queries hit DB and return correct post-delete results.
        lessonProgressRepository.deleteBySectionId(sectionId);
        lessonRepository.deleteBySectionId(sectionId);
        sectionRepository.deleteByIdDirect(sectionId);
    }

    @Transactional
    public InstructorLessonResponse createLesson(Long sectionId, CreateLessonRequest request,
            CustomUserDetails currentUser) {
        InstructorProfile instructor = resolveApprovedInstructorProfile(currentUser);
        Section section = resolveSectionForInstructor(instructor, sectionId);
        rejectIfArchived(section.getCourse());

        Lesson lesson = lessonRepository.save(
                Lesson.builder().title(request.title().trim()).section(section).build());

        return new InstructorLessonResponse(lesson.getId(), lesson.getTitle());
    }

    @Transactional
    public InstructorLessonResponse updateLesson(Long lessonId, UpdateLessonRequest request,
            CustomUserDetails currentUser) {
        InstructorProfile instructor = resolveApprovedInstructorProfile(currentUser);
        Lesson lesson = resolveLessonForInstructor(instructor, lessonId);
        rejectIfArchived(lesson.getSection().getCourse());

        lesson.setTitle(request.title().trim());
        lessonRepository.save(lesson);

        return new InstructorLessonResponse(lesson.getId(), lesson.getTitle());
    }

    @Transactional
    public void deleteLesson(Long lessonId, CustomUserDetails currentUser) {
        InstructorProfile instructor = resolveApprovedInstructorProfile(currentUser);
        Lesson lesson = resolveLessonForInstructor(instructor, lessonId);
        rejectIfArchived(lesson.getSection().getCourse());

        lessonProgressRepository.deleteByLessonId(lessonId);
        lessonRepository.delete(lesson);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private InstructorProfile resolveApprovedInstructorProfile(CustomUserDetails currentUser) {
        InstructorProfile profile = instructorProfileRepository
                .findByUserId(currentUser.getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.FORBIDDEN, "Instructor profile not found"));

        if (profile.getApprovalStatus() != InstructorApprovalStatus.APPROVED) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "Your instructor profile is not approved yet");
        }

        return profile;
    }

    private Course resolveOwnedCourse(InstructorProfile instructor, Long courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Course not found"));

        if (!course.getInstructorProfile().getId().equals(instructor.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "You are not the owner of this course");
        }

        return course;
    }

    private Section resolveSectionForInstructor(InstructorProfile instructor, Long sectionId) {
        Section section = sectionRepository.findById(sectionId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Section not found"));

        if (!section.getCourse().getInstructorProfile().getId().equals(instructor.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "You are not the owner of this section");
        }

        return section;
    }

    private Lesson resolveLessonForInstructor(InstructorProfile instructor, Long lessonId) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Lesson not found"));

        if (!lesson.getSection().getCourse().getInstructorProfile().getId().equals(instructor.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "You are not the owner of this lesson");
        }

        return lesson;
    }

    private void rejectIfArchived(Course course) {
        if (course.getStatus() == CourseStatus.ARCHIVED) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Archived courses cannot be modified");
        }
    }

    private InstructorSectionResponse toSectionResponse(Section section) {
        List<InstructorLessonResponse> lessons = lessonRepository
                .findBySectionIdOrderByIdAsc(section.getId())
                .stream()
                .map(l -> new InstructorLessonResponse(l.getId(), l.getTitle()))
                .toList();
        return new InstructorSectionResponse(section.getId(), section.getTitle(), lessons);
    }
}
