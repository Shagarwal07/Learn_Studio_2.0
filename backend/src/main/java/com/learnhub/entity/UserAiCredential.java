package com.learnhub.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "user_ai_credentials")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class UserAiCredential extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String provider; // e.g., "GEMINI", "OPENROUTER"

    @Column(nullable = false, length = 1024)
    private String encryptedApiKey;

    @Column(nullable = false, length = 50)
    private String keyLast4;

    @Column(nullable = false, length = 256)
    private String keyHash; // SHA-256 hash to prevent users from adding duplicate keys

    @Builder.Default
    @Column(nullable = false)
    private Boolean active = true;
}
