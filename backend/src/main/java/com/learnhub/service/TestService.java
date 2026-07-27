package com.learnhub.service;

import com.learnhub.dto.MarkDetail;
import com.learnhub.dto.StudentTestResultDTO;
import com.learnhub.dto.TestResultUploadDTO;
import com.learnhub.entity.Test;
import com.learnhub.entity.TestResult;
import com.learnhub.entity.User;
import com.learnhub.entity.UserIdentityProfile;
import com.learnhub.repository.TestRepository;
import com.learnhub.repository.TestResultRepository;
import com.learnhub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class TestService {

    private final TestRepository testRepository;
    private final TestResultRepository testResultRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    @Transactional
    public void uploadTestMarks(Long testId, List<TestResultUploadDTO> results, String instructorEmail) {
        Test test = testRepository.findById(testId)
                .orElseThrow(() -> new RuntimeException("Test not found with ID: " + testId));

        // Optionally, verify instructorEmail is the creator or has admin role.
        // if (!test.getCreatedBy().getEmail().equals(instructorEmail)) throw new RuntimeException("Unauthorized");

        for (TestResultUploadDTO dto : results) {
            User student = userRepository.findById(dto.getStudentId())
                    .orElseThrow(() -> new RuntimeException("Student not found with ID: " + dto.getStudentId()));

            // 1. Save or Update TestResult in Database
            TestResult testResult = testResultRepository.findByTestIdAndStudentId(testId, student.getId())
                    .orElseGet(() -> TestResult.builder()
                            .test(test)
                            .student(student)
                            .build());

            testResult.setScore(dto.getScore());
            testResult.setFeedback(dto.getFeedback() != null && !dto.getFeedback().isBlank() 
                                ? dto.getFeedback() 
                                : generateDefaultFeedback(dto.getScore(), test.getMaxMarks()));
            testResultRepository.save(testResult);
            log.info("Saved result for student {}", student.getEmail());
        }
    }

    @Transactional(readOnly = true)
    public List<TestResultUploadDTO> getTestMarks(Long testId) {
        return testResultRepository.findByTestId(testId).stream()
                .map(result -> {
                    TestResultUploadDTO dto = new TestResultUploadDTO();
                    dto.setStudentId(result.getStudent().getId());
                    dto.setScore(result.getScore());
                    dto.setFeedback(result.getFeedback());
                    return dto;
                })
                .collect(java.util.stream.Collectors.toList());
    }

    @Transactional
    public void sendReportCardsForTest(Long testId, String instructorEmail) {
        Test test = testRepository.findById(testId)
                .orElseThrow(() -> new RuntimeException("Test not found with ID: " + testId));
        
        // Optionally verify instructorEmail is the creator or has admin role.

        List<TestResult> results = testResultRepository.findByTestId(testId);
        if (results.isEmpty()) {
            throw new RuntimeException("No marks uploaded for this test yet.");
        }

        String batchName = test.getBatch() != null ? test.getBatch().getName() : "General Batch";

        for (TestResult result : results) {
            if (result.getScore() == null || result.getScore() < 1) {
                log.info("Skipping report card for student {} due to invalid/zero marks", result.getStudent().getEmail());
                continue;
            }
            User student = result.getStudent();

            List<MarkDetail> marksList = List.of(
                    new MarkDetail(test.getSubjectName(), test.getDescription(), result.getScore(), test.getMaxMarks())
            );

            String grade = calculateGrade(result.getScore(), test.getMaxMarks());

            Map<String, Object> templateModel = new HashMap<>();
            templateModel.put("testTitle", test.getTitle());
            templateModel.put("marks", marksList);
            templateModel.put("totalScore", result.getScore());
            templateModel.put("grade", grade);
            templateModel.put("feedback", result.getFeedback());

            List<String> emailsToSend = new ArrayList<>();
            if (student.getIdentityProfiles() != null && !student.getIdentityProfiles().isEmpty()) {
                for (UserIdentityProfile profile : student.getIdentityProfiles()) {
                    if (profile.getGoogleEmail() != null && !profile.getGoogleEmail().isBlank()) {
                        emailsToSend.add(profile.getGoogleEmail());
                    }
                }
            }
            
            // Fallback: If no google profile found, but they have a valid email that is not an internal dummy email
            if (emailsToSend.isEmpty() && student.getEmail() != null && !student.getEmail().endsWith("@learnstudio.com")) {
                emailsToSend.add(student.getEmail());
            }

            for (String targetEmail : emailsToSend) {
                emailService.sendReportCard(targetEmail, student.getName(), batchName, templateModel);
                log.info("Triggered report card email for student {} at {}", student.getEmail(), targetEmail);
            }
        }
    }
    @Transactional(readOnly = true)
    public List<StudentTestResultDTO> getMyTestResults(String email) {
        User student = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        List<TestResult> results = testResultRepository.findByStudentId(student.getId());

        return results.stream().map(result -> {
            Test test = result.getTest();
            return StudentTestResultDTO.builder()
                    .testId(test.getId())
                    .testTitle(test.getTitle())
                    .subjectName(test.getSubjectName())
                    .score(result.getScore())
                    .maxMarks(test.getMaxMarks())
                    .grade(calculateGrade(result.getScore(), test.getMaxMarks()))
                    .feedback(result.getFeedback())
                    .testDate(test.getTestDate())
                    .build();
        }).collect(java.util.stream.Collectors.toList());
    }

    private String generateDefaultFeedback(int score, int maxMarks) {
        if (maxMarks == 0) return "N/A";
        double percentage = ((double) score / maxMarks) * 100;
        if (percentage >= 90) return "Excellent performance! Keep up the outstanding work.";
        if (percentage >= 80) return "Great job! You have a solid understanding of the material.";
        if (percentage >= 70) return "Good effort. Reviewing a few core concepts will help you improve further.";
        if (percentage >= 60) return "Fair performance. Please focus more on your weak areas and practice regularly.";
        if (percentage >= 50) return "You passed, but significant improvement is needed. Consider attending extra doubt sessions.";
        return "Poor performance. It is critical that you review all course material and seek immediate help.";
    }

    private String calculateGrade(int score, int maxMarks) {
        if (maxMarks == 0) return "N/A";
        double percentage = ((double) score / maxMarks) * 100;
        if (percentage >= 90) return "A+";
        if (percentage >= 80) return "A";
        if (percentage >= 70) return "B";
        if (percentage >= 60) return "C";
        if (percentage >= 50) return "D";
        return "F";
    }
}
