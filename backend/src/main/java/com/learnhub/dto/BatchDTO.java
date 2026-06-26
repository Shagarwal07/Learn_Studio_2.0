package com.learnhub.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BatchDTO {
    private Long id;
    private String name;
    private String level;
    private Long instructorId;
    private String instructorName;
    private Set<String> subjects;
    private int studentCount;
}
