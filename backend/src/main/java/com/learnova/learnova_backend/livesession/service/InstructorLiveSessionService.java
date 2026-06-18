package com.learnova.learnova_backend.livesession.service;

import com.learnova.learnova_backend.course.entity.Course;
import com.learnova.learnova_backend.course.entity.CourseStatus;
import com.learnova.learnova_backend.course.repository.CourseRepository;
import com.learnova.learnova_backend.livesession.dto.CreateLiveSessionRequest;
import com.learnova.learnova_backend.livesession.dto.InstructorLiveSessionResponse;
import com.learnova.learnova_backend.livesession.entity.LiveSession;
import com.learnova.learnova_backend.livesession.entity.LiveSessionStatus;
import com.learnova.learnova_backend.livesession.repository.LiveSessionRepository;
import com.learnova.learnova_backend.profile.entity.InstructorProfile;
import com.learnova.learnova_backend.profile.repository.InstructorProfileRepository;
import com.learnova.learnova_backend.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.util.List;

@Service
@RequiredArgsConstructor
public class InstructorLiveSessionService {

    private static final SecureRandom ROOM_NAME_RANDOM = new SecureRandom();
    private static final String ROOM_NAME_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";
    private static final int ROOM_NAME_RANDOM_LENGTH = 32;

    private final LiveSessionRepository liveSessionRepository;
    private final CourseRepository courseRepository;
    private final InstructorProfileRepository instructorProfileRepository;

    @Transactional
    public InstructorLiveSessionResponse createSession(
            CustomUserDetails currentUser, Long courseId, CreateLiveSessionRequest request) {

        InstructorProfile instructorProfile = resolveInstructorProfile(currentUser);

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));

        if (!course.getInstructorProfile().getId().equals(instructorProfile.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Access denied. You are not the authorized owner of this course resource");
        }

        if (course.getStatus() == CourseStatus.ARCHIVED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Archived courses cannot be modified");
        }

        if (!request.endTime().isAfter(request.startTime())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "End time must be after start time");
        }

        String roomName = generateRoomName();

        LiveSession session = LiveSession.builder()
                .course(course)
                .instructorProfile(instructorProfile)
                .title(request.title().trim())
                .description(request.description() != null ? request.description().trim() : null)
                .startTime(request.startTime())
                .endTime(request.endTime())
                .meetingRoomName(roomName)
                .meetingUrl("https://meet.jit.si/" + roomName)
                .maxParticipants(request.maxParticipants())
                .status(LiveSessionStatus.SCHEDULED)
                .build();

        return toResponse(liveSessionRepository.save(session));
    }

    @Transactional(readOnly = true)
    public List<InstructorLiveSessionResponse> listMySessions(CustomUserDetails currentUser) {
        InstructorProfile instructorProfile = resolveInstructorProfile(currentUser);

        return liveSessionRepository.findByInstructorProfileIdOrderByStartTimeDesc(instructorProfile.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public InstructorLiveSessionResponse cancelSession(CustomUserDetails currentUser, Long sessionId) {
        InstructorProfile instructorProfile = resolveInstructorProfile(currentUser);

        LiveSession session = liveSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Live session not found"));

        if (!session.getInstructorProfile().getId().equals(instructorProfile.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Access denied. You are not the authorized owner of this live session");
        }

        if (session.getStatus() != LiveSessionStatus.SCHEDULED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Only scheduled sessions can be cancelled");
        }

        session.setStatus(LiveSessionStatus.CANCELLED);
        return toResponse(liveSessionRepository.save(session));
    }

    private InstructorProfile resolveInstructorProfile(CustomUserDetails currentUser) {
        return instructorProfileRepository.findByUserId(currentUser.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Authenticated account does not possess an Instructor Profile"));
    }

    private String generateRoomName() {
        StringBuilder suffix = new StringBuilder(ROOM_NAME_RANDOM_LENGTH);
        for (int i = 0; i < ROOM_NAME_RANDOM_LENGTH; i++) {
            suffix.append(ROOM_NAME_CHARS.charAt(ROOM_NAME_RANDOM.nextInt(ROOM_NAME_CHARS.length())));
        }
        return "learnova-live-" + suffix;
    }

    private InstructorLiveSessionResponse toResponse(LiveSession session) {
        return new InstructorLiveSessionResponse(
                session.getId(),
                session.getCourse().getId(),
                session.getCourse().getTitle(),
                session.getTitle(),
                session.getDescription(),
                session.getStartTime(),
                session.getEndTime(),
                session.getMeetingProvider(),
                session.getMeetingUrl(),
                session.getMeetingRoomName(),
                session.getMaxParticipants(),
                session.getStatus(),
                session.getCreatedAt(),
                session.getUpdatedAt());
    }
}
