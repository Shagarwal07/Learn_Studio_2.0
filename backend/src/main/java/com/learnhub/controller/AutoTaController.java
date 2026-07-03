package com.learnhub.controller;

import com.learnhub.dto.*;
import com.learnhub.entity.*;
import com.learnhub.repository.AgentExecutionLogRepository;
import com.learnhub.repository.ExamRequestRepository;
import com.learnhub.repository.GeneratedPaperRepository;
import com.learnhub.service.EditorService;
import com.learnhub.service.ManagerService;
import com.learnhub.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/autota")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('INSTRUCTOR','ADMIN')")
public class AutoTaController {

    private final ManagerService managerService;
    private final ReviewService reviewService;
    private final EditorService editorService;
    private final ExamRequestRepository examRequestRepository;
    private final GeneratedPaperRepository paperRepository;
    private final AgentExecutionLogRepository executionLogRepository;

    @PostMapping("/requests")
    public ResponseEntity<ApiResponse<ExamRequestDTO>> createExamRequest(@RequestBody ExamRequestDTO dto) {
        ExamRequest request = ExamRequest.builder()
                .subject(dto.getSubject())
                .course(dto.getCourse())
                .syllabus(dto.getSyllabus())
                .marks(dto.getMarks())
                .difficulty(dto.getDifficulty())
                .questionPattern(dto.getQuestionPattern())
                .totalQuestions(dto.getTotalQuestions())
                .status(ExamRequest.Status.PENDING)
                .build();

        ExamRequest savedRequest = examRequestRepository.save(request);
        
        // Execute the multi-agent pipeline in a background thread
        java.util.concurrent.CompletableFuture.runAsync(() -> {
            try {
                managerService.generateExamPaper(savedRequest);
            } catch (Exception e) {
                savedRequest.setStatus(ExamRequest.Status.FAILED);
                examRequestRepository.save(savedRequest);
                System.err.println("Auto-TA multi-agent pipeline failed: " + e.getMessage());
            }
        });

        ExamRequestDTO result = ExamRequestDTO.builder()
                .id(savedRequest.getId())
                .subject(savedRequest.getSubject())
                .course(savedRequest.getCourse())
                .status(savedRequest.getStatus().name())
                .createdAt(savedRequest.getCreatedAt())
                .build();
        
        return ResponseEntity.ok(ApiResponse.success(result, "Exam paper generation triggered in background"));
    }

    @GetMapping("/requests/{id}/status")
    public ResponseEntity<ApiResponse<List<AgentExecutionLogDTO>>> getRequestStatus(@PathVariable Long id) {
        List<AgentExecutionLog> logs = executionLogRepository.findByExamRequestId(id);
        List<AgentExecutionLogDTO> dtos = logs.stream()
                .map(log -> AgentExecutionLogDTO.builder()
                        .id(log.getId())
                        .examRequestId(log.getExamRequest().getId())
                        .agentType(log.getAgentType())
                        .status(log.getStatus().name())
                        .executionTimeMs(log.getExecutionTimeMs())
                        .logOutput(log.getLogOutput())
                        .timestamp(log.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success(dtos, "Agent execution logs retrieved successfully"));
    }

    @GetMapping("/papers")
    public ResponseEntity<ApiResponse<List<GeneratedPaperDTO>>> getAllPapers() {
        List<GeneratedPaper> papers = paperRepository.findByOrderByCreatedAtDesc();
        List<GeneratedPaperDTO> dtos = papers.stream()
                .map(editorService::toDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(dtos, "All generated exam papers retrieved"));
    }

    @GetMapping("/papers/{id}")
    public ResponseEntity<ApiResponse<GeneratedPaperDTO>> getPaperDetails(@PathVariable Long id) {
        GeneratedPaper paper = paperRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Paper not found"));
        GeneratedPaperDTO dto = editorService.toDTO(paper);
        return ResponseEntity.ok(ApiResponse.success(dto, "Exam paper details retrieved"));
    }

    @PostMapping("/papers/{id}/review")
    public ResponseEntity<ApiResponse<GeneratedPaperDTO>> submitPaperReview(
            @PathVariable Long id, @RequestBody ReviewRequestDTO dto, Principal principal) {
        GeneratedPaperDTO result = reviewService.submitReview(principal.getName(), id, dto);
        return ResponseEntity.ok(ApiResponse.success(result, "Professor review successfully recorded"));
    }

    @PostMapping("/papers/{id}/questions/{questionId}/regenerate")
    public ResponseEntity<ApiResponse<GeneratedPaperDTO>> regenerateQuestion(
            @PathVariable Long id, @PathVariable Long questionId, Principal principal) {
        GeneratedPaperDTO result = reviewService.regenerateSingleQuestion(id, questionId, principal.getName());
        return ResponseEntity.ok(ApiResponse.success(result, "Question successfully regenerated via Feedback Loop"));
    }

    @PutMapping("/papers/{id}/questions/{questionId}")
    public ResponseEntity<ApiResponse<GeneratedQuestionDTO>> updateQuestionText(
            @PathVariable Long id, @PathVariable Long questionId, @RequestBody GeneratedQuestionDTO dto) {
        GeneratedQuestionDTO result = reviewService.updateQuestion(id, questionId, dto);
        return ResponseEntity.ok(ApiResponse.success(result, "Question successfully updated in exam draft"));
    }

    @PutMapping("/papers/{id}")
    public ResponseEntity<ApiResponse<GeneratedPaperDTO>> updatePaperDraft(
            @PathVariable Long id, @RequestBody GeneratedPaperDTO dto, Principal principal) {
        GeneratedPaperDTO result = reviewService.updatePaper(id, dto, principal.getName());
        return ResponseEntity.ok(ApiResponse.success(result, "Exam paper draft successfully updated"));
    }

    @GetMapping("/papers/{id}/versions")
    public ResponseEntity<ApiResponse<List<PaperVersionDTO>>> getPaperVersions(@PathVariable Long id) {
        List<PaperVersion> versions = reviewService.getVersionHistory(id);
        List<PaperVersionDTO> dtos = versions.stream()
                .map(v -> PaperVersionDTO.builder()
                        .id(v.getId())
                        .paperId(v.getGeneratedPaper().getId())
                        .version(v.getVersion())
                        .questionsJson(v.getQuestionsJson())
                        .changeReason(v.getChangeReason())
                        .changedByName(v.getChangedBy() != null ? v.getChangedBy().getName() : "Professor (Direct Edit)")
                        .timestamp(v.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success(dtos, "Exam paper version history retrieved"));
    }

    @GetMapping("/requests/{id}/paper")
    public ResponseEntity<ApiResponse<GeneratedPaperDTO>> getPaperByRequest(@PathVariable Long id) {
        List<GeneratedPaper> papers = paperRepository.findByExamRequestId(id);
        if (papers.isEmpty()) {
            return ResponseEntity.ok(ApiResponse.success(null, "Paper is still generating..."));
        }
        GeneratedPaperDTO dto = editorService.toDTO(papers.get(0));
        return ResponseEntity.ok(ApiResponse.success(dto, "Generated paper retrieved"));
    }
}
