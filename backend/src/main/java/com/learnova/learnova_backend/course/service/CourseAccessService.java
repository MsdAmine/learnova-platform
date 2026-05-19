package com.learnova.learnova_backend.course.service;

import com.learnova.learnova_backend.course.entity.Course;
import com.learnova.learnova_backend.course.repository.EnrollmentRepository;
import com.learnova.learnova_backend.profile.entity.InstructorProfile;
import com.learnova.learnova_backend.profile.entity.LearnerProfile;
import com.learnova.learnova_backend.profile.repository.InstructorProfileRepository;
import com.learnova.learnova_backend.profile.repository.LearnerProfileRepository;
import com.learnova.learnova_backend.user.entity.User;
import com.learnova.learnova_backend.user.entity.RoleName;
import com.learnova.learnova_backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CourseAccessService {

    private final EnrollmentRepository enrollmentRepository;
    private final UserRepository userRepository;
    private final LearnerProfileRepository learnerProfileRepository;
    private final InstructorProfileRepository instructorProfileRepository;

    @Transactional(readOnly = true)
    public boolean canUserAccessCourseContent(String username, Course course) {
        if (username == null || course == null) {
            return false;
        }

        // 1. Extraction et vérification de l'utilisateur
        Optional<User> userOpt = userRepository.findByEmail(username);
        if (userOpt.isEmpty()) {
            return false;
        }
        User user = userOpt.get();

        // 2. Règle d'accès : Rôle ADMIN (Autorisation globale pour modération)
        boolean isAdmin = user.getRoles().stream()
                .anyMatch(role -> role.getName() == RoleName.ROLE_ADMIN);
        if (isAdmin) {
            return true;
        }

        // 3. Règle d'accès : Rôle INSTRUCTOR propriétaire du cours
        if (course.getInstructorProfile() != null) {
            Optional<InstructorProfile> instructorOpt = instructorProfileRepository.findByUser(user);
            if (instructorOpt.isPresent()
                    && course.getInstructorProfile().getId().equals(instructorOpt.get().getId())) {
                return true;
            }
        }

        // 4. Règle d'accès : Rôle LEARNER avec une inscription active
        Optional<LearnerProfile> learnerOpt = learnerProfileRepository.findByUser(user);
        if (learnerOpt.isPresent()) {
            return enrollmentRepository.existsByLearnerProfileAndCourse(learnerOpt.get(), course);
        }

        return false;
    }
}