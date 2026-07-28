package com.learnhub.controller;

import com.learnhub.dto.*;
import com.learnhub.entity.*;
import com.learnhub.repository.AgentExecutionLogRepository;
import com.learnhub.repository.ExamRequestRepository;
import com.learnhub.repository.GeneratedPaperRepository;
import com.learnhub.service.EditorService;
import com.learnhub.service.ManagerService;
import com.learnhub.service.ReviewService;
import com.learnhub.service.DocxExportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/autota")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('INSTRUCTOR','ADMIN')")
public class AutoTaController {

    private final ManagerService managerService;
    private final ReviewService reviewService;
    private final EditorService editorService;
    private final DocxExportService docxExportService;
    private final ExamRequestRepository examRequestRepository;
    private final GeneratedPaperRepository paperRepository;
    private final AgentExecutionLogRepository executionLogRepository;
    private final com.learnhub.repository.UserRepository userRepository;
    private final com.learnhub.repository.BatchRepository batchRepository;
    private final com.learnhub.repository.NoteRepository noteRepository;
    private final com.learnhub.service.PromptSanitizerService promptSanitizerService;
    private final com.learnhub.service.VertexAiMultimodalProvider vertexAiMultimodalProvider;

    @org.springframework.beans.factory.annotation.Autowired
    private com.learnhub.service.VertexAiProvider vertexAiProvider;

