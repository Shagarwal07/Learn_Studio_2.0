package com.learnhub.service;

import com.learnhub.dto.UserDTO;
import com.learnhub.entity.*;
import com.learnhub.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.*;
import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional
public class AdminService {

    private final UserRepository userRepository;
    private final BatchRepository batchRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final AttendanceRepository attendanceRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final CertificateRepository certificateRepository;
    private final HomeworkSubmissionRepository homeworkSubmissionRepository;
    private final HomeworkRepository homeworkRepository;
    private final CourseRepository courseRepository;
    private final ScheduleEventRepository scheduleEventRepository;
    private final NoteRepository noteRepository;
    private final AnnouncementRepository announcementRepository;
    private final OnlineActivityLogRepository onlineActivityLogRepository;
    private final LessonProgressRepository lessonProgressRepository;
    private final ReviewRepository reviewRepository;
    private final ReviewHistoryRepository reviewHistoryRepository;
    private final PaperVersionRepository paperVersionRepository;
    private final NoteViewLogRepository noteViewLogRepository;
    private final PasswordEncoder passwordEncoder;

    public List<UserDTO> getAllUsers() {
        return userRepository.findByActiveTrue().stream().map(this::toDTO).toList();
    }

    public UserDTO createUser(UserDTO dto, String password) {
        if (userRepository.existsByEmail(dto.getEmail())) {
            throw new RuntimeException("Email already registered: " + dto.getEmail());
        }

        String plainPassword = (password == null || password.isBlank()) ? "LearnStudio123" : password;

        User user = User.builder()
                .name(dto.getName())
                .email(dto.getEmail())
                .password(passwordEncoder.encode(plainPassword))
                .role(User.Role.valueOf(dto.getRole().toUpperCase()))
                .build();

        if (user.getRole() == User.Role.STUDENT && dto.getBatchId() != null) {
            Batch batch = batchRepository.findById(dto.getBatchId())
                    .orElseThrow(() -> new RuntimeException("Batch not found with ID: " + dto.getBatchId()));
            user.setBatch(batch);
        }

        User saved = userRepository.save(user);
        return toDTO(saved);
    }

