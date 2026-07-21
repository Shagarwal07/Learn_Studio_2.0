package com.learnhub.dto;

import lombok.Builder;
import java.time.LocalDate;

@Builder
public record StudentStreakDTO(
    int currentOfflineStreak,
    int bestOfflineStreak,
    int currentOnlineStreak,
    int bestOnlineStreak,
    LocalDate lastUpdatedOffline,
    LocalDate lastUpdatedOnline
) {}
