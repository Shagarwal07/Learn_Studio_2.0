package com.learnhub.service;

import com.learnhub.dto.NoteDTO;
import com.learnhub.entity.Note;
import com.learnhub.entity.NoteViewLog;
import com.learnhub.entity.User;
import com.learnhub.repository.*;
import lombok.RequiredArgsConstructor;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.graphics.state.PDExtendedGraphicsState;
import org.apache.pdfbox.pdmodel.encryption.AccessPermission;
import org.apache.pdfbox.pdmodel.encryption.StandardProtectionPolicy;
import org.apache.pdfbox.text.PDFTextStripper;
import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import java.io.InputStream;
import java.net.URL;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class NoteService {

    private final NoteRepository noteRepository;
    private final NoteViewLogRepository noteViewLogRepository;
    private final CourseRepository courseRepository;
    private final LessonRepository lessonRepository;
    private final UserRepository userRepository;
    private final EnrollmentRepository enrollmentRepository;
    // Cloudinary removed
    private final AiService aiService;
    private final GoogleDriveSyncService googleDriveSyncService;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.google.api.services.drive.Drive googleDrive;

    @Transactional
    public NoteDTO uploadNote(String email, String title, String description, Long courseId, Long lessonId, MultipartFile file) {
        User instructor = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Instructor not found"));

        var course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));

        var lesson = lessonId != null ? lessonRepository.findById(lessonId).orElse(null) : null;

        try {
            System.out.println("Starting Google Drive upload for course note: " + title);
            String secureUrl = null;
            String publicId = null;
            String resourceType = "pdf";

            if (googleDriveSyncService != null && file.getOriginalFilename() != null) {
                try {
                    byte[] fileBytes = file.getBytes();
                    String driveFileId = googleDriveSyncService.uploadFileToDrive(
                            course.getTitle(),
                            "Notes",
                            lesson != null ? lesson.getTitle() : "General",
                            file.getOriginalFilename(),
                            fileBytes,
                            file.getContentType() != null ? file.getContentType() : "application/pdf"
                    );
                    if (driveFileId != null) {
                        publicId = driveFileId;
                        secureUrl = String.format("https://drive.google.com/file/d/%s/view?usp=drivesdk", driveFileId);
                        System.out.println("Google Drive upload success for course note: " + title + ", fileId: " + driveFileId);
                    } else {
                        throw new RuntimeException("Drive file ID returned null");
                    }
                } catch (Exception ex) {
                    System.err.println("Google Drive upload failed for course note: " + ex.getMessage());
                    throw ex;
                }
            } else {
                throw new RuntimeException("Google Drive Sync Service is not available or filename is null");
            }

            // 2. Extract Text from PDF using PDFBox
            String extractedText = "";
            try (InputStream is = file.getInputStream()) {
                extractedText = extractTextFromPdf(is);
            } catch (Exception e) {
                System.err.println("Could not extract PDF text: " + e.getMessage());
            }

            // 3. Build & Save Entity
            Note note = Note.builder()
                    .title(title)
                    .description(description)
                    .course(course)
                    .lesson(lesson)
                    .fileUrl(secureUrl)
                    .publicId(publicId)
                    .uploadedBy(instructor)
                    .isVisible(true)
                    .extractedText(extractedText)
                    .aiEnabled(true)
                    .originalFilename(file.getOriginalFilename())
                    .fileSize(file.getSize())
                    .resourceType(resourceType)
                    .secureUrl(secureUrl)
                    .build();

            return toDTO(noteRepository.save(note));
        } catch (Exception e) {
            System.err.println("Cloudinary upload failed for course note: " + title + " - " + e.getMessage());
            throw new RuntimeException("Note upload failed: " + e.getMessage(), e);
        }
    }

    public List<NoteDTO> getNotesForCourse(String studentEmail, Long courseId) {
        User user = userRepository.findByEmail(studentEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Students must be enrolled to view notes
        if (user.getRole() == User.Role.STUDENT) {
            boolean enrolled = enrollmentRepository.existsByUserIdAndCourseId(user.getId(), courseId);
            if (!enrolled) {
                throw new RuntimeException("You must be enrolled in this course to access notes");
            }
            if (user.getBatch() != null) {
                return noteRepository.findByCourseIdAndBatchIdOrBatchNull(courseId, user.getBatch().getId()).stream()
                        .map(this::toDTO)
                        .toList();
            } else {
                return noteRepository.findByCourseIdAndBatchIsNull(courseId).stream()
                        .map(this::toDTO)
                        .toList();
            }
        }

        return noteRepository.findByCourseIdAndIsVisibleTrue(courseId).stream()
                .map(this::toDTO)
                .toList();
    }

    public List<Map<String, Object>> getCoursesWithNotes(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<com.learnhub.entity.Course> courses;
        if (user.getRole() == User.Role.STUDENT) {
            courses = enrollmentRepository.findByUserId(user.getId()).stream()
                    .map(com.learnhub.entity.Enrollment::getCourse)
                    .toList();
        } else if (user.getRole() == User.Role.INSTRUCTOR) {
            courses = courseRepository.findByInstructorId(user.getId());
        } else {
            courses = courseRepository.findAll();
        }

        return courses.stream()
                .map(course -> {
                    long noteCount = noteRepository.findByCourseIdAndIsVisibleTrue(course.getId()).size();
                    return Map.of(
                            "id", (Object) course.getId(),
                            "title", (Object) course.getTitle(),
                            "thumbnail", (Object) (course.getThumbnail() != null ? course.getThumbnail() : ""),
                            "noteCount", (Object) noteCount
                    );
                })
                .filter(m -> (long) m.get("noteCount") > 0 || user.getRole() != User.Role.STUDENT)
                .toList();
    }

    public byte[] secureViewNote(String email, Long noteId, String ipAddress, String userAgent) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new RuntimeException("Note not found"));

        // Validate access
        validateStudentNoteAccess(user, note);

        // Log the view event
        NoteViewLog log = NoteViewLog.builder()
                .note(note)
                .user(user)
                .viewedAt(LocalDateTime.now())
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .build();
        noteViewLogRepository.save(log);

        // Fetch PDF from Cloudinary or Google Drive URL, apply watermark and protection, and return bytes
        try {
            byte[] pdfBytes = null;
            boolean isGoogleDrive = note.getFileUrl() != null && note.getFileUrl().contains("drive.google.com");

            if (isGoogleDrive) {
                // Try downloading via Google Drive API if client is available
                if (googleDrive != null && note.getPublicId() != null && !note.getPublicId().isBlank()) {
                    try {
                        System.out.println("Downloading Google Drive PDF using Drive API client for file ID: " + note.getPublicId());
                        try (InputStream driveStream = googleDrive.files().get(note.getPublicId()).executeMediaAsInputStream()) {
                            pdfBytes = driveStream.readAllBytes();
                        }
                    } catch (Exception ex) {
                        System.err.println("Google Drive API download failed: " + ex.getMessage());
                    }
                }
                
                // Fallback to public export URL if API client failed or is null
                if (pdfBytes == null && note.getPublicId() != null && !note.getPublicId().isBlank()) {
                    try {
                        String exportUrl = "https://drive.google.com/uc?export=download&id=" + note.getPublicId();
                        System.out.println("Trying public Google Drive export download: " + exportUrl);
                        URL url = new URL(exportUrl);
                        java.net.HttpURLConnection conn = (java.net.HttpURLConnection) url.openConnection();
                        conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
                        try (InputStream is = conn.getInputStream()) {
                            pdfBytes = is.readAllBytes();
                        }
                    } catch (Exception ex) {
                        System.err.println("Google Drive export URL download failed: " + ex.getMessage());
                    }
                }
            } else {
                System.out.println("Note file URL is not Google Drive (likely GCP Cloud Storage or public URL): " + note.getFileUrl());
            }

            // Fallback for either if pdfBytes is still null (e.g. GCP storage URLs, S3, or standard HTTP links)
            if (pdfBytes == null) {
                if (note.getFileUrl() != null && !note.getFileUrl().isBlank()) {
                    System.out.println("Downloading PDF directly from public URL: " + note.getFileUrl());
                    URL url = new URL(note.getFileUrl());
                    java.net.HttpURLConnection conn = (java.net.HttpURLConnection) url.openConnection();
                    conn.setConnectTimeout(15000);
                    conn.setReadTimeout(60000);
                    conn.setInstanceFollowRedirects(true);
                    conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
                    try (InputStream is = conn.getInputStream()) {
                        pdfBytes = is.readAllBytes();
                    }
                } else {
                    throw new RuntimeException("No file URL or public ID available for this note");
                }
            }

            // Simplify: bypass watermark/cryptographic PDFBox modifications and return raw bytes directly
            return pdfBytes;
        } catch (Exception e) {
            throw new RuntimeException("Failed to load or secure PDF file: " + e.getMessage(), e);
        }
    }

    private byte[] watermarkAndProtectPdf(InputStream inputStream, User user, String ipAddress) {
        try (PDDocument document = PDDocument.load(inputStream)) {
            // 1. Generate Watermark Text
            String timestamp = LocalDateTime.now().format(
                    java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
            String watermarkText = String.format("%s (%s) | IP: %s | %s | LEARNSTUDIO SECURE STREAM",
                    user.getName(), user.getEmail(), ipAddress, timestamp);

            // 2. Add Watermark to all pages
            for (PDPage page : document.getPages()) {
                float width = page.getMediaBox().getWidth();
                float height = page.getMediaBox().getHeight();

                // Append mode, compress, preserve graphics state
                try (PDPageContentStream contentStream = new PDPageContentStream(
                        document, page, PDPageContentStream.AppendMode.APPEND, true, true)) {

                    // Configure semi-transparent graphics state (10% opacity)
                    PDExtendedGraphicsState graphicsState = new PDExtendedGraphicsState();
                    graphicsState.setNonStrokingAlphaConstant(0.10f);
                    graphicsState.setAlphaSourceFlag(true);
                    contentStream.setGraphicsStateParameters(graphicsState);

                    // Set font and color (using standard Helvetica Bold)
                    contentStream.setFont(PDType1Font.HELVETICA_BOLD, 12);
                    contentStream.setNonStrokingColor(Color.GRAY);

                    // Draw multiple diagonal lines of watermark to ensure full page coverage
                    float angle = (float) Math.toRadians(30);
                    float cos = (float) Math.cos(angle);
                    float sin = (float) Math.sin(angle);

                    // We will draw three diagonal rows at 25%, 50%, and 75% of page height
                    float[] yFractions = { 0.25f, 0.50f, 0.75f };
                    for (float yFraction : yFractions) {
                        contentStream.beginText();
                        // Position text diagonally across the page width
                        contentStream.setTextMatrix(cos, sin, -sin, cos, width * 0.05f, height * yFraction);
                        contentStream.showText(watermarkText);
                        contentStream.endText();
                    }
                }
            }

            // 3. Configure PDF permissions & encryption to prevent copying/printing/editing
            AccessPermission ap = new AccessPermission();
            ap.setCanPrint(false);
            ap.setCanExtractContent(false);
            ap.setCanModify(false);
            ap.setCanAssembleDocument(false);
            ap.setCanFillInForm(false);
            ap.setCanModifyAnnotations(false);

            // Use a random UUID as the owner password (practically un-guessable)
            String ownerPassword = UUID.randomUUID().toString();
            // User password is empty so anyone can open and view it in the iframe
            StandardProtectionPolicy spp = new StandardProtectionPolicy(ownerPassword, "", ap);
            spp.setEncryptionKeyLength(128);
            document.protect(spp);

            // 4. Save to byte array
            try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
                document.save(baos);
                return baos.toByteArray();
            }
        } catch (Exception e) {
            System.err.println("Failed to watermark or protect PDF: " + e.getMessage());
            throw new RuntimeException("Failed to secure PDF document: " + e.getMessage(), e);
        }
    }

    public NoteDTO getNoteById(String email, Long noteId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new RuntimeException("Note not found"));

        validateStudentNoteAccess(user, note);

        return toDTO(note);
    }

    @Transactional
    public void deleteNote(String email, Long noteId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new RuntimeException("Note not found"));

        // Only uploader or admin can delete
        if (user.getRole() != User.Role.ADMIN && !note.getUploadedBy().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized to delete this note");
        }

        // Delete from storage
        if (note.getPublicId() != null) {
            if (note.getFileUrl() != null && note.getFileUrl().contains("drive.google.com")) {
                googleDriveSyncService.deleteFileFromDrive(note.getPublicId());
            } else {
                System.err.println("Legacy Cloudinary note deletion is no longer supported.");
            }
        }

        // Delete child view logs first to maintain referential integrity
        noteViewLogRepository.deleteAll(noteViewLogRepository.findByNoteId(noteId));

        noteRepository.delete(note);
    }

    public String askAiAboutNote(String email, Long noteId, String question, String selectedText, String mode) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new RuntimeException("Note not found"));

        // Students must be enrolled or assigned to the batch
        validateStudentNoteAccess(user, note);

        if (note.getExtractedText() == null || note.getExtractedText().isBlank()) {
            return "AI notes assistant cannot find text in this PDF to answer your question.";
        }

        // Build context-aware prompt
        String context = note.getExtractedText();
        // Limit context size to prevent exceeding token limits
        if (context.length() > 6000) {
            context = context.substring(0, 6000) + "... [truncated]";
        }

        StringBuilder promptBuilder = new StringBuilder();
        promptBuilder.append("You are an AI learning assistant helping a student with their course notes.\n");
        promptBuilder.append("Here is the context extracted from the note titled '").append(note.getTitle()).append("':\n");
        promptBuilder.append("=== NOTE CONTENT START ===\n").append(context).append("\n=== NOTE CONTENT END ===\n\n");

        if (selectedText != null && !selectedText.isBlank()) {
            promptBuilder.append("The student has highlighted the following text: '").append(selectedText).append("'\n");
        }

        promptBuilder.append("Question/Task: ").append(question).append("\n");
        promptBuilder.append("Mode: ").append(mode).append("\n");
        promptBuilder.append("Provide a helpful, precise, and educational response based on the note context. Keep it under 6-8 sentences.");

        // Call AI Service
        return aiService.askWithFallback(null, "NOTE_GENERATION", promptBuilder.toString(), "gemini");
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

    private void validateStudentNoteAccess(User user, Note note) {
        if (user.getRole() != User.Role.STUDENT) return;

        boolean batchMatch = (note.getBatch() != null && user.getBatch() != null && user.getBatch().getId().equals(note.getBatch().getId()));
        boolean courseMatch = (note.getCourse() != null && enrollmentRepository.existsByUserIdAndCourseId(user.getId(), note.getCourse().getId()));

        if (!batchMatch && !courseMatch) {
            throw new RuntimeException("Access denied: User is neither assigned to the offline batch nor enrolled in the corresponding course for this note.");
        }
    }

    public NoteDTO toDTO(Note note) {
        if (note == null) return null;
        return NoteDTO.builder()
                .id(note.getId())
                .title(note.getTitle())
                .description(note.getDescription())
                .courseId(note.getCourse() != null ? note.getCourse().getId() : null)
                .courseTitle(note.getCourse() != null ? note.getCourse().getTitle() : null)
                .batchId(note.getBatch() != null ? note.getBatch().getId() : null)
                .batchName(note.getBatch() != null ? note.getBatch().getName() : null)
                .lessonId(note.getLesson() != null ? note.getLesson().getId() : null)
                .lessonTitle(note.getLesson() != null ? note.getLesson().getTitle() : null)
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
}
