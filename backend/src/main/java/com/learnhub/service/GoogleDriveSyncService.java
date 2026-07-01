package com.learnhub.service;

import com.google.api.services.drive.Drive;
import com.learnhub.entity.Batch;
import com.learnhub.entity.Homework;
import com.learnhub.entity.Note;
import com.learnhub.entity.User;
import com.learnhub.repository.BatchRepository;
import com.learnhub.repository.HomeworkRepository;
import com.learnhub.repository.NoteRepository;
import com.learnhub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.HashSet;

@Service
public class GoogleDriveSyncService {

    private final Drive googleDrive;
    private final BatchRepository batchRepository;
    private final NoteRepository noteRepository;
    private final HomeworkRepository homeworkRepository;
    private final UserRepository userRepository;

    public GoogleDriveSyncService(
            @org.springframework.beans.factory.annotation.Autowired(required = false) Drive googleDrive,
            BatchRepository batchRepository,
            NoteRepository noteRepository,
            HomeworkRepository homeworkRepository,
            UserRepository userRepository) {
        this.googleDrive = googleDrive;
        this.batchRepository = batchRepository;
        this.noteRepository = noteRepository;
        this.homeworkRepository = homeworkRepository;
        this.userRepository = userRepository;
    }

    @Value("${google.drive.root.folder.id:}")
    private String rootFolderId;

    /**
     * Scheduled task to run Google Drive synchronization automatically every 30 minutes.
     */
    @Scheduled(cron = "0 */30 * * * *")
    public void scheduledSync() {
        System.out.println("Executing automated Google Drive sync task...");
        try {
            syncAll(null);
            System.out.println("Automated Google Drive sync completed successfully.");
        } catch (Exception e) {
            System.err.println("Automated Google Drive sync failed: " + e.getMessage());
        }
    }

    /**
     * Run full sync from a specific folder ID or default config folder ID.
     */
    @Transactional
    public void syncAll(String folderId) throws Exception {
        if (googleDrive == null) {
            throw new IllegalStateException("Google Drive synchronization is disabled because Google Drive credentials were not found at startup.");
        }

        String parentId = (folderId != null && !folderId.isEmpty()) ? folderId 
                : ((rootFolderId != null && !rootFolderId.isEmpty()) ? rootFolderId : "root");

        System.out.println("Starting Google Drive synchronization using parent folder ID: " + parentId);
        List<com.google.api.services.drive.model.File> batchFolders = getFoldersInParent(parentId);

        if (batchFolders.isEmpty()) {
            System.out.println("No batch folders found in Google Drive root.");
            return;
        }

        // Find a default uploader/creator (Admin or Instructor)
        User defaultUploader = userRepository.findAll().stream()
                .filter(u -> u.getRole() == User.Role.ADMIN || u.getRole() == User.Role.INSTRUCTOR)
                .findFirst()
                .orElse(null);

        for (var batchFolder : batchFolders) {
            String batchName = batchFolder.getName();
            Optional<Batch> batchOpt = batchRepository.findByName(batchName);

            // Fetch the top-level folders inside the batch folder (expecting Notes and Homework)
            List<com.google.api.services.drive.model.File> typeFolders = getFoldersInParent(batchFolder.getId());

            // Collect all subjects under 'Notes' and 'Homework' to assign them if we create/initialize the batch
            Set<String> subjects = new HashSet<>();
            for (var typeFolder : typeFolders) {
                String typeName = typeFolder.getName().trim();
                if (typeName.equalsIgnoreCase("Notes") || typeName.equalsIgnoreCase("Homework") || typeName.equalsIgnoreCase("Assignments")) {
                    List<com.google.api.services.drive.model.File> subjectFolders = getFoldersInParent(typeFolder.getId());
                    if (subjectFolders != null) {
                        for (var subFolder : subjectFolders) {
                            subjects.add(subFolder.getName());
                        }
                    }
                }
            }

            Batch batch;
            if (batchOpt.isEmpty()) {
                System.out.println("Google Drive folder '" + batchName + "' has no matching database Batch. Initializing dynamically.");
                
                // Determine batch level
                String level = "Class X";
                for (String possibleLevel : List.of("Class VIII", "Class IX", "Class X", "Class XI", "Class XII", "Undergraduate", "Postgraduate")) {
                    if (batchName.toLowerCase().contains(possibleLevel.toLowerCase())) {
                        level = possibleLevel;
                        break;
                    }
                }

                batch = Batch.builder()
                        .name(batchName)
                        .level(level)
                        .instructor(defaultUploader)
                        .subjects(subjects)
                        .build();
                
                batch = batchRepository.save(batch);
                System.out.println("Successfully created batch: " + batchName + " with level " + level + " and subjects " + subjects);
            } else {
                batch = batchOpt.get();
                // Dynamically sync subjects if they changed in Google Drive
                boolean subjectsChanged = false;
                if (batch.getSubjects() == null) {
                    batch.setSubjects(new HashSet<>());
                }
                for (String sub : subjects) {
                    if (!batch.getSubjects().contains(sub)) {
                        batch.getSubjects().add(sub);
                        subjectsChanged = true;
                    }
                }
                if (subjectsChanged) {
                    batch = batchRepository.save(batch);
                }
            }

            User uploader = batch.getInstructor() != null ? batch.getInstructor() : defaultUploader;
            if (uploader == null) {
                System.err.println("No instructor or admin found to assign files for batch: " + batchName);
                continue;
            }

            System.out.println("Syncing batch: " + batchName);
            // Now run the sync traversal
            for (var typeFolder : typeFolders) {
                String typeName = typeFolder.getName().trim();
                List<com.google.api.services.drive.model.File> subjectFolders = getFoldersInParent(typeFolder.getId());
                if (subjectFolders == null) continue;

                if (typeName.equalsIgnoreCase("Notes")) {
                    for (var subjectFolder : subjectFolders) {
                        String subjectName = subjectFolder.getName();
                        System.out.println("  Syncing notes for subject: " + subjectName);
                        syncNotes(subjectFolder.getId(), batch, subjectName, uploader);
                    }
                } else if (typeName.equalsIgnoreCase("Homework") || typeName.equalsIgnoreCase("Assignments")) {
                    for (var subjectFolder : subjectFolders) {
                        String subjectName = subjectFolder.getName();
                        System.out.println("  Syncing homework for subject: " + subjectName);
                        syncHomework(subjectFolder.getId(), batch, subjectName, uploader);
                    }
                }
            }
        }
    }

