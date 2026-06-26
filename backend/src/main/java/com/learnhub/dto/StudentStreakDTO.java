package com.learnhub.dto;

import lombok.*;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentStreakDTO {
    private int currentOfflineStreak;
    private int bestOfflineStreak;
    private int currentOnlineStreak;
    private int bestOnlineStreak;
    private LocalDate lastUpdatedOffline;
    private LocalDate lastUpdatedOnline;
}
