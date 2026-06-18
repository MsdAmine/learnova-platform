package com.learnova.learnova_backend.livesession.dto;

import com.learnova.learnova_backend.livesession.entity.LiveSessionStatus;
import com.learnova.learnova_backend.livesession.entity.MeetingProvider;

import java.time.Instant;

public record InstructorLiveSessionResponse(
        Long id,
        Long courseId,
        String courseTitle,
        String title,
        String description,
        Instant startTime,
        Instant endTime,
        MeetingProvider meetingProvider,
        String meetingUrl,
        String meetingRoomName,
        Integer maxParticipants,
        LiveSessionStatus status,
        Instant createdAt,
        Instant updatedAt) {
}
