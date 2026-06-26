package com.learnhub.controller;

import com.learnhub.dto.ApiResponse;
import com.learnhub.dto.ScheduleEventDTO;
import com.learnhub.service.ScheduleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ScheduleController {

    private final ScheduleService scheduleService;

    @GetMapping("/schedules/week")
    public ResponseEntity<ApiResponse<List<ScheduleEventDTO>>> getWeeklySchedule(Principal principal) {
        List<ScheduleEventDTO> list = scheduleService.getWeeklySchedule(principal.getName());
        return ResponseEntity.ok(ApiResponse.success(list, "Weekly schedule retrieved successfully"));
    }

    @PostMapping("/schedules")
    @PreAuthorize("hasAnyRole('INSTRUCTOR','ADMIN')")
    public ResponseEntity<ApiResponse<ScheduleEventDTO>> createSchedule(
            @RequestBody ScheduleEventDTO dto, Principal principal) {
        ScheduleEventDTO created = scheduleService.createSchedule(principal.getName(), dto);
        return ResponseEntity.ok(ApiResponse.success(created, "Schedule event created successfully"));
    }

    @PatchMapping("/schedules/{id}")
    @PreAuthorize("hasAnyRole('INSTRUCTOR','ADMIN')")
    public ResponseEntity<ApiResponse<ScheduleEventDTO>> updateSchedule(
            @PathVariable Long id, @RequestBody ScheduleEventDTO dto, Principal principal) {
        ScheduleEventDTO updated = scheduleService.updateSchedule(principal.getName(), id, dto);
        return ResponseEntity.ok(ApiResponse.success(updated, "Schedule event updated successfully"));
    }

    @DeleteMapping("/schedules/{id}")
    @PreAuthorize("hasAnyRole('INSTRUCTOR','ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteSchedule(@PathVariable Long id, Principal principal) {
        scheduleService.deleteSchedule(principal.getName(), id);
        return ResponseEntity.ok(ApiResponse.success(null, "Schedule event deleted successfully"));
    }

    @GetMapping("/instructor/schedules")
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public ResponseEntity<ApiResponse<List<ScheduleEventDTO>>> getInstructorSchedules(Principal principal) {
        List<ScheduleEventDTO> list = scheduleService.getInstructorSchedules(principal.getName());
        return ResponseEntity.ok(ApiResponse.success(list, "Instructor schedules retrieved successfully"));
    }

    @GetMapping("/admin/schedules")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<ScheduleEventDTO>>> getAdminSchedules() {
        List<ScheduleEventDTO> list = scheduleService.getAdminSchedules();
        return ResponseEntity.ok(ApiResponse.success(list, "Admin schedules retrieved successfully"));
    }
}
