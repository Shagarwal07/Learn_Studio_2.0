package com.learnhub.controller;

import com.learnhub.dto.ApiResponse;
import com.learnhub.dto.HomeworkDTO;
import com.learnhub.dto.HomeworkSubmissionDTO;
import com.learnhub.service.HomeworkService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class HomeworkController {

    private final HomeworkService homeworkService;

    // ── Instructor APIs ─────────────────────────────────

    @PostMapping(value = "/instructor/homework", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('INSTRUCTOR','ADMIN')")
    public ResponseEntity<ApiResponse<HomeworkDTO>> createHomework(
            @RequestParam("title") String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam("courseId") Long courseId,
            @RequestParam(value = "lessonId", required = false) Long lessonId,
            @RequestParam("dueDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dueDate,
            @RequestParam("file") MultipartFile file,
            Principal principal) throws IOException {

        HomeworkDTO homework = homeworkService.createHomework(principal.getName(), title, description, courseId, lessonId, dueDate, file);
        return ResponseEntity.ok(ApiResponse.success(homework, "Homework created successfully"));
    }

    @DeleteMapping("/instructor/homework/{homeworkId}")
    @PreAuthorize("hasAnyRole('INSTRUCTOR','ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteHomework(@PathVariable Long homeworkId, Principal principal) {
        homeworkService.deleteHomework(principal.getName(), homeworkId);
        return ResponseEntity.ok(ApiResponse.success(null, "Homework deleted successfully"));
    }

    @GetMapping("/instructor/homework/{homeworkId}/submissions")
    @PreAuthorize("hasAnyRole('INSTRUCTOR','ADMIN')")
    public ResponseEntity<ApiResponse<List<HomeworkSubmissionDTO>>> getSubmissionsForHomework(
            @PathVariable Long homeworkId, Principal principal) {
        List<HomeworkSubmissionDTO> subs = homeworkService.getSubmissionsForHomework(principal.getName(), homeworkId);
        return ResponseEntity.ok(ApiResponse.success(subs, "Submissions retrieved successfully"));
    }

    @PatchMapping("/instructor/homework/submissions/{submissionId}/review")
    @PreAuthorize("hasAnyRole('INSTRUCTOR','ADMIN')")
    public ResponseEntity<ApiResponse<HomeworkSubmissionDTO>> gradeSubmission(
            @PathVariable Long submissionId,
            @RequestBody Map<String, Object> body,
            Principal principal) {

        Double marks = Double.valueOf(body.get("marks").toString());
        String feedback = body.getOrDefault("feedback", "").toString();

        HomeworkSubmissionDTO sub = homeworkService.gradeSubmission(principal.getName(), submissionId, marks, feedback);
        return ResponseEntity.ok(ApiResponse.success(sub, "Submission graded successfully"));
    }

    // ── Student APIs ───────────────────────────────────

    @GetMapping("/student/homework/courses")
    @PreAuthorize("hasAnyRole('STUDENT','INSTRUCTOR','ADMIN')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getCoursesWithHomework(Principal principal) {
        List<Map<String, Object>> courses = homeworkService.getCoursesWithHomework(principal.getName());
        return ResponseEntity.ok(ApiResponse.success(courses, "Courses with homework retrieved successfully"));
    }

    @GetMapping("/student/homework/course/{courseId}")
    @PreAuthorize("hasAnyRole('STUDENT','INSTRUCTOR','ADMIN')")
    public ResponseEntity<ApiResponse<List<HomeworkDTO>>> getHomeworkForCourse(
            @PathVariable Long courseId, Principal principal) {
        List<HomeworkDTO> homeworks = homeworkService.getHomeworkForCourse(principal.getName(), courseId);
        return ResponseEntity.ok(ApiResponse.success(homeworks, "Homework list retrieved successfully"));
    }

    @GetMapping("/student/homework/{homeworkId}")
    @PreAuthorize("hasAnyRole('STUDENT','INSTRUCTOR','ADMIN')")
    public ResponseEntity<ApiResponse<HomeworkDTO>> getHomeworkById(@PathVariable Long homeworkId, Principal principal) {
        HomeworkDTO homework = homeworkService.getHomeworkById(principal.getName(), homeworkId);
        return ResponseEntity.ok(ApiResponse.success(homework, "Homework details retrieved successfully"));
    }

    @PostMapping(value = "/student/homework/{homeworkId}/submit", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('STUDENT','INSTRUCTOR','ADMIN')")
    public ResponseEntity<ApiResponse<HomeworkSubmissionDTO>> submitHomework(
            @PathVariable Long homeworkId,
            @RequestParam("file") MultipartFile file,
            Principal principal) throws IOException {

        HomeworkSubmissionDTO sub = homeworkService.submitHomework(principal.getName(), homeworkId, file);
        return ResponseEntity.ok(ApiResponse.success(sub, "Homework submitted successfully"));
    }

    @GetMapping("/student/homework/{homeworkId}/submission")
    @PreAuthorize("hasAnyRole('STUDENT','INSTRUCTOR','ADMIN')")
    public ResponseEntity<ApiResponse<HomeworkSubmissionDTO>> getStudentSubmission(
            @PathVariable Long homeworkId, Principal principal) {
        HomeworkSubmissionDTO sub = homeworkService.getStudentSubmission(principal.getName(), homeworkId);
        return ResponseEntity.ok(ApiResponse.success(sub, "Student submission retrieved"));
    }
}
