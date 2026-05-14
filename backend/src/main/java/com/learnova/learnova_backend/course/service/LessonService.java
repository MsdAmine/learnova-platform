package com.learnova.learnova_backend.course.service;

import com.learnova.learnova_backend.course.dto.LessonRequest;
import com.learnova.learnova_backend.course.dto.LessonResponse;
import com.learnova.learnova_backend.course.entity.Lesson;
import com.learnova.learnova_backend.course.entity.Section;
import com.learnova.learnova_backend.course.repository.LessonRepository;
import com.learnova.learnova_backend.course.repository.SectionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LessonService {

    private final LessonRepository lessonRepository;
    private final SectionRepository sectionRepository;
    private final CourseService courseService;

    @Transactional(readOnly = true)
    public List<LessonResponse> getSectionLessons(Long sectionId) {
        return lessonRepository.findBySectionIdOrderByPositionAsc(sectionId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public LessonResponse createLesson(Long courseId, Long sectionId, Long userId, LessonRequest request) {
        Section section = validateSectionOwnership(courseId, sectionId, userId);

        Lesson lesson = Lesson.builder()
                .title(request.title().trim())
                .position(request.position())
                .contentType(request.contentType())
                .contentUrl(request.contentUrl())
                .textContent(request.textContent())
                .section(section)
                .build();

        return toResponse(lessonRepository.save(lesson));
    }

    @Transactional
    public LessonResponse updateLesson(Long courseId, Long sectionId, Long lessonId, Long userId,
            LessonRequest request) {
        validateSectionOwnership(courseId, sectionId, userId);
        Lesson lesson = findLessonAndValidateSection(lessonId, sectionId);

        lesson.setTitle(request.title().trim());
        lesson.setPosition(request.position());
        lesson.setContentType(request.contentType());
        lesson.setContentUrl(request.contentUrl());
        lesson.setTextContent(request.textContent());

        return toResponse(lessonRepository.save(lesson));
    }

    @Transactional
    public void deleteLesson(Long courseId, Long sectionId, Long lessonId, Long userId) {
        validateSectionOwnership(courseId, sectionId, userId);
        Lesson lesson = findLessonAndValidateSection(lessonId, sectionId);
        lessonRepository.delete(lesson);
    }

    private Section validateSectionOwnership(Long courseId, Long sectionId, Long userId) {
        // First, verify the user owns the course
        courseService.validateAndGetCourseOwnership(courseId, userId);

        // Then, verify the section belongs to that course
        Section section = sectionRepository.findById(sectionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Section not found"));

        if (!section.getCourse().getId().equals(courseId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Section does not belong to the specified course");
        }
        return section;
    }

    private Lesson findLessonAndValidateSection(Long lessonId, Long sectionId) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lesson not found"));

        if (!lesson.getSection().getId().equals(sectionId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Lesson does not belong to this section");
        }
        return lesson;
    }

    private LessonResponse toResponse(Lesson lesson) {
        return new LessonResponse(
                lesson.getId(),
                lesson.getTitle(),
                lesson.getPosition(),
                lesson.getContentType(),
                lesson.getContentUrl(),
                lesson.getTextContent(),
                lesson.getSection().getId());
    }
}