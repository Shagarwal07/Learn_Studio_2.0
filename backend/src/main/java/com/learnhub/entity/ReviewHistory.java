package com.learnhub.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "review_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(callSuper = false)
public class ReviewHistory extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "paper_id", nullable = false)
    private GeneratedPaper generatedPaper;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Action action;

    @Column(columnDefinition = "TEXT")
    private String comments;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by_id", nullable = false)
    private User reviewedBy;

    public enum Action {
        APPROVE, REJECT, REQUEST_REGENERATION
    }
}
