package com.learnhub.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "quiz_attempts")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(callSuper = true)
public class QuizAttempt extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String topic;

    @Column(nullable = false)
    private Integer score;

    @Column(nullable = false)
    private Integer totalQuestions;
}
