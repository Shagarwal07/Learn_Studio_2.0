package com.learnhub.controller;

import com.learnhub.dto.*;
import com.learnhub.service.AttendanceService;
import lombok.RequiredArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AttendanceController {

    private final AttendanceService attendanceService;

    // ────────────────────────────────────────────────────────────────────────
    // STUDENT ENDPOINTS
    // ────────────────────────────────────────────────────────────────────────

    @GetMapping("/student/attendance/summary")
    public ResponseEntity<ApiResponse<StudentAttendanceSummaryDTO>> getSummary(Principal principal) {
        StudentAttendanceSummaryDTO data = attendanceService.getSummary(principal.getName());
        return ResponseEntity.ok(ApiResponse.success(data, "Attendance summary retrieved successfully"));
    }

    @GetMapping("/student/attendance/offline")
    public ResponseEntity<ApiResponse<StudentOfflineAttendanceDTO>> getOfflineAttendance(Principal principal) {
        StudentOfflineAttendanceDTO data = attendanceService.getOfflineAttendance(principal.getName());
        return ResponseEntity.ok(ApiResponse.success(data, "Offline attendance records retrieved successfully"));
    }

    @GetMapping("/student/attendance/online")
    public ResponseEntity<ApiResponse<StudentOnlineAttendanceDTO>> getOnlineAttendance(Principal principal) {
        StudentOnlineAttendanceDTO data = attendanceService.getOnlineAttendance(principal.getName());
        return ResponseEntity.ok(ApiResponse.success(data, "Online attendance activity retrieved successfully"));
    }

    @GetMapping("/student/attendance/streak")
    public ResponseEntity<ApiResponse<StudentStreakDTO>> getStreak(Principal principal) {
        StudentStreakDTO data = attendanceService.getStreak(principal.getName());
        return ResponseEntity.ok(ApiResponse.success(data, "Attendance streak details retrieved successfully"));
    }

    // Deprecated backward-compatibility mapping
    @GetMapping("/student/attendance")
    public ResponseEntity<ApiResponse<StudentOfflineAttendanceDTO>> getStudentAttendance(Principal principal) {
        StudentOfflineAttendanceDTO data = attendanceService.getOfflineAttendance(principal.getName());
        return ResponseEntity.ok(ApiResponse.success(data, "Attendance records retrieved successfully"));
    }

    // ────────────────────────────────────────────────────────────────────────
    // INSTRUCTOR ENDPOINTS (SECURED)
    // ────────────────────────────────────────────────────────────────────────

    @GetMapping("/instructor/attendance/students")
    @PreAuthorize("hasAnyRole('INSTRUCTOR','ADMIN')")
    public ResponseEntity<ApiResponse<List<UserDTO>>> getStudentsList() {
        List<UserDTO> list = attendanceService.getStudentsList();
        return ResponseEntity.ok(ApiResponse.success(list, "Students list retrieved successfully"));
    }

    @GetMapping("/instructor/attendance/student/{studentId}")
    @PreAuthorize("hasAnyRole('INSTRUCTOR','ADMIN')")
    public ResponseEntity<ApiResponse<StudentOfflineAttendanceDTO>> getStudentAttendanceForInstructor(
            @PathVariable Long studentId) {
        StudentOfflineAttendanceDTO data = attendanceService.getStudentAttendanceById(studentId);
        return ResponseEntity.ok(ApiResponse.success(data, "Student attendance records retrieved successfully"));
    }

    @PostMapping("/instructor/attendance/mark")
    @PreAuthorize("hasAnyRole('INSTRUCTOR','ADMIN')")
    public ResponseEntity<ApiResponse<AttendanceDTO>> markAttendance(
            @RequestBody InstructorAttendanceMarkRequest request) {
        AttendanceDTO created = attendanceService.markAttendance(request);
        return ResponseEntity.ok(ApiResponse.success(created, "Student attendance marked successfully"));
    }

    @PutMapping("/instructor/attendance/update/{attendanceId}")
    @PreAuthorize("hasAnyRole('INSTRUCTOR','ADMIN')")
    public ResponseEntity<ApiResponse<AttendanceDTO>> updateAttendance(
            @PathVariable Long attendanceId,
            @RequestBody MapUpdateStatusRequest request) {
        AttendanceDTO updated = attendanceService.updateAttendance(attendanceId, request.getStatus());
        return ResponseEntity.ok(ApiResponse.success(updated, "Student attendance updated successfully"));
    }

    @DeleteMapping("/instructor/attendance/delete/{attendanceId}")
    @PreAuthorize("hasAnyRole('INSTRUCTOR','ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteAttendance(@PathVariable Long attendanceId) {
        attendanceService.deleteAttendance(attendanceId);
        return ResponseEntity.ok(ApiResponse.success(null, "Student attendance record deleted successfully"));
    }

    // Tiny helper class for update status body
    @Data
    @NoArgsConstructor
    public static class MapUpdateStatusRequest {
        private String status;
    }
}
