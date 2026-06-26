package com.learnhub.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewDTO {
    private Long id;
    private Long userId;
    private String studentName;
    private Integer rating;
    private String comment;
    private LocalDateTime createdAt;
}
