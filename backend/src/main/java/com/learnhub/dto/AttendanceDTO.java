package com.learnhub.dto;

import lombok.Builder;
import java.time.LocalDate;

@Builder
public record AttendanceDTO(
    Long id,
    Long studentId,
    String studentName,
    String subjectName,
    LocalDate date,
    String day,
    String status
) {}
