package com.learnhub.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizAttemptDTO {
    private Long id;
    private String topic;
    private Integer score;
    private Integer totalQuestions;
    private LocalDateTime createdAt;
}
