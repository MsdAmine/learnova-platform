package com.learnova.learnova_backend.course.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "lessons")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Lesson {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    /**
     * The kind of content this lesson carries. Nullable: a lesson can be created
     * as a structural placeholder before any body content is added.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "content_type")
    private LessonContentType contentType;

    /** Instructor-authored body text. Populated only when contentType == TEXT. */
    @Column(name = "text_content", columnDefinition = "TEXT")
    private String textContent;

    /** External http(s) resource URL. Populated only for URL-based content types. */
    @Column(name = "content_url", length = 2048)
    private String contentUrl;

    /** Optional learner-facing duration hint, in seconds. Non-negative when present. */
    @Column(name = "duration_seconds")
    private Integer durationSeconds;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "section_id", nullable = false)
    private Section section;
}