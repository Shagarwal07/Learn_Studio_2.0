package com.learnhub.dto;

import lombok.Builder;

@Builder
public record StudentAttendanceSummaryDTO(
    double overallRate,
    double offlineRate,
    double onlineRate,
    int offlinePresent,
    int offlineAbsent,
    int offlineTotal,
    String badge
) {}
