package com.learnova.learnova_backend.livesession.entity;

import com.learnova.learnova_backend.course.entity.Course;
import com.learnova.learnova_backend.profile.entity.InstructorProfile;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "live_sessions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LiveSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "course_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_live_sessions_course")
    )
    private Course course;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "instructor_profile_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_live_sessions_instructor_profile")
    )
    private InstructorProfile instructorProfile;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(length = 2000)
    private String description;

    @Column(name = "start_time", nullable = false)
    private Instant startTime;

    @Column(name = "end_time", nullable = false)
    private Instant endTime;

    @Enumerated(EnumType.STRING)
    @Column(name = "meeting_provider", nullable = false, length = 30)
    @Builder.Default
    private MeetingProvider meetingProvider = MeetingProvider.JITSI;

    @Column(name = "meeting_room_name", nullable = false, length = 200)
    private String meetingRoomName;

    @Column(name = "meeting_url", nullable = false, length = 500)
    private String meetingUrl;

    @Column(name = "max_participants")
    private Integer maxParticipants;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private LiveSessionStatus status = LiveSessionStatus.SCHEDULED;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;

        if (this.status == null) {
            this.status = LiveSessionStatus.SCHEDULED;
        }
        if (this.meetingProvider == null) {
            this.meetingProvider = MeetingProvider.JITSI;
        }
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = Instant.now();
    }
}
