package com.learnova.learnova_backend.course.service;

import com.learnova.learnova_backend.course.dto.QuizRequest;
import com.learnova.learnova_backend.course.dto.QuizResponse;
import com.learnova.learnova_backend.course.entity.Course;
import com.learnova.learnova_backend.course.entity.Quiz;
import com.learnova.learnova_backend.course.entity.QuizStatus;
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

        // 2. Extraction et validation du profil Instructeur connecté
        InstructorProfile instructorProfile = instructorProfileRepository.findByUserId(currentUser.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Authenticated account does not possess an Instructor Profile"));

        // 3. Contrôle strict de propriété : L'instructeur doit être le créateur
        // originel du cours
        if (!course.getInstructorProfile().getId().equals(instructorProfile.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Access denied. You are not the authorized owner of this course resource");
        }

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