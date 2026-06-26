package com.learnhub.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaperVersionDTO {
    private Long id;
    private Long paperId;
    private Integer version;
    private String questionsJson; // JSON representation of questions
    private String changeReason;
    private String changedByName;
    private LocalDateTime timestamp;
}
