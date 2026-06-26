package com.learnhub.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "schedule_events")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScheduleEvent extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(length = 1000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false)
    private EventType eventType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id")
    private Course course;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "batch_id")
    private Batch batch;

    @Column(name = "subject_name")
    private String subjectName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "instructor_id")
    private User instructor;

    @Enumerated(EnumType.STRING)
    @Column(name = "target_role", nullable = false)
    private TargetRole targetRole;

    @Column(name = "event_date", nullable = false)
    private LocalDate eventDate;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    private String location;

    @Column(name = "meeting_link")
    private String meetingLink;

    @Builder.Default
    @Column(name = "is_recurring", nullable = false)
    private boolean isRecurring = false;

    @Column(name = "recurrence_day")
    private String recurrenceDay;

    @Builder.Default
    @Column(name = "is_cancelled", nullable = false)
    private boolean isCancelled = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id", nullable = false)
    private User createdBy;

    @Builder.Default
    @Column(name = "notify_students", nullable = false)
    private boolean notifyStudents = false;

    @Builder.Default
    @Column(name = "notification_sent", nullable = false)
    private boolean notificationSent = false;

    public enum EventType {
        CLASS, TEST, ASSIGNMENT, SPECIAL, HOLIDAY
    }

    public enum TargetRole {
        STUDENT, INSTRUCTOR, ALL
    }
}
