package com.learnhub.dto;

import lombok.Builder;

@Builder
public record SubjectStatsDTO(
    String subjectName,
    double percentage,
    int present,
    int total
) {}
