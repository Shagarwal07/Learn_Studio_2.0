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
    private String finalAnswer; // Added for Solver Agent
    private String calculations; // Added for Solver Agent
    private String solutionSteps; // step-wise math solutions
    private Integer marks;
    private String difficulty;
    private String questionType; // MCQ, SHORT, LONG, NUMERICAL, fill_blank, true_false, matching
    private String confidence; // high, low
    private String agentType; // THEORY, MATHEMATICS, QUESTION_BANK
    private String subject;
    private Integer version;
    private Boolean isApproved;
    private String chapter;
    private String topic;
    private String learningOutcome;
    private String section;
    private Integer questionOrder;
    private String qualityStatus;
    private String bloomLevel;
    private String markingScheme;
    private Integer estimatedTimeMinutes;
}
