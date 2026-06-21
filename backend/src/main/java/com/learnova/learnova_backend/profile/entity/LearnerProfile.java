package com.learnova.learnova_backend.profile.entity;

import com.learnova.learnova_backend.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(
        name = "learner_profiles",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_learner_profiles_user", columnNames = "user_id")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LearnerProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "user_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_learner_profiles_user")
    )
    private User user;

    @Column(name = "display_name", nullable = false, length = 150)
    private String displayName;

    @Column(length = 500)
    private String bio;

    @Column(name = "profile_image_url", length = 500)
    private String profileImageUrl;

    @Column(name = "profile_image_public_id", length = 255)
    private String profileImagePublicId;

    @Column(name = "onboarding_completed", nullable = false, columnDefinition = "boolean default false")
    @Builder.Default
    private boolean onboardingCompleted = false;

    @Column(name = "onboarding_completed_at")
    private Instant onboardingCompletedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;

        if (this.displayName == null && this.user != null) {
            this.displayName = this.user.getFullName();
        }
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = Instant.now();
    }
}