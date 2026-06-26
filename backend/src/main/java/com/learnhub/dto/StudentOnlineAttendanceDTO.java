package com.learnhub.dto;

import lombok.*;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentOnlineAttendanceDTO {
    private double onlineRate;
    private int onlineActiveDays;
    private int onlineTotalDays;
    private int streak;
    private double completionRate;
    private List<OnlineActivityLogDTO> activities;
    private Map<String, Integer> courseParticipation;
}
