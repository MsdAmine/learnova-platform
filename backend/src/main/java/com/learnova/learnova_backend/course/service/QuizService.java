package com.learnova.learnova_backend.course.service;

import com.learnova.learnova_backend.course.dto.QuizRequest;
import com.learnova.learnova_backend.course.dto.QuizResponse;
import com.learnova.learnova_backend.course.dto.QuizUpdateRequest;
import com.learnova.learnova_backend.course.entity.Course;
import com.learnova.learnova_backend.course.entity.Quiz;
import com.learnova.learnova_backend.course.entity.QuizStatus;
import com.learnova.learnova_backend.course.entity.Question;
import com.learnova.learnova_backend.course.entity.Section;
import com.learnova.learnova_backend.course.repository.CourseRepository;
import com.learnova.learnova_backend.course.repository.QuizRepository;
import com.learnova.learnova_backend.course.repository.SectionRepository;
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
public class QuizService {

    private final QuizRepository quizRepository;
    private final CourseRepository courseRepository;
    private final SectionRepository sectionRepository;
    private final InstructorProfileRepository instructorProfileRepository;

    @Transactional
    public QuizResponse createQuiz(CustomUserDetails currentUser, Long courseId, QuizRequest request) {

        // 1. Validation de l'existence du cours cible
        Course course = courseRepository.findById(courseId)
                .orElseThrow(
                        () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Target course context not found"));

        // 2 & 3. Contrôle strict de propriété : L'instructeur doit être le créateur originel du cours
        checkTeacherOwnership(course, currentUser);

        // 4. Validation optionnelle de la Section (si fournie dans la requête)
        Section section = null;
        if (request.sectionId() != null) {
            section = sectionRepository.findById(request.sectionId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                            "Target section context not found"));

            // Cohérence de structure : La section doit impérativement faire partie du cours
            // spécifié
            if (!section.getCourse().getId().equals(course.getId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Invalid scope mapping. The selected section does not belong to the targeted course");
            }
        }

        // 5. Instanciation du modèle avec un statut initial par défaut mis en DRAFT
        Quiz quiz = Quiz.builder()
                .title(request.title().trim())
                .description(request.description() != null ? request.description().trim() : null)
                .passingScore(request.passingScore())
                .status(QuizStatus.DRAFT)
                .course(course)
                .section(section)
                .build();

        Quiz savedQuiz = quizRepository.save(quiz);

        return toResponse(savedQuiz);
    }

    @Transactional
    public QuizResponse updateQuiz(CustomUserDetails currentUser, Long quizId, QuizUpdateRequest request) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Quiz not found"));

        checkTeacherOwnership(quiz.getCourse(), currentUser);

        Section section = null;
        if (request.sectionId() != null) {
            section = sectionRepository.findById(request.sectionId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Target section context not found"));
            if (!section.getCourse().getId().equals(quiz.getCourse().getId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid scope mapping. The selected section does not belong to the targeted course");
            }
        }

        quiz.setTitle(request.title().trim());
        quiz.setDescription(request.description() != null ? request.description().trim() : null);
        quiz.setPassingScore(request.passingScore());
        quiz.setSection(section);

        return toResponse(quizRepository.save(quiz));
    }

    @Transactional
    public QuizResponse publishQuiz(CustomUserDetails currentUser, Long quizId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Quiz not found"));

        checkTeacherOwnership(quiz.getCourse(), currentUser);

        if (quiz.getQuestions() == null || quiz.getQuestions().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot publish a quiz with no questions");
        }

        for (Question question : quiz.getQuestions()) {
            if (question.getAnswerOptions() == null || question.getAnswerOptions().isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Question " + question.getId() + " has no answer options");
            }

            boolean hasCorrectOption = question.getAnswerOptions().stream().anyMatch(option -> Boolean.TRUE.equals(option.getIsCorrect()));
            if (!hasCorrectOption) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Question " + question.getId() + " lacks a true isCorrect target flag");
            }
        }

        quiz.setStatus(QuizStatus.PUBLISHED);
        return toResponse(quizRepository.save(quiz));
    }

    @Transactional
    public QuizResponse archiveQuiz(CustomUserDetails currentUser, Long quizId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Quiz not found"));

        checkTeacherOwnership(quiz.getCourse(), currentUser);

        quiz.setStatus(QuizStatus.ARCHIVED);
        return toResponse(quizRepository.save(quiz));
    }

    private void checkTeacherOwnership(Course course, CustomUserDetails currentUser) {
        InstructorProfile instructorProfile = instructorProfileRepository.findByUserId(currentUser.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Authenticated account does not possess an Instructor Profile"));

        if (!course.getInstructorProfile().getId().equals(instructorProfile.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Access denied. You are not the authorized owner of this course resource");
        }
    }

    public QuizResponse toResponse(Quiz quiz) {
        return new QuizResponse(
                quiz.getId(),
                quiz.getTitle(),
                quiz.getDescription(),
                quiz.getPassingScore(),
                quiz.getStatus(),
                quiz.getCourse().getId(),
                quiz.getSection() != null ? quiz.getSection().getId() : null,
                quiz.getCreatedAt(),
                quiz.getUpdatedAt());
    }
}