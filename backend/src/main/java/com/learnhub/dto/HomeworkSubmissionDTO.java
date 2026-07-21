package com.learnhub.dto;

import com.learnhub.entity.HomeworkSubmission;
import lombok.Builder;
import java.time.LocalDateTime;

@Builder 
public record HomeworkSubmissionDTO(
    Long id,
    Long homeworkId,
    String homeworkTitle,
    Long studentId,
    String studentName,
    String studentEmail,
    String submissionFileUrl,
    String publicId,
    LocalDateTime submittedAt,
    HomeworkSubmission.Status status,
    String feedback,
    Double marks
) {}
