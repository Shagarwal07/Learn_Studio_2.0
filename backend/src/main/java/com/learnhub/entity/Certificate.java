package com.learnhub.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "certificates",
       uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "course_id"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Certificate extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @Column(nullable = false, unique = true)
    private String certificateHash; // Unique verification code

    @Builder.Default
    @Column(nullable = false)
    private LocalDateTime issuedAt = LocalDateTime.now();
}
