package com.learnhub.service;

import com.learnhub.dto.HomeworkDTO;
import com.learnhub.dto.HomeworkSubmissionDTO;
import com.learnhub.entity.*;
import com.learnhub.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class HomeworkService {

    private final HomeworkRepository homeworkRepository;
    private final HomeworkSubmissionRepository homeworkSubmissionRepository;
    private final CourseRepository courseRepository;
    private final LessonRepository lessonRepository;
    private final UserRepository userRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final CloudinaryService cloudinaryService;
    private final GoogleDriveSyncService googleDriveSyncService;

    // ── Instructor APIs ─────────────────────────────────

    @Transactional
    public HomeworkDTO createHomework(String email, String title, String description, Long courseId, Long lessonId, LocalDateTime dueDate, MultipartFile file) throws IOException {
        User instructor = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Instructor not found"));

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));

        Lesson lesson = lessonId != null ? lessonRepository.findById(lessonId).orElse(null) : null;

        // Upload task to Cloudinary
        @SuppressWarnings("rawtypes")
        Map uploadResult = cloudinaryService.uploadFileRaw(file, "homework_tasks");
        String secureUrl = uploadResult.get("secure_url").toString();
        String publicId = uploadResult.containsKey("public_id") ? uploadResult.get("public_id").toString() : null;

        Homework homework = Homework.builder()
                .title(title)
                .description(description)
                .course(course)
                .lesson(lesson)
                .fileUrl(secureUrl)
                .publicId(publicId)
                .dueDate(dueDate)
                .createdBy(instructor)
                .isVisible(true)
                .build();

        return toDTO(homeworkRepository.save(homework));
    }

    @Transactional
    public void deleteHomework(String email, Long homeworkId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Homework homework = homeworkRepository.findById(homeworkId)
                .orElseThrow(() -> new RuntimeException("Homework not found"));

        if (user.getRole() != User.Role.ADMIN && !homework.getCreatedBy().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized");
        }

        // Delete from storage
        if (homework.getPublicId() != null) {
            if (homework.getFileUrl() != null && homework.getFileUrl().contains("drive.google.com")) {
                googleDriveSyncService.deleteFileFromDrive(homework.getPublicId());
            } else {
                cloudinaryService.deleteFile(homework.getPublicId());
            }
        }

        homeworkRepository.delete(homework);
    }

    public List<HomeworkSubmissionDTO> getSubmissionsForHomework(String email, Long homeworkId) {
        User instructor = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Homework homework = homeworkRepository.findById(homeworkId)
                .orElseThrow(() -> new RuntimeException("Homework not found"));

        // Validate that this instructor teaches the course or is admin
        if (instructor.getRole() != User.Role.ADMIN && !homework.getCourse().getInstructor().getId().equals(instructor.getId())) {
            throw new RuntimeException("Unauthorized to view submissions for this course");
        }

        return homeworkSubmissionRepository.findByHomeworkId(homeworkId).stream()
                .map(this::toSubmissionDTO)
                .toList();
    }

    @Transactional
    public HomeworkSubmissionDTO gradeSubmission(String email, Long submissionId, Double marks, String feedback) {
        User instructor = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        HomeworkSubmission submission = homeworkSubmissionRepository.findById(submissionId)
                .orElseThrow(() -> new RuntimeException("Submission not found"));

        if (instructor.getRole() != User.Role.ADMIN && !submission.getHomework().getCourse().getInstructor().getId().equals(instructor.getId())) {
            throw new RuntimeException("Unauthorized");
        }

        submission.setMarks(marks);
        submission.setFeedback(feedback);
        submission.setStatus(HomeworkSubmission.Status.REVIEWED);

        return toSubmissionDTO(homeworkSubmissionRepository.save(submission));
    }

    // ── Student APIs ───────────────────────────────────

    public List<Map<String, Object>> getCoursesWithHomework(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Course> courses;
        if (user.getRole() == User.Role.STUDENT) {
            courses = enrollmentRepository.findByUserId(user.getId()).stream()
                    .map(Enrollment::getCourse)
                    .toList();
        } else if (user.getRole() == User.Role.INSTRUCTOR) {
            courses = courseRepository.findByInstructorId(user.getId());
        } else {
            courses = courseRepository.findAll();
        }

        return courses.stream()
                .map(course -> {
                    long homeworkCount = homeworkRepository.findByCourseIdAndIsVisibleTrue(course.getId()).size();
                    return Map.of(
                            "id", (Object) course.getId(),
                            "title", (Object) course.getTitle(),
                            "thumbnail", (Object) (course.getThumbnail() != null ? course.getThumbnail() : ""),
                            "homeworkCount", (Object) homeworkCount
                    );
                })
                .filter(m -> (long) m.get("homeworkCount") > 0 || user.getRole() != User.Role.STUDENT)
                .toList();
    }

    public List<HomeworkDTO> getHomeworkForCourse(String email, Long courseId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getRole() == User.Role.STUDENT) {
            boolean enrolled = enrollmentRepository.existsByUserIdAndCourseId(user.getId(), courseId);
            if (!enrolled) {
                throw new RuntimeException("You must be enrolled to view homework");
            }
        }

        return homeworkRepository.findByCourseIdAndIsVisibleTrue(courseId).stream()
                .map(this::toDTO)
                .toList();
    }

    public HomeworkDTO getHomeworkById(String email, Long homeworkId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Homework homework = homeworkRepository.findById(homeworkId)
                .orElseThrow(() -> new RuntimeException("Homework not found"));

        if (user.getRole() == User.Role.STUDENT) {
            if (homework.getBatch() != null) {
                if (user.getBatch() == null || !user.getBatch().getId().equals(homework.getBatch().getId())) {
                    throw new RuntimeException("You are not in the batch assigned to this homework");
                }
            } else if (homework.getCourse() != null) {
                boolean enrolled = enrollmentRepository.existsByUserIdAndCourseId(user.getId(), homework.getCourse().getId());
                if (!enrolled) {
                    throw new RuntimeException("Unauthorized");
                }
            } else {
                throw new RuntimeException("Access denied: Homework is not assigned to a batch or course");
            }
        }

        return toDTO(homework);
    }

    @Transactional
    public HomeworkSubmissionDTO submitHomework(String email, Long homeworkId, MultipartFile file) throws IOException {
        User student = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        Homework homework = homeworkRepository.findById(homeworkId)
                .orElseThrow(() -> new RuntimeException("Homework not found"));

        // Verify enrollment or batch assignment
        if (homework.getBatch() != null) {
            if (student.getBatch() == null || !student.getBatch().getId().equals(homework.getBatch().getId())) {
                throw new RuntimeException("You are not in the batch assigned to this homework");
            }
        } else if (homework.getCourse() != null) {
            boolean enrolled = enrollmentRepository.existsByUserIdAndCourseId(student.getId(), homework.getCourse().getId());
            if (!enrolled) {
                throw new RuntimeException("You must be enrolled to submit homework");
            }
        } else {
            throw new RuntimeException("Access denied: Homework is not assigned to a batch or course");
        }

        // Upload submission to Cloudinary
        @SuppressWarnings("rawtypes")
        Map uploadResult = cloudinaryService.uploadFileRaw(file, "homework_submissions");
        String secureUrl = uploadResult.get("secure_url").toString();
        String publicId = uploadResult.containsKey("public_id") ? uploadResult.get("public_id").toString() : null;

        // Check if previous submission exists
        Optional<HomeworkSubmission> existingOpt = homeworkSubmissionRepository.findByHomeworkIdAndStudentId(homeworkId, student.getId());
        HomeworkSubmission submission;

        HomeworkSubmission.Status status = LocalDateTime.now().isAfter(homework.getDueDate()) 
                ? HomeworkSubmission.Status.LATE 
                : HomeworkSubmission.Status.SUBMITTED;

        if (existingOpt.isPresent()) {
            submission = existingOpt.get();
            // Delete old file
            if (submission.getPublicId() != null) {
                cloudinaryService.deleteFile(submission.getPublicId());
            }
            submission.setSubmissionFileUrl(secureUrl);
            submission.setPublicId(publicId);
            submission.setSubmittedAt(LocalDateTime.now());
            submission.setStatus(status);
        } else {
            submission = HomeworkSubmission.builder()
                    .homework(homework)
                    .student(student)
                    .submissionFileUrl(secureUrl)
                    .publicId(publicId)
                    .submittedAt(LocalDateTime.now())
                    .status(status)
                    .build();
        }

        return toSubmissionDTO(homeworkSubmissionRepository.save(submission));
    }

    public HomeworkSubmissionDTO getStudentSubmission(String email, Long homeworkId) {
        User student = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        return homeworkSubmissionRepository.findByHomeworkIdAndStudentId(homeworkId, student.getId())
                .map(this::toSubmissionDTO)
                .orElse(null);
    }

    public HomeworkDTO toDTO(Homework homework) {
        if (homework == null) return null;
        return HomeworkDTO.builder()
                .id(homework.getId())
                .title(homework.getTitle())
                .description(homework.getDescription())
                .courseId(homework.getCourse() != null ? homework.getCourse().getId() : null)
                .courseTitle(homework.getCourse() != null ? homework.getCourse().getTitle() : null)
                .batchId(homework.getBatch() != null ? homework.getBatch().getId() : null)
                .batchName(homework.getBatch() != null ? homework.getBatch().getName() : null)
                .lessonId(homework.getLesson() != null ? homework.getLesson().getId() : null)
                .lessonTitle(homework.getLesson() != null ? homework.getLesson().getTitle() : null)
                .fileUrl(homework.getFileUrl())
                .publicId(homework.getPublicId())
                .dueDate(homework.getDueDate())
                .createdById(homework.getCreatedBy().getId())
                .createdByName(homework.getCreatedBy().getName())
                .isVisible(homework.getIsVisible())
                .createdAt(homework.getCreatedAt())
                .build();
    }

    public HomeworkSubmissionDTO toSubmissionDTO(HomeworkSubmission submission) {
        if (submission == null) return null;
        return HomeworkSubmissionDTO.builder()
                .id(submission.getId())
                .homeworkId(submission.getHomework().getId())
                .homeworkTitle(submission.getHomework().getTitle())
                .studentId(submission.getStudent().getId())
                .studentName(submission.getStudent().getName())
                .studentEmail(submission.getStudent().getEmail())
                .submissionFileUrl(submission.getSubmissionFileUrl())
                .publicId(submission.getPublicId())
                .submittedAt(submission.getSubmittedAt())
                .status(submission.getStatus())
                .feedback(submission.getFeedback())
                .marks(submission.getMarks())
                .build();
    }
}
