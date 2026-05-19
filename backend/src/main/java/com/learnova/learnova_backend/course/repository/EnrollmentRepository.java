package com.learnova.learnova_backend.course.repository;

import com.learnova.learnova_backend.course.entity.Course;
import com.learnova.learnova_backend.course.entity.Enrollment;
import com.learnova.learnova_backend.course.entity.EnrollmentStatus;
import com.learnova.learnova_backend.profile.entity.LearnerProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {

    // Vérifier l'existence d'une inscription active ou globale pour empêcher les
    // doublons au niveau service
    boolean existsByLearnerProfileAndCourse(LearnerProfile learnerProfile, Course course);

    // Trouver une inscription spécifique entre un étudiant et un cours
    Optional<Enrollment> findByLearnerProfileAndCourse(LearnerProfile learnerProfile, Course course);

    // Récupérer toutes les inscriptions d'un apprenant par statut (ex: afficher
    // uniquement ses cours en cours)
    List<Enrollment> findByLearnerProfileAndStatus(LearnerProfile learnerProfile, EnrollmentStatus status);

    // Récupérer tout l'historique d'un apprenant
    List<Enrollment> findByLearnerProfile(LearnerProfile learnerProfile);
}