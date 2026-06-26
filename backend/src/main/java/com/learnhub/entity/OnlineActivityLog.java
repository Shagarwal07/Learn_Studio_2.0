package com.learnhub.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "online_activity_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(callSuper = true)
public class OnlineActivityLog extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @Column(name = "course_name", nullable = false)
    private String courseName;

    @Column(nullable = false)
    private LocalDate date;

    @Column(name = "activity_type", nullable = false)
    private String activityType; // e.g., "Lesson Completed", "Quiz Attempted"

    @Column(nullable = false)
    private String status; // e.g., "Completed", "Attempted", "Submitted"
}
