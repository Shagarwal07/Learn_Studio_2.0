package com.learnhub.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubjectStatsDTO {
    private String subjectName;
    private double percentage;
    private int present;
    private int total;
}
