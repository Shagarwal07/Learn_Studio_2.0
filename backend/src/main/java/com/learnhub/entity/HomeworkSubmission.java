package com.learnhub.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "homework_submissions")
@Data 
@NoArgsConstructor 
@AllArgsConstructor 
@Builder
@EqualsAndHashCode(callSuper = false)
public class HomeworkSubmission extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "homework_id", nullable = false)
    @JsonIgnore
    private Homework homework;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    @JsonIgnore
    private User student;

    @Column(nullable = false, length = 1024)
    private String submissionFileUrl;

    private String publicId; // Cloudinary public ID

    @Column(nullable = false)
    private LocalDateTime submittedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status;

    @Column(columnDefinition = "TEXT")
    private String feedback;

    private Double marks;

    public enum Status { SUBMITTED, LATE, REVIEWED }
}
