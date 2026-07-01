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
import com.learnhub.repository.NoteViewLogRepository;
import com.learnhub.repository.HomeworkSubmissionRepository;
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
    private final NoteViewLogRepository noteViewLogRepository;
    private final HomeworkSubmissionRepository homeworkSubmissionRepository;

    public GoogleDriveSyncService(
            @org.springframework.beans.factory.annotation.Autowired(required = false) Drive googleDrive,
            BatchRepository batchRepository,
            NoteRepository noteRepository,
            HomeworkRepository homeworkRepository,
            UserRepository userRepository,
            NoteViewLogRepository noteViewLogRepository,
            HomeworkSubmissionRepository homeworkSubmissionRepository) {
        this.googleDrive = googleDrive;
        this.batchRepository = batchRepository;
        this.noteRepository = noteRepository;
        this.homeworkRepository = homeworkRepository;
        this.userRepository = userRepository;
        this.noteViewLogRepository = noteViewLogRepository;
        this.homeworkSubmissionRepository = homeworkSubmissionRepository;
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

        Set<String> activeFileIds = new HashSet<>();

        for (var batchFolder : batchFolders) {
            String batchName = batchFolder.getName();
            Optional<Batch> batchOpt = batchRepository.findByName(batchName);

            // Fetch the top-level folders inside the batch folder (expecting Subject folders)
            List<com.google.api.services.drive.model.File> subjectFolders = getFoldersInParent(batchFolder.getId());

            // Collect all subjects to assign them if we create/initialize the batch
            Set<String> subjects = new HashSet<>();
            if (subjectFolders != null) {
                for (var subFolder : subjectFolders) {
                    subjects.add(subFolder.getName());
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
            // Now run the sync traversal: Batch -> Subject Folder -> Notes & Homework
            if (subjectFolders != null) {
                for (var subjectFolder : subjectFolders) {
                    String subjectName = subjectFolder.getName();
                    
                    // Fetch category folders inside the subject folder (expecting Notes, Homework, Assignments)
                    List<com.google.api.services.drive.model.File> typeFolders = getFoldersInParent(subjectFolder.getId());
                    if (typeFolders == null) continue;
                    
                    for (var typeFolder : typeFolders) {
                        String typeName = typeFolder.getName().trim();
                        if (typeName.equalsIgnoreCase("Notes")) {
                            System.out.println("  Syncing notes for subject: " + subjectName);
                            syncNotes(typeFolder.getId(), batch, subjectName, uploader, activeFileIds);
                        } else if (typeName.equalsIgnoreCase("Homework") || typeName.equalsIgnoreCase("Assignments")) {
                            System.out.println("  Syncing homework for subject: " + subjectName);
                            syncHomework(typeFolder.getId(), batch, subjectName, uploader, activeFileIds);
                        }
                    }
                }
            }
        }

        // Deletion Cleanup: Remove notes and homeworks that no longer exist in Google Drive
        List<Note> allDbNotes = noteRepository.findAll();
        for (Note note : allDbNotes) {
            if (note.getPublicId() != null && note.getFileUrl() != null && note.getFileUrl().contains("drive.google.com")) {
                if (!activeFileIds.contains(note.getPublicId())) {
                    System.out.println("Cleaning up deleted Note from DB: " + note.getTitle());
                    // Delete child view logs first to avoid constraint violation
                    noteViewLogRepository.deleteAll(noteViewLogRepository.findByNoteId(note.getId()));
                    noteRepository.delete(note);
                }
            }
        }

        List<Homework> allDbHomeworks = homeworkRepository.findAll();
        for (Homework hw : allDbHomeworks) {
            if (hw.getPublicId() != null && hw.getFileUrl() != null && hw.getFileUrl().contains("drive.google.com")) {
                if (!activeFileIds.contains(hw.getPublicId())) {
                    System.out.println("Cleaning up deleted Homework from DB: " + hw.getTitle());
                    // Delete student submissions first to avoid constraint violation
                    homeworkSubmissionRepository.deleteAll(homeworkSubmissionRepository.findByHomeworkId(hw.getId()));
                    homeworkRepository.delete(hw);
                }
            }
        }
    }

    private void syncNotes(String parentId, Batch batch, String subjectName, User uploader, Set<String> activeFileIds) throws Exception {
        List<com.google.api.services.drive.model.File> files = getFilesInParent(parentId);
        System.out.println("    Found " + files.size() + " files in Notes folder.");

        for (var file : files) {
            activeFileIds.add(file.getId());
            Optional<Note> existingNoteOpt = noteRepository.findByPublicId(file.getId());
            if (existingNoteOpt.isPresent()) {
                Note existingNote = existingNoteOpt.get();
                boolean changed = false;
                String currentTitle = removeFileExtension(file.getName());
                if (!currentTitle.equals(existingNote.getTitle())) {
                    existingNote.setTitle(currentTitle);
                    existingNote.setOriginalFilename(file.getName());
                    changed = true;
                }
                if (file.getSize() != null && !file.getSize().equals(existingNote.getFileSize())) {
                    existingNote.setFileSize(file.getSize());
                    changed = true;
                }
                if (changed) {
                    noteRepository.save(existingNote);
                    System.out.println("      Updated existing Note details: " + file.getName());
                }
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

    private void syncHomework(String parentId, Batch batch, String subjectName, User creator, Set<String> activeFileIds) throws Exception {
        List<com.google.api.services.drive.model.File> files = getFilesInParent(parentId);
        System.out.println("    Found " + files.size() + " files in Homework folder.");

        for (var file : files) {
            activeFileIds.add(file.getId());
            Optional<Homework> existingHwOpt = homeworkRepository.findByPublicId(file.getId());
            if (existingHwOpt.isPresent()) {
                Homework existingHw = existingHwOpt.get();
                boolean changed = false;
                String currentTitle = removeFileExtension(file.getName());
                if (!currentTitle.equals(existingHw.getTitle())) {
                    existingHw.setTitle(currentTitle);
                    changed = true;
                }
                if (changed) {
                    homeworkRepository.save(existingHw);
                    System.out.println("      Updated existing Homework details: " + file.getName());
                }
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

    public void deleteFileFromDrive(String fileId) {
        if (googleDrive == null || fileId == null || fileId.isBlank()) return;
        try {
            googleDrive.files().delete(fileId).execute();
            System.out.println("Successfully deleted file from Google Drive: " + fileId);
        } catch (Exception e) {
            System.err.println("Could not delete file permanently (lack of ownership). Attempting to remove from parent folders... Error: " + e.getMessage());
            try {
                com.google.api.services.drive.model.File file = googleDrive.files().get(fileId)
                        .setFields("parents")
                        .execute();
                List<String> parents = file.getParents();
                if (parents != null && !parents.isEmpty()) {
                    for (String parent : parents) {
                        googleDrive.files().update(fileId, null)
                                .setRemoveParents(parent)
                                .execute();
                    }
                    System.out.println("Successfully unparented/removed file from folders: " + fileId);
                }
            } catch (Exception ex) {
                System.err.println("Failed to remove file parents: " + ex.getMessage());
            }
        }
    }

    private String getOrCreateFolder(String folderName, String parentId) throws Exception {
        if (googleDrive == null) {
            throw new IllegalStateException("Google Drive client is not initialized");
        }
        String q = String.format("'%s' in parents and mimeType = 'application/vnd.google-apps.folder' and name = '%s' and trashed = false", 
                parentId, folderName.replace("'", "\\'"));
        List<com.google.api.services.drive.model.File> folders = googleDrive.files().list()
                .setQ(q)
                .setFields("files(id, name)")
                .execute()
                .getFiles();
        if (folders != null && !folders.isEmpty()) {
            return folders.get(0).getId();
        }
        
        com.google.api.services.drive.model.File folderMetadata = new com.google.api.services.drive.model.File();
        folderMetadata.setName(folderName);
        folderMetadata.setMimeType("application/vnd.google-apps.folder");
        if (parentId != null) {
            folderMetadata.setParents(Collections.singletonList(parentId));
        }
        com.google.api.services.drive.model.File createdFolder = googleDrive.files().create(folderMetadata)
                .setFields("id")
                .execute();
        return createdFolder.getId();
    }

    public String uploadFileToDrive(String batchName, String categoryFolder, String subjectName, String fileName, byte[] fileBytes, String mimeType) {
        if (googleDrive == null) {
            System.err.println("Google Drive is disabled, skipping drive upload for: " + fileName);
            return null;
        }
        try {
            String parentId = (rootFolderId != null && !rootFolderId.isEmpty()) ? rootFolderId : "root";
            
            // 1. Get/Create Batch folder
            String batchFolderId = getOrCreateFolder(batchName, parentId);
            
            // 2. Get/Create Subject folder (e.g. "Science")
            String subjectFolderId = getOrCreateFolder(subjectName, batchFolderId);
            
            // 3. Get/Create category folder (e.g. "Notes" or "Homework") inside the Subject folder
            String categoryFolderId = getOrCreateFolder(categoryFolder, subjectFolderId);
            
            // 4. Upload file to category folder
            com.google.api.services.drive.model.File fileMetadata = new com.google.api.services.drive.model.File();
            fileMetadata.setName(fileName);
            fileMetadata.setParents(Collections.singletonList(categoryFolderId));
            
            com.google.api.client.http.InputStreamContent mediaContent = new com.google.api.client.http.InputStreamContent(
                    mimeType, new java.io.ByteArrayInputStream(fileBytes));
            
            com.google.api.services.drive.model.File uploadedFile = googleDrive.files().create(fileMetadata, mediaContent)
                    .setFields("id, webViewLink")
                    .execute();
            
            return uploadedFile.getId();
        } catch (Exception e) {
            System.err.println("Error uploading file to Google Drive: " + e.getMessage());
            return null;
        }
    }

    private List<com.google.api.services.drive.model.File> getFoldersInParent(String parentId) throws Exception {
        String q = String.format("'%s' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false", parentId);
        List<com.google.api.services.drive.model.File> files = googleDrive.files().list()
                .setQ(q)
                .setFields("files(id, name)")
                .execute()
                .getFiles();
        return files != null ? files : new java.util.ArrayList<>();
    }

    private List<com.google.api.services.drive.model.File> getFilesInParent(String parentId) throws Exception {
        String q = String.format("'%s' in parents and mimeType != 'application/vnd.google-apps.folder' and trashed = false", parentId);
        List<com.google.api.services.drive.model.File> files = googleDrive.files().list()
                .setQ(q)
                .setFields("files(id, name, size)")
                .execute()
                .getFiles();
        return files != null ? files : new java.util.ArrayList<>();
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
