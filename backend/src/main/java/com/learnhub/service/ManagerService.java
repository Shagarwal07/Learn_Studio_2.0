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
        PaperBlueprint bp = new PaperBlueprint();
        int targetA, targetB, targetC;
        int countA, countB, countC;
        int marksA, marksB, marksC;

        switch (totalMarks) {
            case 10: targetA = 2; countA = 2; marksA = 1; targetB = 3; countB = 1; marksB = 3; targetC = 5; countC = 1; marksC = 5; break;
            case 15: targetA = 3; countA = 3; marksA = 1; targetB = 4; countB = 2; marksB = 2; targetC = 8; countC = 2; marksC = 4; break;
            case 20: targetA = 4; countA = 4; marksA = 1; targetB = 6; countB = 2; marksB = 3; targetC = 10; countC = 2; marksC = 5; break;
            case 25: targetA = 5; countA = 5; marksA = 1; targetB = 8; countB = 2; marksB = 4; targetC = 12; countC = 2; marksC = 6; break;
            case 30: targetA = 6; countA = 6; marksA = 1; targetB = 9; countB = 3; marksB = 3; targetC = 15; countC = 3; marksC = 5; break;
            case 40: targetA = 8; countA = 4; marksA = 2; targetB = 12; countB = 4; marksB = 3; targetC = 20; countC = 2; marksC = 10; break;
            case 50: targetA = 10; countA = 5; marksA = 2; targetB = 15; countB = 3; marksB = 5; targetC = 25; countC = 5; marksC = 5; break;
            case 60: targetA = 12; countA = 6; marksA = 2; targetB = 18; countB = 6; marksB = 3; targetC = 30; countC = 3; marksC = 10; break;
            case 70: targetA = 14; countA = 7; marksA = 2; targetB = 21; countB = 7; marksB = 3; targetC = 35; countC = 5; marksC = 7; break;
            case 75: targetA = 15; countA = 15; marksA = 1; targetB = 20; countB = 5; marksB = 4; targetC = 40; countC = 4; marksC = 10; break;
            case 80: targetA = 16; countA = 8; marksA = 2; targetB = 24; countB = 6; marksB = 4; targetC = 40; countC = 4; marksC = 10; break;
            case 100: targetA = 20; countA = 10; marksA = 2; targetB = 30; countB = 6; marksB = 5; targetC = 50; countC = 5; marksC = 10; break;
            default:
                if (totalMarks <= 6) {
                    targetA = totalMarks; countA = totalMarks; marksA = 1; targetB = 0; countB = 0; marksB = 0; targetC = 0; countC = 0; marksC = 0;
                    break;
                }
                targetA = Math.max(1, (int) Math.round(totalMarks * 0.20));
                targetB = Math.max(1, (int) Math.round(totalMarks * 0.30));
                targetC = Math.max(1, totalMarks - targetA - targetB);
                
                marksA = targetA >= 14 ? 2 : 1;
                countA = Math.max(1, targetA / marksA);
                targetA = countA * marksA;
                
                marksB = targetB >= 15 ? (targetB % 5 == 0 ? 5 : (targetB % 4 == 0 ? 4 : 3)) : 2;
                countB = Math.max(1, targetB / marksB);
                targetB = countB * marksB;
                
                targetC = Math.max(1, totalMarks - targetA - targetB);
                marksC = targetC >= 30 && targetC % 10 == 0 ? 10 : (targetC >= 15 && targetC % 5 == 0 ? 5 : (targetC % 4 == 0 ? 4 : (targetC % 3 == 0 ? 3 : (targetC % 2 == 0 ? 2 : targetC))));
                countC = Math.max(1, targetC / marksC);
                break;
        }

        SectionBlueprint sA = new SectionBlueprint();
        sA.sectionName = "SECTION_A"; sA.questionCount = countA; sA.marksPerQuestion = marksA; sA.targetMarks = targetA; bp.sectionA = sA;
        SectionBlueprint sB = new SectionBlueprint();
        sB.sectionName = "SECTION_B"; sB.questionCount = countB; sB.marksPerQuestion = marksB; sB.targetMarks = targetB; bp.sectionB = sB;
        SectionBlueprint sC = new SectionBlueprint();
        sC.sectionName = "SECTION_C"; sC.questionCount = countC; sC.marksPerQuestion = marksC; sC.targetMarks = targetC; bp.sectionC = sC;

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
                                    } else {
                                        q.setAgentType("AUDIT_WARNING");
                                        logAgent(request, "AUDITOR", AgentExecutionLog.Status.FAILED, 0L, "Audit warning: " + verifyResult.getRejectionReason());
                                    }
                                }
                            } catch (Exception processEx) {
                                logAgent(request, "PIPELINE", AgentExecutionLog.Status.FAILED, 0L, "Agent crash isolated: " + processEx.getMessage());
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
