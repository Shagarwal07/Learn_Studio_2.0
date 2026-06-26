package com.learnhub.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentAttendanceSummaryDTO {
    private double overallRate;
    private double offlineRate;
    private double onlineRate;
    private int offlinePresent;
    private int offlineAbsent;
    private int offlineTotal;
    private String badge;
}
