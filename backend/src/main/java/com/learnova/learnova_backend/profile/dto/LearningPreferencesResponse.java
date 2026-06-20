package com.learnova.learnova_backend.profile.dto;

import com.learnova.learnova_backend.course.entity.CourseLevel;
import com.learnova.learnova_backend.profile.entity.LearningGoal;

import java.time.Instant;
import java.util.List;

public record LearningPreferencesResponse(
        LearningGoal learningGoal,
        CourseLevel preferredLevel,
        Integer weeklyGoalMinutes,
        List<Long> preferredCategoryIds,
        Instant updatedAt
) {
}
