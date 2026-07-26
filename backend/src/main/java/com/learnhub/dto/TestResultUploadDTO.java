package com.learnhub.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class TestResultUploadDTO {
    @NotNull(message = "Student ID is required")
    private Long studentId;
    
    @NotNull(message = "Score is required")
    private Integer score;
    
    private String feedback;
}
