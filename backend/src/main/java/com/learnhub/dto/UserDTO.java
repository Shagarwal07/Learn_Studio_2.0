package com.learnhub.dto;

import lombok.Builder;

@Builder
public record UserDTO(
    Long id,
    String name,
    String email,
    String role,
    Long batchId,
    String batchName,
    boolean active,
    String deletedAt,
    String deletedBy,
    String primaryGoogleEmail,
    String secondaryGoogleEmail,
    String avatarUrl
) {}
