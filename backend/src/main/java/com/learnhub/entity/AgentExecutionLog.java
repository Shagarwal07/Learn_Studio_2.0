package com.learnhub.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "agent_execution_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(callSuper = false)
public class AgentExecutionLog extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_request_id", nullable = false)
    private ExamRequest examRequest;

    @Column(name = "agent_type", nullable = false)
    private String agentType; // MANAGER, THEORY, MATHEMATICS, QUESTION_BANK, EDITOR

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status;

    @Column(name = "execution_time_ms")
    private Long executionTimeMs;

    @Column(columnDefinition = "TEXT")
    private String logOutput;

    public enum Status {
        RUNNING, SUCCESS, WARNING, FAILED
    }
}
