package com.learnova.learnova_backend.livesession.repository;

import com.learnova.learnova_backend.livesession.entity.SessionAttendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SessionAttendanceRepository extends JpaRepository<SessionAttendance, Long> {

    Optional<SessionAttendance> findByLiveSessionIdAndLearnerProfileId(
            Long liveSessionId, Long learnerProfileId);
}