    public UserDTO updateUser(Long id, UserDTO dto, String password) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + id));

        if (!user.getEmail().equalsIgnoreCase(dto.getEmail()) && userRepository.existsByEmail(dto.getEmail())) {
            throw new RuntimeException("Email already in use: " + dto.getEmail());
        }

        user.setName(dto.getName());
        user.setEmail(dto.getEmail());
        user.setRole(User.Role.valueOf(dto.getRole().toUpperCase()));

        if (password != null && !password.isBlank() && !password.equals("[ENCRYPTED]")) {
            user.setPassword(passwordEncoder.encode(password));
        }

        if (user.getRole() == User.Role.STUDENT) {
            if (dto.getBatchId() != null) {
                Batch batch = batchRepository.findById(dto.getBatchId())
                        .orElseThrow(() -> new RuntimeException("Batch not found with ID: " + dto.getBatchId()));
                user.setBatch(batch);
            } else {
                user.setBatch(null);
            }
        } else {
            user.setBatch(null);
        }

        User saved = userRepository.save(user);
        return toDTO(saved);
    }

    private void checkUserDependencies(User user) {
        Long id = user.getId();
        

        
        if (user.getRole() == User.Role.STUDENT) {
            if (!noteViewLogRepository.findByUserId(id).isEmpty()) {
                throw new RuntimeException("This user has note view activity history and cannot be deleted. Deactivate them instead.");
            }
            if (!quizAttemptRepository.findByUserId(id).isEmpty()) {
                throw new RuntimeException("This user has quiz attempt records and cannot be deleted. Deactivate them instead.");
            }
            if (!attendanceRepository.findByStudentIdOrderByDateDesc(id).isEmpty()) {
                throw new RuntimeException("This user has attendance logs and cannot be deleted. Deactivate them instead.");
            }
            if (!homeworkSubmissionRepository.findByStudentId(id).isEmpty()) {
                throw new RuntimeException("This user has homework submissions and cannot be deleted. Deactivate them instead.");
            }
            if (!onlineActivityLogRepository.findByStudentIdOrderByDateDesc(id).isEmpty()) {
                throw new RuntimeException("This user has online course activity history and cannot be deleted. Deactivate them instead.");
            }
            if (!enrollmentRepository.findByUserId(id).isEmpty()) {
                throw new RuntimeException("This user is enrolled in courses and cannot be deleted. Deactivate them instead.");
            }
            if (!certificateRepository.findByUserId(id).isEmpty()) {
                throw new RuntimeException("This user has earned certificates and cannot be deleted. Deactivate them instead.");
            }
            if (!reviewRepository.findByUserId(id).isEmpty()) {
                throw new RuntimeException("This user has written course reviews and cannot be deleted. Deactivate them instead.");
            }
        }
        
        if (user.getRole() == User.Role.INSTRUCTOR || user.getRole() == User.Role.ADMIN) {
            if (!noteRepository.findByUploadedById(id).isEmpty()) {
                throw new RuntimeException("This user has uploaded study notes and cannot be deleted. Deactivate them instead.");
            }
            if (!homeworkRepository.findByCreatedById(id).isEmpty()) {
                throw new RuntimeException("This user has created homework tasks and cannot be deleted. Deactivate them instead.");
            }
            if (!batchRepository.findByInstructorId(id).isEmpty()) {
                throw new RuntimeException("This user is assigned to teach batches and cannot be deleted. Deactivate them instead.");
            }
            if (!courseRepository.findByInstructorId(id).isEmpty()) {
                throw new RuntimeException("This user is assigned to teach courses and cannot be deleted. Deactivate them instead.");
            }
            if (!scheduleEventRepository.findByInstructorIdOrderByEventDateAscStartTimeAsc(id).isEmpty() ||
                !scheduleEventRepository.findByCreatedByIdOrderByEventDateAscStartTimeAsc(id).isEmpty()) {
                throw new RuntimeException("This user is scheduled as an instructor or created events and cannot be deleted. Deactivate them instead.");
            }
            if (!announcementRepository.findByCreatedById(id).isEmpty()) {
                throw new RuntimeException("This user has published announcements and cannot be deleted. Deactivate them instead.");
            }
            if (!reviewHistoryRepository.findByReviewedById(id).isEmpty()) {
                throw new RuntimeException("This user has exam paper review history and cannot be deleted. Deactivate them instead.");
            }
            if (!paperVersionRepository.findByChangedById(id).isEmpty()) {
                throw new RuntimeException("This user has changed exam paper versions and cannot be deleted. Deactivate them instead.");
            }
        }
    }

    @Transactional
    public UserDTO deactivateUser(Long id, String adminEmail) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + id));
        user.setActive(false);
        user.setDeletedAt(java.time.LocalDateTime.now());
        user.setDeletedBy(adminEmail);
        
        if (user.getRole() == User.Role.STUDENT) {
            user.setBatch(null);
        }
        
        refreshTokenRepository.deleteByUserId(id);
        User saved = userRepository.save(user);
        return toDTO(saved);
    }

    @Transactional
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + id));

        // Enforce dependency checks to protect historical academic records in production
        checkUserDependencies(user);

        // 1. Delete refresh tokens
        refreshTokenRepository.deleteByUserId(id);

        // 2. Clear relations or delete dependent entities
        if (user.getRole() == User.Role.STUDENT) {
            List<Enrollment> enrollments = enrollmentRepository.findByUserId(id);
            for (Enrollment enrollment : enrollments) {
                lessonProgressRepository.deleteByEnrollmentId(enrollment.getId());
            }
            enrollmentRepository.deleteByUserId(id);
            certificateRepository.deleteByUserId(id);
            quizAttemptRepository.deleteByUserId(id);
            attendanceRepository.deleteByStudentId(id);
            homeworkSubmissionRepository.deleteByStudentId(id);
            onlineActivityLogRepository.deleteByStudentId(id);
        } else {
            // Instructor/Admin cleanup - Null out references to avoid FK constraints
            for (Course course : courseRepository.findByInstructorId(id)) {
                course.setInstructor(null);
                courseRepository.save(course);
            }
            for (Batch batch : batchRepository.findByInstructorId(id)) {
                batch.setInstructor(null);
                batchRepository.save(batch);
            }
            for (ScheduleEvent event : scheduleEventRepository.findByInstructorIdOrderByEventDateAscStartTimeAsc(id)) {
                event.setInstructor(null);
                scheduleEventRepository.save(event);
            }
            for (ScheduleEvent event : scheduleEventRepository.findByCreatedByIdOrderByEventDateAscStartTimeAsc(id)) {
                scheduleEventRepository.delete(event);
            }
            for (Note note : noteRepository.findByUploadedById(id)) {
                noteRepository.delete(note);
            }
            for (Homework homework : homeworkRepository.findByCreatedById(id)) {
                homeworkRepository.delete(homework);
            }
            for (Announcement announcement : announcementRepository.findByCreatedById(id)) {
                announcementRepository.delete(announcement);
            }
        }

        userRepository.delete(user);
    }

    // Export current database users as CSV String content
    public String exportUsersToCsvContent() {
        StringBuilder sb = new StringBuilder();
        sb.append("ID,Name,Email,Password,Role,BatchName\n");
        for (User u : userRepository.findByActiveTrue()) {
            String batchName = u.getBatch() != null ? u.getBatch().getName() : "";
            sb.append(String.format("%s,%s,%s,%s,%s,%s\n",
                    u.getId(),
                    escapeCsv(u.getName()),
                    escapeCsv(u.getEmail()),
                    "[ENCRYPTED]",
                    u.getRole().name(),
                    escapeCsv(batchName)
            ));
        }
        return sb.toString();
    }

    private String generateStudentPassword(String name, Set<String> batchPasswords) {
        String cleanName = name.toLowerCase().replaceAll("[^a-zA-Z0-9]", "");
        if (cleanName.isEmpty()) {
            cleanName = "student";
        }
        Random random = new Random();
        String pwd;
        do {
            int number = 1000 + random.nextInt(9000); // 4-digit unique number
            pwd = cleanName + "@" + number;
        } while (batchPasswords.contains(pwd));
        batchPasswords.add(pwd);
        return pwd;
    }

    // Sync database from a CSV input stream and return sync statistics
    public Map<String, Object> importUsersFromCsvContent(java.io.InputStream inputStream, boolean deleteUnfound) {
        int createdCount = 0;
        int updatedCount = 0;
        int failedCount = 0;
        Set<String> csvEmails = new HashSet<>();
        Set<String> generatedPasswords = new HashSet<>();
        List<Map<String, Object>> failedRows = new ArrayList<>();

        try (BufferedReader reader = new java.io.BufferedReader(new java.io.InputStreamReader(inputStream, java.nio.charset.StandardCharsets.UTF_8))) {
            String headerLine = reader.readLine(); 
            if (headerLine == null) {
                throw new RuntimeException("CSV file is empty");
            }
            
            String[] headers = headerLine.split(",");
            int nameIdx = -1;
            int emailIdx = -1;
            int passwordIdx = -1;
            int roleIdx = -1;
            int batchIdx = -1;

            for (int i = 0; i < headers.length; i++) {
                String h = headers[i].trim().toLowerCase();
                if (h.equals("name")) nameIdx = i;
                else if (h.equals("email")) emailIdx = i;
                else if (h.equals("password")) passwordIdx = i;
                else if (h.equals("role")) roleIdx = i;
                else if (h.equals("batchname") || h.equals("batch")) batchIdx = i;
            }

            if (nameIdx == -1 || emailIdx == -1) {
                throw new RuntimeException("Missing required headers: 'name' and 'email' must be present.");
            }

            String line;
            int rowNumber = 1; // Header is row 1
            while ((line = reader.readLine()) != null) {
                rowNumber++;
                if (line.trim().isBlank()) continue;
                String[] parts = line.split(",", -1);

                String name = parts.length > nameIdx ? unescapeCsv(parts[nameIdx].trim()) : "";
                String email = parts.length > emailIdx ? unescapeCsv(parts[emailIdx].trim()).toLowerCase() : "";
                String password = (passwordIdx != -1 && parts.length > passwordIdx) ? parts[passwordIdx].trim() : "";
                String roleStr = (roleIdx != -1 && parts.length > roleIdx) ? parts[roleIdx].trim().toUpperCase() : "";
                String batchName = (batchIdx != -1 && parts.length > batchIdx) ? unescapeCsv(parts[batchIdx].trim()) : "";

                if (name.isEmpty()) {
                    failedCount++;
                    Map<String, Object> failedRow = new LinkedHashMap<>();
                    failedRow.put("rowNumber", rowNumber);
                    failedRow.put("email", email.isEmpty() ? "[UNKNOWN]" : email);
                    failedRow.put("reason", "Name is required");
                    failedRows.add(failedRow);
                    continue;
                }
                if (email.isEmpty()) {
                    failedCount++;
                    Map<String, Object> failedRow = new LinkedHashMap<>();
                    failedRow.put("rowNumber", rowNumber);
                    failedRow.put("email", "[UNKNOWN]");
                    failedRow.put("reason", "Email is required");
                    failedRows.add(failedRow);
                    continue;
                }

                if (csvEmails.contains(email)) {
                    failedCount++;
                    Map<String, Object> failedRow = new LinkedHashMap<>();
                    failedRow.put("rowNumber", rowNumber);
                    failedRow.put("email", email);
                    failedRow.put("reason", "Duplicate email in CSV: " + email);
                    failedRows.add(failedRow);
                    continue;
                }
                csvEmails.add(email);

                User.Role role = User.Role.STUDENT;
                if (!roleStr.isEmpty()) {
                    try {
                        role = User.Role.valueOf(roleStr);
                    } catch (IllegalArgumentException e) {
                        failedCount++;
                        Map<String, Object> failedRow = new LinkedHashMap<>();
                        failedRow.put("rowNumber", rowNumber);
                        failedRow.put("email", email);
                        failedRow.put("reason", "Invalid role: " + roleStr);
                        failedRows.add(failedRow);
                        continue;
                    }
                }

                Batch batch = null;
                if (role == User.Role.STUDENT && !batchName.isEmpty()) {
                    batch = batchRepository.findByNameIgnoreCase(batchName).orElse(null);
                    if (batch == null) {
                        failedCount++;
                        Map<String, Object> failedRow = new LinkedHashMap<>();
                        failedRow.put("rowNumber", rowNumber);
                        failedRow.put("email", email);
                        failedRow.put("reason", "Batch '" + batchName + "' not found");
                        failedRows.add(failedRow);
                        continue;
                    }
                }

                User user = userRepository.findByEmail(email).orElse(null);
                if (user != null) {
                    // Update existing
                    user.setName(name);
                    user.setRole(role);
                    user.setBatch(batch);
                    if (!password.isEmpty() && !password.equals("[ENCRYPTED]")) {
                        user.setPassword(passwordEncoder.encode(password));
                    }
                    userRepository.save(user);
                    updatedCount++;
                } else {
                    // Create new
                    String plainPassword = password;
                    if (plainPassword.isEmpty() || plainPassword.equals("[ENCRYPTED]")) {
                        plainPassword = generateStudentPassword(name, generatedPasswords);
                    }
                    User newUser = User.builder()
                            .name(name)
                            .email(email)
                            .password(passwordEncoder.encode(plainPassword))
                            .role(role)
                            .batch(batch)
                            .active(true)
                            .build();
                    userRepository.save(newUser);
                    createdCount++;
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse CSV stream: " + e.getMessage(), e);
        }

        // Identify unfound users (excluding ADMINs to prevent lockouts)
        List<User> allDbUsers = userRepository.findByActiveTrue();
        List<UserDTO> unfoundUsers = new ArrayList<>();

        for (User u : allDbUsers) {
            if (u.getRole() == User.Role.ADMIN) {
                continue;
            }
            if (!csvEmails.contains(u.getEmail().toLowerCase())) {
                unfoundUsers.add(toDTO(u));
                if (deleteUnfound) {
                    deleteUser(u.getId());
                }
            }
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("createdCount", createdCount);
        result.put("updatedCount", updatedCount);
        result.put("successCount", createdCount + updatedCount);
        result.put("failedCount", failedCount);
        result.put("failedRows", failedRows);
        result.put("unfoundCount", unfoundUsers.size());
        result.put("deleted", deleteUnfound);
        result.put("unfoundUsers", deleteUnfound ? Collections.emptyList() : unfoundUsers);

        return result;
    }

    private String escapeCsv(String val) {
        if (val == null) return "";
        if (val.contains(",") || val.contains("\"") || val.contains("\n")) {
            return "\"" + val.replace("\"", "\"\"") + "\"";
        }
        return val;
    }

    private String unescapeCsv(String val) {
        if (val == null) return "";
        String clean = val.trim();
        if (clean.startsWith("\"") && clean.endsWith("\"") && clean.length() >= 2) {
            clean = clean.substring(1, clean.length() - 1);
            clean = clean.replace("\"\"", "\"");
        }
        return clean;
    }

    private UserDTO toDTO(User u) {
        return UserDTO.builder()
                .id(u.getId())
                .name(u.getName())
                .email(u.getEmail())
                .role(u.getRole().name())
                .batchId(u.getBatch() != null ? u.getBatch().getId() : null)
                .batchName(u.getBatch() != null ? u.getBatch().getName() : null)
                .active(u.isActive())
                .deletedAt(u.getDeletedAt() != null ? u.getDeletedAt().toString() : null)
                .deletedBy(u.getDeletedBy())
                .build();
    }
}
