package com.learnova.learnova_backend.profile.entity;

import com.learnova.learnova_backend.course.entity.CourseLevel;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(
        name = "learning_preferences",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_learning_preferences_learner_profile", columnNames = "learner_profile_id")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LearningPreference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "learner_profile_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_learning_preferences_learner_profile")
    )
    private LearnerProfile learnerProfile;

    @Enumerated(EnumType.STRING)
    @Column(name = "learning_goal", length = 30)
    private LearningGoal learningGoal;

    @Enumerated(EnumType.STRING)
    @Column(name = "preferred_level", length = 30)
    private CourseLevel preferredLevel;

    @Column(name = "weekly_goal_minutes")
    private Integer weeklyGoalMinutes;

    @ElementCollection
    @CollectionTable(
            name = "learning_preference_categories",
            joinColumns = @JoinColumn(name = "learning_preference_id")
    )
    @Column(name = "category_id")
    @Builder.Default
    private Set<Long> preferredCategoryIds = new HashSet<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = Instant.now();
    }
}
