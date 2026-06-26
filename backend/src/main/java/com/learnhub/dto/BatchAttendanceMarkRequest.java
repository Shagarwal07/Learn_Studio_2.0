package com.learnhub.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BatchAttendanceMarkRequest {
    private String subjectName;
    private String date; // "YYYY-MM-DD"
    private List<StudentMark> records;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class StudentMark {
        private Long studentId;
        private String status; // "PRESENT" or "ABSENT"
    }
}
