package com.learnhub.dto;

import lombok.Builder;
import java.time.LocalDate;

@Builder
public record InstructorAttendanceMarkRequest(
    Long studentId,
    String subjectName,
    LocalDate date,
    String status // "PRESENT" or "ABSENT"
) {}
