package com.learnhub.dto;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScheduleEventDTO {
    private Long id;
    private String title;
    private String description;
    private String eventType;
    private Long courseId;
    private String courseTitle;
    private Long instructorId;
    private String instructorName;
    private String targetRole;
    private LocalDate eventDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private String location;
    private String meetingLink;
    private boolean isRecurring;
    private String recurrenceDay;
    private boolean isCancelled;
    private Long createdById;
    private String createdByName;
    private boolean notifyStudents;
    private boolean notificationSent;
    private boolean isUpdated;
    private Long batchId;
    private String batchName;
    private String subjectName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
