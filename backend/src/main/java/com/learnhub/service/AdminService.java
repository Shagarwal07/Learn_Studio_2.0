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
    private final PasswordEncoder passwordEncoder;

    public List<UserDTO> getAllUsers() {
        return userRepository.findAll().stream().map(this::toDTO).toList();
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

    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + id));

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
        for (User u : userRepository.findAll()) {
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

    // Sync database from a CSV input stream and return sync statistics
    public Map<String, Object> importUsersFromCsvContent(java.io.InputStream inputStream, boolean deleteUnfound) {
        int createdCount = 0;
        int updatedCount = 0;
        Set<String> csvEmails = new HashSet<>();

        try (BufferedReader reader = new java.io.BufferedReader(new java.io.InputStreamReader(inputStream, java.nio.charset.StandardCharsets.UTF_8))) {
            String header = reader.readLine(); // Skip header
            String line;
            while ((line = reader.readLine()) != null) {
                if (line.trim().isBlank()) continue;
                String[] parts = line.split(",", -1);
                if (parts.length < 5) continue;

                String name = unescapeCsv(parts[1].trim());
                String email = unescapeCsv(parts[2].trim()).toLowerCase();
                String password = parts[3].trim();
                String roleStr = parts[4].trim().toUpperCase();
                String batchName = parts.length >= 6 ? unescapeCsv(parts[5].trim()) : "";

                if (name.isEmpty() || email.isEmpty() || roleStr.isEmpty()) continue;

                csvEmails.add(email);

                User.Role role = User.Role.valueOf(roleStr);
                Batch batch = null;
                if (role == User.Role.STUDENT && !batchName.isEmpty()) {
                    batch = batchRepository.findByName(batchName).orElse(null);
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
                    String plainPassword = (password.isEmpty() || password.equals("[ENCRYPTED]")) ? "LearnStudio123" : password;
                    User newUser = User.builder()
                            .name(name)
                            .email(email)
                            .password(passwordEncoder.encode(plainPassword))
                            .role(role)
                            .batch(batch)
                            .build();
                    userRepository.save(newUser);
                    createdCount++;
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse CSV stream: " + e.getMessage(), e);
        }

        // Identify unfound users (excluding ADMINs to prevent lockouts)
        List<User> allDbUsers = userRepository.findAll();
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
                .build();
    }
}
