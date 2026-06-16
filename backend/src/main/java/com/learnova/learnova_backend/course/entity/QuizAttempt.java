package com.learnova.learnova_backend.course.entity;

import com.learnova.learnova_backend.profile.entity.LearnerProfile;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "quiz_attempts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "learner_profile_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_quiz_attempts_learner_profile"))
    private LearnerProfile learnerProfile;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "quiz_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_quiz_attempts_quiz"))
    private Quiz quiz;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private QuizAttemptStatus status;

    @Column(name = "score_percentage")
    private Integer scorePercentage;

    @Column(name = "total_points")
    private Integer totalPoints;

    @Column(name = "earned_points")
    private Integer earnedPoints;

    private Boolean passed;

    @Column(name = "started_at", nullable = false)
    private Instant startedAt;

    @Column(name = "submitted_at")
    private Instant submittedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @OneToMany(mappedBy = "attempt", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<QuizAttemptAnswer> answers = new ArrayList<>();

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.startedAt == null) {
            this.startedAt = now;
        }
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = Instant.now();
    }
}