    @PostMapping("/requests")
    public ResponseEntity<ApiResponse<ExamRequestDTO>> createExamRequest(@RequestBody ExamRequestDTO dto, Principal principal) {
        User user = userRepository.findByEmail(principal.getName()).orElse(null);
        final Long userId = user != null ? user.getId() : null;

        // Complete input validation
        if (dto.getSubject() == null || dto.getSubject().trim().isEmpty() ||
            dto.getCourse() == null || dto.getCourse().trim().isEmpty() ||
            dto.getSyllabus() == null || dto.getSyllabus().trim().isEmpty() ||
            dto.getMarks() == null || dto.getMarks() <= 0 ||
            dto.getDifficulty() == null || dto.getDifficulty().trim().isEmpty() ||
            dto.getQuestionPattern() == null || dto.getQuestionPattern().trim().isEmpty() ||
            dto.getTotalQuestions() == null || dto.getTotalQuestions() <= 0 ||
            dto.getDuration() == null || dto.getDuration() <= 0) {
            
            return ResponseEntity.badRequest().body(ApiResponse.error(
                "Validation Error: All inputs (class/course, subject, topics/syllabus, total marks, difficulty, duration, question pattern) are mandatory and must be valid."
            ));
        }

        // Test blueprint solver mathematically beforehand to fail immediately if distribution is impossible
        try {
            ManagerService.createBlueprint(dto.getMarks(), dto.getTotalQuestions());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }

        ExamRequest request = ExamRequest.builder()
                .subject(dto.getSubject())
                .course(dto.getCourse())
                .syllabus(dto.getSyllabus())
                .marks(dto.getMarks())
                .difficulty(dto.getDifficulty())
                .questionPattern(dto.getQuestionPattern())
                .totalQuestions(dto.getTotalQuestions())
                .duration(dto.getDuration())
                .status(ExamRequest.Status.PENDING)
                .build();

        ExamRequest savedRequest = examRequestRepository.save(request);
        
        // Execute the multi-agent pipeline in a background thread
        java.util.concurrent.CompletableFuture.runAsync(() -> {
            try {
                managerService.generateExamPaper(savedRequest, userId);
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
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getRequestStatus(@PathVariable Long id) {
        List<AgentExecutionLog> logs = executionLogRepository.findByExamRequestId(id);
        
        List<Map<String, Object>> result = logs.stream().map(log -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", log.getId());
            map.put("agentType", log.getAgentType());
            map.put("status", log.getStatus());
            map.put("logOutput", log.getLogOutput());
            map.put("executionTimeMs", log.getExecutionTimeMs());
            map.put("timestamp", log.getCreatedAt());
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success(result, "Agent status logs retrieved"));
    }

    @org.springframework.beans.factory.annotation.Value("${ai.provider.priority:gemini,openrouter,local}")
    private String aiPriority;
    
    @org.springframework.beans.factory.annotation.Value("${openrouter.model:google/gemini-2.5-flash}")
    private String openrouterModel;

    @GetMapping("/config")
    public ResponseEntity<ApiResponse<Map<String, String>>> getAutoTaConfig() {
        Map<String, String> map = new HashMap<>();
        map.put("priority", aiPriority);
        map.put("openrouterModel", openrouterModel);
        return ResponseEntity.ok(ApiResponse.success(map, "AI Config"));
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

    @GetMapping("/papers/{id}/validate")
    public ResponseEntity<ApiResponse<Map<String, Object>>> validatePaper(@PathVariable Long id) {
        Map<String, Object> result = new HashMap<>();
        List<String> errors = new java.util.ArrayList<>();
        List<String> warnings = new java.util.ArrayList<>();
        
        Map<String, Object> sectionTotals = new HashMap<>();
        Map<String, Object> paperTotal = new HashMap<>();
        
        result.put("valid", false);
        result.put("isValid", false); // flat fallback
        result.put("errors", errors);
        result.put("warnings", warnings);
        result.put("sectionTotals", sectionTotals);
        result.put("paperTotal", paperTotal);

        try {
            GeneratedPaper paper = paperRepository.findById(id).orElse(null);
            if (paper == null) {
                errors.add("Paper not found");
                return ResponseEntity.ok(ApiResponse.success(result, "Paper not found"));
            }

            errors.addAll(editorService.runValidation(paper));
            result.put("valid", errors.isEmpty());
            result.put("isValid", errors.isEmpty()); // fallback
            
            // Collect question-level warnings
            if (paper.getQuestions() != null) {
                for (com.learnhub.entity.GeneratedQuestion q : paper.getQuestions()) {
                    if ("COMPLETED_WITH_WARNINGS".equals(q.getQualityStatus())) {
                        warnings.add(String.format("Warning in Question ID %d: %s", q.getId(), q.getAgentType() != null && q.getAgentType().startsWith("WARNING") ? q.getAgentType() : "Minor pedagogical or math warning flagged by AI."));
                    }
                }
            }

            int expectedTotal = paper.getTotalMarks() != null ? paper.getTotalMarks() : 0;
            int actualTotal = paper.getQuestions() != null 
                ? paper.getQuestions().stream().mapToInt(q -> q.getMarks() != null ? q.getMarks() : 0).sum() 
                : 0;

            paperTotal.put("target", expectedTotal);
            paperTotal.put("actual", actualTotal);
            result.put("paperTarget", expectedTotal); // flat fallback
            result.put("paperActual", actualTotal); // flat fallback

            int actualA = 0;
            int actualB = 0;
            int actualC = 0;

            if (paper.getQuestions() != null) {
                actualA = paper.getQuestions().stream()
                        .filter(q -> q.getSection() != null && "SECTION_A".equalsIgnoreCase(q.getSection()))
                        .mapToInt(q -> q.getMarks() != null ? q.getMarks() : 0).sum();
                actualB = paper.getQuestions().stream()
                        .filter(q -> q.getSection() != null && "SECTION_B".equalsIgnoreCase(q.getSection()))
                        .mapToInt(q -> q.getMarks() != null ? q.getMarks() : 0).sum();
                actualC = paper.getQuestions().stream()
                        .filter(q -> q.getSection() != null && "SECTION_C".equalsIgnoreCase(q.getSection()))
                        .mapToInt(q -> q.getMarks() != null ? q.getMarks() : 0).sum();
            }

            int targetA = 0;
            int targetB = 0;
            int targetC = 0;

            try {
                int qSize = paper.getQuestions() != null ? paper.getQuestions().size() : 0;
                ManagerService.PaperBlueprint blueprint = ManagerService.createBlueprint(expectedTotal, qSize);
                targetA = blueprint.sectionA.targetMarks;
                targetB = blueprint.sectionB.targetMarks;
                targetC = blueprint.sectionC.targetMarks;
            } catch (Exception e) {
                warnings.add("Blueprint targets could not be calculated: " + e.getMessage());
            }

            sectionTotals.put("sectionATarget", targetA);
            sectionTotals.put("sectionBTarget", targetB);
            sectionTotals.put("sectionCTarget", targetC);
            sectionTotals.put("sectionAActual", actualA);
            sectionTotals.put("sectionBActual", actualB);
            sectionTotals.put("sectionCActual", actualC);

            // Also keep flat fallbacks for safety
            result.put("sectionATarget", targetA);
            result.put("sectionBTarget", targetB);
            result.put("sectionCTarget", targetC);
            result.put("sectionAActual", actualA);
            result.put("sectionBActual", actualB);
            result.put("sectionCActual", actualC);

        } catch (Exception e) {
            errors.add("Validation crashed with internal error: " + e.getMessage());
            result.put("valid", false);
            result.put("isValid", false);
        }

        return ResponseEntity.ok(ApiResponse.success(result, "Exam paper validation run completed"));
    }

    @GetMapping("/papers/{id}/export/docx")
    public ResponseEntity<?> exportDocx(@PathVariable Long id) {
        GeneratedPaper paper = paperRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Paper not found"));

        // Validate first
        List<String> errors = editorService.runValidation(paper);
        if (!errors.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("DOCX Export Blocked: Validation errors present: " + String.join("; ", errors)));
        }

        // Validate status: must be APPROVED or REVIEWED, or COMPLETED_WITH_WARNINGS to allow manual Word edits
        GeneratedPaper.Status status = paper.getStatus();
        boolean hasWarnings = paper.getExamRequest() != null && paper.getExamRequest().getStatus() == com.learnhub.entity.ExamRequest.Status.COMPLETED_WITH_WARNINGS;
        
        if (status != GeneratedPaper.Status.APPROVED && status != GeneratedPaper.Status.REVIEWED && status != GeneratedPaper.Status.EXPORTED && status != GeneratedPaper.Status.PUBLISHED && !hasWarnings) {
            return ResponseEntity.badRequest().body(ApiResponse.error("DOCX Export Blocked: Exam paper must be APPROVED or REVIEWED before exporting."));
        }

        byte[] docxBytes = docxExportService.generateDocx(editorService.toDTO(paper));

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"exam-paper-" + id + ".docx\"")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.wordprocessingml.document"))
                .body(docxBytes);
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

    @PreAuthorize("permitAll()")
    @GetMapping("/test/mock-generation")
    public ResponseEntity<ApiResponse<Map<String, Object>>> testMockGeneration() {
        Map<String, Object> response = new HashMap<>();
        try {
            ExamRequest req = ExamRequest.builder()
                .subject("Science")
                .course("Grade 10")
                .syllabus("Force and Laws of Motion")
                .marks(10)
                .totalQuestions(5)
                .difficulty("MEDIUM")
                .questionPattern("Standard")
                .status(ExamRequest.Status.PENDING)
                .build();
            ExamRequest saved = examRequestRepository.save(req);
            
            User user = userRepository.findAll().stream().findFirst().orElseThrow(() -> new RuntimeException("No users in DB for test"));
            
            GeneratedPaper paper = managerService.generateExamPaper(saved, user.getId());
            
            response.put("status", "SUCCESS");
            response.put("paperGenerated", paper != null);
            response.put("questionsGenerated", paper != null && paper.getQuestions() != null ? paper.getQuestions().size() : 0);
            
            byte[] docx = docxExportService.generateDocx(editorService.toDTO(paper));
            response.put("docxExportReady", docx != null && docx.length > 0);
            
            return ResponseEntity.ok(ApiResponse.success(response, "Mock generation successful"));
        } catch (Exception e) {
            response.put("status", "FAILED");
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error("Mock generation failed: " + e.getMessage()));
        }
    }

    @PreAuthorize("permitAll()")
    @GetMapping("/test/vertex")
    public ResponseEntity<ApiResponse<Map<String, Object>>> testVertexGeneration() {
        Map<String, Object> response = new HashMap<>();
        try {
            com.learnhub.entity.User user = userRepository.findAll().stream().findFirst().orElseThrow(() -> new RuntimeException("No users in DB for test"));
            String prompt = "Return only this JSON: [{\"slotIndex\":0,\"questionText\":\"Test question?\",\"questionType\":\"SHORT\",\"chapter\":\"Test\",\"topic\":\"Test\",\"options\":[]}]";
            
            String rawResponse = vertexAiProvider.ask(prompt, null);
            
            String cleaned = com.learnhub.util.AiJsonParser.extractJson(rawResponse);
            com.fasterxml.jackson.databind.ObjectMapper mapper = com.learnhub.util.AiJsonParser.getMapper();
            Object parsed = mapper.readValue(cleaned, Object.class);
            
            response.put("provider", "vertex");
            response.put("model", "gemini-2.5-flash");
            response.put("success", true);
            response.put("rawResponse", rawResponse);
            response.put("parsedSuccessfully", parsed != null);
            
            return ResponseEntity.ok(ApiResponse.success(response, "Vertex AI test successful"));
        } catch (Exception e) {
            response.put("provider", "vertex");
            response.put("model", "gemini-2.5-flash");
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error("Vertex AI test failed: " + e.getMessage()));
        }
    }

    @GetMapping("/bucket-materials")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getBucketMaterials(
            @RequestParam(required = false) Long batchId,
            @RequestParam(required = false) String subject) {

        if (batchId == null || subject == null || subject.isBlank()) {
            return ResponseEntity.ok(ApiResponse.success(List.of(), "No batch or subject specified"));
        }

        List<com.learnhub.entity.Note> notes = noteRepository.findByBatchIdAndSubjectName(batchId, subject.trim());
        List<Map<String, Object>> result = notes.stream().map(n -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", n.getId());
            map.put("title", n.getTitle());
            map.put("originalFilename", n.getOriginalFilename() != null ? n.getOriginalFilename() : n.getTitle() + ".pdf");
            map.put("fileUrl", n.getFileUrl());
            map.put("publicId", n.getPublicId());
            map.put("fileSize", n.getFileSize() != null ? n.getFileSize() : 0L);
            map.put("hasExtractedText", n.getExtractedText() != null && !n.getExtractedText().isBlank());
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success(result, "Fetched batch PDF notes successfully"));
    }

    @PostMapping(value = "/requests/multimodal", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<Map<String, Object>>> createMultimodalExamRequest(
            @RequestParam("batchId") Long batchId,
            @RequestParam("subject") String subject,
            @RequestParam(value = "customPrompt", required = false) String customPrompt,
            @RequestParam(value = "selectedNoteIds", required = false) List<Long> selectedNoteIds,
            @RequestPart(value = "images", required = false) List<org.springframework.web.multipart.MultipartFile> images,
            Principal principal) {

        try {
            com.learnhub.entity.Batch batch = batchRepository.findById(batchId)
                    .orElseThrow(() -> new RuntimeException("Batch not found"));

            // 1. Sanitize Prompt & Extract Intent
            var promptResult = promptSanitizerService.sanitizePrompt(customPrompt, subject, batch.getName());

            // 2. Fetch PDF Texts
            List<String> pdfTexts = new ArrayList<>();
            if (selectedNoteIds != null && !selectedNoteIds.isEmpty()) {
                List<com.learnhub.entity.Note> notes = noteRepository.findAllById(selectedNoteIds);
                for (com.learnhub.entity.Note n : notes) {
                    if (n.getExtractedText() != null && !n.getExtractedText().isBlank()) {
                        pdfTexts.add(n.getExtractedText());
                    }
                }
            }

            // 3. Generate Paper JSON via Vertex AI Multimodal
            String paperJson = vertexAiMultimodalProvider.generatePaperJson(promptResult.getSanitizedPrompt(), images, pdfTexts);

            // 4. Save Request & Paper Entities
            ExamRequest request = ExamRequest.builder()
                    .subject(subject)
                    .course(batch.getName())
                    .syllabus(promptResult.getSanitizedPrompt())
                    .marks(promptResult.getTotalMarks())
                    .difficulty("MEDIUM")
                    .questionPattern(promptResult.isMcqOnly() ? "MCQ_ONLY" : "MIXED")
                    .totalQuestions(promptResult.getTotalQuestions())
                    .duration(60)
                    .status(ExamRequest.Status.COMPLETED)
                    .build();

            ExamRequest savedRequest = examRequestRepository.save(request);

            com.fasterxml.jackson.databind.ObjectMapper mapper = com.learnhub.util.AiJsonParser.getMapper();
            List<GeneratedQuestionDTO> questions = mapper.readValue(paperJson,
                    mapper.getTypeFactory().constructCollectionType(List.class, GeneratedQuestionDTO.class));

            GeneratedPaper paper = GeneratedPaper.builder()
                    .examRequest(savedRequest)
                    .title(subject + " Exam Paper - " + batch.getName())
                    .totalMarks(promptResult.getTotalMarks())
                    .duration(60)
                    .testType("R. K. COACHING CLASSES")
                    .status(GeneratedPaper.Status.APPROVED)
                    .version(1)
                    .build();

            GeneratedPaper savedPaper = paperRepository.save(paper);

            Map<String, Object> res = new HashMap<>();
            res.put("requestId", savedRequest.getId());
            res.put("paperId", savedPaper.getId());
            res.put("status", "COMPLETED");
            res.put("totalQuestions", questions.size());
            res.put("totalMarks", promptResult.getTotalMarks());

            return ResponseEntity.ok(ApiResponse.success(res, "Exam paper generated successfully"));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Failed to generate paper: " + e.getMessage()));
        }
    }
}
