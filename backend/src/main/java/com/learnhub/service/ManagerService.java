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
        String difficulty = request.getDifficulty();

        int theoryCount, mathCount, bankCount;
        int theoryMarks, mathMarks, bankMarks;

        if (isQuantitative) {
            // Quantitative Subject Split: 40% Theory, 40% Math, 20% Question Bank
            theoryCount = Math.max(1, (int) (totalCount * 0.4));
            mathCount = Math.max(1, (int) (totalCount * 0.4));
            bankCount = Math.max(1, totalCount - theoryCount - mathCount);

            theoryMarks = Math.max(1, (int) (totalMarks * 0.4));
            mathMarks = Math.max(1, (int) (totalMarks * 0.4));
            bankMarks = Math.max(1, totalMarks - theoryMarks - mathMarks);
        } else {
            // Qualitative Subject Split: 70% Theory, 30% Question Bank, 0% Math
            theoryCount = Math.max(1, (int) (totalCount * 0.7));
            mathCount = 0;
            bankCount = Math.max(1, totalCount - theoryCount);

            theoryMarks = Math.max(1, (int) (totalMarks * 0.7));
            mathMarks = 0;
            bankMarks = Math.max(1, totalMarks - theoryMarks);
        }

        String logMsg = String.format("Tasks partitioned: Theory Agent (%d Qs, %d Marks), Mathematics Agent (%d Qs, %d Marks), Question Bank Agent (%d Qs, %d Marks)",
                theoryCount, theoryMarks, mathCount, mathMarks, bankCount, bankMarks);
        logAgent(request, "MANAGER", AgentExecutionLog.Status.RUNNING, 0L, logMsg);

        // 2. Parallel Agent Execution with CompletableFuture
        CompletableFuture<List<GeneratedQuestionDTO>> theoryFuture = CompletableFuture.supplyAsync(() -> 
            executeAgentWithRetry("THEORY", () -> 
                theoryService.generateQuestions(subject, request.getCourse(), request.getSyllabus(), theoryMarks, difficulty, request.getQuestionPattern(), theoryCount),
                request
            )
        );

        CompletableFuture<List<GeneratedQuestionDTO>> mathFuture = CompletableFuture.supplyAsync(() -> {
            if (mathCount > 0) {
                return executeAgentWithRetry("MATHEMATICS", () -> 
                    mathematicsService.generateQuestions(subject, request.getCourse(), request.getSyllabus(), mathMarks, difficulty, mathCount),
                    request
                );
            }
            return Collections.emptyList();
        });

        CompletableFuture<List<GeneratedQuestionDTO>> bankFuture = CompletableFuture.supplyAsync(() -> 
            executeAgentWithRetry("QUESTION_BANK", () -> 
                questionBankService.fetchQuestions(subject, difficulty, bankMarks, bankCount),
                request
            )
        );

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
