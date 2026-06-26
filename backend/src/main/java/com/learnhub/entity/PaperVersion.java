package com.learnhub.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "paper_versions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(callSuper = false)
public class PaperVersion extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "paper_id", nullable = false)
    private GeneratedPaper generatedPaper;

    @Column(nullable = false)
    private Integer version;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String questionsJson; // Serialized list of question IDs or DTOs

    @Column(name = "change_reason")
    private String changeReason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "changed_by_id")
    private User changedBy;
}
