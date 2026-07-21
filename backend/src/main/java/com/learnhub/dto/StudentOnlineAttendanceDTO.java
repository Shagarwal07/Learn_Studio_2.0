package com.learnhub.dto;

import lombok.Builder;
import java.util.List;
import java.util.Map;

@Builder
public record StudentOnlineAttendanceDTO(
    double onlineRate,
    int onlineActiveDays,
    int onlineTotalDays,
    int streak,
    double completionRate,
    List<OnlineActivityLogDTO> activities,
    Map<String, Integer> courseParticipation
) {}
