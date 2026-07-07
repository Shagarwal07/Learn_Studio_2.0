package com.learnhub.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExamRequestDTO {
    private Long id;
    private String subject;
    private String course;
    private String syllabus;
    private Integer marks;
    private String difficulty;
    private String questionPattern;
    private Integer totalQuestions;
    private Integer duration;
    private String status;
    private LocalDateTime createdAt;
}
