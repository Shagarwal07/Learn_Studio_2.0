package com.learnhub.dto;

import com.learnhub.entity.Course.Level;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import java.math.BigDecimal;

@Builder
public record CourseDTO(
    Long id,
    
    @NotBlank
    String title,
    
    String description,
    
    @NotNull
    BigDecimal price,
    
    String thumbnail,
    
    Level level,
    
    String instructorName,
    
    int totalLessons,
    
    String previewVideoUrl,
    
    Double averageRating,
    
    int totalReviews
) {}
