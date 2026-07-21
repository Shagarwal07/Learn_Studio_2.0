package com.learnhub.dto;

import lombok.Builder;
import java.time.LocalDateTime;

@Builder 
public record NoteDTO(
    Long id,
    String title,
    String description,
    Long courseId,
    String courseTitle,
    Long lessonId,
    String lessonTitle,
    String fileUrl,
    String publicId,
    Long uploadedById,
    String uploadedByName,
    Boolean isVisible,
    Boolean aiEnabled,
    Long batchId,
    String batchName,
    String subjectName,
    LocalDateTime createdAt,
    String originalFilename,
    Long fileSize,
    String resourceType,
    String secureUrl
) {}
