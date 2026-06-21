package com.learnova.learnova_backend.livesession.dto;

import com.learnova.learnova_backend.livesession.entity.LiveSessionStatus;

import java.time.Instant;

// Learner-facing summary intentionally omits meetingUrl/meetingRoomName.
// The meeting URL is only ever returned by the join endpoint, after
// enrollment and joinability are validated.
public record LearnerLiveSessionResponse(
        Long id,
        Long courseId,
        String courseTitle,
        String instructorName,
        String title,
        String description,
        Instant startTime,
        Instant endTime,
        LiveSessionStatus status) {
}
