package com.learnhub.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "announcements")
@Data 
@NoArgsConstructor 
@AllArgsConstructor 
@Builder
@EqualsAndHashCode(callSuper = false)
public class Announcement extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    private String imageUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TargetRole targetRole;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id")
    @JsonIgnore
    private Course course;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "batch_id")
    @JsonIgnore
    private Batch batch;

    private String instagramUrl;

    private String externalLink;

    @Builder.Default
    private Boolean pinned = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id", nullable = false)
    @JsonIgnore
    private User createdBy;

    public enum TargetRole { ALL, STUDENT, INSTRUCTOR }
}
