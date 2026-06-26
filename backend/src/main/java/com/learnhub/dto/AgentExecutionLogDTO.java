package com.learnhub.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AgentExecutionLogDTO {
    private Long id;
    private Long examRequestId;
    private String agentType; // MANAGER, THEORY, MATHEMATICS, QUESTION_BANK, EDITOR
    private String status; // RUNNING, SUCCESS, FAILED
    private Long executionTimeMs;
    private String logOutput;
    private LocalDateTime timestamp;
}
