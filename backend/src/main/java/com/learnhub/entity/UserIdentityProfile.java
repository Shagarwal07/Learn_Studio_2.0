package com.learnhub.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "user_identity_profile")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class UserIdentityProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", referencedColumnName = "id", nullable = false)
    private User user;

    @Column(name = "is_primary")
    private boolean isPrimary;

    private String googleEmail;
    
    private String googleSub;
    private String googleName;
    @Column(columnDefinition = "TEXT")
    private String googlePictureUrl;

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
