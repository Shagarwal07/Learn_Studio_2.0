package com.learnhub.dto;

import lombok.Data;
import java.util.List;
import java.util.Set;

@Data
public class BatchAssignmentsRequest {
    private List<Long> instructorIds;
    private Set<String> subjects;
}
