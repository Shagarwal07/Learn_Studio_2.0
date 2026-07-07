package com.learnhub.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "ai_usage_logs")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class AiUsageLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private String planType;
    private String provider;
    private String model;
    private String feature;

    @Builder.Default
    private Integer tokensUsed = 0;

    @Column(precision = 10, scale = 6)
    @Builder.Default
    private BigDecimal estimatedCost = BigDecimal.ZERO;

    @Builder.Default
    private Long latencyMs = 0L;

    @Builder.Default
    private Boolean success = true;

    @Column(columnDefinition = "TEXT")
    private String errorType;

    @Column(updatable = false)
    @Builder.Default
    private java.time.LocalDateTime createdAt = java.time.LocalDateTime.now();
}
