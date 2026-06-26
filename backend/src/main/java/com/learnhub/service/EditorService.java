package com.learnhub.service;

import com.learnhub.dto.GeneratedPaperDTO;
import com.learnhub.dto.GeneratedQuestionDTO;
import com.learnhub.entity.ExamRequest;
import com.learnhub.entity.GeneratedPaper;
import com.learnhub.entity.GeneratedQuestion;
import com.learnhub.repository.GeneratedPaperRepository;
import com.learnhub.repository.GeneratedQuestionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EditorService {

    private final GeneratedQuestionRepository questionRepository;
    private final GeneratedPaperRepository paperRepository;

    @Transactional
    public GeneratedPaper compileExamPaper(ExamRequest request, List<GeneratedQuestionDTO> allQuestions) {
        // 1. Deduplicate questions by text (case-insensitive)
        Map<String, GeneratedQuestionDTO> uniqueMap = new LinkedHashMap<>();
        for (GeneratedQuestionDTO q : allQuestions) {
            uniqueMap.put(q.getQuestionText().toLowerCase().trim(), q);
        }
        List<GeneratedQuestionDTO> filtered = new ArrayList<>(uniqueMap.values());

        // 2. Verify and enforce marks distribution
        int totalMarks = request.getMarks();
        int currentTotal = filtered.stream().mapToInt(GeneratedQuestionDTO::getMarks).sum();
        
        if (currentTotal != totalMarks && !filtered.isEmpty()) {
            System.out.println(String.format("Adjusting marks to match target: current=%d, target=%d", currentTotal, totalMarks));
            // Adjust the marks of the last question to make the sum exactly correct
            GeneratedQuestionDTO last = filtered.get(filtered.size() - 1);
            int adjustment = totalMarks - currentTotal;
            last.setMarks(Math.max(1, last.getMarks() + adjustment));
        }

        // 3. Save questions to database
        List<GeneratedQuestion> savedQuestions = filtered.stream()
                .map(dto -> {
                    GeneratedQuestion q = GeneratedQuestion.builder()
                            .questionText(dto.getQuestionText())
                            .options(dto.getOptions())
                            .correctAnswer(dto.getCorrectAnswer())
                            .solutionSteps(dto.getSolutionSteps())
                            .marks(dto.getMarks())
                            .difficulty(dto.getDifficulty())
                            .questionType(dto.getQuestionType())
                            .agentType(dto.getAgentType())
                            .subject(dto.getSubject())
                            .version(1)
                            .isApproved(true)
                            .build();
                    return questionRepository.save(q);
                })
                .collect(Collectors.toList());

        // 4. Create and compile final exam paper
        GeneratedPaper paper = GeneratedPaper.builder()
                .examRequest(request)
                .title(String.format("Final Exam: %s (%s)", request.getCourse(), request.getSubject()))
                .totalMarks(totalMarks)
                .questions(savedQuestions)
                .status(GeneratedPaper.Status.UNDER_REVIEW)
                .version(1)
                .build();

        return paperRepository.save(paper);
    }

    public GeneratedPaperDTO toDTO(GeneratedPaper paper) {
        if (paper == null) return null;
        List<GeneratedQuestionDTO> questionDTOs = paper.getQuestions().stream()
                .map(q -> GeneratedQuestionDTO.builder()
                        .id(q.getId())
                        .questionText(q.getQuestionText())
                        .options(q.getOptions())
                        .correctAnswer(q.getCorrectAnswer())
                        .solutionSteps(q.getSolutionSteps())
                        .marks(q.getMarks())
                        .difficulty(q.getDifficulty())
                        .questionType(q.getQuestionType())
                        .agentType(q.getAgentType())
                        .subject(q.getSubject())
                        .version(q.getVersion())
                        .isApproved(q.getIsApproved())
                        .build())
                .collect(Collectors.toList());

        return GeneratedPaperDTO.builder()
                .id(paper.getId())
                .examRequestId(paper.getExamRequest().getId())
                .title(paper.getTitle())
                .totalMarks(paper.getTotalMarks())
                .questions(questionDTOs)
                .status(paper.getStatus().name())
                .version(paper.getVersion())
                .fileUrl(paper.getFileUrl())
                .createdAt(paper.getCreatedAt())
                .build();
    }
}
