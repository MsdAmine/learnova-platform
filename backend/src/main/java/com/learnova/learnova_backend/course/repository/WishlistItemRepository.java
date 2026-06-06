package com.learnova.learnova_backend.course.repository;

import com.learnova.learnova_backend.course.entity.WishlistItem;
import com.learnova.learnova_backend.course.entity.Course;
import com.learnova.learnova_backend.profile.entity.LearnerProfile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface WishlistItemRepository extends JpaRepository<WishlistItem, Long> {

    // Récupérer la liste des favoris d'un apprenant de manière paginée
    Page<WishlistItem> findByLearnerProfile(LearnerProfile learnerProfile, Pageable pageable);

    // Trouver un élément spécifique pour la suppression
    Optional<WishlistItem> findByLearnerProfileAndCourse(LearnerProfile learnerProfile, Course course);

    // Vérifier l'existence pour empêcher les doublons de manière préventive
    boolean existsByLearnerProfileAndCourse(LearnerProfile learnerProfile, Course course);
}