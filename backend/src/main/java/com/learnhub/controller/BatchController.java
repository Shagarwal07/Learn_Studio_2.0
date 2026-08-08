package com.learnhub.controller;

import com.learnhub.dto.*;
import com.learnhub.service.BatchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.security.Principal;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class BatchController {

    private final BatchService batchService;

    // ────────────────────────────────────────────────────────────────────────
    // INSTRUCTOR BATCH CRUD ENDPOINTS
    // ────────────────────────────────────────────────────────────────────────

    @GetMapping("/instructor/batches")
    @PreAuthorize("hasAnyRole('INSTRUCTOR','ADMIN')")
    public ResponseEntity<ApiResponse<List<BatchDTO>>> getAllBatches(Principal principal) {
        List<BatchDTO> batches = batchService.getAllBatches(principal.getName());
        return ResponseEntity.ok(ApiResponse.success(batches, "Batches list retrieved successfully"));
    }

    @GetMapping("/instructor/batches/{id}")
    @PreAuthorize("hasAnyRole('INSTRUCTOR','ADMIN')")
    public ResponseEntity<ApiResponse<BatchDetailsDTO>> getBatchDetails(@PathVariable Long id) {
        BatchDetailsDTO details = batchService.getBatchDetails(id);
        return ResponseEntity.ok(ApiResponse.success(details, "Batch details retrieved successfully"));
    }

    @PostMapping("/instructor/batches")
    @PreAuthorize("hasAnyRole('INSTRUCTOR','ADMIN')")
    public ResponseEntity<ApiResponse<BatchDTO>> createBatch(@RequestBody BatchDTO dto) {
        BatchDTO created = batchService.createBatch(dto);
        return ResponseEntity.ok(ApiResponse.success(created, "Batch created successfully"));
    }

    @PutMapping("/instructor/batches/{id}")
    @PreAuthorize("hasAnyRole('INSTRUCTOR','ADMIN')")
    public ResponseEntity<ApiResponse<BatchDTO>> updateBatch(@PathVariable Long id, @RequestBody BatchDTO dto) {
        BatchDTO updated = batchService.updateBatch(id, dto);
        return ResponseEntity.ok(ApiResponse.success(updated, "Batch updated successfully"));
    }

    @DeleteMapping("/instructor/batches/{id}")
    @PreAuthorize("hasAnyRole('INSTRUCTOR','ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteBatch(@PathVariable Long id) {
        batchService.deleteBatch(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Batch deleted successfully"));
    }

    // ────────────────────────────────────────────────────────────────────────
    // ASSIGNMENTS
    // ────────────────────────────────────────────────────────────────────────

    @PostMapping("/instructor/batches/{id}/assign-students")
    @PreAuthorize("hasAnyRole('INSTRUCTOR','ADMIN')")
    public ResponseEntity<ApiResponse<Void>> assignStudents(
            @PathVariable Long id, @RequestBody List<Long> studentIds) {
        batchService.assignStudents(id, studentIds);
        return ResponseEntity.ok(ApiResponse.success(null, "Students assigned to batch successfully"));
    }

    @PutMapping("/instructor/batches/{id}/assignments")
    @PreAuthorize("hasAnyRole('INSTRUCTOR','ADMIN')")
    public ResponseEntity<ApiResponse<Void>> updateAssignments(
            @PathVariable Long id, @RequestBody com.learnhub.dto.BatchAssignmentsRequest request) {
        batchService.updateAssignments(id, request.getInstructorIds(), request.getSubjects());
        return ResponseEntity.ok(ApiResponse.success(null, "Batch assignments updated successfully"));
    }

    // ────────────────────────────────────────────────────────────────────────
    // ATTENDANCE & TESTS
    // ────────────────────────────────────────────────────────────────────────

    @PostMapping("/instructor/batches/{id}/attendance")
    @PreAuthorize("hasAnyRole('INSTRUCTOR','ADMIN')")
    public ResponseEntity<ApiResponse<Void>> markBatchAttendance(
            @PathVariable Long id, @RequestBody BatchAttendanceMarkRequest request) {
        batchService.markBatchAttendance(id, request);
        return ResponseEntity.ok(ApiResponse.success(null, "Batch attendance marked successfully"));
    }

    @GetMapping("/instructor/batches/{id}/attendance")
    @PreAuthorize("hasAnyRole('INSTRUCTOR','ADMIN')")
    public ResponseEntity<ApiResponse<List<AttendanceDTO>>> getBatchAttendance(@PathVariable Long id) {
        List<AttendanceDTO> attendance = batchService.getBatchAttendance(id);
        return ResponseEntity.ok(ApiResponse.success(attendance, "Batch attendance records retrieved successfully"));
    }


    @PostMapping("/instructor/batches/{id}/tests")
    @PreAuthorize("hasAnyRole('INSTRUCTOR','ADMIN')")
    public ResponseEntity<ApiResponse<TestDTO>> createTest(
            @PathVariable Long id, @RequestBody TestDTO dto, Principal principal) {
        TestDTO created = batchService.createTest(id, dto, principal.getName());
        return ResponseEntity.ok(ApiResponse.success(created, "Batch test scheduled successfully"));
    }

    @GetMapping("/instructor/batches/{id}/tests")
    @PreAuthorize("hasAnyRole('INSTRUCTOR','ADMIN')")
    public ResponseEntity<ApiResponse<List<TestDTO>>> getBatchTests(@PathVariable Long id) {
        List<TestDTO> tests = batchService.getBatchTests(id);
        return ResponseEntity.ok(ApiResponse.success(tests, "Batch tests list retrieved successfully"));
    }

    @PutMapping("/instructor/batches/tests/{testId}")
    @PreAuthorize("hasAnyRole('INSTRUCTOR','ADMIN')")
    public ResponseEntity<ApiResponse<TestDTO>> updateTest(
            @PathVariable Long testId, @RequestBody TestDTO dto) {
        TestDTO updated = batchService.updateTest(testId, dto);
        return ResponseEntity.ok(ApiResponse.success(updated, "Batch test updated successfully"));
    }

    @DeleteMapping("/instructor/batches/tests/{testId}")
    @PreAuthorize("hasAnyRole('INSTRUCTOR','ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteTest(@PathVariable Long testId) {
        batchService.deleteTest(testId);
        return ResponseEntity.ok(ApiResponse.success(null, "Batch test deleted successfully"));
    }

    // ────────────────────────────────────────────────────────────────────────
    // BATCH-WISE NOTES, HOMEWORKS, AND ANNOUNCEMENTS
    // ────────────────────────────────────────────────────────────────────────

    @PostMapping(value = "/instructor/batches/{id}/notes", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('INSTRUCTOR','ADMIN')")
    public ResponseEntity<ApiResponse<NoteDTO>> createBatchNote(
            @PathVariable Long id,
            @RequestParam("title") String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam("subjectName") String subjectName,
            @RequestParam("file") MultipartFile file,
            Principal principal) {
        NoteDTO created = batchService.createBatchNote(id, title, description, subjectName, file, principal.getName());
        return ResponseEntity.ok(ApiResponse.success(created, "Batch note uploaded and secure-mapped successfully"));
    }

    @GetMapping("/instructor/batches/{id}/notes")
    @PreAuthorize("hasAnyRole('INSTRUCTOR','ADMIN')")
    public ResponseEntity<ApiResponse<List<NoteDTO>>> getBatchNotes(@PathVariable Long id) {
        List<NoteDTO> notes = batchService.getBatchNotes(id);
        return ResponseEntity.ok(ApiResponse.success(notes, "Batch notes list retrieved successfully"));
    }

    @PostMapping(value = "/instructor/batches/{id}/homework", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('INSTRUCTOR','ADMIN')")
    public ResponseEntity<ApiResponse<HomeworkDTO>> createBatchHomework(
            @PathVariable Long id,
            @RequestParam("title") String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam("subjectName") String subjectName,
            @RequestParam("dueDate") String dueDate,
            @RequestParam("file") MultipartFile file,
            Principal principal) {
        HomeworkDTO created = batchService.createBatchHomework(id, title, description, subjectName, dueDate, file, principal.getName());
        return ResponseEntity.ok(ApiResponse.success(created, "Batch homework created successfully"));
    }

    @GetMapping("/instructor/batches/{id}/homework")
    @PreAuthorize("hasAnyRole('INSTRUCTOR','ADMIN')")
    public ResponseEntity<ApiResponse<List<HomeworkDTO>>> getBatchHomeworks(@PathVariable Long id) {
        List<HomeworkDTO> homeworks = batchService.getBatchHomeworks(id);
        return ResponseEntity.ok(ApiResponse.success(homeworks, "Batch homeworks list retrieved successfully"));
    }

    @PostMapping("/instructor/batches/{id}/announcements")
    @PreAuthorize("hasAnyRole('INSTRUCTOR','ADMIN')")
    public ResponseEntity<ApiResponse<AnnouncementDTO>> createBatchAnnouncement(
            @PathVariable Long id, @RequestBody AnnouncementDTO dto, Principal principal) {
        AnnouncementDTO created = batchService.createBatchAnnouncement(id, dto, principal.getName());
        return ResponseEntity.ok(ApiResponse.success(created, "Batch announcement created successfully"));
    }

    @GetMapping("/instructor/batches/{id}/announcements")
    @PreAuthorize("hasAnyRole('INSTRUCTOR','ADMIN')")
    public ResponseEntity<ApiResponse<List<AnnouncementDTO>>> getBatchAnnouncements(@PathVariable Long id) {
        List<AnnouncementDTO> announcements = batchService.getBatchAnnouncements(id);
        return ResponseEntity.ok(ApiResponse.success(announcements, "Batch announcements list retrieved successfully"));
    }

    @GetMapping("/student/batch/my")
    public ResponseEntity<ApiResponse<BatchDTO>> getStudentBatch(Principal principal) {
        BatchDTO batch = batchService.getStudentBatch(principal.getName());
        return ResponseEntity.ok(ApiResponse.success(batch, "My batch retrieved successfully"));
    }

    @GetMapping("/student/batch/tests")
    public ResponseEntity<ApiResponse<List<TestDTO>>> getStudentBatchTests(Principal principal) {
        List<TestDTO> tests = batchService.getStudentBatchTests(principal.getName());
        return ResponseEntity.ok(ApiResponse.success(tests, "My batch tests retrieved successfully"));
    }

    @GetMapping("/student/batch/notes")
    public ResponseEntity<ApiResponse<List<NoteDTO>>> getStudentBatchNotes(Principal principal) {
        List<NoteDTO> notes = batchService.getStudentBatchNotes(principal.getName());
        return ResponseEntity.ok(ApiResponse.success(notes, "My batch notes retrieved successfully"));
    }

    @GetMapping("/student/batch/homework")
    public ResponseEntity<ApiResponse<List<HomeworkDTO>>> getStudentBatchHomeworks(Principal principal) {
        List<HomeworkDTO> homeworks = batchService.getStudentBatchHomeworks(principal.getName());
        return ResponseEntity.ok(ApiResponse.success(homeworks, "My batch homeworks retrieved successfully"));
    }

    @GetMapping("/student/batch/announcements")
    public ResponseEntity<ApiResponse<List<AnnouncementDTO>>> getStudentBatchAnnouncements(Principal principal) {
        List<AnnouncementDTO> announcements = batchService.getStudentBatchAnnouncements(principal.getName());
        return ResponseEntity.ok(ApiResponse.success(announcements, "My batch announcements retrieved successfully"));
    }
}
