package com.learnhub.service;

import com.learnhub.dto.*;
import com.learnhub.entity.*;
import com.learnhub.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import java.io.InputStream;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class BatchService {

    private final BatchRepository batchRepository;
    private final UserRepository userRepository;
    private final TestRepository testRepository;
    private final AttendanceRepository attendanceRepository;
    private final NoteRepository noteRepository;
    private final HomeworkRepository homeworkRepository;
    private final AnnouncementRepository announcementRepository;
    private final CloudinaryService cloudinaryService;

    // ────────────────────────────────────────────────────────────────────────
    // BATCH CRUD OPERATIONS
    // ────────────────────────────────────────────────────────────────────────

    public List<BatchDTO> getAllBatches() {
        return batchRepository.findAll().stream()
                .map(this::convertToDTO)
                .toList();
    }

    public BatchDetailsDTO getBatchDetails(Long id) {
        Batch batch = batchRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Batch not found"));
        return convertToDetailsDTO(batch);
    }

    public BatchDTO createBatch(BatchDTO dto) {
        User instructor = null;
        if (dto.getInstructorId() != null) {
            instructor = userRepository.findById(dto.getInstructorId())
                    .orElseThrow(() -> new RuntimeException("Instructor not found"));
        }

        Batch batch = Batch.builder()
                .name(dto.getName())
                .level(dto.getLevel())
                .instructor(instructor)
                .subjects(dto.getSubjects() != null ? dto.getSubjects() : new HashSet<>())
                .build();

        Batch saved = batchRepository.save(batch);
        return convertToDTO(saved);
    }

    public BatchDTO updateBatch(Long id, BatchDTO dto) {
        Batch batch = batchRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Batch not found"));

        User instructor = null;
        if (dto.getInstructorId() != null) {
            instructor = userRepository.findById(dto.getInstructorId())
                    .orElseThrow(() -> new RuntimeException("Instructor not found"));
        }

        batch.setName(dto.getName());
        batch.setLevel(dto.getLevel());
        batch.setInstructor(instructor);
        if (dto.getSubjects() != null) {
            batch.setSubjects(dto.getSubjects());
        }

        Batch saved = batchRepository.save(batch);
        return convertToDTO(saved);
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
        batch.setSubjects(subjects);
        batchRepository.save(batch);
    }

    // ────────────────────────────────────────────────────────────────────────
    // BATCH-WISE ATTENDANCE MARKING
    // ────────────────────────────────────────────────────────────────────────

    public void markBatchAttendance(Long batchId, BatchAttendanceMarkRequest request) {
        Batch batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new RuntimeException("Batch not found"));

        LocalDate date = LocalDate.parse(request.getDate());
        String subjectName = request.getSubjectName();

        // Validate subject belongs to batch
        if (!batch.getSubjects().contains(subjectName)) {
            throw new RuntimeException("Subject '" + subjectName + "' is not assigned to this batch.");
        }

        for (BatchAttendanceMarkRequest.StudentMark record : request.getRecords()) {
            User student = userRepository.findById(record.getStudentId())
                    .orElseThrow(() -> new RuntimeException("Student not found with ID: " + record.getStudentId()));

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
                att.setStatus(Attendance.Status.valueOf(record.getStatus().toUpperCase()));
                att.setBatch(batch); // Ensure batch is set
                attendanceRepository.save(att);
            } else {
                Attendance att = Attendance.builder()
                        .student(student)
                        .batch(batch)
                        .subjectName(subjectName)
                        .date(date)
                        .day(dayOfWeek)
                        .status(Attendance.Status.valueOf(record.getStatus().toUpperCase()))
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
        testRepository.delete(test);
    }

    // ────────────────────────────────────────────────────────────────────────
    // CONVERTERS & HELPERS
    // ────────────────────────────────────────────────────────────────────────

    private BatchDTO convertToDTO(Batch batch) {
        return BatchDTO.builder()
                .id(batch.getId())
                .name(batch.getName())
                .level(batch.getLevel())
                .instructorId(batch.getInstructor() != null ? batch.getInstructor().getId() : null)
                .instructorName(batch.getInstructor() != null ? batch.getInstructor().getName() : null)
                .subjects(batch.getSubjects())
                .studentCount(batch.getStudents() != null ? batch.getStudents().size() : 0)
                .build();
    }

    private BatchDetailsDTO convertToDetailsDTO(Batch batch) {
        UserDTO instructorDTO = batch.getInstructor() != null ? 
                UserDTO.builder()
                        .id(batch.getInstructor().getId())
                        .name(batch.getInstructor().getName())
                        .email(batch.getInstructor().getEmail())
                        .role(batch.getInstructor().getRole().name())
                        .build() : null;

        List<UserDTO> studentDTOs = batch.getStudents() != null ?
                batch.getStudents().stream()
                        .map(s -> UserDTO.builder()
                                .id(s.getId())
                                .name(s.getName())
                                .email(s.getEmail())
                                .role(s.getRole().name())
                                .build())
                        .toList() : new ArrayList<>();

        return BatchDetailsDTO.builder()
                .id(batch.getId())
                .name(batch.getName())
                .level(batch.getLevel())
                .instructor(instructorDTO)
                .students(studentDTOs)
                .subjects(batch.getSubjects())
                .build();
    }

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

        System.out.println("Starting Cloudinary upload for batch note: " + title);
        try {
            // 1. Upload to Cloudinary
            @SuppressWarnings("rawtypes")
            Map uploadResult = cloudinaryService.uploadFileRaw(file, "notes");
            String secureUrl = uploadResult.get("secure_url").toString();
            String publicId = uploadResult.containsKey("public_id") ? uploadResult.get("public_id").toString() : null;
            String resourceType = uploadResult.containsKey("resource_type") ? uploadResult.get("resource_type").toString() : "auto";

            System.out.println("Cloudinary upload success for batch note: " + title + ", publicId: " + publicId);

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
            System.err.println("Cloudinary upload failed for batch note: " + title + " - " + e.getMessage());
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

    public List<NoteDTO> getBatchNotes(Long batchId) {
        return noteRepository.findByBatchId(batchId).stream()
                .map(this::convertNoteToDTO)
                .toList();
    }

    public List<NoteDTO> getStudentBatchNotes(String email) {
        User student = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Student not found"));
        if (student.getBatch() == null) {
            return Collections.emptyList();
        }
        return noteRepository.findByBatchId(student.getBatch().getId()).stream()
                .map(this::convertNoteToDTO)
                .toList();
    }

    public HomeworkDTO createBatchHomework(Long batchId, HomeworkDTO dto, String email) {
        Batch batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new RuntimeException("Batch not found"));
        User creator = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Instructor not found"));

        Homework homework = Homework.builder()
                .title(dto.getTitle())
                .description(dto.getDescription())
                .batch(batch)
                .subjectName(dto.getSubjectName())
                .fileUrl(dto.getFileUrl())
                .publicId(dto.getPublicId())
                .dueDate(dto.getDueDate())
                .createdBy(creator)
                .isVisible(dto.getIsVisible() != null ? dto.getIsVisible() : true)
                .build();

        Homework saved = homeworkRepository.save(homework);
        return convertHomeworkToDTO(saved);
    }

    public List<HomeworkDTO> getBatchHomeworks(Long batchId) {
        return homeworkRepository.findByBatchId(batchId).stream()
                .map(this::convertHomeworkToDTO)
                .toList();
    }

    public List<HomeworkDTO> getStudentBatchHomeworks(String email) {
        User student = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Student not found"));
        if (student.getBatch() == null) {
            return Collections.emptyList();
        }
        return homeworkRepository.findByBatchId(student.getBatch().getId()).stream()
                .map(this::convertHomeworkToDTO)
                .toList();
    }

    public AnnouncementDTO createBatchAnnouncement(Long batchId, AnnouncementDTO dto, String email) {
        Batch batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new RuntimeException("Batch not found"));
        User creator = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Instructor not found"));

        Announcement ann = Announcement.builder()
                .title(dto.getTitle())
                .message(dto.getMessage())
                .imageUrl(dto.getImageUrl())
                .batch(batch)
                .targetRole(dto.getTargetRole() != null ? dto.getTargetRole() : Announcement.TargetRole.STUDENT)
                .pinned(dto.getPinned() != null ? dto.getPinned() : false)
                .createdBy(creator)
                .instagramUrl(dto.getInstagramUrl())
                .externalLink(dto.getExternalLink())
                .build();

        Announcement saved = announcementRepository.save(ann);
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
                .sorted(Comparator.comparing(AttendanceDTO::getDate).reversed())
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

