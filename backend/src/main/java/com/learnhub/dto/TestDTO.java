package com.learnhub.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TestDTO {
    private Long id;
    private String title;
    private String description;
    private Long batchId;
    private String batchName;
    private String subjectName;
    private LocalDate testDate;
    private Integer maxMarks;
    private String createdByName;
}
