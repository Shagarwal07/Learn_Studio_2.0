package com.learnhub.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseProgressDTO {
    private Long enrollmentId;
    private Long courseId;
    private String courseTitle;
    private int progress; // Overall percentage
    private int completedLessons;
    private int totalLessons;
    private Long nextLessonId; // ID of the next unlocked and incomplete lesson
    private List<LessonProgressDTO> lessons;
}