package com.learnhub.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "lesson_progress",
       uniqueConstraints = @UniqueConstraint(columnNames = {"enrollment_id", "lesson_id"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LessonProgress extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "enrollment_id", nullable = false)
    private Enrollment enrollment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lesson_id", nullable = false)
    private Lesson lesson;

    @Builder.Default
    private boolean completed = false;
    private LocalDateTime completedAt;

    private Integer lastWatchedSeconds;
    private LocalDateTime lastAccessedAt;
}