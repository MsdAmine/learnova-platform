package com.learnova.learnova_backend.course.service;

import com.learnova.learnova_backend.course.entity.Course;
import org.springframework.stereotype.Service;

@Service
public class CourseAccessService {
    
    public boolean canUserAccessCourseContent(String username, Course course) {
        // Mocked implementation to allow compilation and basic functionality
        return true;
    }
}
