package com.learnhub.service;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.Storage;
import com.google.cloud.storage.StorageOptions;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import jakarta.annotation.PostConstruct;

import java.io.FileInputStream;
import java.io.IOException;
import java.util.UUID;

@Service
@Slf4j
public class GoogleCloudStorageService {

    @Value("${google.drive.credentials.path:../resources/google-credentials.json}")
    private String credentialsPath;

    @Value("${gcp.storage.bucket.name:learnstudio_bucket}")
    private String bucketName;

    private Storage storage;

    @PostConstruct
    public void init() {
        try {
            java.io.File file = new java.io.File(credentialsPath);
            if (!file.exists()) {
                // Fallback for when running from the backend/ directory
                file = new java.io.File("../" + credentialsPath);
            }
            if (!file.exists()) {
                // Fallback for when path starts with ../ but we are in root
                file = new java.io.File(credentialsPath.replace("../", ""));
            }
            
            GoogleCredentials credentials = GoogleCredentials.fromStream(new FileInputStream(file));
            storage = StorageOptions.newBuilder().setCredentials(credentials).build().getService();
            log.info("Initialized Google Cloud Storage using credentials from {}", file.getAbsolutePath());
        } catch (Exception e) {
            log.error("Failed to initialize Google Cloud Storage. Avatar uploads will fail until configured.", e);
        }
    }

    public String uploadAvatar(MultipartFile file) throws IOException {
        if (storage == null) {
            throw new RuntimeException("Google Cloud Storage is not properly configured.");
        }
        
        String fileName = "student_avatar/" + UUID.randomUUID().toString() + "-" + file.getOriginalFilename().replaceAll("[^a-zA-Z0-9.-]", "_");
        BlobId blobId = BlobId.of(bucketName, fileName);
        BlobInfo blobInfo = BlobInfo.newBuilder(blobId).setContentType(file.getContentType()).build();
        
        storage.create(blobInfo, file.getBytes());
        
        return "https://storage.googleapis.com/" + bucketName + "/" + fileName;
    }

    public java.util.Map<String, Object> uploadFileRaw(MultipartFile file, String folderName) throws IOException {
        if (storage == null) {
            throw new RuntimeException("Google Cloud Storage is not properly configured.");
        }
        
        if (file.getSize() > 10 * 1024 * 1024) {
            throw new RuntimeException("File size exceeds maximum limit of 10MB");
        }
        String contentType = file.getContentType();
        if (contentType == null || (!contentType.startsWith("image/") && !contentType.equals("application/pdf") && !contentType.startsWith("video/"))) {
            throw new RuntimeException("Only images, videos and PDF documents are allowed");
        }

        String fileName = folderName + "/" + UUID.randomUUID().toString() + "-" + file.getOriginalFilename().replaceAll("[^a-zA-Z0-9.-]", "_");
        BlobId blobId = BlobId.of(bucketName, fileName);
        BlobInfo blobInfo = BlobInfo.newBuilder(blobId).setContentType(contentType).build();
        
        storage.create(blobInfo, file.getBytes());
        
        String secureUrl = "https://storage.googleapis.com/" + bucketName + "/" + fileName;
        
        java.util.Map<String, Object> result = new java.util.HashMap<>();
        result.put("secure_url", secureUrl);
        result.put("public_id", fileName);
        result.put("resource_type", contentType.startsWith("video/") ? "video" : (contentType.startsWith("image/") ? "image" : "raw"));
        return result;
    }

    public void deleteFile(String publicId) {
        if (storage != null && publicId != null && !publicId.isBlank()) {
            try {
                storage.delete(BlobId.of(bucketName, publicId));
            } catch (Exception e) {
                log.error("Failed to delete file from Google Cloud Storage: " + e.getMessage());
            }
        }
    }

    public byte[] downloadFile(String publicId) throws IOException {
        if (storage == null) {
            throw new RuntimeException("Google Cloud Storage is not properly configured.");
        }
        return storage.readAllBytes(BlobId.of(bucketName, publicId));
    }
}
