package com.learnhub.dto;

import lombok.Builder;
import java.util.List;
import java.util.Set;

@Builder
public record BatchDetailsDTO(
    Long id,
    String name,
    String level,
    UserDTO instructor,
    List<UserDTO> students,
    Set<String> subjects
) {}
