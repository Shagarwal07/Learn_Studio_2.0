package com.learnhub.service;

import com.learnhub.dto.UserDTO;
import com.learnhub.entity.*;
import com.learnhub.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.*;
import java.util.ArrayList;
import java.util.List;

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
        exportUsersToCsv();
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
        exportUsersToCsv();
        return toDTO(saved);
    }

    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + id));

        // 1. Delete refresh tokens
        refreshTokenRepository.deleteByUserId(id);

        // 2. Clear relations or delete dependent entities
        if (user.getRole() == User.Role.STUDENT) {
            enrollmentRepository.deleteByUserId(id);
            certificateRepository.deleteByUserId(id);
            quizAttemptRepository.deleteByUserId(id);
            attendanceRepository.deleteByStudentId(id);
            homeworkSubmissionRepository.deleteByStudentId(id);
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
        exportUsersToCsv();
    }

    // Export current database users to a CSV file in the project workspace
    public void exportUsersToCsv() {
        File csvFile = getCsvFile();
        try (PrintWriter writer = new PrintWriter(new BufferedWriter(new FileWriter(csvFile)))) {
            writer.println("ID,Name,Email,Password,Role,BatchName");
            for (User u : userRepository.findAll()) {
                String batchName = u.getBatch() != null ? u.getBatch().getName() : "";
                writer.println(String.format("%s,%s,%s,%s,%s,%s",
                        u.getId(),
                        escapeCsv(u.getName()),
                        escapeCsv(u.getEmail()),
                        "[ENCRYPTED]",
                        u.getRole().name(),
                        escapeCsv(batchName)
                ));
            }
        } catch (IOException e) {
            System.err.println("Failed to write users CSV file: " + e.getMessage());
        }
    }

    // Sync database from the users.csv file in the project workspace
    public void importUsersFromCsv() {
        File csvFile = getCsvFile();
        if (!csvFile.exists()) {
            // If it doesn't exist, build it first
            exportUsersToCsv();
            return;
        }

        try (BufferedReader reader = new BufferedReader(new FileReader(csvFile))) {
            String header = reader.readLine(); // Skip header
            String line;
            while ((line = reader.readLine()) != null) {
                if (line.trim().isBlank()) continue;
                String[] parts = line.split(",", -1);
                if (parts.length < 5) continue;

                String idStr = parts[0].trim();
                String name = unescapeCsv(parts[1].trim());
                String email = unescapeCsv(parts[2].trim());
                String password = parts[3].trim();
                String roleStr = parts[4].trim().toUpperCase();
                String batchName = parts.length >= 6 ? unescapeCsv(parts[5].trim()) : "";

                if (name.isEmpty() || email.isEmpty() || roleStr.isEmpty()) continue;

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
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to import/sync users from CSV: " + e.getMessage(), e);
        }

        // Re-export to update IDs or reset password labels
        exportUsersToCsv();
    }

    private File getCsvFile() {
        File rootDir = new File(".");
        if (new File(rootDir, "../docker-compose.yml").exists()) {
            rootDir = new File(rootDir, "..");
        }
        return new File(rootDir, "users.csv");
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
