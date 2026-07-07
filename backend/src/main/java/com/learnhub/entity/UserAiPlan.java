package com.learnhub.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "user_ai_plan")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class UserAiPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", referencedColumnName = "id", nullable = false, unique = true)
    private User user;

    @Column(nullable = false)
    @Builder.Default
    private String planType = "FREE"; // FREE, PREMIUM, BYOK

    @Column(nullable = false)
    @Builder.Default
    private String planStatus = "ACTIVE"; // ACTIVE, EXPIRED, SUSPENDED

    @Column(nullable = false)
    @Builder.Default
    private Integer aiMonthlyLimit = 50;

    @Column(nullable = false)
    @Builder.Default
    private Integer aiMonthlyUsed = 0;

    private String billingOwner;

    @Column(updatable = false)
    @Builder.Default
    private java.time.LocalDateTime createdAt = java.time.LocalDateTime.now();

    @Builder.Default
    private java.time.LocalDateTime updatedAt = java.time.LocalDateTime.now();

    @PreUpdate
    public void setUpdatedAt() {
        this.updatedAt = java.time.LocalDateTime.now();
    }
}
