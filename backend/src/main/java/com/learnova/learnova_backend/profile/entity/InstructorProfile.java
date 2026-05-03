package com.learnova.learnova_backend.profile.entity;

import com.learnova.learnova_backend.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(
        name = "instructor_profiles",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_instructor_profiles_user", columnNames = "user_id")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InstructorProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "user_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_instructor_profiles_user")
    )
    private User user;

    @Column(nullable = false, length = 1000)
    private String bio;

    @Column(nullable = false, length = 500)
    private String expertise;

    @Column(length = 1000)
    private String experience;

    @Column(name = "motivation", length = 1000)
    private String motivation;

    @Enumerated(EnumType.STRING)
    @Column(name = "approval_status", nullable = false, length = 30)
    @Builder.Default
    private InstructorApprovalStatus approvalStatus = InstructorApprovalStatus.PENDING;

    @Column(name = "rejection_reason", length = 1000)
    private String rejectionReason;

    @Column(name = "requested_at", nullable = false, updatable = false)
    private Instant requestedAt;

    @Column(name = "reviewed_at")
    private Instant reviewedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
        this.requestedAt = now;

        if (this.approvalStatus == null) {
            this.approvalStatus = InstructorApprovalStatus.PENDING;
        }
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = Instant.now();
    }
}