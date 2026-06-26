package com.learnhub.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CertificateDTO {
    private Long id;
    private Long courseId;
    private String courseTitle;
    private String studentName;
    private String certificateHash;
    private LocalDateTime issuedAt;
}
