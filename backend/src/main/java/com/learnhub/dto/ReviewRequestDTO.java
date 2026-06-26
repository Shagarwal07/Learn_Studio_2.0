package com.learnhub.dto;

import lombok.*;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewRequestDTO {
    private String action; // APPROVE, REJECT, REQUEST_REGENERATION
    private String comments;
    private List<Long> rejectedQuestionIds; // specific questions to regenerate in the feedback loop
}
