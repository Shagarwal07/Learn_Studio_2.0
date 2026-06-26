package com.learnhub.dto;

import com.learnhub.entity.Course.Level;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class CourseDTO {
    private Long id;
    
    @NotBlank
    private String title;
    
    private String description;
    
    @NotNull
    private BigDecimal price;
    
    private String thumbnail;
    
    private Level level;
    
    private String instructorName;
    
    private int totalLessons;
    
    private String previewVideoUrl;
    
    private Double averageRating;
    
    private int totalReviews;
}
