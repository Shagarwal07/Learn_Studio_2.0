package com.learnhub.controller;

import com.learnhub.dto.TestResultUploadDTO;
import com.learnhub.service.TestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tests")
@RequiredArgsConstructor
public class TestController {

    private final TestService testService;

    @GetMapping("/{testId}/results")
    @PreAuthorize("hasAnyRole('INSTRUCTOR', 'ADMIN')")
    public ResponseEntity<List<TestResultUploadDTO>> getTestMarks(@PathVariable Long testId) {
        return ResponseEntity.ok(testService.getTestMarks(testId));
    }

    @PostMapping("/{testId}/results")
    @PreAuthorize("hasAnyRole('INSTRUCTOR', 'ADMIN')")
    public ResponseEntity<?> uploadTestMarks(
            @PathVariable Long testId,
            @Valid @RequestBody List<TestResultUploadDTO> results,
            Principal principal) {
        
        testService.uploadTestMarks(testId, results, principal.getName());
        return ResponseEntity.ok(Map.of("message", "Marks uploaded successfully."));
    }

    @PostMapping("/{testId}/send-emails")
    @PreAuthorize("hasAnyRole('INSTRUCTOR', 'ADMIN')")
    public ResponseEntity<?> sendReportCards(
            @PathVariable Long testId,
            Principal principal) {
        
        testService.sendReportCardsForTest(testId, principal.getName());
        return ResponseEntity.ok(Map.of("message", "Report cards are being sent asynchronously to all students."));
    }

    @GetMapping("/my-results")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> getMyTestResults(Principal principal) {
        return ResponseEntity.ok(testService.getMyTestResults(principal.getName()));
    }
}
