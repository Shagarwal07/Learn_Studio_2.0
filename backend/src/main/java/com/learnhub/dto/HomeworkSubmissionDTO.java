package com.learnhub.dto;

import com.learnhub.entity.HomeworkSubmission;
import lombok.*;
import java.time.LocalDateTime;

@Data 
@Builder 
@NoArgsConstructor 
@AllArgsConstructor
public class HomeworkSubmissionDTO {
    private Long id;
    private Long homeworkId;
    private String homeworkTitle;
    private Long studentId;
    private String studentName;
    private String studentEmail;
    private String submissionFileUrl;
    private String publicId;
    private LocalDateTime submittedAt;
    private HomeworkSubmission.Status status;
    private String feedback;
    private Double marks;
}
