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

        /*
        // 2. Seed Courses
        Course webDev = Course.builder()
                .title("Full-Stack Web Development")
                .description("Master HTML, CSS, JavaScript, React, and Spring Boot by building real-world projects.")
                .price(new BigDecimal("99.99"))
                .level(Course.Level.INTERMEDIATE)
                .instructor(instructor)
                .thumbnail("https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=500")
                .build();

        Course mlIntro = Course.builder()
                .title("Introduction to Machine Learning")
                .description("Learn python, NumPy, Pandas, Scikit-learn, and Neural Networks from scratch.")
                .price(new BigDecimal("149.99"))
                .level(Course.Level.ADVANCED)
                .instructor(instructor)
                .thumbnail("https://images.unsplash.com/photo-1527474305487-b87b222841cc?w=500")
                .build();

        Course uiux = Course.builder()
                .title("UI/UX Design Fundamentals")
                .description("Understand user research, wireframing, prototyping, and design systems in Figma.")
                .price(new BigDecimal("49.99"))
                .level(Course.Level.BEGINNER)
                .instructor(instructor)
                .thumbnail("https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?w=500")
                .build();

        Course awsCloud = Course.builder()
                .title("AWS Certified Cloud Practitioner")
                .description("Prepare and pass the AWS Certified Cloud Practitioner exam (CLF-C02). Complete guide.")
                .price(new BigDecimal("79.99"))
                .level(Course.Level.BEGINNER)
                .instructor(instructor)
                .thumbnail("https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=500")
                .build();

        courseRepository.saveAll(List.of(webDev, mlIntro, uiux, awsCloud));

        // 3. Seed Lessons
        // Web Dev lessons
        lessonRepository.saveAll(List.of(
                Lesson.builder().course(webDev).title("Introduction to HTML").position(1).videoUrl("").duration("15 min").build(),
                Lesson.builder().course(webDev).title("HTML Semantic Elements").position(2).videoUrl("").duration("22 min").build(),
                Lesson.builder().course(webDev).title("CSS Box Model & Flexbox").position(3).videoUrl("").duration("35 min").build(),
                Lesson.builder().course(webDev).title("CSS Grid Layout").position(4).videoUrl("").duration("28 min").build(),
                Lesson.builder().course(webDev).title("Responsive Design").position(5).videoUrl("").duration("30 min").build(),
                Lesson.builder().course(webDev).title("JS Variables & Data Types").position(6).videoUrl("").duration("20 min").build(),
                Lesson.builder().course(webDev).title("Functions & Arrow Functions").position(7).videoUrl("").duration("25 min").build(),
                Lesson.builder().course(webDev).title("DOM Manipulation").position(8).videoUrl("").duration("40 min").build(),
                Lesson.builder().course(webDev).title("React Introduction & Setup").position(9).videoUrl("").duration("18 min").build()
        ));

        // ML lessons
        lessonRepository.saveAll(List.of(
                Lesson.builder().course(mlIntro).title("Python Basics").position(1).videoUrl("").duration("25 min").build(),
                Lesson.builder().course(mlIntro).title("NumPy Intro").position(2).videoUrl("").duration("30 min").build(),
                Lesson.builder().course(mlIntro).title("Pandas").position(3).videoUrl("").duration("40 min").build(),
                Lesson.builder().course(mlIntro).title("Scikit-learn").position(4).videoUrl("").duration("35 min").build(),
                Lesson.builder().course(mlIntro).title("Linear Regression").position(5).videoUrl("").duration("45 min").build(),
                Lesson.builder().course(mlIntro).title("Decision Trees").position(6).videoUrl("").duration("30 min").build(),
                Lesson.builder().course(mlIntro).title("Neural Networks").position(7).videoUrl("").duration("50 min").build()
        ));

        // UIUX lessons
        lessonRepository.saveAll(List.of(
                Lesson.builder().course(uiux).title("Figma Basics").position(1).videoUrl("").duration("20 min").build(),
                Lesson.builder().course(uiux).title("Prototyping").position(2).videoUrl("").duration("25 min").build(),
                Lesson.builder().course(uiux).title("User Research").position(3).videoUrl("").duration("30 min").build()
        ));

        // AWS lessons
        lessonRepository.saveAll(List.of(
                Lesson.builder().course(awsCloud).title("AWS Cloud Practitioner – Full Course Overview").position(1).videoUrl("https://www.youtube.com/embed/SOTamWNgDKc").duration("12 min").build(),
                Lesson.builder().course(awsCloud).title("Cloud Computing Concepts & AWS Global Infrastructure").position(2).videoUrl("https://www.youtube.com/embed/M988_fsOSWo").duration("18 min").build(),
                Lesson.builder().course(awsCloud).title("IAM – Users, Groups, Roles & Policies").position(3).videoUrl("https://www.youtube.com/embed/iF9fs8Rw4Uo").duration("22 min").build(),
                Lesson.builder().course(awsCloud).title("Amazon EC2 – Instances, Types & Pricing").position(4).videoUrl("https://www.youtube.com/embed/TsRBftzZsQo").duration("25 min").build(),
                Lesson.builder().course(awsCloud).title("Amazon S3 – Buckets, Storage Classes & Policies").position(5).videoUrl("https://www.youtube.com/embed/77lMCiiMilo").duration("20 min").build()
        ));

        // 4. Seed Enrollments for testing
        Enrollment enroll1 = Enrollment.builder()
                .user(student2)
                .course(webDev)
                .progress(0)
                .build();
        Enrollment enroll2 = Enrollment.builder()
                .user(student2)
                .course(awsCloud)
                .progress(0)
                .build();
        enrollmentRepository.saveAll(List.of(enroll1, enroll2));

        // 5. Seed Schedule Events for testing
        ScheduleEvent event1 = ScheduleEvent.builder()
                .title("Full-Stack Web Dev: React Intro")
                .description("Deep dive into React components, props, state, and hooks.")
                .eventType(ScheduleEvent.EventType.CLASS)
                .course(webDev)
                .instructor(instructor)
                .targetRole(ScheduleEvent.TargetRole.STUDENT)
                .eventDate(LocalDate.now())
                .startTime(LocalTime.of(10, 0))
                .endTime(LocalTime.of(11, 30))
                .location("Room 402 - Engineering Block")
                .meetingLink("https://zoom.us/j/123456789")
                .createdBy(instructor)
                .build();

        ScheduleEvent event2 = ScheduleEvent.builder()
                .title("AWS Cloud Practitioner Midterm Exam")
                .description("Comprehensive exam covering IAM, EC2, S3, RDS, and CloudWatch. 50 multiple-choice questions.")
                .eventType(ScheduleEvent.EventType.TEST)
                .course(awsCloud)
                .instructor(instructor)
                .targetRole(ScheduleEvent.TargetRole.STUDENT)
                .eventDate(LocalDate.now().plusDays(2))
                .startTime(LocalTime.of(14, 0))
                .endTime(LocalTime.of(15, 30))
                .location("Exam Hall A")
                .meetingLink("")
                .createdBy(instructor)
                .build();

        ScheduleEvent event3 = ScheduleEvent.builder()
                .title("Figma Wireframe Submission")
                .description("Submit high-fidelity Figma wireframes for the user registration and checkout flows.")
                .eventType(ScheduleEvent.EventType.ASSIGNMENT)
                .course(uiux)
                .instructor(instructor)
                .targetRole(ScheduleEvent.TargetRole.STUDENT)
                .eventDate(LocalDate.now().plusDays(4))
                .startTime(LocalTime.of(23, 59))
                .endTime(LocalTime.of(23, 59))
                .location("Online Submission")
                .meetingLink("")
                .createdBy(instructor)
                .build();

        ScheduleEvent event4 = ScheduleEvent.builder()
                .title("National Engineers Day")
                .description("Campus closed. Enjoy the holiday and work on your personal projects!")
                .eventType(ScheduleEvent.EventType.HOLIDAY)
                .course(null)
                .instructor(admin)
                .targetRole(ScheduleEvent.TargetRole.ALL)
                .eventDate(LocalDate.now().plusDays(3))
                .startTime(LocalTime.of(0, 0))
                .endTime(LocalTime.of(23, 59))
                .location("Campus-Wide")
                .meetingLink("")
                .createdBy(admin)
                .build();

        ScheduleEvent event5 = ScheduleEvent.builder()
                .title("Guest Lecture: AI Trends in 2026")
                .description("Special guest lecture by lead researchers on advanced agentic coding, generative AI, and career paths.")
                .eventType(ScheduleEvent.EventType.SPECIAL)
                .course(null)
                .instructor(instructor)
                .targetRole(ScheduleEvent.TargetRole.STUDENT)
                .eventDate(LocalDate.now().plusDays(1))
                .startTime(LocalTime.of(16, 0))
                .endTime(LocalTime.of(17, 30))
                .location("Main Auditorium")
                .meetingLink("https://zoom.us/j/987654321")
                .createdBy(instructor)
                .build();

        scheduleEventRepository.saveAll(List.of(event1, event2, event3, event4, event5));
        */

        // 6. Seed Attendance for testing (student2 - abc@gmail.com)
        // Offline Attendance: We want exactly 44 Present and 6 Absent out of 50 total records (88%)
        String[] offlineSubjects = {
            "English",
            "Hindi",
            "Mathematics",
            "Science",
            "Social Science"
        };
        
        List<Attendance> attendanceList = new java.util.ArrayList<>();
        LocalDate currentDate = LocalDate.now().minusDays(1);
        
        for (int i = 0; i < 50; i++) {
            // Skip weekends (Saturday and Sunday) to make it highly realistic
            while (currentDate.getDayOfWeek() == java.time.DayOfWeek.SATURDAY || currentDate.getDayOfWeek() == java.time.DayOfWeek.SUNDAY) {
                currentDate = currentDate.minusDays(1);
            }
            
            String subject = offlineSubjects[i % offlineSubjects.length];
            String dayOfWeek = currentDate.getDayOfWeek().name();
            // Format to TitleCase, e.g., "Monday"
            dayOfWeek = dayOfWeek.charAt(0) + dayOfWeek.substring(1).toLowerCase();
            
            // Mark 6 specific classes as ABSENT, others as PRESENT (44 PRESENT, 6 ABSENT = 88%)
            Attendance.Status status = Attendance.Status.PRESENT;
            if (i == 7 || i == 15 || i == 23 || i == 31 || i == 39 || i == 47) {
                status = Attendance.Status.ABSENT;
            }
            
            attendanceList.add(Attendance.builder()
                    .student(student2)
                    .subjectName(subject)
                    .date(currentDate)
                    .day(dayOfWeek)
                    .status(status)
                    .build());
            
            currentDate = currentDate.minusDays(1);
        }
        attendanceRepository.saveAll(attendanceList);

        // 7. Seed Online Activity Logs for testing (student2 - abc@gmail.com)
        // Online Course Attendance: We want exactly 23 Active Days out of 25 Total Days (92%)
        String[] onlineCourses = {
            "Python Programming",
            "Web Development",
            "AWS Fundamentals",
            "AI Foundations"
        };
        
        String[] activityTypes = {
            "Lesson Completed",
            "Quiz Attempted",
            "Assignment Submitted"
        };
        
        String[] activityStatuses = {
            "Completed",
            "Attempted",
            "Submitted"
        };
        
        List<OnlineActivityLog> onlineActivityList = new java.util.ArrayList<>();
        LocalDate baseDate = LocalDate.now();
        
        for (int i = 0; i < 25; i++) {
            // Define 2 inactive days (e.g. index 3 and 10) to get exactly 23 active days out of 25
            if (i == 3 || i == 10) {
                continue;
            }
            
            LocalDate activityDate = baseDate.minusDays(i);
            String course = onlineCourses[i % onlineCourses.length];
            String activityType = activityTypes[i % activityTypes.length];
            String status = activityStatuses[i % activityStatuses.length];
            
            onlineActivityList.add(OnlineActivityLog.builder()
                    .student(student2)
                    .courseName(course)
                    .date(activityDate)
                    .activityType(activityType)
                    .status(status)
                    .build());
            
            // On some days, seed an extra activity to show multiple activities on the same day
            if (i % 5 == 0) {
                String secondCourse = onlineCourses[(i + 1) % onlineCourses.length];
                String secondActivity = activityTypes[(i + 1) % activityTypes.length];
                String secondStatus = activityStatuses[(i + 1) % activityStatuses.length];
                
                onlineActivityList.add(OnlineActivityLog.builder()
                        .student(student2)
                        .courseName(secondCourse)
                        .date(activityDate)
                        .activityType(secondActivity)
                        .status(secondStatus)
                        .build());
            }
        }
        onlineActivityLogRepository.saveAll(onlineActivityList);

        // 8. Seed Batch-wise Offline structures
        Set<String> batchSubjectsSet = new HashSet<>(List.of("English", "Hindi", "Mathematics", "Science", "Social Science"));
        Batch batch = Batch.builder()
                .name("Class VIII Morning Batch")
                .level("Class VIII")
                .instructor(instructor)
                .subjects(batchSubjectsSet)
                .build();
        batch = batchRepository.save(batch);

        // Assign student & student2 to this batch
        student.setBatch(batch);
        student2.setBatch(batch);
        userRepository.save(student);
        userRepository.save(student2);

        // Associate the 50 seeded Attendance records with this batch
        for (Attendance att : attendanceList) {
            att.setBatch(batch);
        }
        attendanceRepository.saveAll(attendanceList);

        // Seed Timetable / class timings for this batch (ScheduleEvent)
        ScheduleEvent timing1 = ScheduleEvent.builder()
                .title("English Class")
                .description("Weekly English Grammar class")
                .eventType(ScheduleEvent.EventType.CLASS)
                .batch(batch)
                .subjectName("English")
                .instructor(instructor)
                .targetRole(ScheduleEvent.TargetRole.STUDENT)
                .eventDate(LocalDate.now()) // Today
                .startTime(LocalTime.of(10, 0))
                .endTime(LocalTime.of(11, 0))
                .location("Room 201")
                .createdBy(instructor)
                .build();

        ScheduleEvent timing2 = ScheduleEvent.builder()
                .title("Mathematics Class")
                .description("Weekly Algebra class")
                .eventType(ScheduleEvent.EventType.CLASS)
                .batch(batch)
                .subjectName("Mathematics")
                .instructor(instructor)
                .targetRole(ScheduleEvent.TargetRole.STUDENT)
                .eventDate(LocalDate.now()) // Today
                .startTime(LocalTime.of(11, 0))
                .endTime(LocalTime.of(12, 0))
                .location("Room 201")
                .createdBy(instructor)
                .build();

        ScheduleEvent timing3 = ScheduleEvent.builder()
                .title("Science Class")
                .description("Weekly Physics lecture")
                .eventType(ScheduleEvent.EventType.CLASS)
                .batch(batch)
                .subjectName("Science")
                .instructor(instructor)
                .targetRole(ScheduleEvent.TargetRole.STUDENT)
                .eventDate(LocalDate.now().plusDays(1)) // Tomorrow
                .startTime(LocalTime.of(10, 0))
                .endTime(LocalTime.of(11, 0))
                .location("Room 201")
                .createdBy(instructor)
                .build();

        ScheduleEvent timing4 = ScheduleEvent.builder()
                .title("Social Science Class")
                .description("Weekly History & Civics lesson")
                .eventType(ScheduleEvent.EventType.CLASS)
                .batch(batch)
                .subjectName("Social Science")
                .instructor(instructor)
                .targetRole(ScheduleEvent.TargetRole.STUDENT)
                .eventDate(LocalDate.now().plusDays(1)) // Tomorrow
                .startTime(LocalTime.of(11, 0))
                .endTime(LocalTime.of(12, 0))
                .location("Room 201")
                .createdBy(instructor)
                .build();

        scheduleEventRepository.saveAll(List.of(timing1, timing2, timing3, timing4));

        // Seed Batch Test
        Test batchTest = Test.builder()
                .title("English Vocabulary Unit Test")
                .description("Unit test covering chapters 1-3 vocabulary and grammar rules.")
                .batch(batch)
                .subjectName("English")
                .testDate(LocalDate.now().plusDays(2))
                .maxMarks(25)
                .createdBy(instructor)
                .build();
        testRepository.save(batchTest);

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
