package com.learnhub.dto;

import lombok.Builder;
import java.time.LocalDateTime;

@Builder
public record ReviewDTO(
    Long id,
    Long userId,
    String studentName,
    Integer rating,
    String comment,
    LocalDateTime createdAt
) {}
