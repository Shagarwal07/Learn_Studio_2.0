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

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "paper_questions",
        joinColumns = @JoinColumn(name = "paper_id"),
        inverseJoinColumns = @JoinColumn(name = "question_id")
    )
    private List<GeneratedQuestion> questions;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Status status = Status.DRAFT;

    @Column(nullable = false)
    @Builder.Default
    private Integer version = 1;

    @Column(name = "file_url")
    private String fileUrl;

    public enum Status {
        DRAFT, UNDER_REVIEW, REVISION_NEEDED, APPROVED, PUBLISHED
    }
}
