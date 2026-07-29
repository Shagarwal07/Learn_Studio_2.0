package com.learnhub.service;

import com.learnhub.dto.GeneratedQuestionDTO;
import com.learnhub.entity.AgentExecutionLog;
import com.learnhub.entity.ExamRequest;
import com.learnhub.entity.GeneratedPaper;
import com.learnhub.repository.AgentExecutionLogRepository;
import com.learnhub.repository.ExamRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ManagerService {

    private final ExamRequestRepository examRequestRepository;
    private final QuestionGeneratorService questionGeneratorService;
    private final VerificationService verificationService;
    private final PromptEnhancerService promptEnhancerService;
    private final RagService ragService;
    private final EditorService editorService;
    private final AgentExecutionLogRepository executionLogRepository;

    @org.springframework.beans.factory.annotation.Value("${autota.max.retries:2}")
    private int maxRetries;

    public static class SectionBlueprint {
        public String sectionName;
        public int questionCount;
        public int marksPerQuestion;
        public int targetMarks;

        public SectionBlueprint() {}

        public SectionBlueprint(String name, int count, int marks, int target) {
            this.sectionName = name;
            this.questionCount = count;
            this.marksPerQuestion = marks;
            this.targetMarks = target;
        }
    }

    public static class PaperBlueprint {
        public SectionBlueprint sectionA = new SectionBlueprint("SECTION_A", 0, 0, 0);
        public SectionBlueprint sectionB = new SectionBlueprint("SECTION_B", 0, 0, 0);
        public SectionBlueprint sectionC = new SectionBlueprint("SECTION_C", 0, 0, 0);
    }

    public static PaperBlueprint createBlueprint(int totalMarks, int totalQuestions) {
        int[] allowedA = {1, 2};
        int[] allowedB = {3, 4, 5, 6};
        int[] allowedC = {8, 10, 12, 15};

        int idealCountA = Math.max(1, Math.round(totalQuestions * 0.40f));
        int idealCountB = Math.max(1, Math.round(totalQuestions * 0.40f));
        int idealCountC = Math.max(1, totalQuestions - idealCountA - idealCountB);

        PaperBlueprint bestBlueprint = null;
        int bestDistance = Integer.MAX_VALUE;

        PaperBlueprint closestBlueprint = null;
        int closestDiff = Integer.MAX_VALUE;

        for (int countA = 1; countA <= totalQuestions - 2; countA++) {
            for (int countB = 1; countB <= totalQuestions - countA - 1; countB++) {
                int countC = totalQuestions - countA - countB;
                if (countC <= 0) continue;

                for (int marksA : allowedA) {
                    for (int marksB : allowedB) {
                        for (int marksC : allowedC) {
                            int sum = countA * marksA + countB * marksB + countC * marksC;
                            
                            PaperBlueprint bp = new PaperBlueprint();
                            SectionBlueprint sA = new SectionBlueprint();
                            sA.sectionName = "SECTION_A"; sA.questionCount = countA; sA.marksPerQuestion = marksA; sA.targetMarks = countA * marksA; bp.sectionA = sA;
                            SectionBlueprint sB = new SectionBlueprint();
                            sB.sectionName = "SECTION_B"; sB.questionCount = countB; sB.marksPerQuestion = marksB; sB.targetMarks = countB * marksB; bp.sectionB = sB;
                            SectionBlueprint sC = new SectionBlueprint();
                            sC.sectionName = "SECTION_C"; sC.questionCount = countC; sC.marksPerQuestion = marksC; sC.targetMarks = countC * marksC; bp.sectionC = sC;
                            
                            if (sum == totalMarks) {
                                int dist = Math.abs(countA - idealCountA) + Math.abs(countB - idealCountB) + Math.abs(countC - idealCountC);
                                if (dist < bestDistance) {
                                    bestDistance = dist;
                                    bestBlueprint = bp;
                                }
                            }
                            
                            int diff = Math.abs(sum - totalMarks);
                            if (diff < closestDiff) {
                                closestDiff = diff;
                                closestBlueprint = bp;
                            }
                        }
                    }
                }
            }
        }
        
        if (bestBlueprint != null) {
            return bestBlueprint;
        }
        
        if (closestBlueprint != null) {
            System.err.println("WARNING: Unable to find exact blueprint match. Falling back to nearest approximation.");
            return closestBlueprint;
        }

        // Ultimate fallback if loops didn't run (e.g. totalQuestions < 3)
        PaperBlueprint bp = new PaperBlueprint();
        SectionBlueprint sA = new SectionBlueprint();
        sA.sectionName = "SECTION_A"; sA.questionCount = totalQuestions; 
        sA.marksPerQuestion = totalQuestions > 0 ? (totalMarks / totalQuestions) : totalMarks;
        if (sA.marksPerQuestion == 0) sA.marksPerQuestion = 1;
        sA.targetMarks = totalMarks; 
        bp.sectionA = sA;
        return bp;
    }

    public GeneratedPaper generateExamPaper(ExamRequest request, Long userId) {
        request.setStatus(ExamRequest.Status.GENERATING);
        examRequestRepository.save(request);

        long startPipeline = System.currentTimeMillis();
        logAgent(request, "MANAGER", AgentExecutionLog.Status.RUNNING, 0L, "Manager Agent started Section-by-Section pipeline.");

        try {
            // 1. Establish deterministic blueprint targets
            PaperBlueprint blueprint = createBlueprint(request.getMarks(), request.getTotalQuestions());
            
            // 2. Enhance syllabus & retrieve RAG
            String enhancedSyllabus = promptEnhancerService.enhanceSyllabus(userId, request.getSubject(), request.getSyllabus());
            String ragContext = ragService.retrieveContext(request.getCourse(), request.getSubject(), enhancedSyllabus);

            // 3. Build Slots
            List<QuestionGeneratorService.QuestionSlot> allSlots = buildSlots(request, blueprint);
            List<GeneratedQuestionDTO> compiledList = new ArrayList<>();
            List<String> questionHistory = new ArrayList<>();

            // 4. GENERATE SECTION-BY-SECTION
            List<String> sections = Arrays.asList("SECTION_A", "SECTION_B", "SECTION_C");
            for (String section : sections) {
                List<QuestionGeneratorService.QuestionSlot> sectionSlots = allSlots.stream()
                        .filter(s -> s.getSection().equals(section))
                        .toList();

                if (sectionSlots.isEmpty()) continue;

                List<GeneratedQuestionDTO> sectionQuestions = null;
                int retries = 0;
                String rejectionReason = null;
                boolean sectionPassed = false;

                while (!sectionPassed && retries <= maxRetries) {
                    long sectionStart = System.currentTimeMillis();
                    logAgent(request, "SECTION_GENERATOR", AgentExecutionLog.Status.RUNNING, 0L, 
                        "Generating bulk questions for " + section + " (Attempt " + (retries + 1) + ")");

                    try {
                        // Batch Generate
                        sectionQuestions = questionGeneratorService.generateSectionQuestions(
                            userId, request.getSubject(), request.getCourse(), request.getSyllabus(),
                            section, sectionSlots, ragContext, questionHistory, rejectionReason
                        );

                        // Verify
                        for (GeneratedQuestionDTO q : sectionQuestions) {
                            try {
                                VerificationService.VerificationResult verifyResult = verificationService.verifySolution(
                                    userId, q, request.getSubject(), request.getCourse(), request.getSyllabus(), questionHistory
                                );

                                if (!verifyResult.isPassed()) {
                                    q.setQualityStatus("COMPLETED_WITH_WARNINGS");
                                    if (verifyResult.isCritical()) {
                                        q.setAgentType("CRITICAL_AUDIT_FAILED");
                                        logAgent(request, "AUDITOR", AgentExecutionLog.Status.FAILED, 0L, "CRITICAL Audit failure isolated: " + verifyResult.getRejectionReason());
                                        System.err.println("⚠️ CRITICAL Audit failed for question but isolating failure. Reason: " + verifyResult.getRejectionReason());
                                    } else {
                                        q.setAgentType("AUDIT_WARNING");
                                        logAgent(request, "AUDITOR", AgentExecutionLog.Status.FAILED, 0L, "Audit warning: " + verifyResult.getRejectionReason());
                                    }
                                }
                            } catch (Exception processEx) {
                                logAgent(request, "PIPELINE", AgentExecutionLog.Status.FAILED, 0L, "Agent crash isolated: " + processEx.getMessage());
                                System.err.println("⚠️ Pipeline Agent completely crashed for question. Isolating failure to prevent section wipeout: " + processEx.getMessage());
                                q.setQualityStatus("COMPLETED_WITH_WARNINGS");
                                q.setAgentType("AGENT_CRASH_FALLBACK");
                            }
                        }

                        sectionPassed = true; // All questions processed without critical failure
                        logAgent(request, "SECTION_GENERATOR", AgentExecutionLog.Status.SUCCESS, System.currentTimeMillis() - sectionStart, "Section " + section + " successfully compiled.");
                    } catch (Exception e) {
                        retries++;
                        rejectionReason = "Validation failed: " + e.getMessage();
                        logAgent(request, "MANAGER", AgentExecutionLog.Status.FAILED, System.currentTimeMillis() - sectionStart, "Section " + section + " failed: " + e.getMessage() + ". Retrying...");
                    }
                }

                // FALLBACK: If max retries exhausted, inject local templates
                if (!sectionPassed || sectionQuestions == null || sectionQuestions.size() != sectionSlots.size()) {
                    logAgent(request, "MANAGER", AgentExecutionLog.Status.FAILED, 0L, "Section " + section + " exhausted all retries. Injecting Local Fallback Templates.");
                    sectionQuestions = new ArrayList<>();
                    for (QuestionGeneratorService.QuestionSlot slot : sectionSlots) {
                        GeneratedQuestionDTO fallback = questionGeneratorService.generateFallbackQuestion(slot, request.getSubject());
                        sectionQuestions.add(fallback);
                    }
                }

                // Add to compiled list
                for (GeneratedQuestionDTO q : sectionQuestions) {
                    compiledList.add(q);
                    questionHistory.add(q.getQuestionText());
                }
            }

            // Sync Question Orders
            for (int i = 0; i < compiledList.size(); i++) {
                compiledList.get(i).setQuestionOrder(i + 1);
            }

            // 6. Aggregation and compilation via Editor
            long editorStart = System.currentTimeMillis();
            request.setStatus(ExamRequest.Status.VALIDATING);
            examRequestRepository.save(request);
            
            GeneratedPaper paper = editorService.compileExamPaper(request, compiledList);
            logAgent(request, "EDITOR", AgentExecutionLog.Status.SUCCESS, System.currentTimeMillis() - editorStart, "Editor compiled paper.");

            // Check if ANY question has warnings
            boolean hasWarnings = compiledList.stream().anyMatch(q -> "COMPLETED_WITH_WARNINGS".equals(q.getQualityStatus()));
            if (hasWarnings) {
                request.setStatus(ExamRequest.Status.COMPLETED_WITH_WARNINGS);
            } else {
                request.setStatus(ExamRequest.Status.APPROVED);
            }
            examRequestRepository.save(request);
            logAgent(request, "MANAGER", AgentExecutionLog.Status.SUCCESS, System.currentTimeMillis() - startPipeline, "Pipeline successfully completed.");
            return paper;

        } catch (Exception criticalCrash) {
            // Absolute catch-all so the paper never just hangs
            logAgent(request, "MANAGER", AgentExecutionLog.Status.FAILED, 0L, "CRITICAL PIPELINE CRASH: " + criticalCrash.getMessage());
            request.setStatus(ExamRequest.Status.FAILED);
            examRequestRepository.save(request);
            throw new RuntimeException("Generation pipeline crashed, but was safely caught: " + criticalCrash.getMessage(), criticalCrash);
        }
    }

    private List<QuestionGeneratorService.QuestionSlot> buildSlots(ExamRequest request, PaperBlueprint blueprint) {
        List<QuestionGeneratorService.QuestionSlot> slots = new ArrayList<>();
        int slotIndex = 0;
        int totalQuestions = request.getTotalQuestions();
        boolean isQuantitative = isQuantitativeSubject(request.getSubject());

        for (int i = 0; i < blueprint.sectionA.questionCount; i++) {
            slots.add(QuestionGeneratorService.QuestionSlot.builder().section("SECTION_A").marks(blueprint.sectionA.marksPerQuestion).questionType("MCQ").slotIndex(slotIndex++).build());
        }
        for (int i = 0; i < blueprint.sectionB.questionCount; i++) {
            slots.add(QuestionGeneratorService.QuestionSlot.builder().section("SECTION_B").marks(blueprint.sectionB.marksPerQuestion).questionType("SHORT").slotIndex(slotIndex++).build());
        }
        for (int i = 0; i < blueprint.sectionC.questionCount; i++) {
            slots.add(QuestionGeneratorService.QuestionSlot.builder().section("SECTION_C").marks(blueprint.sectionC.marksPerQuestion).questionType(isQuantitative ? "NUMERICAL" : "LONG").slotIndex(slotIndex++).build());
        }

        int easyCount = (int) Math.round(totalQuestions * 0.30);
        int hardCount = (int) Math.round(totalQuestions * 0.20);
        int mediumCount = totalQuestions - easyCount - hardCount;

        List<String> difficultyPool = new ArrayList<>();
        for (int i = 0; i < easyCount; i++) difficultyPool.add("EASY");
        for (int i = 0; i < mediumCount; i++) difficultyPool.add("MEDIUM");
        for (int i = 0; i < hardCount; i++) difficultyPool.add("HARD");

        List<String> chapters = new ArrayList<>();
        if (request.getSyllabus() != null && !request.getSyllabus().trim().isEmpty()) {
            for (String part : request.getSyllabus().split(",")) {
                if (!part.trim().isEmpty()) chapters.add(part.trim());
            }
        }
        if (chapters.isEmpty()) chapters.add("General Curriculum");

        List<String> bloomLevels = Arrays.asList("Remembering", "Understanding", "Applying", "Analyzing", "Evaluating");

        for (int i = 0; i < totalQuestions; i++) {
            slots.get(i).setTargetDifficulty(difficultyPool.get(i));
            slots.get(i).setTargetChapter(chapters.get(i % chapters.size()));
            slots.get(i).setBloomLevel(bloomLevels.get(i % bloomLevels.size()));
        }
        return slots;
    }

    private void logAgent(ExamRequest request, String agentType, AgentExecutionLog.Status status, Long timeMs, String message) {
        AgentExecutionLog log = AgentExecutionLog.builder()
                .examRequest(request)
                .agentType(agentType)
                .status(status)
                .executionTimeMs(timeMs)
                .logOutput(String.format("[%s] [%s] %s", LocalDateTime.now(), status, message))
                .build();
        executionLogRepository.save(log);
    }

    private boolean isQuantitativeSubject(String subject) {
        if (subject == null) return false;
        String lower = subject.toLowerCase();
        return lower.contains("math") || lower.contains("science") || lower.contains("physic") || lower.contains("chemist") || lower.contains("calculus") || lower.contains("algebra") || lower.contains("computer");
    }
}
