package com.learnhub.dto;

import lombok.Builder;
import java.util.List;
import java.util.Set;

@Builder
public record BatchDetailsDTO(
    Long id,
    String name,
    String level,
    List<UserDTO> instructors,
    List<UserDTO> students,
    Set<String> subjects
) {}
