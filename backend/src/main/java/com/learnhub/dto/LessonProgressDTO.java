package com.learnhub.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LessonProgressDTO {
    private Long id;
    private String title;
    private Integer position;
    private String videoUrl;
    private String duration;
    private boolean completed;
    private boolean unlocked;
    private LocalDateTime completedAt;
}