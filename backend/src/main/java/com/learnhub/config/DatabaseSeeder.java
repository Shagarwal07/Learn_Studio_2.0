package com.learnhub.config;

import com.learnhub.entity.Course;
import com.learnhub.entity.Enrollment;
import com.learnhub.entity.Lesson;
import com.learnhub.entity.ScheduleEvent;
import com.learnhub.entity.User;
import com.learnhub.entity.Attendance;
import com.learnhub.entity.OnlineActivityLog;
import com.learnhub.repository.AttendanceRepository;
import com.learnhub.repository.OnlineActivityLogRepository;
import com.learnhub.repository.CourseRepository;
import com.learnhub.repository.EnrollmentRepository;
import com.learnhub.repository.LessonRepository;
import com.learnhub.repository.ScheduleEventRepository;
import com.learnhub.repository.UserRepository;
import com.learnhub.repository.BatchRepository;
import com.learnhub.repository.TestRepository;
import com.learnhub.repository.NoteRepository;
import com.learnhub.repository.HomeworkRepository;
import com.learnhub.repository.AnnouncementRepository;
import com.learnhub.repository.QuestionBankRepository;
import com.learnhub.entity.Batch;
import com.learnhub.entity.Test;
import com.learnhub.entity.Note;
import com.learnhub.entity.Homework;
import com.learnhub.entity.Announcement;
import com.learnhub.entity.QuestionBank;
import java.util.HashSet;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DatabaseSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final LessonRepository lessonRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final ScheduleEventRepository scheduleEventRepository;
    private final AttendanceRepository attendanceRepository;
    private final OnlineActivityLogRepository onlineActivityLogRepository;
    private final BatchRepository batchRepository;
    private final TestRepository testRepository;
    private final NoteRepository noteRepository;
    private final HomeworkRepository homeworkRepository;
    private final AnnouncementRepository announcementRepository;
    private final QuestionBankRepository questionBankRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() == 0) {
            seedDatabase();
        }
    }

    private void seedDatabase() {
        // 1. Seed Users
        User admin = User.builder()
                .name("Admin User")
                .email("admin@learnstudio.com")
                .password(passwordEncoder.encode("Password123"))
                .role(User.Role.ADMIN)
                .build();

        User instructor = User.builder()
                .name("Jane Doe (Instructor)")
                .email("instructor@learnstudio.com")
                .password(passwordEncoder.encode("Password123"))
                .role(User.Role.INSTRUCTOR)
                .build();

        User student = User.builder()
                .name("John Doe (Student)")
                .email("student@learnstudio.com")
                .password(passwordEncoder.encode("Password123"))
                .role(User.Role.STUDENT)
                .build();

        User student2 = User.builder()
                .name("Student User")
                .email("abc@gmail.com")
                .password(passwordEncoder.encode("Password123"))
                .role(User.Role.STUDENT)
                .build();

        userRepository.saveAll(List.of(admin, instructor, student, student2));
        // 9. Seed Question Bank for Auto-TA
        if (questionBankRepository.count() == 0) {
            questionBankRepository.saveAll(List.of(
                QuestionBank.builder()
                    .questionText("Solve for x: 2x + 5 = 15. Provide a detailed calculation.")
                    .options(null)
                    .correctAnswer("x = 5")
                    .marks(5)
                    .difficulty("EASY")
                    .questionType("NUMERICAL")
                    .subject("Mathematics")
                    .build(),
                QuestionBank.builder()
                    .questionText("Find the derivative of f(x) = 3x^2 + 5x - 2 with respect to x.")
                    .options(null)
                    .correctAnswer("f'(x) = 6x + 5")
                    .marks(5)
                    .difficulty("MEDIUM")
                    .questionType("NUMERICAL")
                    .subject("Mathematics")
                    .build(),
                QuestionBank.builder()
                    .questionText("What is the chemical formula of Glucose? Select the correct option.")
                    .options("[\"C6H12O6\", \"C12H22O11\", \"CH4\", \"CO2\"]")
                    .correctAnswer("A")
                    .marks(3)
                    .difficulty("EASY")
                    .questionType("MCQ")
                    .subject("Science")
                    .build(),
                QuestionBank.builder()
                    .questionText("Explain the Law of Conservation of Energy with a real-world example.")
                    .options(null)
                    .correctAnswer("Energy cannot be created or destroyed, only transformed from one form to another. Example: A pendulum converting potential to kinetic energy.")
                    .marks(10)
                    .difficulty("MEDIUM")
                    .questionType("SHORT")
                    .subject("Science")
                    .build(),
                QuestionBank.builder()
                    .questionText("Identify the correct synonym of 'Meticulous' from the choices below.")
                    .options("[\"Careful and precise\", \"Sloppy and careless\", \"Fast and energetic\", \"Quiet and shy\"]")
                    .correctAnswer("A")
                    .marks(2)
                    .difficulty("EASY")
                    .questionType("MCQ")
                    .subject("English")
                    .build()
            ));
        }
    }
}
