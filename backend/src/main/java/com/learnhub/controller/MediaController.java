package com.learnhub.controller;

import com.learnhub.dto.ApiResponse;
import com.learnhub.service.GoogleCloudStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.Map;

@RestController
@RequestMapping("/api/media")
@RequiredArgsConstructor
public class MediaController {

    private final GoogleCloudStorageService gcsService;

    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<Map<String, String>>> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "folder", defaultValue = "general") String folder) {
        try {
            @SuppressWarnings("rawtypes")
            java.util.Map uploadResult = gcsService.uploadFileRaw(file, folder);
            String secureUrl = uploadResult.get("secure_url").toString();
            String publicId  = uploadResult.containsKey("public_id") ? uploadResult.get("public_id").toString() : "";
            return ResponseEntity.ok(ApiResponse.success(
                Map.of("url", secureUrl, "publicId", publicId),
                "File uploaded successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("File upload failed: " + e.getMessage()));
        }
    }
}
