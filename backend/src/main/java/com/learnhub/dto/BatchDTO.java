package com.learnhub.dto;

import lombok.Builder;
import java.util.Set;

@Builder
public record BatchDTO(
    Long id,
    String name,
    String level,
    Long instructorId,
    String instructorName,
    Set<String> subjects,
    int studentCount
) {}
