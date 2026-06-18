package com.learnova.learnova_backend.livesession.repository;

import com.learnova.learnova_backend.livesession.entity.LiveSession;
import com.learnova.learnova_backend.livesession.entity.LiveSessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface LiveSessionRepository extends JpaRepository<LiveSession, Long> {

    List<LiveSession> findByInstructorProfileIdOrderByStartTimeDesc(Long instructorProfileId);

    List<LiveSession> findByCourseIdInAndStatusOrderByStartTimeAsc(
            Collection<Long> courseIds, LiveSessionStatus status);
}
