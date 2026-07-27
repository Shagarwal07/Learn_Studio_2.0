package com.learnhub.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentTestResultDTO {
    private Long testId;
    private String testTitle;
    private String subjectName;
    private Integer score;
    private Integer maxMarks;
    private String grade;
    private String feedback;
    private LocalDate testDate;
}
