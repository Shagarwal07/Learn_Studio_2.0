package com.learnhub.dto;

import lombok.Builder;
import java.util.List;

@Builder
public record BatchAttendanceMarkRequest(
    String subjectName,
    String date, // "YYYY-MM-DD"
    List<StudentMark> records
) {
    @Builder
    public record StudentMark(
        Long studentId,
        String status // "PRESENT" or "ABSENT"
    ) {}
}
