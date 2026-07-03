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
import java.util.Collections;
import java.util.List;
import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
public class ManagerService {

    private final ExamRequestRepository examRequestRepository;
    private final TheoryService theoryService;
    private final MathematicsService mathematicsService;
    private final QuestionBankService questionBankService;
    private final EditorService editorService;
    private final AgentExecutionLogRepository executionLogRepository;

    public GeneratedPaper generateExamPaper(ExamRequest request) {
        request.setStatus(ExamRequest.Status.RUNNING);
        examRequestRepository.save(request);

        long startPipeline = System.currentTimeMillis();
        logAgent(request, "MANAGER", AgentExecutionLog.Status.RUNNING, 0L, "Manager Agent started. Partitioning tasks...");

        // 1. Task partitioning based on subject and parameters
        String subject = request.getSubject();
        boolean isQuantitative = isQuantitativeSubject(subject);

        int totalCount = request.getTotalQuestions();
        int totalMarks = request.getMarks();
        String difficulty = request.getDifficulty();        int targetA = Math.round(totalMarks * 0.20f);
        int targetB = Math.round(totalMarks * 0.30f);
        int targetC = totalMarks - targetA - targetB;
        
        int countA = Math.max(1, (int)(totalCount * 0.40f));
        int countB = Math.max(1, (int)(totalCount * 0.40f));
        int countC = Math.max(1, totalCount - countA - countB);
        
        List<Integer> sectionAMarks = distributeMarks(targetA, countA);
        List<Integer> sectionBMarks = distributeMarks(targetB, countB);
        List<Integer> sectionCMarks = distributeMarks(targetC, countC);
        
        List<Integer> theoryWeights = new ArrayList<>();
        List<String> theorySections = new ArrayList<>();
        
        List<Integer> mathWeights = new ArrayList<>();
        List<String> mathSections = new ArrayList<>();
        
        List<Integer> bankWeights = new ArrayList<>();
        List<String> bankSections = new ArrayList<>();

        // Section A
        for (int i = 0; i < sectionAMarks.size(); i++) {
            int w = sectionAMarks.get(i);
            if (isQuantitative) {
                if (i % 3 == 0) {
                    theoryWeights.add(w);
                    theorySections.add("SECTION_A");
                } else if (i % 3 == 1) {
                    mathWeights.add(w);
                    mathSections.add("SECTION_A");
                } else {
                    bankWeights.add(w);
                    bankSections.add("SECTION_A");
                }
            } else {
                if (i % 2 == 0) {
                    theoryWeights.add(w);
                    theorySections.add("SECTION_A");
                } else {
                    bankWeights.add(w);
                    bankSections.add("SECTION_A");
                }
            }
        }

        // Section B
        for (int i = 0; i < sectionBMarks.size(); i++) {
            int w = sectionBMarks.get(i);
            if (isQuantitative) {
                if (i % 3 == 0) {
                    theoryWeights.add(w);
                    theorySections.add("SECTION_B");
                } else if (i % 3 == 1) {
                    mathWeights.add(w);
                    mathSections.add("SECTION_B");
                } else {
                    bankWeights.add(w);
                    bankSections.add("SECTION_B");
                }
            } else {
                if (i % 2 == 0) {
                    theoryWeights.add(w);
                    theorySections.add("SECTION_B");
                } else {
                    bankWeights.add(w);
                    bankSections.add("SECTION_B");
                }
            }
        }

        // Section C
        for (int i = 0; i < sectionCMarks.size(); i++) {
            int w = sectionCMarks.get(i);
            if (isQuantitative) {
                if (i % 3 == 0) {
                    theoryWeights.add(w);
                    theorySections.add("SECTION_C");
                } else if (i % 3 == 1) {
                    mathWeights.add(w);
                    mathSections.add("SECTION_C");
                } else {
                    bankWeights.add(w);
                    bankSections.add("SECTION_C");
                }
            } else {
                if (i % 2 == 0) {
                    theoryWeights.add(w);
                    theorySections.add("SECTION_C");
                } else {
                    bankWeights.add(w);
                    bankSections.add("SECTION_C");
                }
            }
        }

        String logMsg = String.format("Tasks partitioned deterministically by sections: Theory Agent (%s), Mathematics Agent (%s), Question Bank Agent (%s)",
                theoryWeights.toString(), mathWeights.toString(), bankWeights.toString());
        logAgent(request, "MANAGER", AgentExecutionLog.Status.RUNNING, 0L, logMsg);

        // 2. Parallel Agent Execution with CompletableFuture
        CompletableFuture<List<GeneratedQuestionDTO>> theoryFuture = CompletableFuture.supplyAsync(() -> 
            executeAgentWithRetry("THEORY", () -> 
                theoryService.generateQuestions(subject, request.getCourse(), request.getSyllabus(), theoryWeights, theorySections, difficulty, request.getQuestionPattern()),
                request
            )
        );

        CompletableFuture<List<GeneratedQuestionDTO>> mathFuture = CompletableFuture.supplyAsync(() -> {
            if (!mathWeights.isEmpty()) {
                return executeAgentWithRetry("MATHEMATICS", () -> 
                    mathematicsService.generateQuestions(subject, request.getCourse(), request.getSyllabus(), mathWeights, mathSections, difficulty),
                    request
                );
            }
            return Collections.emptyList();
        });

        CompletableFuture<List<GeneratedQuestionDTO>> bankFuture = CompletableFuture.supplyAsync(() -> {
            if (!bankWeights.isEmpty()) {
                return executeAgentWithRetry("QUESTION_BANK", () -> 
                    questionBankService.fetchQuestions(subject, request.getCourse(), request.getSyllabus(), difficulty, bankWeights, bankSections),
                    request
                );
            }
            return Collections.emptyList();
        });
        // Wait for all agents to complete
        CompletableFuture.allOf(theoryFuture, mathFuture, bankFuture).join();

        List<GeneratedQuestionDTO> theoryQuestions = theoryFuture.join();
        List<GeneratedQuestionDTO> mathQuestions = mathFuture.join();
        List<GeneratedQuestionDTO> bankQuestions = bankFuture.join();

        // 3. Editor compilation and aggregation
        long editorStart = System.currentTimeMillis();
        logAgent(request, "EDITOR", AgentExecutionLog.Status.RUNNING, 0L, "Editor Agent compiling and aggregation started...");

        List<GeneratedQuestionDTO> compiledList = new ArrayList<>();
        compiledList.addAll(theoryQuestions);
        compiledList.addAll(mathQuestions);
        compiledList.addAll(bankQuestions);

        GeneratedPaper paper = editorService.compileExamPaper(request, compiledList);
        long editorEnd = System.currentTimeMillis();
        logAgent(request, "EDITOR", AgentExecutionLog.Status.SUCCESS, (editorEnd - editorStart), "Editor Agent successfully compiled paper: " + paper.getTitle());

        request.setStatus(ExamRequest.Status.COMPLETED);
        examRequestRepository.save(request);

        long endPipeline = System.currentTimeMillis();
        logAgent(request, "MANAGER", AgentExecutionLog.Status.SUCCESS, (endPipeline - startPipeline), "Pipeline execution completed successfully.");

        return paper;
    }

