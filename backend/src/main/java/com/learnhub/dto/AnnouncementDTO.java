package com.learnhub.dto;

import com.learnhub.entity.Announcement;
import lombok.*;
import java.time.LocalDateTime;

@Data 
@Builder 
@NoArgsConstructor 
@AllArgsConstructor
public class AnnouncementDTO {
    private Long id;
    private String title;
    private String message;
    private String imageUrl;
    private Announcement.TargetRole targetRole;
    private Long courseId;
    private String courseTitle;
    private String instagramUrl;
    private String externalLink;
    private Boolean pinned;
    private Long createdById;
    private String createdByName;
    private Long batchId;
    private String batchName;
    private LocalDateTime createdAt;
}
