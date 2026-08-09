package com.learnhub.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.List;

@Entity
@Table(name = "generated_papers")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(callSuper = false)
public class GeneratedPaper extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_request_id", nullable = false)
    private ExamRequest examRequest;

    @Column(nullable = false)
    private String title;

    @Column(name = "total_marks", nullable = false)
    private Integer totalMarks;

    @Column(name = "firestore_document_id")
    private String firestoreDocumentId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Status status = Status.DRAFT;

    @Column(nullable = false)
    @Builder.Default
    private Integer version = 1;

    public enum Status {
        DRAFT, UNDER_REVIEW, REVISION_NEEDED, REVIEWED, APPROVED, EXPORTED, PUBLISHED
    }
}
