package com.learnhub.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "exam_requests")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(callSuper = false)
public class ExamRequest extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String subject;

    @Column(nullable = false)
    private String course;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String syllabus;

    @Column(nullable = false)
    private Integer marks;

    @Column(nullable = false)
    private String difficulty;

    @Column(name = "question_pattern", nullable = false)
    private String questionPattern;

    @Column(name = "total_questions", nullable = false)
    private Integer totalQuestions;

    @Column(name = "duration")
    private Integer duration;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Status status = Status.PENDING;

    public enum Status {
        PENDING, RUNNING, GENERATING, VALIDATING, COMPLETED, COMPLETED_WITH_WARNINGS, APPROVED, PUBLISHED, REJECTED, FAILED
    }
}
