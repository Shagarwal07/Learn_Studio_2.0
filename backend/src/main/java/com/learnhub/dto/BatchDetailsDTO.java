package com.learnhub.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BatchDetailsDTO {
    private Long id;
    private String name;
    private String level;
    private UserDTO instructor;
    private List<UserDTO> students;
    private Set<String> subjects;
}
