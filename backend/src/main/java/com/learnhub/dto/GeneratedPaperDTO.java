package com.learnhub.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GeneratedPaperDTO {
    private Long id;
    private Long examRequestId;
    private String title;
    private Integer totalMarks;
    private List<GeneratedQuestionDTO> questions;
    private String status; // DRAFT, UNDER_REVIEW, REVISION_NEEDED, APPROVED, PUBLISHED
    private Integer version;
    private String fileUrl;
    private LocalDateTime createdAt;
}
