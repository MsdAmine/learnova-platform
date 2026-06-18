package com.learnova.learnova_backend.livesession.entity;

import com.learnova.learnova_backend.profile.entity.LearnerProfile;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(
        name = "session_attendances",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_session_attendances_session_learner",
                        columnNames = { "live_session_id", "learner_profile_id" })
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SessionAttendance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "live_session_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_session_attendances_live_session")
    )
    private LiveSession liveSession;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "learner_profile_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_session_attendances_learner_profile")
    )
    private LearnerProfile learnerProfile;

    @Column(name = "joined_at", nullable = false)
    private Instant joinedAt;

    @Column(name = "left_at")
    private Instant leftAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private AttendanceStatus status = AttendanceStatus.JOINED;

    @PrePersist
    void onCreate() {
        if (this.joinedAt == null) {
            this.joinedAt = Instant.now();
        }
        if (this.status == null) {
            this.status = AttendanceStatus.JOINED;
        }
    }
}
