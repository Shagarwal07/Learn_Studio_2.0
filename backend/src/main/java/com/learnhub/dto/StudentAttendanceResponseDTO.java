package com.learnhub.dto;

import lombok.*;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentAttendanceResponseDTO {
    private double overallRate;
    
    private double offlineRate;
    private int offlinePresent;
    private int offlineTotal;
    
    private double onlineRate;
    private int onlineActiveDays;
    private int onlineTotalDays;
    
    private int onlineStreak;
    private double onlineCompletionRate;
    
    private List<AttendanceDTO> offlineRecords;
    private List<OnlineActivityLogDTO> onlineActivities;
    private Map<String, Integer> courseParticipation;
}
