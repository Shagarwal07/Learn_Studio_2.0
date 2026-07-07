package com.learnhub.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "generated_questions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(callSuper = false)
public class GeneratedQuestion extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String questionText;

    @Column(columnDefinition = "TEXT")
    private String options; // JSON string for MCQ options

    @Column(columnDefinition = "TEXT")
    private String correctAnswer;

    @Column(columnDefinition = "TEXT")
    private String solutionSteps; // step-by-step math solutions

    @Column(nullable = false)
    private Integer marks;

    @Column(nullable = false)
    private String difficulty;

    @Column(name = "question_type", nullable = false)
    private String questionType; // MCQ, SHORT, LONG, NUMERICAL

    @Column(name = "agent_type", nullable = false)
    private String agentType; // THEORY, MATHEMATICS, QUESTION_BANK

    @Column(nullable = false)
    private String subject;

    @Column(name = "chapter")
    private String chapter;

    @Column(name = "topic")
    private String topic;

    @Column(name = "learning_outcome")
    private String learningOutcome;

    @Column(name = "section")
    private String section;

    @Column(name = "question_order")
    private Integer questionOrder;

    @Column(nullable = false)
    @Builder.Default
    private Integer version = 1;

    @Column(name = "quality_status")
    private String qualityStatus;

    @Column(name = "is_approved", nullable = false)
    @Builder.Default
    private Boolean isApproved = true;

    @Column(name = "bloom_level")
    private String bloomLevel;

    @Column(name = "marking_scheme", columnDefinition = "TEXT")
    private String markingScheme;

    @Column(name = "estimated_time_minutes")
    private Integer estimatedTimeMinutes;
}
