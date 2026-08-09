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

import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.apache.commons.csv.CSVPrinter;

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

    private final NoteViewLogRepository noteViewLogRepository;
    private final UserIdentityProfileRepository userIdentityProfileRepository;
    private final PasswordEncoder passwordEncoder;

    public List<UserDTO> getAllUsers() {
        return userRepository.findByActiveTrue().stream().map(this::toDTO).toList();
    }

    public UserDTO createUser(UserDTO dto, String password) {
        if (userRepository.existsByEmail(dto.email())) {
            throw new RuntimeException("Email already registered: " + dto.email());
        }

        String plainPassword = (password == null || password.isBlank()) ? "LearnStudio123" : password;

        User user = User.builder()
                .name(dto.name())
                .email(dto.email())
                .password(passwordEncoder.encode(plainPassword))
                .role(User.Role.valueOf(dto.role().toUpperCase()))
                .build();

        if (user.getRole() == User.Role.STUDENT && dto.batchId() != null) {
            Batch batch = batchRepository.findById(dto.batchId())
                    .orElseThrow(() -> new RuntimeException("Batch not found with ID: " + dto.batchId()));
            user.setBatch(batch);
        }

        User saved = userRepository.save(user);

        updateGoogleProfiles(saved, dto.primaryGoogleEmail(), dto.secondaryGoogleEmail());

        return toDTO(saved);
    }

    public UserDTO updateUser(Long id, UserDTO dto, String password) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + id));

        if (!user.getEmail().equalsIgnoreCase(dto.email()) && userRepository.existsByEmail(dto.email())) {
            throw new RuntimeException("Email already in use: " + dto.email());
        }

        user.setName(dto.name());
        user.setEmail(dto.email());
        user.setRole(User.Role.valueOf(dto.role().toUpperCase()));

        if (password != null && !password.isBlank() && !password.equals("[ENCRYPTED]")) {
            user.setPassword(passwordEncoder.encode(password));
        }

        if (user.getRole() == User.Role.STUDENT) {
            if (dto.batchId() != null) {
                Batch batch = batchRepository.findById(dto.batchId())
                        .orElseThrow(() -> new RuntimeException("Batch not found with ID: " + dto.batchId()));
                user.setBatch(batch);
            } else {
                user.setBatch(null);
            }
        } else {
            user.setBatch(null);
        }

        User saved = userRepository.save(user);

        updateGoogleProfiles(saved, dto.primaryGoogleEmail(), dto.secondaryGoogleEmail());

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
            if (!batchRepository.findByInstructorsId(id).isEmpty()) {
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
            for (Batch batch : batchRepository.findByInstructorsId(id)) {
                batch.getInstructors().removeIf(u -> u.getId().equals(id));
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

    public String exportUsersToCsvContent() {
        try (StringWriter sw = new StringWriter();
             CSVPrinter printer = new CSVPrinter(sw, CSVFormat.DEFAULT.builder().setHeader("ID", "Name", "Email", "Password", "Role", "BatchName", "Primary Google Email", "Secondary Google Email").build())) {
            
            for (User u : userRepository.findByActiveTrue()) {
                String batchName = u.getBatch() != null ? u.getBatch().getName() : "";
                List<UserIdentityProfile> profiles = userIdentityProfileRepository.findByUserId(u.getId());
                String primaryGoogleEmail = "";
                String secondaryGoogleEmail = "";
                for (UserIdentityProfile p : profiles) {
                    if (p.isPrimary()) {
                        primaryGoogleEmail = p.getGoogleEmail();
                    } else if (secondaryGoogleEmail.isEmpty()) {
                        secondaryGoogleEmail = p.getGoogleEmail();
                    }
                }
                if (primaryGoogleEmail.isEmpty() && !profiles.isEmpty()) {
                    primaryGoogleEmail = profiles.get(0).getGoogleEmail();
                    if (profiles.size() > 1) {
                        secondaryGoogleEmail = profiles.get(1).getGoogleEmail();
                    }
                }
                
                printer.printRecord(
                        u.getId(),
                        u.getName(),
                        u.getEmail(),
                        "[ENCRYPTED]",
                        u.getRole().name(),
                        batchName,
                        primaryGoogleEmail,
                        secondaryGoogleEmail
                );
            }
            return sw.toString();
        } catch (IOException e) {
            throw new RuntimeException("Error exporting users to CSV", e);
        }
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

    private String getHeaderCaseInsensitive(Map<String, Integer> headerMap, String... candidates) {
        if (headerMap == null) return null;
        for (String candidate : candidates) {
            for (String key : headerMap.keySet()) {
                if (key.trim().equalsIgnoreCase(candidate)) {
                    return key;
                }
            }
        }
        return null;
    }

    // Sync database from a CSV input stream and return sync statistics
    public Map<String, Object> importUsersFromCsvContent(java.io.InputStream inputStream, boolean deleteUnfound) {
        int createdCount = 0;
        int updatedCount = 0;
        int failedCount = 0;
        Set<String> csvEmails = new HashSet<>();
        Set<String> generatedPasswords = new HashSet<>();
        List<Map<String, Object>> failedRows = new ArrayList<>();

        try (BufferedReader reader = new java.io.BufferedReader(new java.io.InputStreamReader(inputStream, java.nio.charset.StandardCharsets.UTF_8));
             CSVParser csvParser = new CSVParser(reader, CSVFormat.DEFAULT.builder().setHeader().setSkipHeaderRecord(true).setIgnoreHeaderCase(true).setTrim(true).build())) {
            
            List<CSVRecord> allRows = csvParser.getRecords();
            if (allRows.isEmpty()) {
                throw new RuntimeException("CSV file is empty");
            }
            
            Map<String, Integer> headerMap = csvParser.getHeaderMap();
            String nameHeader = getHeaderCaseInsensitive(headerMap, "name");
            String emailHeader = getHeaderCaseInsensitive(headerMap, "email", "learnstudio email");
            String passwordHeader = getHeaderCaseInsensitive(headerMap, "password");
            String roleHeader = getHeaderCaseInsensitive(headerMap, "role");
            String batchHeader = getHeaderCaseInsensitive(headerMap, "batchname", "batch");
            String primaryGoogleHeader = getHeaderCaseInsensitive(headerMap, "primary google email", "google email", "googleemail");
            String secondaryGoogleHeader = getHeaderCaseInsensitive(headerMap, "secondary google email");

            if (nameHeader == null || emailHeader == null) {
                throw new RuntimeException("Missing required headers: 'name' and 'email' must be present.");
            }

            // Pre-validation pass
            Set<String> csvGoogleEmails = new HashSet<>();
            int rowNumber = 1;
            boolean hasValidationErrors = false;
            for (CSVRecord record : allRows) {
                rowNumber++;
                String email = record.isSet(emailHeader) ? record.get(emailHeader).toLowerCase() : "";
                String primaryGoogleEmail = (primaryGoogleHeader != null && record.isSet(primaryGoogleHeader)) ? record.get(primaryGoogleHeader).toLowerCase() : "";
                String secondaryGoogleEmail = (secondaryGoogleHeader != null && record.isSet(secondaryGoogleHeader)) ? record.get(secondaryGoogleHeader).toLowerCase() : "";

                // Email format validation relaxed to support usernames like 'the_og_admin_07'
                if (email.isEmpty()) {
                    failedCount++;
                    Map<String, Object> failedRow = new LinkedHashMap<>();
                    failedRow.put("rowNumber", rowNumber);
                    failedRow.put("email", email);
                    failedRow.put("reason", "Email/Username cannot be empty");
                    failedRows.add(failedRow);
                    hasValidationErrors = true;
                }
                
                String[] gEmails = {primaryGoogleEmail, secondaryGoogleEmail};
                for (String gEmail : gEmails) {
                    if (!gEmail.isEmpty()) {
                        if (!gEmail.contains("@")) {
                            failedCount++;
                            Map<String, Object> failedRow = new LinkedHashMap<>();
                            failedRow.put("rowNumber", rowNumber);
                            failedRow.put("email", email);
                            failedRow.put("reason", "Invalid Google Email format: " + gEmail);
                            failedRows.add(failedRow);
                            hasValidationErrors = true;
                        }
                        // Duplicates allowed: removed validation.
                    }
                }
            }

            if (hasValidationErrors) {
                Map<String, Object> result = new LinkedHashMap<>();
                result.put("createdCount", 0);
                result.put("updatedCount", 0);
                result.put("successCount", 0);
                result.put("failedCount", failedCount);
                result.put("failedRows", failedRows);
                result.put("unfoundCount", 0);
                result.put("deleted", false);
                result.put("unfoundUsers", Collections.emptyList());
                return result;
            }

            rowNumber = 1;
            for (CSVRecord record : allRows) {
                rowNumber++;

                String name = record.isSet(nameHeader) ? record.get(nameHeader) : "";
                String email = record.isSet(emailHeader) ? record.get(emailHeader).toLowerCase() : "";
                String password = (passwordHeader != null && record.isSet(passwordHeader)) ? record.get(passwordHeader) : "";
                String roleStr = (roleHeader != null && record.isSet(roleHeader)) ? record.get(roleHeader).toUpperCase() : "";
                String batchName = (batchHeader != null && record.isSet(batchHeader)) ? record.get(batchHeader) : "";
                String primaryGoogleEmail = (primaryGoogleHeader != null && record.isSet(primaryGoogleHeader)) ? record.get(primaryGoogleHeader).toLowerCase() : "";
                String secondaryGoogleEmail = (secondaryGoogleHeader != null && record.isSet(secondaryGoogleHeader)) ? record.get(secondaryGoogleHeader).toLowerCase() : "";

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
                    user = userRepository.save(newUser);
                    createdCount++;
                }
                
                updateGoogleProfiles(user, primaryGoogleEmail, secondaryGoogleEmail);
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse CSV stream: " + e.getMessage(), e);
        }

        List<User> unfoundUsers = new ArrayList<>();
        int unfoundCount = 0;
        
        if (deleteUnfound) {
            List<User> allUsers = userRepository.findAll();
            for (User u : allUsers) {
                if (u.getRole() == User.Role.ADMIN) continue;
                if (!csvEmails.contains(u.getEmail().toLowerCase())) {
                    unfoundUsers.add(u);
                    unfoundCount++;
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
        result.put("unfoundCount", unfoundCount);
        result.put("deleted", deleteUnfound);
        
        List<Map<String, String>> unfoundList = new ArrayList<>();
        for (User u : unfoundUsers) {
            Map<String, String> m = new LinkedHashMap<>();
            m.put("name", u.getName());
            m.put("email", u.getEmail());
            unfoundList.add(m);
        }
        result.put("unfoundUsers", unfoundList);

        return result;
    }



    private UserDTO toDTO(User u) {
        List<UserIdentityProfile> profiles = userIdentityProfileRepository.findByUserId(u.getId());
        String primaryGoogleEmail = null;
        String secondaryGoogleEmail = null;
        for (UserIdentityProfile p : profiles) {
            if (p.isPrimary()) {
                primaryGoogleEmail = p.getGoogleEmail();
            } else if (secondaryGoogleEmail == null) {
                secondaryGoogleEmail = p.getGoogleEmail();
            }
        }
        if (primaryGoogleEmail == null && !profiles.isEmpty()) {
            primaryGoogleEmail = profiles.get(0).getGoogleEmail();
            if (profiles.size() > 1) {
                secondaryGoogleEmail = profiles.get(1).getGoogleEmail();
            }
        }

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
                .primaryGoogleEmail(primaryGoogleEmail)
                .secondaryGoogleEmail(secondaryGoogleEmail)
                .build();
    }

    private void updateGoogleProfiles(User user, String primary, String secondary) {
        List<UserIdentityProfile> existing = userIdentityProfileRepository.findByUserId(user.getId());
        
        Set<String> newEmails = new HashSet<>();
        if (primary != null && !primary.trim().isEmpty()) newEmails.add(primary.trim().toLowerCase());
        if (secondary != null && !secondary.trim().isEmpty()) newEmails.add(secondary.trim().toLowerCase());
        
        // Remove ones not in newEmails
        for (UserIdentityProfile p : existing) {
            if (!newEmails.contains(p.getGoogleEmail())) {
                userIdentityProfileRepository.delete(p);
            }
        }
        
        // Add or update existing
        for (String email : newEmails) {
            
            boolean isPrim = email.equals(primary != null ? primary.trim().toLowerCase() : null);
            
            Optional<UserIdentityProfile> existingForUser = existing.stream().filter(e -> e.getGoogleEmail().equals(email)).findFirst();
            if (existingForUser.isPresent()) {
                UserIdentityProfile p = existingForUser.get();
                p.setPrimary(isPrim);
                userIdentityProfileRepository.save(p);
            } else {
                UserIdentityProfile p = UserIdentityProfile.builder()
                        .user(user)
                        .googleEmail(email)
                        .isPrimary(isPrim)
                        .build();
                userIdentityProfileRepository.save(p);
            }
        }
    }
}
