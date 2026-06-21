package com.learnova.learnova_backend.profile.dto;

import com.learnova.learnova_backend.course.entity.CourseLevel;
import com.learnova.learnova_backend.profile.entity.LearningGoal;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

import java.util.List;

public record UpdateLearningPreferencesRequest(

        LearningGoal learningGoal,

        CourseLevel preferredLevel,

        @Min(value = 30, message = "Weekly goal minutes must be at least 30")
        @Max(value = 1200, message = "Weekly goal minutes must not exceed 1200")
        Integer weeklyGoalMinutes,

        @Size(max = 8, message = "You can select up to 8 preferred categories")
        List<Long> preferredCategoryIds
) {
}
