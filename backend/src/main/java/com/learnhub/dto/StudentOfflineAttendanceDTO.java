package com.learnhub.dto;

import lombok.Builder;
import java.util.List;

@Builder
public record StudentOfflineAttendanceDTO(
    double offlineRate,
    int offlinePresent,
    int offlineTotal,
    List<SubjectStatsDTO> subjectWiseStats,
    List<AttendanceDTO> records
) {}