    private void syncNotes(String parentId, Batch batch, String subjectName, User uploader) throws Exception {
        List<com.google.api.services.drive.model.File> files = getFilesInParent(parentId);
        System.out.println("    Found " + files.size() + " files in Notes folder.");

        for (var file : files) {
            if (noteRepository.existsByPublicId(file.getId())) {
                continue;
            }

            System.out.println("      New Note found: " + file.getName());
            String title = removeFileExtension(file.getName());
            String fileUrl = String.format("https://drive.google.com/file/d/%s/view?usp=drivesdk", file.getId());

            // Extract PDF text for the AI chat assistant
            String extractedText = "";
            if (file.getName().toLowerCase().endsWith(".pdf")) {
                extractedText = extractTextFromDriveFile(file.getId());
            }

            Note note = Note.builder()
                    .title(title)
                    .description("Synced from Google Drive Folder: " + subjectName + " Notes")
                    .batch(batch)
                    .subjectName(subjectName)
                    .fileUrl(fileUrl)
                    .secureUrl(fileUrl)
                    .publicId(file.getId())
                    .uploadedBy(uploader)
                    .extractedText(extractedText)
                    .aiEnabled(true)
                    .isVisible(true)
                    .originalFilename(file.getName())
                    .fileSize(file.getSize() != null ? file.getSize() : 0L)
                    .resourceType("pdf")
                    .build();

            noteRepository.save(note);
            System.out.println("      Successfully saved Note: " + title);
        }
    }

    private void syncHomework(String parentId, Batch batch, String subjectName, User creator) throws Exception {
        List<com.google.api.services.drive.model.File> files = getFilesInParent(parentId);
        System.out.println("    Found " + files.size() + " files in Homework folder.");

        for (var file : files) {
            if (homeworkRepository.existsByPublicId(file.getId())) {
                continue;
            }

            System.out.println("      New Homework found: " + file.getName());
            String title = removeFileExtension(file.getName());
            String fileUrl = String.format("https://drive.google.com/file/d/%s/view?usp=drivesdk", file.getId());

            Homework homework = Homework.builder()
                    .title(title)
                    .description("Synced from Google Drive Folder: " + subjectName + " Homework")
                    .batch(batch)
                    .subjectName(subjectName)
                    .fileUrl(fileUrl)
                    .publicId(file.getId())
                    .dueDate(LocalDateTime.now().plusDays(7)) // Default 7 days from now
                    .createdBy(creator)
                    .isVisible(true)
                    .build();

            homeworkRepository.save(homework);
            System.out.println("      Successfully saved Homework: " + title);
        }
    }

    private List<com.google.api.services.drive.model.File> getFoldersInParent(String parentId) throws Exception {
        String q = String.format("'%s' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false", parentId);
        return googleDrive.files().list()
                .setQ(q)
                .setFields("files(id, name)")
                .execute()
                .getFiles();
    }

    private List<com.google.api.services.drive.model.File> getFilesInParent(String parentId) throws Exception {
        String q = String.format("'%s' in parents and mimeType != 'application/vnd.google-apps.folder' and trashed = false", parentId);
        return googleDrive.files().list()
                .setQ(q)
                .setFields("files(id, name, size)")
                .execute()
                .getFiles();
    }

    private String extractTextFromDriveFile(String fileId) {
        try (InputStream is = googleDrive.files().get(fileId).executeMediaAsInputStream()) {
            try (PDDocument document = PDDocument.load(is)) {
                PDFTextStripper stripper = new PDFTextStripper();
                return stripper.getText(document);
            }
        } catch (Exception e) {
            System.err.println("Could not extract text from Google Drive file: " + fileId + " - " + e.getMessage());
            return "";
        }
    }

    private String removeFileExtension(String filename) {
        if (filename == null || filename.indexOf(".") == -1) {
            return filename;
        }
        return filename.substring(0, filename.lastIndexOf("."));
    }
}
