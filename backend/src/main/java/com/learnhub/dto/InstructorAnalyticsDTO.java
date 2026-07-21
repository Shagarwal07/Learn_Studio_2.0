package com.learnhub.dto;

import lombok.Builder;
import java.util.List;
import java.util.Map;

@Builder
public record InstructorAnalyticsDTO(
    long totalCourses,
    long totalStudents,
    double averageRating,
    List<Map<String, Object>> courseEnrollmentStats
) {}