    public static List<Integer> distributeMarks(int totalMarks, int totalQuestions) {
        int[] allowed = {15, 12, 10, 8, 6, 5, 4, 3, 2, 1};
        List<Integer> result = new ArrayList<>();
        
        int remainingMarks = totalMarks;
        int remainingQuestions = totalQuestions;
        
        for (int i = 0; i < totalQuestions; i++) {
            if (remainingQuestions <= 0) break;
            
            int targetWeight = remainingMarks / remainingQuestions;
            int chosenWeight = 1;
            
            for (int w : allowed) {
                if (w <= targetWeight && (remainingMarks - w) >= (remainingQuestions - 1)) {
                    chosenWeight = w;
                    break;
                }
            }
            
            result.add(chosenWeight);
            remainingMarks -= chosenWeight;
            remainingQuestions--;
        }
        
        // Distribute any remainder by scaling up to next valid allowed marks
        while (remainingMarks > 0) {
            boolean increased = false;
            for (int i = 0; i < result.size(); i++) {
                int curr = result.get(i);
                for (int w : allowed) {
                    if (w > curr && (w - curr) <= remainingMarks) {
                        result.set(i, w);
                        remainingMarks -= (w - curr);
                        increased = true;
                        break;
                    }
                }
                if (remainingMarks <= 0) break;
            }
            if (!increased) {
                throw new IllegalStateException(String.format("Unable to distribute %d marks deterministically among %d questions using allowed weights.", totalMarks, totalQuestions));
            }
        }
        
        // Strict verification checks
        int sum = 0;
        for (int m : result) {
            boolean isValid = false;
            for (int a : allowed) {
                if (m == a) {
                    isValid = true;
                    break;
                }
            }
            if (!isValid) {
                throw new IllegalStateException("Generated invalid question weight: " + m);
            }
            sum += m;
        }
        
        if (sum != totalMarks) {
            throw new IllegalStateException(String.format("Sum of question marks (%d) does not match target marks (%d).", sum, totalMarks));
        }
        
        Collections.sort(result);
        return result;
    }

    private List<GeneratedQuestionDTO> executeAgentWithRetry(String agentType, java.util.function.Supplier<List<GeneratedQuestionDTO>> agentCall, ExamRequest request) {
        long start = System.currentTimeMillis();
        logAgent(request, agentType, AgentExecutionLog.Status.RUNNING, 0L, agentType + " Agent execution started...");
        try {
            List<GeneratedQuestionDTO> questions = agentCall.get();
            long end = System.currentTimeMillis();
            logAgent(request, agentType, AgentExecutionLog.Status.SUCCESS, (end - start), String.format("%s Agent generated %d questions.", agentType, questions.size()));
            return questions;
        } catch (Exception e) {
            System.err.println(agentType + " Agent failed. Retrying once... Error: " + e.getMessage());
            logAgent(request, agentType, AgentExecutionLog.Status.RUNNING, 0L, "Warning: " + agentType + " Agent failed. Retrying once...");
            try {
                // Retry once
                List<GeneratedQuestionDTO> questions = agentCall.get();
                long end = System.currentTimeMillis();
                logAgent(request, agentType, AgentExecutionLog.Status.SUCCESS, (end - start), String.format("%s Agent generated %d questions on retry.", agentType, questions.size()));
                return questions;
            } catch (Exception ex) {
                long end = System.currentTimeMillis();
                logAgent(request, agentType, AgentExecutionLog.Status.FAILED, (end - start), String.format("%s Agent failed permanently. Error: %s", agentType, ex.getMessage()));
                // Return empty list to prevent pipeline crash
                return Collections.emptyList();
            }
        }
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
