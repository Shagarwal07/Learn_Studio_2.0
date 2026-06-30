package com.learnhub.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.Map;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CloudinaryService {

    private final Cloudinary cloudinary;

    public String uploadFile(MultipartFile file, String folderName) throws IOException {
        // Validate file size (max 10MB)
        if (file.getSize() > 10 * 1024 * 1024) {
            throw new RuntimeException("File size exceeds maximum limit of 10MB");
        }

        // Validate file type (allow only image/video/pdf)
        String contentType = file.getContentType();
        if (contentType == null || (!contentType.startsWith("image/") && !contentType.equals("application/pdf"))) {
            throw new RuntimeException("Only images and PDF documents are allowed");
        }

        @SuppressWarnings("rawtypes")
        Map uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
            "folder", folderName,
            "resource_type", "auto"
        ));

        if (uploadResult == null || !uploadResult.containsKey("secure_url")) {
            throw new RuntimeException("Upload failed on Cloudinary provider");
        }

        return uploadResult.get("secure_url").toString();
    }

    @SuppressWarnings("rawtypes")
    public Map uploadFileRaw(MultipartFile file, String folderName) throws IOException {
        if (file.getSize() > 10 * 1024 * 1024) {
            throw new RuntimeException("File size exceeds maximum limit of 10MB");
        }
        String contentType = file.getContentType();
        if (contentType == null || (!contentType.startsWith("image/") && !contentType.equals("application/pdf"))) {
            throw new RuntimeException("Only images and PDF documents are allowed");
        }
        return cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
            "folder", folderName,
            "resource_type", "auto"
        ));
    }

    public void deleteFile(String publicId) {
        try {
            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
        } catch (IOException e) {
            System.err.println("Failed to delete file from Cloudinary: " + e.getMessage());
        }
    }

    public byte[] downloadFile(String publicId) throws IOException {
        return downloadFile(publicId, null);
    }

    public byte[] downloadFile(String publicId, String version) throws IOException {
        com.cloudinary.Url urlBuilder = cloudinary.url()
                .resourceType("image")
                .type("upload")
                .format("pdf")
                .secure(true)
                .signed(true);

        if (version != null && !version.isBlank()) {
            urlBuilder.version(version);
        }

        String signedUrl = urlBuilder.generate(publicId);
        System.out.println("Downloading PDF from signed URL: " + signedUrl);

        java.net.URL url = new java.net.URL(signedUrl);
        try (java.io.InputStream is = url.openStream()) {
            return is.readAllBytes();
        }
    }

    @SuppressWarnings("rawtypes")
    public int getCloudinaryAssetCount() {
        try {
            Map result = cloudinary.api().resources(ObjectUtils.asMap("max_results", 500));
            if (result != null && result.containsKey("resources")) {
                List resources = (List) result.get("resources");
                return resources.size();
            }
        } catch (Exception e) {
            System.err.println("Failed to fetch Cloudinary resources: " + e.getMessage());
        }
        return -1;
    }
}
