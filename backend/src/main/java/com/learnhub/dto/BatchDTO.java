package com.learnhub.dto;

import lombok.Builder;
import java.util.Set;
import java.util.List;

@Builder
public record BatchDTO(
    Long id,
    String name,
    String level,
    List<Long> instructorIds,
    List<UserDTO> instructors,
    Set<String> subjects,
    int studentCount
) {}
