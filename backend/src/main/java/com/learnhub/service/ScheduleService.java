package com.learnhub.service;

import com.learnhub.dto.ScheduleEventDTO;
import com.learnhub.entity.Course;
import com.learnhub.entity.ScheduleEvent;
import com.learnhub.entity.User;
import com.learnhub.repository.CourseRepository;
import com.learnhub.repository.EnrollmentRepository;
import com.learnhub.repository.ScheduleEventRepository;
import com.learnhub.repository.UserRepository;
import com.learnhub.repository.BatchRepository;
import com.learnhub.repository.TestRepository;
import com.learnhub.entity.Batch;
import com.learnhub.entity.Test;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class ScheduleService {

    private final ScheduleEventRepository scheduleEventRepository;
    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final BatchRepository batchRepository;
    private final TestRepository testRepository;

    public List<ScheduleEventDTO> getWeeklySchedule(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        LocalDate today = LocalDate.now();
        LocalDate end = today.plusDays(6);

        // Fetch all events
        List<ScheduleEvent> allEvents = scheduleEventRepository.findAll();

        List<ScheduleEventDTO> weeklyEvents = new ArrayList<>();

        for (int i = 0; i < 7; i++) {
            LocalDate d = today.plusDays(i);
            String dayName = d.getDayOfWeek().getDisplayName(java.time.format.TextStyle.FULL, Locale.ENGLISH);

            for (ScheduleEvent e : allEvents) {
                if (e.isRecurring()) {
                    // Check if recurring event start date is on or before d, matches the day, and is not cancelled
                    if (!e.getEventDate().isAfter(d) && e.getRecurrenceDay() != null 
                            && e.getRecurrenceDay().equalsIgnoreCase(dayName) && !e.isCancelled()) {
                        ScheduleEventDTO dto = convertToDTO(e);
                        dto.setEventDate(d);
                        weeklyEvents.add(dto);
                    }
                } else {
                    // Check if non-recurring event date matches d
                    if (e.getEventDate().equals(d)) {
                        weeklyEvents.add(convertToDTO(e));
                    }
                }
            }
        }

        // Sort by event date, then start time
        weeklyEvents.sort(Comparator.comparing(ScheduleEventDTO::getEventDate)
                .thenComparing(ScheduleEventDTO::getStartTime));

        // Filter based on role
        if (user.getRole() == User.Role.ADMIN) {
            return weeklyEvents;
        }

        if (user.getRole() == User.Role.INSTRUCTOR) {
            final Long userId = user.getId();
            return weeklyEvents.stream()
                    .filter(e -> "INSTRUCTOR".equalsIgnoreCase(e.getTargetRole()) 
                            || "ALL".equalsIgnoreCase(e.getTargetRole())
                            || (e.getInstructorId() != null && e.getInstructorId().equals(userId))
                            || e.getCreatedById().equals(userId))
                    .toList();
        }

        // Student Role: Filter by enrolled courses AND batch events (offline)
        final Long studentId = user.getId();
        List<Long> enrolledCourseIds = enrollmentRepository.findByUserId(studentId).stream()
                .map(enrollment -> enrollment.getCourse().getId())
                .toList();

        final Long studentBatchId = user.getBatch() != null ? user.getBatch().getId() : null;

        return weeklyEvents.stream()
                .filter(e -> "STUDENT".equalsIgnoreCase(e.getTargetRole()) 
                        || "ALL".equalsIgnoreCase(e.getTargetRole()))
                .filter(e -> {
                    // If course is set, student must be enrolled
                    if (e.getCourseId() != null) {
                        return enrolledCourseIds.contains(e.getCourseId());
                    }
                    // If batch is set, student must belong to this batch
                    if (e.getBatchId() != null) {
                        return studentBatchId != null && e.getBatchId().equals(studentBatchId);
                    }
                    // General events
                    return true;
                })
                .toList();
    }

    public ScheduleEventDTO createSchedule(String email, ScheduleEventDTO dto) {
        User creator = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Course course = null;
        if (dto.getCourseId() != null) {
            course = courseRepository.findById(dto.getCourseId())
                    .orElseThrow(() -> new RuntimeException("Course not found"));
            
            // If instructor, verify they own/teach this course
            if (creator.getRole() == User.Role.INSTRUCTOR) {
                if (course.getInstructor() == null || !course.getInstructor().getId().equals(creator.getId())) {
                    throw new RuntimeException("You can only schedule events for courses you teach.");
                }
            }
        }

        Batch batch = null;
        if (dto.getBatchId() != null) {
            batch = batchRepository.findById(dto.getBatchId())
                    .orElseThrow(() -> new RuntimeException("Batch not found"));
        }

        ScheduleEvent event = ScheduleEvent.builder()
                .title(dto.getTitle())
                .description(dto.getDescription())
                .eventType(ScheduleEvent.EventType.valueOf(dto.getEventType().toUpperCase()))
                .course(course)
                .batch(batch)
                .subjectName(dto.getSubjectName())
                .instructor(course != null ? course.getInstructor() : (batch != null && batch.getInstructor() != null ? batch.getInstructor() : creator))
                .targetRole(ScheduleEvent.TargetRole.valueOf(dto.getTargetRole().toUpperCase()))
                .eventDate(dto.getEventDate())
                .startTime(dto.getStartTime())
                .endTime(dto.getEndTime())
                .location(dto.getLocation())
                .meetingLink(dto.getMeetingLink())
                .isRecurring(dto.isRecurring())
                .recurrenceDay(dto.getRecurrenceDay())
                .isCancelled(false)
                .createdBy(creator)
                .notifyStudents(dto.isNotifyStudents())
                .notificationSent(false)
                .build();

        ScheduleEvent saved = scheduleEventRepository.save(event);

        // Auto-create Test if event is TEST
        if (saved.getEventType() == ScheduleEvent.EventType.TEST) {
            Test newTest = Test.builder()
                    .title(saved.getTitle())
                    .description(saved.getDescription())
                    .batch(batch) // Assuming batch is mandatory for tests, or handle null appropriately
                    .subjectName(saved.getSubjectName() != null ? saved.getSubjectName() : (course != null ? course.getTitle() : "Unknown Subject"))
                    .testDate(saved.getEventDate())
                    .maxMarks(100) // Default max marks
                    .createdBy(creator)
                    .build();
            testRepository.save(newTest);
        }

        return convertToDTO(saved);
    }

    public ScheduleEventDTO updateSchedule(String email, Long id, ScheduleEventDTO dto) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        ScheduleEvent event = scheduleEventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Schedule event not found"));

        // Permission check
        if (user.getRole() == User.Role.INSTRUCTOR) {
            boolean isCreator = event.getCreatedBy().getId().equals(user.getId());
            boolean teachesCourse = event.getCourse() != null 
                    && event.getCourse().getInstructor() != null 
                    && event.getCourse().getInstructor().getId().equals(user.getId());
            
            if (!isCreator && !teachesCourse) {
                throw new RuntimeException("Unauthorized to update this schedule event.");
            }
        }

        Course course = null;
        if (dto.getCourseId() != null) {
            course = courseRepository.findById(dto.getCourseId())
                    .orElseThrow(() -> new RuntimeException("Course not found"));
        }

        Batch batch = null;
        if (dto.getBatchId() != null) {
            batch = batchRepository.findById(dto.getBatchId())
                    .orElseThrow(() -> new RuntimeException("Batch not found"));
        }

        event.setTitle(dto.getTitle());
        event.setDescription(dto.getDescription());
        event.setEventType(ScheduleEvent.EventType.valueOf(dto.getEventType().toUpperCase()));
        event.setCourse(course);
        event.setBatch(batch);
        event.setSubjectName(dto.getSubjectName());
        event.setTargetRole(ScheduleEvent.TargetRole.valueOf(dto.getTargetRole().toUpperCase()));
        event.setEventDate(dto.getEventDate());
        event.setStartTime(dto.getStartTime());
        event.setEndTime(dto.getEndTime());
        event.setLocation(dto.getLocation());
        event.setMeetingLink(dto.getMeetingLink());
        event.setRecurring(dto.isRecurring());
        event.setRecurrenceDay(dto.getRecurrenceDay());
        event.setCancelled(dto.isCancelled());
        event.setNotifyStudents(dto.isNotifyStudents());

        ScheduleEvent saved = scheduleEventRepository.save(event);
        return convertToDTO(saved);
    }

    public void deleteSchedule(String email, Long id) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        ScheduleEvent event = scheduleEventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Schedule event not found"));

        // Permission check
        if (user.getRole() == User.Role.INSTRUCTOR) {
            boolean isCreator = event.getCreatedBy().getId().equals(user.getId());
            boolean teachesCourse = event.getCourse() != null 
                    && event.getCourse().getInstructor() != null 
                    && event.getCourse().getInstructor().getId().equals(user.getId());
            
            if (!isCreator && !teachesCourse) {
                throw new RuntimeException("Unauthorized to delete this schedule event.");
            }
        }

        scheduleEventRepository.delete(event);
    }

    public List<ScheduleEventDTO> getInstructorSchedules(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<ScheduleEvent> eventsByInstructor = scheduleEventRepository.findByInstructorIdOrderByEventDateAscStartTimeAsc(user.getId());
        List<ScheduleEvent> eventsByCreator = scheduleEventRepository.findByCreatedByIdOrderByEventDateAscStartTimeAsc(user.getId());

        Set<ScheduleEvent> uniqueEvents = new LinkedHashSet<>();
        uniqueEvents.addAll(eventsByInstructor);
        uniqueEvents.addAll(eventsByCreator);

        return uniqueEvents.stream().map(this::convertToDTO).toList();
    }

    public List<ScheduleEventDTO> getAdminSchedules() {
        return scheduleEventRepository.findAll().stream()
                .sorted(Comparator.comparing(ScheduleEvent::getEventDate)
                        .thenComparing(ScheduleEvent::getStartTime))
                .map(this::convertToDTO)
                .toList();
    }

    private ScheduleEventDTO convertToDTO(ScheduleEvent event) {
        boolean isUpdated = (event.getUpdatedAt() != null && event.getCreatedAt() != null 
                && java.time.Duration.between(event.getCreatedAt(), event.getUpdatedAt()).getSeconds() > 5);

        return ScheduleEventDTO.builder()
                .id(event.getId())
                .title(event.getTitle())
                .description(event.getDescription())
                .eventType(event.getEventType().name())
                .courseId(event.getCourse() != null ? event.getCourse().getId() : null)
                .courseTitle(event.getCourse() != null ? event.getCourse().getTitle() : null)
                .instructorId(event.getInstructor() != null ? event.getInstructor().getId() : null)
                .instructorName(event.getInstructor() != null ? event.getInstructor().getName() : null)
                .targetRole(event.getTargetRole().name())
                .eventDate(event.getEventDate())
                .startTime(event.getStartTime())
                .endTime(event.getEndTime())
                .location(event.getLocation())
                .meetingLink(event.getMeetingLink())
                .isRecurring(event.isRecurring())
                .recurrenceDay(event.getRecurrenceDay())
                .isCancelled(event.isCancelled())
                .createdById(event.getCreatedBy().getId())
                .createdByName(event.getCreatedBy().getName())
                .notifyStudents(event.isNotifyStudents())
                .notificationSent(event.isNotificationSent())
                .isUpdated(isUpdated)
                .batchId(event.getBatch() != null ? event.getBatch().getId() : null)
                .batchName(event.getBatch() != null ? event.getBatch().getName() : null)
                .subjectName(event.getSubjectName())
                .createdAt(event.getCreatedAt())
                .updatedAt(event.getUpdatedAt())
                .build();
    }
}
