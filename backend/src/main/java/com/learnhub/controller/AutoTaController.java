package com.learnhub.controller;

import com.learnhub.dto.*;
import com.learnhub.entity.*;
import com.learnhub.repository.AgentExecutionLogRepository;
import com.learnhub.repository.ExamRequestRepository;
import com.learnhub.repository.GeneratedPaperRepository;
import com.learnhub.service.EditorService;
import com.learnhub.service.FirestoreService;
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
    private final com.learnhub.service.PdfExportService pdfExportService;
    private final ExamRequestRepository examRequestRepository;
    private final GeneratedPaperRepository paperRepository;
    private final AgentExecutionLogRepository executionLogRepository;
    private final com.learnhub.repository.UserRepository userRepository;
    private final com.learnhub.repository.BatchRepository batchRepository;
    private final com.learnhub.repository.NoteRepository noteRepository;
    private final com.learnhub.service.PromptSanitizerService promptSanitizerService;
    private final com.learnhub.service.VertexAiMultimodalProvider vertexAiMultimodalProvider;
    private final FirestoreService firestoreService;
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
    public ResponseEntity<ApiResponse<List<GeneratedPaperDTO>>> getAllPapers(@RequestParam(required = false) Long instructorId) {
        List<GeneratedPaper> papers;
        if (instructorId != null) {
            papers = paperRepository.findByInstructorIdOrderByCreatedAtDesc(instructorId);
        } else {
            papers = paperRepository.findByOrderByCreatedAtDesc();
        }
        List<GeneratedPaperDTO> dtos = papers.stream()
                .map(editorService::toDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(dtos, "Generated exam papers retrieved"));
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

            List<com.learnhub.dto.GeneratedQuestionDTO> questions = firestoreService.getQuestionsForPaper(paper.getFirestoreDocumentId());
            errors.addAll(editorService.runValidation(paper, questions));
            result.put("valid", errors.isEmpty());
            result.put("isValid", errors.isEmpty()); // fallback
            
            // Collect question-level warnings
            // fetched questions earlier
            if (questions != null) {
                for (com.learnhub.dto.GeneratedQuestionDTO q : questions) {
                    if ("COMPLETED_WITH_WARNINGS".equals(q.getQualityStatus())) {
                        warnings.add(String.format("Warning in Question ID %d: %s", q.getId(), q.getAgentType() != null && q.getAgentType().startsWith("WARNING") ? q.getAgentType() : "Minor pedagogical or math warning flagged by AI."));
                    }
                }
            }
            
            // Recalculate dynamic stats
            int expectedTotal = paper.getTotalMarks() != null ? paper.getTotalMarks() : 0;
            int actualTotal = questions != null 
                ? questions.stream().mapToInt(q -> q.getMarks() != null ? q.getMarks() : 0).sum() 
                : 0;
            
            result.put("dynamicTotalMarks", actualTotal);
            paperTotal.put("target", expectedTotal);
            paperTotal.put("actual", actualTotal);
            result.put("paperTarget", expectedTotal); // flat fallback
            result.put("paperActual", actualTotal); // flat fallback

            // Dynamically collect actual marks per section
            Map<String, Integer> actualMap = new java.util.TreeMap<>();
            if (questions != null) {
                for (var q : questions) {
                    String sec = q.getSection() != null && !q.getSection().isBlank() ? q.getSection() : "SECTION_A";
                    int m = q.getMarks() != null ? q.getMarks() : 0;
                    actualMap.put(sec, actualMap.getOrDefault(sec, 0) + m);
                }
            }

            // Determine target marks per section (Super Duper 7-Section vs Zero-Mark Worksheet vs 3-Section vs Single/Custom)
            Map<String, Integer> targetMap = new java.util.TreeMap<>();
            boolean isSuperDuper = actualMap.size() > 3 || actualMap.keySet().stream().anyMatch(k -> k.toUpperCase().contains("SECTION_D") || k.toUpperCase().contains("SECTION_G"));
            
            if (expectedTotal <= 0) {
                // Zero marks practice worksheet - target is 0 for all existing sections
                for (String sec : actualMap.keySet()) {
                    targetMap.put(sec, 0);
                }
            } else if (isSuperDuper) {
                // 7-Section Super Duper Blueprint (Sections A to G) matching SuperDuperBlueprint exact marks
                boolean isHighMarks = (expectedTotal >= 75);
                String secA = actualMap.keySet().stream().filter(k -> k.toUpperCase().contains("SECTION_A")).findFirst().orElse("SECTION_A - Multiple Choice Questions");
                String secB = actualMap.keySet().stream().filter(k -> k.toUpperCase().contains("SECTION_B")).findFirst().orElse("SECTION_B - Fill in the Blanks");
                String secC = actualMap.keySet().stream().filter(k -> k.toUpperCase().contains("SECTION_C")).findFirst().orElse("SECTION_C - Assertion Reason Questions");
                String secD = actualMap.keySet().stream().filter(k -> k.toUpperCase().contains("SECTION_D")).findFirst().orElse("SECTION_D - Very Short Answer Type Questions");
                String secE = actualMap.keySet().stream().filter(k -> k.toUpperCase().contains("SECTION_E")).findFirst().orElse("SECTION_E - Short Answer Type Questions");
                String secF = actualMap.keySet().stream().filter(k -> k.toUpperCase().contains("SECTION_F")).findFirst().orElse("SECTION_F - Long Answer Type Questions");
                String secG = actualMap.keySet().stream().filter(k -> k.toUpperCase().contains("SECTION_G")).findFirst().orElse("SECTION_G - Case Study Questions");
                
                targetMap.put(secA, isHighMarks ? 10 : 5);
                targetMap.put(secB, isHighMarks ? 10 : 5);
                targetMap.put(secC, isHighMarks ? 4 : 2);
                targetMap.put(secD, isHighMarks ? 16 : 8);
                targetMap.put(secE, isHighMarks ? 20 : 10);
                targetMap.put(secF, isHighMarks ? 16 : 8);
                targetMap.put(secG, isHighMarks ? 24 : 12);
            } else if (actualMap.size() == 1) {
                // Single Section Override
                for (String k : actualMap.keySet()) {
                    targetMap.put(k, expectedTotal);
                }
            } else if (actualTotal == expectedTotal && !actualMap.isEmpty()) {
                // If marks are balanced across custom worksheet/practice groupings, match actual distribution
                targetMap.putAll(actualMap);
            } else {
                // Default 3-Section Balanced Blueprint (20%, 30%, 50%)
                String secA = actualMap.keySet().stream().filter(k -> k.toUpperCase().contains("SECTION_A")).findFirst().orElse("SECTION_A");
                String secB = actualMap.keySet().stream().filter(k -> k.toUpperCase().contains("SECTION_B")).findFirst().orElse("SECTION_B");
                String secC = actualMap.keySet().stream().filter(k -> k.toUpperCase().contains("SECTION_C")).findFirst().orElse("SECTION_C");
                int tA = Math.round(expectedTotal * 0.20f);
                int tB = Math.round(expectedTotal * 0.30f);
                targetMap.put(secA, tA);
                targetMap.put(secB, tB);
                targetMap.put(secC, expectedTotal - tA - tB);
            }

            // Build dynamic sections list for Live Validation Dashboard
            List<Map<String, Object>> sectionDetailsList = new ArrayList<>();
            java.util.Set<String> allSecs = new java.util.TreeSet<>(actualMap.keySet());
            allSecs.addAll(targetMap.keySet());
            for (String sec : allSecs) {
                Map<String, Object> secObj = new HashMap<>();
                secObj.put("sectionName", sec);
                secObj.put("actual", actualMap.getOrDefault(sec, 0));
                secObj.put("target", targetMap.getOrDefault(sec, 0));
                sectionDetailsList.add(secObj);
            }
            result.put("sections", sectionDetailsList);
            sectionTotals.put("sections", sectionDetailsList);

            int actualA = actualMap.getOrDefault("SECTION_A", 0);
            int actualB = actualMap.getOrDefault("SECTION_B", 0);
            int actualC = actualMap.getOrDefault("SECTION_C", 0);
            int targetA = targetMap.getOrDefault("SECTION_A", 0);
            int targetB = targetMap.getOrDefault("SECTION_B", 0);
            int targetC = targetMap.getOrDefault("SECTION_C", 0);

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
        List<com.learnhub.dto.GeneratedQuestionDTO> questions = firestoreService.getQuestionsForPaper(paper.getFirestoreDocumentId());
        List<String> errors = editorService.runValidation(paper, questions);
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

    @GetMapping("/papers/{id}/export/pdf")
    public ResponseEntity<?> exportPdf(@PathVariable Long id, @RequestParam(required = false, defaultValue = "11") Integer fontSize, @CookieValue(name = "access_token", required = false) String accessToken, @RequestParam(required = false, defaultValue = "worksheet") String layoutMode) {
        GeneratedPaper paper = paperRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Paper not found"));

        // Validate first
        List<com.learnhub.dto.GeneratedQuestionDTO> questions = firestoreService.getQuestionsForPaper(paper.getFirestoreDocumentId());
        List<String> errors = editorService.runValidation(paper, questions);
        if (!errors.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("PDF Export Blocked: Validation errors present: " + String.join("; ", errors)));
        }

        // Validate status: must be APPROVED or REVIEWED, or COMPLETED_WITH_WARNINGS to allow export
        GeneratedPaper.Status status = paper.getStatus();
        boolean hasWarnings = paper.getExamRequest() != null && paper.getExamRequest().getStatus() == com.learnhub.entity.ExamRequest.Status.COMPLETED_WITH_WARNINGS;
        
        if (status != GeneratedPaper.Status.APPROVED && status != GeneratedPaper.Status.REVIEWED && status != GeneratedPaper.Status.EXPORTED && status != GeneratedPaper.Status.PUBLISHED && !hasWarnings) {
            return ResponseEntity.badRequest().body(ApiResponse.error("PDF Export Blocked: Exam paper must be APPROVED or REVIEWED before exporting."));
        }

        byte[] pdfBytes;
        try {
            pdfBytes = pdfExportService.generatePdfWithHeadlessBrowser(editorService.toDTO(paper), accessToken, layoutMode);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(ApiResponse.error("Headless PDF Generation failed: " + e.getMessage()));
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"studio-exam-paper-" + id + ".pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfBytes);
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
        return ResponseEntity.status(501).body(ApiResponse.error("Regenerate single question not implemented yet for Firestore."));
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
        try {
            GeneratedPaper paper = paperRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Paper not found"));

            if (paper.getFirestoreDocumentId() == null) {
                return ResponseEntity.ok(ApiResponse.success(new java.util.ArrayList<>()));
            }

            List<java.util.Map<String, Object>> versionMaps = firestoreService.getPaperVersions(paper.getFirestoreDocumentId());
            List<PaperVersionDTO> dtoList = new java.util.ArrayList<>();
            
            // Map the Maps to DTOs
            for (java.util.Map<String, Object> map : versionMaps) {
                PaperVersionDTO dto = new PaperVersionDTO();
                
                // Firestore document id is a string, but DTO expects a Long
                if (map.containsKey("id")) {
                    String stringId = (String) map.get("id");
                    dto.setId((long) stringId.hashCode());
                }
                dto.setPaperId(id);
                
                if (map.containsKey("changeDescription")) {
                    dto.setChangeReason((String) map.get("changeDescription"));
                }
                if (map.containsKey("userId")) {
                    dto.setChangedByName("User " + map.get("userId")); // Or fetch user details if available
                }
                
                if (map.containsKey("timestamp")) {
                    Object tsObj = map.get("timestamp");
                    if (tsObj instanceof com.google.cloud.Timestamp) {
                        java.time.Instant instant = java.time.Instant.ofEpochSecond(((com.google.cloud.Timestamp) tsObj).getSeconds());
                        dto.setTimestamp(java.time.LocalDateTime.ofInstant(instant, java.time.ZoneId.systemDefault()));
                    } else if (tsObj instanceof java.util.Date) {
                        dto.setTimestamp(((java.util.Date) tsObj).toInstant().atZone(java.time.ZoneId.systemDefault()).toLocalDateTime());
                    }
                }
                
                if (map.containsKey("questions")) {
                    com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                    dto.setQuestionsJson(mapper.writeValueAsString(map.get("questions")));
                }

                dtoList.add(dto);
            }

            return ResponseEntity.ok(ApiResponse.success(dtoList));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(ApiResponse.error("Failed to fetch versions: " + e.getMessage()));
        }
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
            List<com.learnhub.dto.GeneratedQuestionDTO> questions = paper != null ? firestoreService.getQuestionsForPaper(paper.getFirestoreDocumentId()) : new ArrayList<>();
            response.put("questionsGenerated", questions != null ? questions.size() : 0);
            
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

            boolean hasUploadedImages = (images != null && !images.isEmpty() && images.stream().anyMatch(f -> f != null && !f.isEmpty()));

            // 1. Sanitize Prompt & Extract Intent (distinguish UI image extraction vs Notes blueprinting)
            var promptResult = promptSanitizerService.sanitizePrompt(customPrompt, subject, batch.getName(), hasUploadedImages);

            // 2. Fetch PDF Texts and Note Titles
            List<String> pdfTexts = new ArrayList<>();
            List<String> noteTitles = new ArrayList<>();
            if (selectedNoteIds != null && !selectedNoteIds.isEmpty()) {
                List<com.learnhub.entity.Note> notes = noteRepository.findAllById(selectedNoteIds);
                for (com.learnhub.entity.Note n : notes) {
                    if (n.getTitle() != null && !n.getTitle().isBlank()) {
                        noteTitles.add(n.getTitle().trim());
                    }
                    if (n.getExtractedText() != null && !n.getExtractedText().isBlank()) {
                        pdfTexts.add(n.getExtractedText());
                    }
                }
            }

            String cleanSyllabus = !noteTitles.isEmpty() ? String.join(", ", noteTitles) : (subject + " - " + batch.getName());
            if (customPrompt != null && !customPrompt.isBlank() && customPrompt.length() <= 60 && !customPrompt.toLowerCase().contains("create") && !customPrompt.toLowerCase().contains("generate") && !customPrompt.toLowerCase().contains("paper") && !customPrompt.toLowerCase().contains("marks")) {
                cleanSyllabus = customPrompt.trim();
            }

            // 3. Generate Paper JSON via Vertex AI Multimodal
            String paperJson = vertexAiMultimodalProvider.generatePaperJson(promptResult.getSanitizedPrompt(), images, pdfTexts);

            // 4. Save Request & Paper Entities
            ExamRequest request = ExamRequest.builder()
                    .subject(subject)
                    .course(batch.getName())
                    .syllabus(cleanSyllabus)
                    .marks(promptResult.getTotalMarks())
                    .difficulty("MEDIUM")
                    .questionPattern(promptResult.isMcqOnly() ? "MCQ_ONLY" : "MIXED")
                    .totalQuestions(promptResult.getTotalQuestions())
                    .duration(60)
                    .status(ExamRequest.Status.COMPLETED)
                    .build();

            ExamRequest savedRequest = examRequestRepository.save(request);

            String cleanedJson = com.learnhub.util.AiJsonParser.extractJson(paperJson);
            com.fasterxml.jackson.databind.ObjectMapper mapper = com.learnhub.util.AiJsonParser.getMapper();
            com.fasterxml.jackson.databind.JsonNode rootNode = mapper.readTree(cleanedJson);

            List<GeneratedQuestionDTO> questionDTOList = new ArrayList<>();
            if (rootNode.isArray()) {
                for (com.fasterxml.jackson.databind.JsonNode node : rootNode) {
                    String qText = node.path("questionText").asText("");
                    if (qText.isBlank() || "null".equalsIgnoreCase(qText.trim())) qText = node.path("question").asText("");
                    if (qText.isBlank() || "null".equalsIgnoreCase(qText.trim())) qText = node.path("text").asText("");
                    if (qText.isBlank() || "null".equalsIgnoreCase(qText.trim())) qText = node.path("question_text").asText("");
                    if (qText.isBlank() || "null".equalsIgnoreCase(qText.trim())) qText = node.path("extractedText").asText("");
                    if (qText.isBlank() || "null".equalsIgnoreCase(qText.trim())) qText = node.path("content").asText("");
                    if (qText.isBlank() || "null".equalsIgnoreCase(qText.trim())) qText = node.path("exercise").asText("");
                    
                    String qType = node.path("questionType").asText("MCQ");
                    String correct = node.path("correctOption").hasNonNull("value") ? node.path("correctOption").asText() : node.path("correctAnswer").asText("");
                    if (correct.isBlank()) correct = node.path("answer").asText("");
                    if (correct.isBlank()) correct = node.path("solution").asText("");
                    if (correct.isBlank()) {
                        correct = hasUploadedImages ? "Answer provided in practice session." : "A";
                    }
                    String explanation = node.path("solutionExplanation").asText(node.path("solutionSteps").asText(""));
                    int qMarks = hasUploadedImages ? 0 : node.path("marks").asInt(1);

                    String optionsStr = null;
                    com.fasterxml.jackson.databind.JsonNode optsNode = node.path("options");
                    if (optsNode.isArray()) {
                        optionsStr = mapper.writeValueAsString(optsNode);
                    } else if (!optsNode.isMissingNode()) {
                        optionsStr = optsNode.asText();
                    }

                    String diff = node.path("difficulty").asText("MEDIUM");
                    String bloom = node.path("bloomLevel").asText("Understanding");
                    String chapter = hasUploadedImages ? node.path("chapter").asText("General Practice") : node.path("chapter").asText(batch.getName());
                    String topic = node.path("topic").asText("");
                    String confidence = node.path("confidence").asText("high");

                    String targetSection = node.path("section").asText("");
                    if (targetSection.isBlank()) {
                        if (hasUploadedImages) {
                            targetSection = "General Practice";
                        } else {
                            targetSection = "SECTION_B";
                            if (qType.equalsIgnoreCase("MCQ") || qType.equalsIgnoreCase("FILL_IN_THE_BLANK") || qType.equalsIgnoreCase("TRUE_FALSE")) {
                                targetSection = "SECTION_A";
                            } else if (qType.equalsIgnoreCase("LONG_ANSWER") || qType.equalsIgnoreCase("LONG") || qType.equalsIgnoreCase("ESSAY") || qType.equalsIgnoreCase("NUMERICAL")) {
                                targetSection = "SECTION_C";
                            }
                        }
                    } else if (hasUploadedImages || targetSection.contains(":") || (targetSection.contains(" ") && !targetSection.trim().startsWith("SECTION_"))) {
                        targetSection = targetSection.trim();
                    } else {
                        targetSection = targetSection.toUpperCase().trim().replace(" ", "_");
                        if (!targetSection.startsWith("SEC")) targetSection = "SECTION_" + targetSection;
                    }

                    GeneratedQuestionDTO qDto = GeneratedQuestionDTO.builder()
                            .questionText(qText)
                            .questionType(qType)
                            .options(optionsStr)
                            .correctAnswer(correct)
                            .solutionSteps(explanation)
                            .marks(qMarks)
                            .difficulty(diff)
                            .bloomLevel(bloom)
                            .chapter(chapter)
                            .topic(topic)
                            .confidence(confidence)
                            .agentType("VERTEX_AI")
                            .subject(subject != null && !subject.trim().isEmpty() ? subject : "General")
                            .section(targetSection)
                            .build();
                    questionDTOList.add(qDto);
                }
            }

            GeneratedPaper savedPaper = editorService.compileExamPaper(savedRequest, questionDTOList);
            if (hasUploadedImages) {
                // savedPaper.setTestType("Categorized Practice");
                savedPaper.setTitle((subject != null && !subject.isBlank() ? subject : "Mathematics") + " Worksheet - Categorized Practice");
                savedPaper.setTotalMarks(0);
            }
            savedPaper.setStatus(GeneratedPaper.Status.APPROVED);
            savedPaper = paperRepository.save(savedPaper);

            savedRequest.setTotalQuestions(questionDTOList.size());
            savedRequest.setMarks(savedPaper.getTotalMarks() != null ? savedPaper.getTotalMarks() : promptResult.getTotalMarks());
            examRequestRepository.save(savedRequest);

            Map<String, Object> res = new HashMap<>();
            res.put("requestId", savedRequest.getId());
            res.put("paperId", savedPaper.getId());
            res.put("status", "COMPLETED");
            res.put("totalQuestions", questionDTOList.size());
            res.put("totalMarks", savedRequest.getMarks());

            return ResponseEntity.ok(ApiResponse.success(res, "Exam paper generated successfully"));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Failed to generate paper: " + e.getMessage()));
        }
    }

    @org.springframework.transaction.annotation.Transactional
    @DeleteMapping("/papers/{paperId}")
    public ResponseEntity<ApiResponse<Void>> deletePaper(@PathVariable Long paperId) {
        if (!paperRepository.existsById(paperId)) {
            return ResponseEntity.status(404).body(ApiResponse.error("Exam paper not found"));
        }
        paperRepository.deleteById(paperId);
        return ResponseEntity.ok(ApiResponse.success(null, "Paper removed successfully"));
    }

    @org.springframework.transaction.annotation.Transactional
    @DeleteMapping("/papers")
    public ResponseEntity<ApiResponse<Void>> deleteAllPapers() {
        // Deleted repositories removed
        paperRepository.deleteAll();
        return ResponseEntity.ok(ApiResponse.success(null, "All exam papers removed successfully"));
    }
}
