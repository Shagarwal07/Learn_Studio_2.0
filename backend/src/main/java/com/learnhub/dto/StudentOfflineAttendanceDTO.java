package com.learnhub.dto;

import lombok.*;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentOfflineAttendanceDTO {
    private double offlineRate;
    private int offlinePresent;
    private int offlineTotal;
    private List<SubjectStatsDTO> subjectWiseStats;
    private List<AttendanceDTO> records;
}
