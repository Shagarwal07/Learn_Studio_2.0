package com.learnhub.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "homeworks")
@Data 
@NoArgsConstructor 
@AllArgsConstructor 
@Builder
@EqualsAndHashCode(callSuper = false)
public class Homework extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = true)
    @JsonIgnore
    private Course course;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lesson_id")
    @JsonIgnore
    private Lesson lesson;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "batch_id")
    @JsonIgnore
    private Batch batch;

    @Column(name = "subject_name")
    private String subjectName;

    @Column(nullable = false, length = 1024)
    private String fileUrl;

    private String publicId; // Cloudinary public ID

    @Column(nullable = false)
    private LocalDateTime dueDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id", nullable = false)
    @JsonIgnore
    private User createdBy;

    @Builder.Default
    private Boolean isVisible = true;
}
