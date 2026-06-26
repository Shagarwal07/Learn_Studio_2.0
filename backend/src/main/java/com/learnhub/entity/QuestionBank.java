package com.learnhub.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "question_bank")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(callSuper = false)
public class QuestionBank extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String questionText;

    @Column(columnDefinition = "TEXT")
    private String options; // JSON string for MCQ options

    @Column(columnDefinition = "TEXT")
    private String correctAnswer;

    @Column(nullable = false)
    private Integer marks;

    @Column(nullable = false)
    private String difficulty;

    @Column(name = "question_type", nullable = false)
    private String questionType;

    @Column(nullable = false)
    private String subject;

    @Column(name = "last_used_at")
    private LocalDate lastUsedAt;
}
