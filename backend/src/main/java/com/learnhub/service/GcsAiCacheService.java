package com.learnhub.service;

import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.StorageException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;

@Service
@Slf4j
@RequiredArgsConstructor
public class GcsAiCacheService {

    private final GoogleCloudStorageService gcsService;

    private String buildPath(String feature, String modelVersion, String promptHash) {
        // e.g. learnstudio_content/AiCache/GENERATE_QUIZ/gemini-2.5-flash/v1/abcd123.json
        return String.format("learnstudio_content/AiCache/%s/%s/v1/%s.json", feature, modelVersion, promptHash);
    }

    public String getCachedResponse(String feature, String modelVersion, String promptHash) {
        if (gcsService.getStorage() == null) {
            return null; // GCS not configured
        }
        
        String path = buildPath(feature, modelVersion, promptHash);
        try {
            byte[] content = gcsService.getStorage().readAllBytes(BlobId.of(gcsService.getBucketName(), path));
            if (content != null && content.length > 0) {
                log.info("🎯 AI Cache HIT for feature: {}, hash: {}", feature, promptHash);
                return new String(content, StandardCharsets.UTF_8);
            }
        } catch (StorageException e) {
            // 404 Not Found is expected for a cache miss
            if (e.getCode() != 404) {
                log.warn("GCS Cache read error for {}: {}", path, e.getMessage());
            }
        } catch (Exception e) {
            log.warn("Unexpected error reading GCS Cache {}: {}", path, e.getMessage());
        }
        return null;
    }

    public void saveCachedResponse(String feature, String modelVersion, String promptHash, String response) {
        if (gcsService.getStorage() == null || response == null || response.isBlank()) {
            return;
        }

        String path = buildPath(feature, modelVersion, promptHash);
        try {
            BlobId blobId = BlobId.of(gcsService.getBucketName(), path);
            BlobInfo blobInfo = BlobInfo.newBuilder(blobId).setContentType("application/json").build();
            gcsService.getStorage().create(blobInfo, response.getBytes(StandardCharsets.UTF_8));
            log.info("💾 AI Cache SAVED for feature: {}, hash: {}", feature, promptHash);
        } catch (Exception e) {
            log.warn("Failed to save AI response to GCS Cache {}: {}", path, e.getMessage());
        }
    }
}
