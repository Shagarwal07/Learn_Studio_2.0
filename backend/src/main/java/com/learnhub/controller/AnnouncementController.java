package com.learnhub.controller;

import com.learnhub.dto.AnnouncementDTO;
import com.learnhub.dto.ApiResponse;
import com.learnhub.service.AnnouncementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/announcements")
@RequiredArgsConstructor
public class AnnouncementController {

    private final AnnouncementService announcementService;

    @PostMapping
    @PreAuthorize("hasAnyRole('INSTRUCTOR','ADMIN')")
    public ResponseEntity<ApiResponse<AnnouncementDTO>> createAnnouncement(
            @RequestBody AnnouncementDTO dto, Principal principal) {
        AnnouncementDTO announcement = announcementService.createAnnouncement(principal.getName(), dto);
        return ResponseEntity.ok(ApiResponse.success(announcement, "Announcement posted successfully"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<AnnouncementDTO>>> getAnnouncements(
            @RequestParam(required = false) Long courseId, Principal principal) {
        List<AnnouncementDTO> list = announcementService.getAnnouncements(principal.getName(), courseId);
        return ResponseEntity.ok(ApiResponse.success(list, "Announcements retrieved successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AnnouncementDTO>> getAnnouncementById(
            @PathVariable Long id, Principal principal) {
        AnnouncementDTO announcement = announcementService.getAnnouncementById(principal.getName(), id);
        return ResponseEntity.ok(ApiResponse.success(announcement, "Announcement retrieved successfully"));
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('INSTRUCTOR','ADMIN')")
    public ResponseEntity<ApiResponse<AnnouncementDTO>> updateAnnouncement(
            @PathVariable Long id, @RequestBody AnnouncementDTO dto, Principal principal) {
        AnnouncementDTO announcement = announcementService.updateAnnouncement(principal.getName(), id, dto);
        return ResponseEntity.ok(ApiResponse.success(announcement, "Announcement updated successfully"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('INSTRUCTOR','ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteAnnouncement(
            @PathVariable Long id, Principal principal) {
        announcementService.deleteAnnouncement(principal.getName(), id);
        return ResponseEntity.ok(ApiResponse.success(null, "Announcement deleted successfully"));
    }
}
