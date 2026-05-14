package com.learnova.learnova_backend.course.service;

import com.learnova.learnova_backend.course.dto.SectionRequest;
import com.learnova.learnova_backend.course.dto.SectionResponse;
import com.learnova.learnova_backend.course.entity.Course;
import com.learnova.learnova_backend.course.entity.Section;
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
public class SectionService {

    private final SectionRepository sectionRepository;
    private final CourseService courseService;

    @Transactional(readOnly = true)
    public List<SectionResponse> getCourseSections(Long courseId) {
        // Anyone can list sections (public or instructor), 
        // but typically you'd just return the ordered list.
        return sectionRepository.findByCourseIdOrderByPositionAsc(courseId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public SectionResponse createSection(Long courseId, Long userId, SectionRequest request) {
        Course course = courseService.validateAndGetCourseOwnership(courseId, userId);

        Section section = Section.builder()
                .title(request.title().trim())
                .position(request.position())
                .course(course)
                .build();

        return toResponse(sectionRepository.save(section));
    }

    @Transactional
    public SectionResponse updateSection(Long courseId, Long sectionId, Long userId, SectionRequest request) {
        courseService.validateAndGetCourseOwnership(courseId, userId);

        Section section = findSectionById(sectionId);
        
        // Ensure section belongs to the validated course
        if (!section.getCourse().getId().equals(courseId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Section does not belong to this course");
        }

        section.setTitle(request.title().trim());
        section.setPosition(request.position());

        return toResponse(sectionRepository.save(section));
    }

    @Transactional
    public void deleteSection(Long courseId, Long sectionId, Long userId) {
        courseService.validateAndGetCourseOwnership(courseId, userId);
        
        Section section = findSectionById(sectionId);
        if (!section.getCourse().getId().equals(courseId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Section does not belong to this course");
        }

        sectionRepository.delete(section);
    }

    private Section findSectionById(Long id) {
        return sectionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Section not found"));
    }

    private SectionResponse toResponse(Section section) {
        return new SectionResponse(
                section.getId(),
                section.getTitle(),
                section.getPosition(),
                section.getCourse().getId()
        );
    }
}