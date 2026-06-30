package com.learnhub.controller;

import com.learnhub.dto.ApiResponse;
import com.learnhub.service.CloudinaryService;
import com.learnhub.repository.NoteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/media")
@RequiredArgsConstructor
public class MediaController {

    private final CloudinaryService cloudinaryService;
    private final NoteRepository noteRepository;

    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<Map<String, String>>> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "folder", defaultValue = "general") String folder) {
        try {
            @SuppressWarnings("rawtypes")
            java.util.Map uploadResult = cloudinaryService.uploadFileRaw(file, folder);
            String secureUrl = uploadResult.get("secure_url").toString();
            String publicId  = uploadResult.containsKey("public_id") ? uploadResult.get("public_id").toString() : "";
            return ResponseEntity.ok(ApiResponse.success(
                Map.of("url", secureUrl, "publicId", publicId),
                "File uploaded successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("File upload failed: " + e.getMessage()));
        }
    }

    @GetMapping("/debug-sync")
    @PreAuthorize("hasAnyRole('ADMIN', 'INSTRUCTOR')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> debugSync() {
        try {
            long databaseNotesCount = noteRepository.count();
            int cloudinaryAssetsCount = cloudinaryService.getCloudinaryAssetCount();

            Map<String, Object> stats = new HashMap<>();
            stats.put("databaseNotesCount", databaseNotesCount);
            stats.put("cloudinaryAssetsCount", cloudinaryAssetsCount);
            stats.put("status", "Synchronized");
            stats.put("message", "Note: Seeded notes using public demo PDFs are not in your own Cloudinary dashboard.");

            return ResponseEntity.ok(ApiResponse.success(stats, "Debug sync report compiled successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Debug sync failed: " + e.getMessage()));
        }
    }
}
