package com.learnhub.service;

import com.learnhub.dto.*;
import com.learnhub.entity.*;
import com.learnhub.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final OnlineActivityLogRepository onlineActivityLogRepository;
    private final UserRepository userRepository;
    private final LessonProgressRepository lessonProgressRepository;
    private final HomeworkSubmissionRepository homeworkSubmissionRepository;
    private final QuizAttemptRepository quizAttemptRepository;

    private static final String DEMO_EMAIL = "demo@learnstudio.com";

    // ────────────────────────────────────────────────────────────────────────
    // STUDENT ENDPOINTS (DYNAMIC + DEMO FALLBACK)
    // ────────────────────────────────────────────────────────────────────────

    public StudentAttendanceSummaryDTO getSummary(String email) {
        if (DEMO_EMAIL.equals(email)) {
            return getDemoSummary();
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        // 1. Calculate Offline Stats
        List<Attendance> offlineRecords = attendanceRepository.findByStudentIdOrderByDateDesc(user.getId());
        int offlineTotal = offlineRecords.size();
        int offlinePresent = (int) offlineRecords.stream()
                .filter(r -> r.getStatus() == Attendance.Status.PRESENT)
                .count();
        int offlineAbsent = offlineTotal - offlinePresent;
        double offlineRate = offlineTotal > 0 ? ((double) offlinePresent / offlineTotal) * 100.0 : 0.0;

        // 2. Calculate Online Stats (from dynamic merged sources)
        List<OnlineActivityLogDTO> onlineLogs = getMergedOnlineActivities(user.getId());
        
        LocalDate registerDate = user.getCreatedAt() != null ? user.getCreatedAt().toLocalDate() : LocalDate.now().minusDays(30);
        int onlineTotalDays = Math.max(1, (int) java.time.temporal.ChronoUnit.DAYS.between(registerDate, LocalDate.now()) + 1);
        if (onlineTotalDays > 30) {
            onlineTotalDays = 30; // 30-day tracking window
        }
        
        LocalDate limitDate = LocalDate.now().minusDays(onlineTotalDays);
        Set<LocalDate> activeDates = onlineLogs.stream()
                .map(OnlineActivityLogDTO::getDate)
                .filter(date -> !date.isBefore(limitDate))
                .collect(Collectors.toSet());
        
        int onlineActiveDays = activeDates.size();
        double onlineRate = ((double) onlineActiveDays / onlineTotalDays) * 100.0;
        if (onlineRate > 100.0) {
            onlineRate = 100.0;
        }

        // 3. Calculate Overall Rate
        double overallRate = (offlineRate + onlineRate) / 2.0;

        // 4. Determine Badge
        String badge = "Critical Attendance";
        if (overallRate >= 85) {
            badge = "Good Attendance";
        } else if (overallRate >= 75) {
            badge = "Needs Attention";
        }

        return StudentAttendanceSummaryDTO.builder()
                .overallRate(Math.round(overallRate * 10.0) / 10.0)
                .offlineRate(Math.round(offlineRate * 10.0) / 10.0)
                .onlineRate(Math.round(onlineRate * 10.0) / 10.0)
                .offlinePresent(offlinePresent)
                .offlineAbsent(offlineAbsent)
                .offlineTotal(offlineTotal)
                .badge(badge)
                .build();
    }

    public StudentOfflineAttendanceDTO getOfflineAttendance(String email) {
        if (DEMO_EMAIL.equals(email)) {
            return getDemoOfflineAttendance();
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        List<Attendance> records = attendanceRepository.findByStudentIdOrderByDateDesc(user.getId());
        int total = records.size();
        int present = (int) records.stream()
                .filter(r -> r.getStatus() == Attendance.Status.PRESENT)
                .count();
        double rate = total > 0 ? ((double) present / total) * 100.0 : 0.0;

        // Group by subject for subject-wise stats
        Map<String, List<Attendance>> grouped = records.stream()
                .collect(Collectors.groupingBy(Attendance::getSubjectName));

        List<SubjectStatsDTO> subjectStats = grouped.keySet().stream().map(subject -> {
            List<Attendance> list = grouped.get(subject);
            int subTotal = list.size();
            int subPresent = (int) list.stream().filter(r -> r.getStatus() == Attendance.Status.PRESENT).count();
            double subRate = subTotal > 0 ? ((double) subPresent / subTotal) * 100.0 : 0.0;
            return SubjectStatsDTO.builder()
                    .subjectName(subject)
                    .percentage(Math.round(subRate * 10.0) / 10.0)
                    .present(subPresent)
                    .total(subTotal)
                    .build();
        }).sorted(Comparator.comparingDouble(SubjectStatsDTO::getPercentage).reversed()).toList();

        List<AttendanceDTO> recordDTOs = records.stream()
                .map(this::convertToOfflineDTO)
                .toList();

        return StudentOfflineAttendanceDTO.builder()
                .offlineRate(Math.round(rate * 10.0) / 10.0)
                .offlinePresent(present)
                .offlineTotal(total)
                .subjectWiseStats(subjectStats)
                .records(recordDTOs)
                .build();
    }

    public StudentOnlineAttendanceDTO getOnlineAttendance(String email) {
        if (DEMO_EMAIL.equals(email)) {
            return getDemoOnlineAttendance();
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        List<OnlineActivityLogDTO> activities = getMergedOnlineActivities(user.getId());
        
        LocalDate registerDate = user.getCreatedAt() != null ? user.getCreatedAt().toLocalDate() : LocalDate.now().minusDays(30);
        int onlineTotalDays = Math.max(1, (int) java.time.temporal.ChronoUnit.DAYS.between(registerDate, LocalDate.now()) + 1);
        if (onlineTotalDays > 30) {
            onlineTotalDays = 30; // 30-day tracking window
        }
        
        LocalDate limitDate = LocalDate.now().minusDays(onlineTotalDays);
        Set<LocalDate> activeDates = activities.stream()
                .map(OnlineActivityLogDTO::getDate)
                .filter(date -> !date.isBefore(limitDate))
                .collect(Collectors.toSet());
        
        int onlineActiveDays = activeDates.size();
        double onlineRate = ((double) onlineActiveDays / onlineTotalDays) * 100.0;
        if (onlineRate > 100.0) {
            onlineRate = 100.0;
        }

        int streak = calculateOnlineStreak(activeDates);

        // Calculate course-wise participation
        Map<String, Integer> courseParticipation = activities.stream()
                .collect(Collectors.groupingBy(
                        OnlineActivityLogDTO::getCourseName,
                        Collectors.summingInt(x -> 1)
                ));

        // Calculate dynamic completion rate across all enrollments
        List<Enrollment> enrollments = user.getEnrollments();
        double completionRate = 0.0;
        if (enrollments != null && !enrollments.isEmpty()) {
            double totalProgress = enrollments.stream()
                    .mapToDouble(Enrollment::getProgress)
                    .sum();
            completionRate = totalProgress / enrollments.size();
        }

        return StudentOnlineAttendanceDTO.builder()
                .onlineRate(Math.round(onlineRate * 10.0) / 10.0)
                .onlineActiveDays(onlineActiveDays)
                .onlineTotalDays(onlineTotalDays)
                .streak(streak)
                .completionRate(Math.round(completionRate * 10.0) / 10.0) // Dynamic platform completion rate
                .activities(activities)
                .courseParticipation(courseParticipation)
                .build();
    }

    public StudentStreakDTO getStreak(String email) {
        if (DEMO_EMAIL.equals(email)) {
            return getDemoStreak();
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        // 1. Offline Streak calculations
        List<Attendance> offlineRecords = attendanceRepository.findByStudentIdOrderByDateDesc(user.getId());
        int currentOffline = calculateCurrentOfflineStreak(offlineRecords);
        int bestOffline = calculateBestOfflineStreak(offlineRecords);
        LocalDate lastOffline = offlineRecords.isEmpty() ? null : offlineRecords.get(0).getDate();

        // 2. Online Streak calculations
        List<OnlineActivityLogDTO> onlineLogs = getMergedOnlineActivities(user.getId());
        Set<LocalDate> activeDates = onlineLogs.stream()
                .map(OnlineActivityLogDTO::getDate)
                .collect(Collectors.toSet());
        int currentOnline = calculateOnlineStreak(activeDates);
        int bestOnline = calculateBestOnlineStreak(activeDates);
        LocalDate lastOnline = onlineLogs.isEmpty() ? null : onlineLogs.get(0).getDate();

        return StudentStreakDTO.builder()
                .currentOfflineStreak(currentOffline)
                .bestOfflineStreak(bestOffline)
                .currentOnlineStreak(currentOnline)
                .bestOnlineStreak(bestOnline)
                .lastUpdatedOffline(lastOffline)
                .lastUpdatedOnline(lastOnline)
                .build();
    }

    // ────────────────────────────────────────────────────────────────────────
    // INSTRUCTOR ENDPOINTS (DATABASE-DRIVEN WRITE / UPDATE / DELETE)
    // ────────────────────────────────────────────────────────────────────────

    public AttendanceDTO markAttendance(InstructorAttendanceMarkRequest request) {
        User student = userRepository.findById(request.getStudentId())
                .orElseThrow(() -> new RuntimeException("Student not found"));

        if (student.getRole() != User.Role.STUDENT) {
            throw new RuntimeException("Attendance can only be marked for students.");
        }

        String dayOfWeek = request.getDate().getDayOfWeek()
                .getDisplayName(TextStyle.FULL, Locale.ENGLISH);

        Attendance attendance = Attendance.builder()
                .student(student)
                .subjectName(request.getSubjectName())
                .date(request.getDate())
                .day(dayOfWeek)
                .status(Attendance.Status.valueOf(request.getStatus().toUpperCase()))
                .build();

        Attendance saved = attendanceRepository.save(attendance);
        return convertToOfflineDTO(saved);
    }

    public AttendanceDTO updateAttendance(Long id, String status) {
        Attendance attendance = attendanceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Attendance record not found"));

        attendance.setStatus(Attendance.Status.valueOf(status.toUpperCase()));
        Attendance updated = attendanceRepository.save(attendance);
        return convertToOfflineDTO(updated);
    }

    public void deleteAttendance(Long id) {
        Attendance attendance = attendanceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Attendance record not found"));
        attendanceRepository.delete(attendance);
    }

    // ────────────────────────────────────────────────────────────────────────
    // DYNAMIC ONLINE ACTIVITY AGGREGATOR ENGINE
    // ────────────────────────────────────────────────────────────────────────

    private List<OnlineActivityLogDTO> getMergedOnlineActivities(Long userId) {
        List<OnlineActivityLogDTO> list = new ArrayList<>();

        // 1. Fetch Completed Lessons
        List<LessonProgress> completedLessons = lessonProgressRepository.findByEnrollmentUserIdOrderByLastAccessedAtDesc(userId);
        for (LessonProgress lp : completedLessons) {
            if (lp.isCompleted() && lp.getCompletedAt() != null) {
                list.add(OnlineActivityLogDTO.builder()
                        .id(lp.getId() * 1000 + 1) // Unique synthetic ID
                        .studentId(userId)
                        .studentName(lp.getEnrollment().getUser().getName())
                        .courseName(lp.getLesson().getCourse().getTitle())
                        .date(lp.getCompletedAt().toLocalDate())
                        .activityType("Lesson Completed")
                        .status("Completed")
                        .build());
            }
        }

        // 2. Fetch Homework Submissions
        List<HomeworkSubmission> submissions = homeworkSubmissionRepository.findByStudentId(userId);
        for (HomeworkSubmission sub : submissions) {
            if (sub.getSubmittedAt() != null) {
                list.add(OnlineActivityLogDTO.builder()
                        .id(sub.getId() * 1000 + 2)
                        .studentId(userId)
                        .studentName(sub.getStudent().getName())
                        .courseName(sub.getHomework().getCourse().getTitle())
                        .date(sub.getSubmittedAt().toLocalDate())
                        .activityType("Assignment Submitted")
                        .status(sub.getStatus().name())
                        .build());
            }
        }

        // 3. Fetch Quiz Attempts
        List<QuizAttempt> quizzes = quizAttemptRepository.findByUserId(userId);
        for (QuizAttempt qa : quizzes) {
            if (qa.getCreatedAt() != null) {
                list.add(OnlineActivityLogDTO.builder()
                        .id(qa.getId() * 1000 + 3)
                        .studentId(userId)
                        .studentName(qa.getUser().getName())
                        .courseName(qa.getTopic())
                        .date(qa.getCreatedAt().toLocalDate())
                        .activityType("Quiz Attempted")
                        .status("Score: " + qa.getScore() + "/" + qa.getTotalQuestions())
                        .build());
            }
        }

        // 4. Fetch custom OnlineActivityLog entries (login, active time)
        List<OnlineActivityLog> customLogs = onlineActivityLogRepository.findByStudentIdOrderByDateDesc(userId);
        for (OnlineActivityLog log : customLogs) {
            list.add(OnlineActivityLogDTO.builder()
                    .id(log.getId() * 1000 + 4)
                    .studentId(userId)
                    .studentName(log.getStudent().getName())
                    .courseName(log.getCourseName())
                    .date(log.getDate())
                    .activityType(log.getActivityType())
                    .status(log.getStatus())
                    .build());
        }

        // Sort all logs by date descending (newest first)
        list.sort(Comparator.comparing(OnlineActivityLogDTO::getDate).reversed());
        return list;
    }

    // ────────────────────────────────────────────────────────────────────────
    // STREAK CALCULATOR ALGORITHMS
    // ────────────────────────────────────────────────────────────────────────

    private int calculateCurrentOfflineStreak(List<Attendance> records) {
        if (records.isEmpty()) {
            return 0;
        }

        // Sort chronologically (oldest first) to find streaks
        List<Attendance> sorted = records.stream()
                .sorted(Comparator.comparing(Attendance::getDate))
                .toList();

        int currentStreak = 0;
        for (Attendance record : sorted) {
            if (record.getStatus() == Attendance.Status.PRESENT) {
                currentStreak++;
            } else {
                currentStreak = 0; // Break streak if absent
            }
        }
        return currentStreak;
    }

    private int calculateBestOfflineStreak(List<Attendance> records) {
        if (records.isEmpty()) {
            return 0;
        }

        List<Attendance> sorted = records.stream()
                .sorted(Comparator.comparing(Attendance::getDate))
                .toList();

        int maxStreak = 0;
        int currentStreak = 0;
        for (Attendance record : sorted) {
            if (record.getStatus() == Attendance.Status.PRESENT) {
                currentStreak++;
                if (currentStreak > maxStreak) {
                    maxStreak = currentStreak;
                }
            } else {
                currentStreak = 0;
            }
        }
        return maxStreak;
    }

    private int calculateOnlineStreak(Set<LocalDate> activeDates) {
        if (activeDates.isEmpty()) {
            return 0;
        }

        LocalDate checkDate = LocalDate.now();
        // If today has no activity, check yesterday to see if streak is still alive
        if (!activeDates.contains(checkDate)) {
            checkDate = checkDate.minusDays(1);
        }

        int streak = 0;
        while (activeDates.contains(checkDate)) {
            streak++;
            checkDate = checkDate.minusDays(1);
        }
        return streak;
    }

    private int calculateBestOnlineStreak(Set<LocalDate> activeDates) {
        if (activeDates.isEmpty()) {
            return 0;
        }

        List<LocalDate> sortedDates = activeDates.stream()
                .sorted()
                .toList();

        int maxStreak = 0;
        int currentStreak = 0;
        LocalDate prevDate = null;

        for (LocalDate date : sortedDates) {
            if (prevDate == null) {
                currentStreak = 1;
            } else if (date.minusDays(1).equals(prevDate)) {
                currentStreak++;
            } else if (!date.equals(prevDate)) {
                currentStreak = 1; // Gap in days, reset streak
            }

            if (currentStreak > maxStreak) {
                maxStreak = currentStreak;
            }
            prevDate = date;
        }
        return maxStreak;
    }

    // ────────────────────────────────────────────────────────────────────────
    // TEMPORARY DEMO MODE FALLBACKS (email: demo@learnstudio.com)
    // ────────────────────────────────────────────────────────────────────────

    private StudentAttendanceSummaryDTO getDemoSummary() {
        return StudentAttendanceSummaryDTO.builder()
                .overallRate(90.0)
                .offlineRate(88.0)
                .onlineRate(92.0)
                .offlinePresent(44)
                .offlineAbsent(6)
                .offlineTotal(50)
                .badge("Good Attendance")
                .build();
    }

    private StudentOfflineAttendanceDTO getDemoOfflineAttendance() {
        List<SubjectStatsDTO> subjectStats = List.of(
                new SubjectStatsDTO("English", 92.0, 23, 25),
                new SubjectStatsDTO("Mathematics", 81.0, 17, 21),
                new SubjectStatsDTO("Science", 85.0, 17, 20),
                new SubjectStatsDTO("Social Science", 88.0, 22, 25),
                new SubjectStatsDTO("Hindi", 88.0, 22, 25)
        );

        List<AttendanceDTO> demoRecords = new ArrayList<>();
        LocalDate current = LocalDate.now().minusDays(1);
        String[] subjects = {"English", "Hindi", "Mathematics", "Science", "Social Science"};
        
        for (int i = 0; i < 50; i++) {
            while (current.getDayOfWeek() == java.time.DayOfWeek.SATURDAY || current.getDayOfWeek() == java.time.DayOfWeek.SUNDAY) {
                current = current.minusDays(1);
            }
            String subject = subjects[i % subjects.length];
            String dayStr = current.getDayOfWeek().getDisplayName(TextStyle.FULL, Locale.ENGLISH);
            String status = (i == 7 || i == 15 || i == 23 || i == 31 || i == 39 || i == 47) ? "ABSENT" : "PRESENT";
            
            demoRecords.add(AttendanceDTO.builder()
                    .id((long) (i + 1))
                    .studentId(999L)
                    .studentName("Demo Student")
                    .subjectName(subject)
                    .date(current)
                    .day(dayStr)
                    .status(status)
                    .build());
            
            current = current.minusDays(1);
        }

        return StudentOfflineAttendanceDTO.builder()
                .offlineRate(88.0)
                .offlinePresent(44)
                .offlineTotal(50)
                .subjectWiseStats(subjectStats)
                .records(demoRecords)
                .build();
    }

    private StudentOnlineAttendanceDTO getDemoOnlineAttendance() {
        List<OnlineActivityLogDTO> demoActivities = new ArrayList<>();
        String[] courses = {"Python Programming", "Web Development", "AWS Fundamentals", "AI Foundations"};
        String[] activityTypes = {"Lesson Completed", "Quiz Attempted", "Assignment Submitted"};
        String[] statuses = {"Completed", "Attempted", "Submitted"};
        
        LocalDate current = LocalDate.now();
        int logId = 1;
        
        for (int i = 0; i < 25; i++) {
            if (i == 3 || i == 10) continue; // Inactive days
            
            LocalDate activeDate = current.minusDays(i);
            demoActivities.add(OnlineActivityLogDTO.builder()
                    .id((long) logId++)
                    .studentId(999L)
                    .studentName("Demo Student")
                    .courseName(courses[i % courses.length])
                    .date(activeDate)
                    .activityType(activityTypes[i % activityTypes.length])
                    .status(statuses[i % statuses.length])
                    .build());
            
            if (i % 5 == 0) {
                demoActivities.add(OnlineActivityLogDTO.builder()
                        .id((long) logId++)
                        .studentId(999L)
                        .studentName("Demo Student")
                        .courseName(courses[(i + 1) % courses.length])
                        .date(activeDate)
                        .activityType(activityTypes[(i + 1) % activityTypes.length])
                        .status(statuses[(i + 1) % statuses.length])
                        .build());
            }
        }

        Map<String, Integer> coursePart = Map.of(
                "Python Programming", 8,
                "Web Development", 7,
                "AWS Fundamentals", 5,
                "AI Foundations", 4
        );

        return StudentOnlineAttendanceDTO.builder()
                .onlineRate(92.0)
                .onlineActiveDays(23)
                .onlineTotalDays(25)
                .streak(5)
                .completionRate(92.0)
                .activities(demoActivities)
                .courseParticipation(coursePart)
                .build();
    }

    private StudentStreakDTO getDemoStreak() {
        return StudentStreakDTO.builder()
                .currentOfflineStreak(4)
                .bestOfflineStreak(12)
                .currentOnlineStreak(5)
                .bestOnlineStreak(8)
                .lastUpdatedOffline(LocalDate.now().minusDays(1))
                .lastUpdatedOnline(LocalDate.now())
                .build();
    }

    private AttendanceDTO convertToOfflineDTO(Attendance record) {
        return AttendanceDTO.builder()
                .id(record.getId())
                .studentId(record.getStudent().getId())
                .studentName(record.getStudent().getName())
                .subjectName(record.getSubjectName())
                .date(record.getDate())
                .day(record.getDay())
                .status(record.getStatus().name())
                .build();
    }

    public List<UserDTO> getStudentsList() {
        return userRepository.findByRole(User.Role.STUDENT).stream()
                .map(u -> UserDTO.builder()
                        .id(u.getId())
                        .name(u.getName())
                        .email(u.getEmail())
                        .role(u.getRole().name())
                        .build())
                .toList();
    }

    public StudentOfflineAttendanceDTO getStudentAttendanceById(Long studentId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        List<Attendance> records = attendanceRepository.findByStudentIdOrderByDateDesc(student.getId());
        int total = records.size();
        int present = (int) records.stream()
                .filter(r -> r.getStatus() == Attendance.Status.PRESENT)
                .count();
        double rate = total > 0 ? ((double) present / total) * 100.0 : 0.0;

        Map<String, List<Attendance>> grouped = records.stream()
                .collect(Collectors.groupingBy(Attendance::getSubjectName));

        List<SubjectStatsDTO> subjectStats = grouped.keySet().stream().map(subject -> {
            List<Attendance> list = grouped.get(subject);
            int subTotal = list.size();
            int subPresent = (int) list.stream().filter(r -> r.getStatus() == Attendance.Status.PRESENT).count();
            double subRate = subTotal > 0 ? ((double) subPresent / subTotal) * 100.0 : 0.0;
            return SubjectStatsDTO.builder()
                    .subjectName(subject)
                    .percentage(Math.round(subRate * 10.0) / 10.0)
                    .present(subPresent)
                    .total(subTotal)
                    .build();
        }).sorted(Comparator.comparingDouble(SubjectStatsDTO::getPercentage).reversed()).toList();

        List<AttendanceDTO> recordDTOs = records.stream()
                .map(this::convertToOfflineDTO)
                .toList();

        return StudentOfflineAttendanceDTO.builder()
                .offlineRate(Math.round(rate * 10.0) / 10.0)
                .offlinePresent(present)
                .offlineTotal(total)
                .subjectWiseStats(subjectStats)
                .records(recordDTOs)
                .build();
    }
}
