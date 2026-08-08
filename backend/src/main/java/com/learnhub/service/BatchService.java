package com.learnhub.service;

import com.learnhub.dto.*;
import com.learnhub.entity.*;
import com.learnhub.repository.*;
import com.learnhub.mapper.BatchMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import java.io.InputStream;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class BatchService {

    private final BatchRepository batchRepository;
    private final UserRepository userRepository;
    private final TestRepository testRepository;
    private final TestResultRepository testResultRepository;
    private final AttendanceRepository attendanceRepository;
    private final BatchMapper batchMapper;
    private final NoteRepository noteRepository;
    private final HomeworkRepository homeworkRepository;
    private final AnnouncementRepository announcementRepository;
    private final GoogleCloudStorageService gcsService;
    private final GoogleDriveSyncService googleDriveSyncService;

    // ────────────────────────────────────────────────────────────────────────
    // BATCH CRUD OPERATIONS
    // ────────────────────────────────────────────────────────────────────────

    public List<BatchDTO> getAllBatches(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        List<Batch> batches;
        if (user.getRole().name().equals("ADMIN")) {
            batches = batchRepository.findAll();
        } else {
            batches = batchRepository.findByInstructorsId(user.getId());
        }

        Map<Long, Long> counts = batchRepository.countStudentsPerBatch().stream()
                .collect(Collectors.toMap(
                        row -> (Long) row[0],
                        row -> (Long) row[1]
                ));

        return batches.stream()
                .map(b -> batchMapper.toDTOWithCount(b, counts.getOrDefault(b.getId(), 0L).intValue()))
                .toList();
    }

    public BatchDetailsDTO getBatchDetails(Long id) {
        Batch batch = batchRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Batch not found"));
        return batchMapper.toDetailsDTO(batch);
    }

    public BatchDTO createBatch(BatchDTO dto) {
        Set<User> instructors = new java.util.HashSet<>();
        if (dto.instructorIds() != null && !dto.instructorIds().isEmpty()) {
            for (Long instId : dto.instructorIds()) {
                userRepository.findById(instId).ifPresent(instructors::add);
            }
        }

        Batch batch = Batch.builder()
                .name(dto.name())
                .level(dto.level())
                .instructors(instructors)
                .subjects(dto.subjects() != null ? dto.subjects() : new java.util.HashSet<>())
                .build();

        return batchMapper.toDTO(batchRepository.save(batch));
    }

    public BatchDTO updateBatch(Long id, BatchDTO dto) {
        Batch batch = batchRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Batch not found"));

        Set<User> instructors = new java.util.HashSet<>();
        if (dto.instructorIds() != null && !dto.instructorIds().isEmpty()) {
            for (Long instId : dto.instructorIds()) {
                userRepository.findById(instId).ifPresent(instructors::add);
            }
        }

        batch.setName(dto.name());
        batch.setLevel(dto.level());
        batch.setInstructors(instructors);
        if (dto.subjects() != null) {
            if (batch.getSubjects() == null) {
                batch.setSubjects(new java.util.HashSet<>(dto.subjects()));
            } else {
                batch.getSubjects().clear();
                batchRepository.saveAndFlush(batch);
                batch.getSubjects().addAll(dto.subjects());
            }
        }

        return batchMapper.toDTO(batchRepository.save(batch));
    }

    public void deleteBatch(Long id) {
        Batch batch = batchRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Batch not found"));

        // Safely unassign all students so we do not trigger foreign key constraint violations
        if (batch.getStudents() != null) {
            for (User student : batch.getStudents()) {
                student.setBatch(null);
                userRepository.save(student);
            }
        }

        batchRepository.delete(batch);
    }

    // ────────────────────────────────────────────────────────────────────────
    // STUDENT & SUBJECT ASSIGNMENTS
    // ────────────────────────────────────────────────────────────────────────

    public void assignStudents(Long batchId, List<Long> studentIds) {
        Batch batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new RuntimeException("Batch not found"));

        // Unassign current students first if they are not in the new list
        if (batch.getStudents() != null) {
            for (User student : batch.getStudents()) {
                if (!studentIds.contains(student.getId())) {
                    student.setBatch(null);
                    userRepository.save(student);
                }
            }
        }

        // Assign new students
        for (Long studentId : studentIds) {
            User student = userRepository.findById(studentId)
                    .orElseThrow(() -> new RuntimeException("Student not found with ID: " + studentId));
            if (student.getRole() != User.Role.STUDENT) {
                throw new RuntimeException("User " + student.getName() + " is not a student");
            }
            student.setBatch(batch);
            userRepository.save(student);
        }
    }

    public void assignSubjects(Long batchId, Set<String> subjects) {
        Batch batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new RuntimeException("Batch not found"));
        if (subjects != null) {
            if (batch.getSubjects() == null) {
                batch.setSubjects(new java.util.HashSet<>(subjects));
            } else {
                batch.getSubjects().clear();
                batchRepository.saveAndFlush(batch);
                batch.getSubjects().addAll(subjects);
            }
        }
        batchRepository.save(batch);
    }

    public void updateAssignments(Long batchId, List<Long> instructorIds, Set<String> subjects) {
        Batch batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new RuntimeException("Batch not found"));
        
        // 1. Update Instructors
        Set<User> instructors = new java.util.HashSet<>();
        if (instructorIds != null) {
            for (Long instId : instructorIds) {
                userRepository.findById(instId).ifPresent(instructors::add);
            }
        }
        batch.setInstructors(instructors);

        // 2. Update Subjects
        if (subjects != null) {
            if (batch.getSubjects() == null) {
                batch.setSubjects(new java.util.HashSet<>(subjects));
            } else {
                batch.getSubjects().clear();
                // Flush is no longer necessary here because we are doing everything in one save
                batch.getSubjects().addAll(subjects);
            }
        }
        
        batchRepository.save(batch);
    }

    // ────────────────────────────────────────────────────────────────────────
    // BATCH-WISE ATTENDANCE MARKING
    // ────────────────────────────────────────────────────────────────────────

    public void markBatchAttendance(Long batchId, BatchAttendanceMarkRequest request) {
        Batch batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new RuntimeException("Batch not found"));

        LocalDate date = LocalDate.parse(request.date());
        String subjectName = request.subjectName();

        // Validate subject belongs to batch
        if (!batch.getSubjects().contains(subjectName)) {
            throw new RuntimeException("Subject '" + subjectName + "' is not assigned to this batch.");
        }

        for (BatchAttendanceMarkRequest.StudentMark record : request.records()) {
            User student = userRepository.findById(record.studentId())
                    .orElseThrow(() -> new RuntimeException("Student not found with ID: " + record.studentId()));

            // Check if student belongs to this batch
            if (student.getBatch() == null || !student.getBatch().getId().equals(batchId)) {
                throw new RuntimeException("Student " + student.getName() + " does not belong to this batch.");
            }

            // Clean day of week representation (e.g. "Monday")
            String dayOfWeek = date.getDayOfWeek().name();
            dayOfWeek = dayOfWeek.charAt(0) + dayOfWeek.substring(1).toLowerCase();

            // Check for existing record to prevent duplicate entries
            Optional<Attendance> existing = attendanceRepository.findByStudentIdAndSubjectNameAndDate(
                    student.getId(), subjectName, date);

            if (existing.isPresent()) {
                Attendance att = existing.get();
                att.setStatus(Attendance.Status.valueOf(record.status().toUpperCase()));
                att.setBatch(batch); // Ensure batch is set
                attendanceRepository.save(att);
            } else {
                Attendance att = Attendance.builder()
                        .student(student)
                        .batch(batch)
                        .subjectName(subjectName)
                        .date(date)
                        .day(dayOfWeek)
                        .status(Attendance.Status.valueOf(record.status().toUpperCase()))
                        .build();
                attendanceRepository.save(att);
            }
        }
    }

    // ────────────────────────────────────────────────────────────────────────
    // BATCH-WISE TESTS MANAGEMENT
    // ────────────────────────────────────────────────────────────────────────

    public TestDTO createTest(Long batchId, TestDTO dto, String creatorEmail) {
        Batch batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new RuntimeException("Batch not found"));
        User creator = userRepository.findByEmail(creatorEmail)
                .orElseThrow(() -> new RuntimeException("Creator instructor not found"));

        Test test = Test.builder()
                .title(dto.getTitle())
                .description(dto.getDescription())
                .batch(batch)
                .subjectName(dto.getSubjectName())
                .testDate(dto.getTestDate())
                .maxMarks(dto.getMaxMarks())
                .createdBy(creator)
                .build();

        Test saved = testRepository.save(test);
        return convertTestToDTO(saved);
    }

    public List<TestDTO> getBatchTests(Long batchId) {
        return testRepository.findByBatchId(batchId).stream()
                .map(this::convertTestToDTO)
                .toList();
    }

    public List<TestDTO> getStudentBatchTests(String email) {
        User student = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Student not found"));
        if (student.getBatch() == null) {
            return Collections.emptyList();
        }
        return testRepository.findByBatchId(student.getBatch().getId()).stream()
                .map(this::convertTestToDTO)
                .toList();
    }

    public TestDTO updateTest(Long testId, TestDTO dto) {
        Test test = testRepository.findById(testId)
                .orElseThrow(() -> new RuntimeException("Test not found"));
        test.setTitle(dto.getTitle());
        test.setDescription(dto.getDescription());
        test.setTestDate(dto.getTestDate());
        test.setMaxMarks(dto.getMaxMarks());
        test.setSubjectName(dto.getSubjectName());

        Test saved = testRepository.save(test);
        return convertTestToDTO(saved);
    }

    public void deleteTest(Long testId) {
        Test test = testRepository.findById(testId)
                .orElseThrow(() -> new RuntimeException("Test not found"));
        testResultRepository.deleteByTestId(testId);
        testRepository.delete(test);
    }

    // ────────────────────────────────────────────────────────────────────────
    // CONVERTERS & HELPERS
    // ────────────────────────────────────────────────────────────────────────



    private TestDTO convertTestToDTO(Test test) {
        return TestDTO.builder()
                .id(test.getId())
                .title(test.getTitle())
                .description(test.getDescription())
                .batchId(test.getBatch().getId())
                .batchName(test.getBatch().getName())
                .subjectName(test.getSubjectName())
                .testDate(test.getTestDate())
                .maxMarks(test.getMaxMarks())
                .createdByName(test.getCreatedBy().getName())
                .build();
    }

    // ────────────────────────────────────────────────────────────────────────
    // BATCH-WISE NOTES, HOMEWORKS, AND ANNOUNCEMENTS
    // ────────────────────────────────────────────────────────────────────────

    @Transactional
    public NoteDTO createBatchNote(Long batchId, String title, String description, String subjectName, MultipartFile file, String email) {
        Batch batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new RuntimeException("Batch not found"));
        User creator = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Instructor not found"));

        System.out.println("Uploading batch note directly to Google Cloud Storage: " + title);
        try {
            String folderPath = "learnstudio_content/Notes/" + batch.getName() + "/" + subjectName;
            @SuppressWarnings("rawtypes")
            Map uploadResult = gcsService.uploadFileRaw(file, folderPath);
            String secureUrl = uploadResult.get("secure_url").toString();
            String publicId = uploadResult.containsKey("public_id") ? uploadResult.get("public_id").toString() : null;
            String resourceType = uploadResult.containsKey("resource_type") ? uploadResult.get("resource_type").toString() : "pdf";
            System.out.println("Google Cloud Storage upload success for batch note: " + title + ", url: " + secureUrl);

            // 2. Extract Text from PDF using PDFBox
            String extractedText = "";
            try (InputStream is = file.getInputStream()) {
                extractedText = extractTextFromPdf(is);
            } catch (Exception e) {
                System.err.println("Could not extract PDF text for batch note: " + e.getMessage());
            }

            // 3. Build & Save Entity
            Note note = Note.builder()
                    .title(title)
                    .description(description)
                    .batch(batch)
                    .subjectName(subjectName)
                    .fileUrl(secureUrl)
                    .publicId(publicId)
                    .uploadedBy(creator)
                    .isVisible(true)
                    .aiEnabled(true)
                    .extractedText(extractedText)
                    .originalFilename(file.getOriginalFilename())
                    .fileSize(file.getSize())
                    .resourceType(resourceType)
                    .secureUrl(secureUrl)
                    .build();

            Note saved = noteRepository.save(note);
            return convertNoteToDTO(saved);
        } catch (Exception e) {
            System.err.println("Upload failed for batch note: " + title + " - " + e.getMessage());
            throw new RuntimeException("Note upload failed: " + e.getMessage(), e);
        }
    }

    private String extractTextFromPdf(InputStream inputStream) {
        try (PDDocument document = PDDocument.load(inputStream)) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(document);
        } catch (Exception e) {
            System.err.println("PDFBox text extraction failed: " + e.getMessage());
            return "";
        }
    }

    private static long lastSyncTime = 0;

    private void triggerBackgroundSync() {
        long now = System.currentTimeMillis();
        if (now - lastSyncTime > 120000) { // 2 minutes throttle
            lastSyncTime = now;
            new Thread(() -> {
                try {
                    System.out.println("Starting background auto-sync of Google Drive...");
                    googleDriveSyncService.syncAll(null);
                    System.out.println("Background auto-sync of Google Drive completed.");
                } catch (Exception e) {
                    System.err.println("Background auto-sync failed: " + e.getMessage());
                }
            }).start();
        }
    }

    public List<NoteDTO> getBatchNotes(Long batchId) {
        return noteRepository.findByBatchId(batchId).stream()
                .map(this::convertNoteToDTO)
                .toList();
    }

    public List<NoteDTO> getStudentBatchNotes(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
                
        if (user.getRole().name().equals("ADMIN") || user.getRole().name().equals("INSTRUCTOR")) {
            return noteRepository.findAll().stream()
                    .map(this::convertNoteToDTO)
                    .toList();
        }

        if (user.getBatch() == null) {
            return Collections.emptyList();
        }
        return noteRepository.findByBatchId(user.getBatch().getId()).stream()
                .map(this::convertNoteToDTO)
                .toList();
    }

    public HomeworkDTO createBatchHomework(Long batchId, String title, String description, String subjectName, String dueDateStr, MultipartFile file, String email) {
        Batch batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new RuntimeException("Batch not found"));
        User creator = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Instructor not found"));

        System.out.println("Uploading batch homework directly to Google Cloud Storage (Zero Drive Sync): " + title);
        try {
            String folderPath = "learnstudio_content/Homework/" + batch.getName() + "/" + subjectName;
            @SuppressWarnings("rawtypes")
            Map uploadResult = gcsService.uploadFileRaw(file, folderPath);
            String secureUrl = uploadResult.get("secure_url").toString();
            String publicId = uploadResult.containsKey("public_id") ? uploadResult.get("public_id").toString() : null;
            System.out.println("Google Cloud Storage upload success for batch homework: " + title + ", url: " + secureUrl);

            LocalDateTime dueDate = null;
            if (dueDateStr != null && !dueDateStr.isEmpty()) {
                try {
                    dueDate = LocalDateTime.parse(dueDateStr);
                } catch (Exception parseEx) {
                    System.err.println("Failed to parse due date: " + dueDateStr + ", error: " + parseEx.getMessage());
                }
            }

            Homework homework = Homework.builder()
                    .title(title)
                    .description(description)
                    .batch(batch)
                    .subjectName(subjectName)
                    .fileUrl(secureUrl)
                    .publicId(publicId)
                    .dueDate(dueDate)
                    .createdBy(creator)
                    .isVisible(true)
                    .build();

            Homework saved = homeworkRepository.save(homework);
            return convertHomeworkToDTO(saved);
        } catch (Exception e) {
            System.err.println("Upload failed for batch homework: " + title + " - " + e.getMessage());
            throw new RuntimeException("Homework upload failed: " + e.getMessage(), e);
        }
    }

    public List<HomeworkDTO> getBatchHomeworks(Long batchId) {
        triggerBackgroundSync();
        return homeworkRepository.findByBatchId(batchId).stream()
                .map(this::convertHomeworkToDTO)
                .toList();
    }

    public List<HomeworkDTO> getStudentBatchHomeworks(String email) {
        triggerBackgroundSync();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
                
        if (user.getRole().name().equals("ADMIN") || user.getRole().name().equals("INSTRUCTOR")) {
            return homeworkRepository.findAll().stream()
                    .map(this::convertHomeworkToDTO)
                    .toList();
        }

        if (user.getBatch() == null) {
            return Collections.emptyList();
        }
        return homeworkRepository.findByBatchId(user.getBatch().getId()).stream()
                .map(this::convertHomeworkToDTO)
                .toList();
    }

    public AnnouncementDTO createBatchAnnouncement(Long batchId, AnnouncementDTO dto, String email) {
        Batch batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new RuntimeException("Batch not found"));
        User creator = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Instructor not found"));

        Announcement announcement = Announcement.builder()
                .title(dto.title())
                .message(dto.message())
                .imageUrl(dto.imageUrl())
                .batch(batch)
                .targetRole(dto.targetRole() != null ? dto.targetRole() : Announcement.TargetRole.ALL)
                .pinned(dto.pinned() != null ? dto.pinned() : false)
                .createdBy(creator)
                .instagramUrl(dto.instagramUrl())
                .externalLink(dto.externalLink())
                .build();

        Announcement saved = announcementRepository.save(announcement);
        return convertAnnouncementToDTO(saved);
    }

    public List<AnnouncementDTO> getBatchAnnouncements(Long batchId) {
        return announcementRepository.findByBatchIdOrderByPinnedDescCreatedAtDesc(batchId).stream()
                .map(this::convertAnnouncementToDTO)
                .toList();
    }

    public List<AnnouncementDTO> getStudentBatchAnnouncements(String email) {
        User student = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Student not found"));
        if (student.getBatch() == null) {
            return Collections.emptyList();
        }
        return announcementRepository.findByBatchIdOrderByPinnedDescCreatedAtDesc(student.getBatch().getId()).stream()
                .map(this::convertAnnouncementToDTO)
                .toList();
    }

    public BatchDTO getStudentBatch(String email) {
        User student = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Student not found"));
        if (student.getBatch() == null) {
            return null;
        }
        return batchMapper.toDTO(student.getBatch());
    }

    private NoteDTO convertNoteToDTO(Note note) {
        return NoteDTO.builder()
                .id(note.getId())
                .title(note.getTitle())
                .description(note.getDescription())
                .courseId(note.getCourse() != null ? note.getCourse().getId() : null)
                .courseTitle(note.getCourse() != null ? note.getCourse().getTitle() : null)
                .lessonId(note.getLesson() != null ? note.getLesson().getId() : null)
                .lessonTitle(note.getLesson() != null ? note.getLesson().getTitle() : null)
                .batchId(note.getBatch() != null ? note.getBatch().getId() : null)
                .batchName(note.getBatch() != null ? note.getBatch().getName() : null)
                .subjectName(note.getSubjectName())
                .fileUrl(note.getFileUrl())
                .publicId(note.getPublicId())
                .uploadedById(note.getUploadedBy().getId())
                .uploadedByName(note.getUploadedBy().getName())
                .isVisible(note.getIsVisible())
                .aiEnabled(note.getAiEnabled())
                .createdAt(note.getCreatedAt())
                .originalFilename(note.getOriginalFilename())
                .fileSize(note.getFileSize())
                .resourceType(note.getResourceType())
                .secureUrl(note.getSecureUrl())
                .build();
    }

    private HomeworkDTO convertHomeworkToDTO(Homework homework) {
        return HomeworkDTO.builder()
                .id(homework.getId())
                .title(homework.getTitle())
                .description(homework.getDescription())
                .courseId(homework.getCourse() != null ? homework.getCourse().getId() : null)
                .courseTitle(homework.getCourse() != null ? homework.getCourse().getTitle() : null)
                .lessonId(homework.getLesson() != null ? homework.getLesson().getId() : null)
                .lessonTitle(homework.getLesson() != null ? homework.getLesson().getTitle() : null)
                .batchId(homework.getBatch() != null ? homework.getBatch().getId() : null)
                .batchName(homework.getBatch() != null ? homework.getBatch().getName() : null)
                .subjectName(homework.getSubjectName())
                .fileUrl(homework.getFileUrl())
                .publicId(homework.getPublicId())
                .dueDate(homework.getDueDate())
                .createdById(homework.getCreatedBy().getId())
                .createdByName(homework.getCreatedBy().getName())
                .isVisible(homework.getIsVisible())
                .createdAt(homework.getCreatedAt())
                .build();
    }

    private AnnouncementDTO convertAnnouncementToDTO(Announcement ann) {
        return AnnouncementDTO.builder()
                .id(ann.getId())
                .title(ann.getTitle())
                .message(ann.getMessage())
                .imageUrl(ann.getImageUrl())
                .targetRole(ann.getTargetRole())
                .courseId(ann.getCourse() != null ? ann.getCourse().getId() : null)
                .courseTitle(ann.getCourse() != null ? ann.getCourse().getTitle() : null)
                .batchId(ann.getBatch() != null ? ann.getBatch().getId() : null)
                .batchName(ann.getBatch() != null ? ann.getBatch().getName() : null)
                .instagramUrl(ann.getInstagramUrl())
                .externalLink(ann.getExternalLink())
                .pinned(ann.getPinned())
                .createdById(ann.getCreatedBy().getId())
                .createdByName(ann.getCreatedBy().getName())
                .createdAt(ann.getCreatedAt())
                .build();
    }

    public List<AttendanceDTO> getBatchAttendance(Long batchId) {
        return attendanceRepository.findByBatchId(batchId).stream()
                .map(this::convertAttendanceToDTO)
                .sorted(Comparator.comparing(AttendanceDTO::date).reversed())
                .toList();
    }

    private AttendanceDTO convertAttendanceToDTO(Attendance record) {
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
}

