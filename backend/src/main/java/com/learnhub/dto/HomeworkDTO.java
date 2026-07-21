package com.learnhub.dto;

import lombok.Builder;
import java.time.LocalDateTime;

@Builder 
public record HomeworkDTO(
    Long id,
    String title,
    String description,
    Long courseId,
    String courseTitle,
    Long lessonId,
    String lessonTitle,
    String fileUrl,
    String publicId,
    LocalDateTime dueDate,
    Long createdById,
    String createdByName,
    Boolean isVisible,
    Long batchId,
    String batchName,
    String subjectName,
    LocalDateTime createdAt
) {}
