package com.learnhub.dto;

import com.learnhub.entity.Announcement;
import lombok.Builder;
import java.time.LocalDateTime;

@Builder 
public record AnnouncementDTO(
    Long id,
    String title,
    String message,
    String imageUrl,
    Announcement.TargetRole targetRole,
    Long courseId,
    String courseTitle,
    String instagramUrl,
    String externalLink,
    Boolean pinned,
    Long createdById,
    String createdByName,
    Long batchId,
    String batchName,
    LocalDateTime createdAt
) {}
