package com.learnhub.controller;

import com.learnhub.dto.ApiResponse;
import com.learnhub.dto.CertificateDTO;
import com.learnhub.dto.CourseProgressDTO;
import com.learnhub.entity.Enrollment;
import com.learnhub.service.EnrollmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.*;

@RestController
@RequestMapping("/api/enrollments")
@RequiredArgsConstructor
public class EnrollmentController {

    private final EnrollmentService enrollmentService;

    @PostMapping("/{courseId}")
    public ResponseEntity<ApiResponse<Enrollment>> enroll(@PathVariable Long courseId, Principal principal) {
        Enrollment enrollment = enrollmentService.enroll(principal.getName(), courseId);
        return ResponseEntity.ok(ApiResponse.success(enrollment, "Enrolled successfully"));
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> myEnrollments(Principal principal) {
        List<Map<String, Object>> enrollments = enrollmentService.getMyEnrollments(principal.getName());
        return ResponseEntity.ok(ApiResponse.success(enrollments, "My enrollments retrieved successfully"));
    }

    @GetMapping("/{courseId}/progress")
    public ResponseEntity<ApiResponse<CourseProgressDTO>> getCourseProgress(
            @PathVariable Long courseId,
            Principal principal) {
        CourseProgressDTO progress = enrollmentService.getCourseProgress(principal.getName(), courseId);
        return ResponseEntity.ok(ApiResponse.success(progress, "Course progress retrieved successfully"));
    }

    @PostMapping("/{courseId}/lessons/{lessonId}/complete")
    public ResponseEntity<ApiResponse<CourseProgressDTO>> completeLesson(
            @PathVariable Long courseId,
            @PathVariable Long lessonId,
            Principal principal) {
        CourseProgressDTO progress = enrollmentService.completeLesson(principal.getName(), courseId, lessonId);
        return ResponseEntity.ok(ApiResponse.success(progress, "Lesson marked as completed successfully"));
    }

    @GetMapping("/{courseId}/certificate")
    public ResponseEntity<ApiResponse<CertificateDTO>> getCertificate(
            @PathVariable Long courseId,
            Principal principal) {
        CertificateDTO certificate = enrollmentService.getOrCreateCertificate(principal.getName(), courseId);
        return ResponseEntity.ok(ApiResponse.success(certificate, "Certificate retrieved successfully"));
    }

    @GetMapping("/my/certificates")
    public ResponseEntity<ApiResponse<List<CertificateDTO>>> getMyCertificates(Principal principal) {
        List<CertificateDTO> certificates = enrollmentService.getMyCertificates(principal.getName());
        return ResponseEntity.ok(ApiResponse.success(certificates, "My certificates retrieved successfully"));
    }

    @PostMapping("/{courseId}/lessons/{lessonId}/progress")
    public ResponseEntity<ApiResponse<Void>> updateLessonProgress(
            @PathVariable Long courseId,
            @PathVariable Long lessonId,
            @RequestBody Map<String, Integer> body,
            Principal principal) {
        Integer lastWatchedSeconds = body.getOrDefault("lastWatchedSeconds", 0);
        enrollmentService.updateLessonProgress(principal.getName(), courseId, lessonId, lastWatchedSeconds);
        return ResponseEntity.ok(ApiResponse.success(null, "Progress updated successfully"));
    }

    @GetMapping("/resume")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getResumeLearning(Principal principal) {
        Map<String, Object> resume = enrollmentService.getResumeLearning(principal.getName());
        return ResponseEntity.ok(ApiResponse.success(resume, "Resume learning state retrieved successfully"));
    }
}
