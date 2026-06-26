package com.learnhub.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "lessons")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Lesson extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    private String videoUrl;

    private String duration;

    private Integer position; // order in course

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;
}
