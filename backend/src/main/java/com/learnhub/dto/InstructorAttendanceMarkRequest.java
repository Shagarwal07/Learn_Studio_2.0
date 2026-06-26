package com.learnhub.dto;

import lombok.*;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InstructorAttendanceMarkRequest {
    private Long studentId;
    private String subjectName;
    private LocalDate date;
    private String status; // "PRESENT" or "ABSENT"
}
