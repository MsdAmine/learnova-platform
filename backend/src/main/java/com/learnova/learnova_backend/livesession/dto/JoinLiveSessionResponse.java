package com.learnova.learnova_backend.livesession.dto;

import com.learnova.learnova_backend.livesession.entity.MeetingProvider;

import java.time.Instant;

public record JoinLiveSessionResponse(
        Long sessionId,
        String title,
        Instant startTime,
        Instant endTime,
        MeetingProvider meetingProvider,
        String meetingUrl,
        String meetingRoomName) {
}
