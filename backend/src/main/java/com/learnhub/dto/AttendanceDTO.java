package com.learnhub.dto;

import lombok.*;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceDTO {
    private Long id;
    private Long studentId;
    private String studentName;
    private String subjectName;
    private LocalDate date;
    private String day;
    private String status;
}
