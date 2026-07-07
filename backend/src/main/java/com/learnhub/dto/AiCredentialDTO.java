package com.learnhub.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiCredentialDTO {
    private Long id;
    private String provider;
    private String maskedKey;
    private Boolean active;
    private String createdAt;
}
