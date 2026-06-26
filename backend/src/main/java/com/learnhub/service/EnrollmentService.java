package com.learnhub.service;

import com.learnhub.dto.CertificateDTO;
import com.learnhub.dto.CourseProgressDTO;
import com.learnhub.dto.LessonProgressDTO;
import com.learnhub.entity.*;
import com.learnhub.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Service;
import java.util.*;
import java.time.LocalDateTime;
import java.util.stream.Collectors;

@Transactional
@Service
@RequiredArgsConstructor
public class EnrollmentService {

    private final EnrollmentRepository enrollmentRepository;
    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final LessonRepository lessonRepository;
    private final LessonProgressRepository lessonProgressRepository;
    private final CertificateRepository certificateRepository;

    public Enrollment enroll(String userEmail, Long courseId) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));

        if (enrollmentRepository.existsByUserIdAndCourseId(user.getId(), courseId)) {
            throw new RuntimeException("Already enrolled in this course");
        }
        return enrollmentRepository.save(
                Enrollment.builder().user(user).course(course).progress(0).build());
    }

    public List<Map<String, Object>> getMyEnrollments(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return enrollmentRepository.findByUserId(user.getId()).stream()
                .map(e -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("enrollmentId", e.getId());
                    map.put("courseId", e.getCourse().getId());
                    map.put("courseTitle", e.getCourse().getTitle());
                    map.put("enrolledAt", e.getEnrolledAt());

                    // Calculate progress dynamically
                    List<Lesson> lessons = lessonRepository.findByCourseIdOrderByPosition(e.getCourse().getId());
                    long totalLessons = lessons.size();
                    long completedLessons = lessonProgressRepository.countByEnrollmentIdAndCompletedTrue(e.getId());

                    int progress = (totalLessons > 0) ? (int) ((completedLessons * 100) / totalLessons) : 0;
                    map.put("progress", progress);
                    map.put("completedLessons", completedLessons);
                    map.put("totalLessons", totalLessons);

                    // Determine next lesson ID
                    Long nextLessonId = null;
                    for (int i = 0; i < lessons.size(); i++) {
                        Lesson currentLesson = lessons.get(i);
                        boolean isCompleted = lessonProgressRepository.findByEnrollmentIdAndLessonId(e.getId(), currentLesson.getId())
                                .map(LessonProgress::isCompleted)
                                .orElse(false);

                        if (!isCompleted) {
                            boolean isUnlocked = (i == 0) || lessonProgressRepository.findByEnrollmentIdAndLessonId(e.getId(), lessons.get(i - 1).getId())
                                    .map(LessonProgress::isCompleted)
                                    .orElse(false);
                            if (isUnlocked) {
                                nextLessonId = currentLesson.getId();
                                break;
                            }
                        }
                    }
                    map.put("nextLessonId", nextLessonId);

                    return map;
                }).toList();
    }

    public CourseProgressDTO getCourseProgress(String userEmail, Long courseId) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Enrollment enrollment = enrollmentRepository
                .findByUserIdAndCourseId(user.getId(), courseId)
                .orElseThrow(() -> new RuntimeException("Enrollment not found"));

        List<Lesson> courseLessons = lessonRepository.findByCourseIdOrderByPosition(courseId);
        Map<Long, LessonProgress> lessonProgressMap = lessonProgressRepository.findByEnrollmentId(enrollment.getId())
                .stream()
                .collect(Collectors.toMap(lp -> lp.getLesson().getId(), lp -> lp));

        long totalLessons = courseLessons.size();
        long completedLessonsCount = 0;
        Long nextLessonId = null;

        List<LessonProgressDTO> lessonProgressDTOs = new ArrayList<>();
        for (int i = 0; i < courseLessons.size(); i++) {
            Lesson lesson = courseLessons.get(i);
            LessonProgress lp = lessonProgressMap.get(lesson.getId());

            boolean isCompleted = (lp != null && lp.isCompleted());
            if (isCompleted) {
                completedLessonsCount++;
            }

            // Determine unlocked status
            boolean isUnlocked = (i == 0) || (lessonProgressMap.containsKey(courseLessons.get(i - 1).getId()) && lessonProgressMap.get(courseLessons.get(i - 1).getId()).isCompleted());

            if (!isCompleted && isUnlocked && nextLessonId == null) {
                nextLessonId = lesson.getId();
            }

            lessonProgressDTOs.add(LessonProgressDTO.builder()
                    .id(lesson.getId())
                    .title(lesson.getTitle())
                    .position(lesson.getPosition())
                    .videoUrl(lesson.getVideoUrl())
                    .duration(lesson.getDuration())
                    .completed(isCompleted)
                    .unlocked(isUnlocked)
                    .completedAt(lp != null ? lp.getCompletedAt() : null)
                    .build());
        }

        int overallProgress = (totalLessons > 0) ? (int) ((completedLessonsCount * 100) / totalLessons) : 0;

        // Update enrollment's aggregate progress
        enrollment.setProgress(overallProgress);
        enrollmentRepository.save(enrollment);

        // If course is fully completed, auto-generate certificate record
        if (overallProgress == 100) {
            try {
                getOrCreateCertificate(userEmail, courseId);
            } catch (Exception e) {
                // Ignore failure of certificate auto-generation
            }
        }

        return CourseProgressDTO.builder()
                .enrollmentId(enrollment.getId())
                .courseId(courseId)
                .courseTitle(enrollment.getCourse().getTitle())
                .progress(overallProgress)
                .completedLessons((int) completedLessonsCount)
                .totalLessons((int) totalLessons)
                .nextLessonId(nextLessonId)
                .lessons(lessonProgressDTOs)
                .build();
    }

    public CourseProgressDTO completeLesson(String userEmail, Long courseId, Long lessonId) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Enrollment enrollment = enrollmentRepository
                .findByUserIdAndCourseId(user.getId(), courseId)
                .orElseThrow(() -> new RuntimeException("Enrollment not found"));
        Lesson lesson = lessonRepository.findByIdAndCourseId(lessonId, courseId)
                .orElseThrow(() -> new RuntimeException("Lesson not found in this course"));

        // Check if the lesson is unlocked before allowing completion
        List<Lesson> courseLessons = lessonRepository.findByCourseIdOrderByPosition(courseId);
        int lessonIndex = courseLessons.indexOf(lesson);
        if (lessonIndex > 0) { // Not the first lesson
            Lesson previousLesson = courseLessons.get(lessonIndex - 1);
            boolean previousLessonCompleted = lessonProgressRepository.findByEnrollmentIdAndLessonId(enrollment.getId(), previousLesson.getId())
                    .map(LessonProgress::isCompleted)
                    .orElse(false);
            if (!previousLessonCompleted) {
                throw new RuntimeException("Previous lesson must be completed first.");
            }
        }

        LessonProgress lessonProgress = lessonProgressRepository.findByEnrollmentIdAndLessonId(enrollment.getId(), lessonId)
                .orElse(LessonProgress.builder().enrollment(enrollment).lesson(lesson).build());

        if (!lessonProgress.isCompleted()) {
            lessonProgress.setCompleted(true);
            lessonProgress.setCompletedAt(LocalDateTime.now());
            lessonProgressRepository.save(lessonProgress);
        }

        // Recalculate and return the updated course progress
        return getCourseProgress(userEmail, courseId);
    }

    public CertificateDTO getOrCreateCertificate(String userEmail, Long courseId) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Enrollment enrollment = enrollmentRepository.findByUserIdAndCourseId(user.getId(), courseId)
                .orElseThrow(() -> new RuntimeException("Enrollment not found"));

        if (enrollment.getProgress() < 100) {
            throw new RuntimeException("Course not completed yet. Progress is " + enrollment.getProgress() + "%");
        }

        Certificate certificate = certificateRepository.findByUserIdAndCourseId(user.getId(), courseId)
                .orElseGet(() -> {
                    String hash = UUID.randomUUID().toString().replace("-", "").substring(0, 16).toUpperCase();
                    Certificate cert = Certificate.builder()
                            .user(user)
                            .course(enrollment.getCourse())
                            .certificateHash(hash)
                            .build();
                    return certificateRepository.save(cert);
                });

        return CertificateDTO.builder()
                .id(certificate.getId())
                .courseId(courseId)
                .courseTitle(certificate.getCourse().getTitle())
                .studentName(user.getName())
                .certificateHash(certificate.getCertificateHash())
                .issuedAt(certificate.getIssuedAt())
                .build();
    }

    public List<CertificateDTO> getMyCertificates(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return certificateRepository.findByUserId(user.getId()).stream()
                .map(cert -> CertificateDTO.builder()
                        .id(cert.getId())
                        .courseId(cert.getCourse().getId())
                        .courseTitle(cert.getCourse().getTitle())
                        .studentName(user.getName())
                        .certificateHash(cert.getCertificateHash())
                        .issuedAt(cert.getIssuedAt())
                        .build())
                .toList();
    }

    @Transactional
    public void updateLessonProgress(String userEmail, Long courseId, Long lessonId, Integer lastWatchedSeconds) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Enrollment enrollment = enrollmentRepository
                .findByUserIdAndCourseId(user.getId(), courseId)
                .orElseThrow(() -> new RuntimeException("Enrollment not found"));
        Lesson lesson = lessonRepository.findByIdAndCourseId(lessonId, courseId)
                .orElseThrow(() -> new RuntimeException("Lesson not found in this course"));

        LessonProgress lessonProgress = lessonProgressRepository.findByEnrollmentIdAndLessonId(enrollment.getId(), lessonId)
                .orElseGet(() -> LessonProgress.builder().enrollment(enrollment).lesson(lesson).build());

        lessonProgress.setLastWatchedSeconds(lastWatchedSeconds);
        lessonProgress.setLastAccessedAt(LocalDateTime.now());
        
        try {
            lessonProgressRepository.saveAndFlush(lessonProgress);
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            // Gracefully handle concurrent database insertions: the progress record already exists.
        }
    }

    public Map<String, Object> getResumeLearning(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<LessonProgress> progresses = lessonProgressRepository.findByEnrollmentUserIdOrderByLastAccessedAtDesc(user.getId());
        if (progresses.isEmpty()) {
            return null;
        }

        LessonProgress recent = null;
        for (LessonProgress lp : progresses) {
            if (lp.getLastAccessedAt() != null) {
                recent = lp;
                break;
            }
        }

        if (recent == null) {
            return null;
        }

        Course course = recent.getEnrollment().getCourse();
        Lesson lesson = recent.getLesson();

        Map<String, Object> map = new HashMap<>();
        map.put("courseId", course.getId());
        map.put("courseTitle", course.getTitle());
        map.put("courseThumbnail", course.getThumbnail());
        map.put("lessonId", lesson.getId());
        map.put("lessonTitle", lesson.getTitle());
        map.put("lastWatchedSeconds", recent.getLastWatchedSeconds() != null ? recent.getLastWatchedSeconds() : 0);
        map.put("lastAccessedAt", recent.getLastAccessedAt());
        return map;
    }
}
