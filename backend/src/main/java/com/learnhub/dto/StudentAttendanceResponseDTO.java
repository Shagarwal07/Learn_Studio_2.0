package com.learnhub.dto;

import lombok.Builder;
import java.util.List;
import java.util.Map;

@Builder
public record StudentAttendanceResponseDTO(
    double overallRate,
    double offlineRate,
    int offlinePresent,
    int offlineTotal,
    double onlineRate,
    int onlineActiveDays,
    int onlineTotalDays,
    int onlineStreak,
    double onlineCompletionRate,
    List<AttendanceDTO> offlineRecords,
    List<OnlineActivityLogDTO> onlineActivities,
    Map<String, Integer> courseParticipation
) {}
