package com.learnhub.controller;

import com.learnhub.dto.ApiResponse;
import com.learnhub.service.CloudinaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.Map;

@RestController
@RequestMapping("/api/media")
@RequiredArgsConstructor
public class MediaController {

    private final CloudinaryService cloudinaryService;

    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<Map<String, String>>> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "folder", defaultValue = "general") String folder) {
        try {
            String secureUrl = cloudinaryService.uploadFile(file, folder);
            return ResponseEntity.ok(ApiResponse.success(Map.of("url", secureUrl), "File uploaded successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("File upload failed: " + e.getMessage()));
        }
    }
}
