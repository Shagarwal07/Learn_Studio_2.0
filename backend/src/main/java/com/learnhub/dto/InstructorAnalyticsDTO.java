package com.learnhub.dto;

import lombok.*;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InstructorAnalyticsDTO {
    private long totalCourses;
    private long totalStudents;
    private double averageRating;
    private List<Map<String, Object>> courseEnrollmentStats;
}
