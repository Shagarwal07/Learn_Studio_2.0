package com.learnhub.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GeneratedQuestionDTO {
    private Long id;
    private String questionText;
    private String options; // JSON string for MCQ options
    private String correctAnswer;
    private String solutionSteps; // step-wise math solutions
    private Integer marks;
    private String difficulty;
    private String questionType; // MCQ, SHORT, LONG, NUMERICAL
    private String agentType; // THEORY, MATHEMATICS, QUESTION_BANK
    private String subject;
    private Integer version;
    private Boolean isApproved;
}
