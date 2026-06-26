package com.learnhub.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data 
@Builder 
@NoArgsConstructor 
@AllArgsConstructor
public class NoteDTO {
    private Long id;
    private String title;
    private String description;
    private Long courseId;
    private String courseTitle;
    private Long lessonId;
    private String lessonTitle;
    private String fileUrl;
    private String publicId;
    private Long uploadedById;
    private String uploadedByName;
    private Boolean isVisible;
    private Boolean aiEnabled;
    private Long batchId;
    private String batchName;
    private String subjectName;
    private LocalDateTime createdAt;
}
