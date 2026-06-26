package com.learnhub.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.Map;

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
}
