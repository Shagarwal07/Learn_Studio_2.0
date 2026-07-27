package com.learnhub.controller;

import com.learnhub.dto.ApiResponse;
import com.learnhub.service.GoogleDriveSyncService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/sync")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('INSTRUCTOR','ADMIN')")
public class GoogleDriveSyncController {

    private final GoogleDriveSyncService driveSyncService;

    @PostMapping("/drive")
    public ResponseEntity<ApiResponse<String>> triggerSync(
            @RequestParam(required = false) String folderId) {
        try {
            driveSyncService.backupPendingNotesToDrive();
            return ResponseEntity.ok(ApiResponse.success(
                    "Google Drive Notes backup completed successfully.",
                    "Notes Backup Completed"
            ));
        } catch (Exception e) {
            System.err.println("Google Drive notes backup request failed: " + e.getMessage());
            return ResponseEntity.status(500).body(ApiResponse.error(
                    "Notes backup failed: " + e.getMessage()
            ));
        }
    }
}
