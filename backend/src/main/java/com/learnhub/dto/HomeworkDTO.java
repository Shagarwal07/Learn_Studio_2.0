package com.learnhub.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data 
@Builder 
@NoArgsConstructor 
@AllArgsConstructor
public class HomeworkDTO {
    private Long id;
    private String title;
    private String description;
    private Long courseId;
    private String courseTitle;
    private Long lessonId;
    private String lessonTitle;
    private String fileUrl;
    private String publicId;
    private LocalDateTime dueDate;
    private Long createdById;
    private String createdByName;
    private Boolean isVisible;
    private Long batchId;
    private String batchName;
    private String subjectName;
    private LocalDateTime createdAt;
}
