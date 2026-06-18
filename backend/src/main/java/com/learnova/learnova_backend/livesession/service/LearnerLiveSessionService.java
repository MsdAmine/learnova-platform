package com.learnova.learnova_backend.livesession.service;

import com.learnova.learnova_backend.enrollment.entity.EnrollmentStatus;
import com.learnova.learnova_backend.enrollment.repository.EnrollmentRepository;
import com.learnova.learnova_backend.livesession.dto.JoinLiveSessionResponse;
import com.learnova.learnova_backend.livesession.dto.LearnerLiveSessionResponse;
import com.learnova.learnova_backend.livesession.entity.LiveSession;
import com.learnova.learnova_backend.livesession.entity.LiveSessionStatus;
import com.learnova.learnova_backend.livesession.entity.SessionAttendance;
import com.learnova.learnova_backend.livesession.repository.LiveSessionRepository;
import com.learnova.learnova_backend.livesession.repository.SessionAttendanceRepository;
import com.learnova.learnova_backend.profile.entity.LearnerProfile;
import com.learnova.learnova_backend.profile.repository.LearnerProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LearnerLiveSessionService {

    private static final List<EnrollmentStatus> ACTIVE_STATUSES =
            List.of(EnrollmentStatus.ACTIVE, EnrollmentStatus.COMPLETED);

    private final LiveSessionRepository liveSessionRepository;
    private final SessionAttendanceRepository sessionAttendanceRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final LearnerProfileRepository learnerProfileRepository;

    @Transactional(readOnly = true)
    public List<LearnerLiveSessionResponse> listUpcoming(Long userId) {
        LearnerProfile learnerProfile = resolveLearnerProfile(userId);

        List<Long> enrolledCourseIds = enrollmentRepository
                .findByLearnerProfileIdAndStatusIn(learnerProfile.getId(), ACTIVE_STATUSES)
                .stream()
                .map(enrollment -> enrollment.getCourse().getId())
                .toList();

        if (enrolledCourseIds.isEmpty()) {
            return List.of();
        }

        return liveSessionRepository
                .findByCourseIdInAndStatusOrderByStartTimeAsc(enrolledCourseIds, LiveSessionStatus.SCHEDULED)
                .stream()
                .map(this::toLearnerResponse)
                .toList();
    }

    @Transactional
    public JoinLiveSessionResponse joinSession(Long userId, Long sessionId) {
        LearnerProfile learnerProfile = resolveLearnerProfile(userId);

        LiveSession session = liveSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Live session not found"));

        boolean enrolled = enrollmentRepository.existsByLearnerProfileIdAndCourseIdAndStatusIn(
                learnerProfile.getId(), session.getCourse().getId(), ACTIVE_STATUSES);
        if (!enrolled) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Live session not found");
        }

        if (session.getStatus() != LiveSessionStatus.SCHEDULED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This session is not joinable");
        }

        sessionAttendanceRepository
                .findByLiveSessionIdAndLearnerProfileId(session.getId(), learnerProfile.getId())
                .orElseGet(() -> sessionAttendanceRepository.save(
                        SessionAttendance.builder()
                                .liveSession(session)
                                .learnerProfile(learnerProfile)
                                .joinedAt(Instant.now())
                                .build()));

        return new JoinLiveSessionResponse(
                session.getId(),
                session.getTitle(),
                session.getStartTime(),
                session.getEndTime(),
                session.getMeetingProvider(),
                session.getMeetingUrl(),
                session.getMeetingRoomName());
    }

    private LearnerProfile resolveLearnerProfile(Long userId) {
        return learnerProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Learner profile not found"));
    }

    private LearnerLiveSessionResponse toLearnerResponse(LiveSession session) {
        return new LearnerLiveSessionResponse(
                session.getId(),
                session.getCourse().getId(),
                session.getCourse().getTitle(),
                session.getInstructorProfile().getUser().getFullName(),
                session.getTitle(),
                session.getDescription(),
                session.getStartTime(),
                session.getEndTime(),
                session.getStatus());
    }
}
