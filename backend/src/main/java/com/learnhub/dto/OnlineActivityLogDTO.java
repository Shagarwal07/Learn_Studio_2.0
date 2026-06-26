package com.learnhub.dto;

import lombok.*;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OnlineActivityLogDTO {
    private Long id;
    private Long studentId;
    private String studentName;
    private String courseName;
    private LocalDate date;
    private String activityType;
    private String status;
}
