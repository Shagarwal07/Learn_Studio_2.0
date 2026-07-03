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
        
        if (currentTotal != totalMarks) {
            throw new IllegalStateException(String.format("Paper validation failed. Expected: %d, Generated: %d", totalMarks, currentTotal));
        }

        // 3. Save questions to database
        List<GeneratedQuestionDTO> listA = new ArrayList<>();
        List<GeneratedQuestionDTO> listB = new ArrayList<>();
        List<GeneratedQuestionDTO> listC = new ArrayList<>();
        
        for (GeneratedQuestionDTO dto : filtered) {
            String sec = dto.getSection();
            if (sec == null || sec.trim().isEmpty()) {
                throw new IllegalStateException("Validation error: Question has no section assigned.");
            }
            if ("SECTION_A".equalsIgnoreCase(sec)) {
                listA.add(dto);
            } else if ("SECTION_B".equalsIgnoreCase(sec)) {
                listB.add(dto);
            } else if ("SECTION_C".equalsIgnoreCase(sec)) {
                listC.add(dto);
            } else {
                throw new IllegalStateException("Validation error: Invalid section name assigned: " + sec);
            }
        }
        
        int sumA = listA.stream().mapToInt(GeneratedQuestionDTO::getMarks).sum();
        int sumB = listB.stream().mapToInt(GeneratedQuestionDTO::getMarks).sum();
        int sumC = listC.stream().mapToInt(GeneratedQuestionDTO::getMarks).sum();
        
        int calculatedTotal = sumA + sumB + sumC;
        if (calculatedTotal != totalMarks) {
            throw new IllegalStateException(String.format("Paper validation failed. Expected total: %d, Generated: %d", totalMarks, calculatedTotal));
        }
        
        int targetA = Math.round(totalMarks * 0.20f);
        int targetB = Math.round(totalMarks * 0.30f);
        int targetC = totalMarks - targetA - targetB;
        
        if (sumA != targetA) {
            throw new IllegalStateException(String.format("Section A validation failed. Expected target: %d, Generated total: %d", targetA, sumA));
        }
        if (sumB != targetB) {
            throw new IllegalStateException(String.format("Section B validation failed. Expected target: %d, Generated total: %d", targetB, sumB));
        }
        if (sumC != targetC) {
            throw new IllegalStateException(String.format("Section C validation failed. Expected target: %d, Generated total: %d", targetC, sumC));
        }
        
        for (int i = 0; i < listA.size(); i++) {
            listA.get(i).setQuestionOrder(i + 1);
        }
        for (int i = 0; i < listB.size(); i++) {
            listB.get(i).setQuestionOrder(i + 1);
        }
        for (int i = 0; i < listC.size(); i++) {
            listC.get(i).setQuestionOrder(i + 1);
        }
        
        List<GeneratedQuestionDTO> sortedFiltered = new ArrayList<>();
        sortedFiltered.addAll(listA);
        sortedFiltered.addAll(listB);
        sortedFiltered.addAll(listC);

        List<GeneratedQuestion> savedQuestions = sortedFiltered.stream()
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
                            .chapter(dto.getChapter())
                            .topic(dto.getTopic())
                            .learningOutcome(dto.getLearningOutcome())
                            .section(dto.getSection())
                            .questionOrder(dto.getQuestionOrder())
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
                .status(GeneratedPaper.Status.DRAFT)
                .version(1)
                .duration(100)
                .testType("Parakh Test Series")
                .chapters(request.getSyllabus())
                .topics("")
                .build();

        return paperRepository.save(paper);
    }

    public GeneratedPaperDTO toDTO(GeneratedPaper paper) {
        if (paper == null) return null;
        
        List<GeneratedQuestionDTO> questionDTOs = new ArrayList<>();
        List<GeneratedQuestion> questions = paper.getQuestions();
        
        int orderA = 1;
        int orderB = 1;
        int orderC = 1;

        for (GeneratedQuestion q : questions) {
            String section = q.getSection();
            Integer order = q.getQuestionOrder();
            
            if (section == null) {
                int marks = q.getMarks();
                if (marks <= 2) {
                    section = "SECTION_A";
                    order = orderA++;
                } else if (marks <= 5) {
                    section = "SECTION_B";
                    order = orderB++;
                } else {
                    section = "SECTION_C";
                    order = orderC++;
                }
            }
            
            questionDTOs.add(GeneratedQuestionDTO.builder()
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
                    .chapter(q.getChapter())
                    .topic(q.getTopic())
                    .learningOutcome(q.getLearningOutcome())
                    .section(section)
                    .questionOrder(order)
                    .version(q.getVersion())
                    .isApproved(q.getIsApproved())
                    .build());
        }

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
                .duration(paper.getDuration())
                .testType(paper.getTestType())
                .chapters(paper.getChapters())
                .topics(paper.getTopics())
                .course(paper.getExamRequest().getCourse())
                .subject(paper.getExamRequest().getSubject())
                .syllabus(paper.getExamRequest().getSyllabus())
                .build();
    }
}
