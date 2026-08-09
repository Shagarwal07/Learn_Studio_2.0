package com.learnhub.service;

import com.learnhub.dto.GeneratedPaperDTO;
import com.learnhub.dto.GeneratedQuestionDTO;
import com.learnhub.entity.ExamRequest;
import com.learnhub.entity.GeneratedPaper;
import com.learnhub.repository.GeneratedPaperRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EditorService {

    private final GeneratedPaperRepository paperRepository;
    private final FirestoreService firestoreService;

    private static final List<Integer> ALLOWED_MARKS = Arrays.asList(1, 2, 3, 4, 5, 6, 8, 10, 12, 15);

    @Transactional
    public GeneratedPaper compileExamPaper(ExamRequest request, List<GeneratedQuestionDTO> allQuestions) {
        // 1. Sort questions dynamically into sections
        Map<String, List<GeneratedQuestionDTO>> sectionMap = new TreeMap<>();
        for (GeneratedQuestionDTO dto : allQuestions) {
            String sec = dto.getSection();
            if (sec == null || sec.isBlank()) {
                sec = "SECTION_A";
                dto.setSection(sec);
            } else {
                sec = sec.toUpperCase().trim().replace(" ", "_");
                if (!sec.startsWith("SECTION_")) {
                    sec = sec.startsWith("SEC_") ? sec.replace("SEC_", "SECTION_") : "SECTION_" + sec;
                }
                dto.setSection(sec);
            }
            sectionMap.computeIfAbsent(sec, k -> new ArrayList<>()).add(dto);
        }

        // 2. Set question order within each section
        List<GeneratedQuestionDTO> sortedList = new ArrayList<>();
        for (List<GeneratedQuestionDTO> list : sectionMap.values()) {
            for (int i = 0; i < list.size(); i++) {
                list.get(i).setQuestionOrder(i + 1);
            }
            sortedList.addAll(list);
        }

        // 3. Auto-deduplication on DTOs directly
        Set<String> seenTexts = new HashSet<>();
        List<GeneratedQuestionDTO> finalQuestions = new ArrayList<>();
        for (GeneratedQuestionDTO dto : sortedList) {
            String origText = dto.getQuestionText() != null ? dto.getQuestionText().trim() : "Question";
            String normText = origText.toLowerCase().replaceAll("[^a-zA-Z0-9]+", "");
            String finalText = origText;
            int varCount = 2;
            while (seenTexts.contains(normText)) {
                finalText = origText + " (Variation " + varCount + ")";
                normText = finalText.toLowerCase().replaceAll("[^a-zA-Z0-9]+", "");
                varCount++;
            }
            seenTexts.add(normText);
            dto.setQuestionText(finalText);
            finalQuestions.add(dto);
        }

        // 4. Save to Firestore
        int actualMarksSum = finalQuestions.stream().mapToInt(q -> q.getMarks() != null ? q.getMarks() : 0).sum();
        int finalTotalMarks = (actualMarksSum > 0) ? actualMarksSum : (request.getMarks() != null ? request.getMarks() : 50);
        if (request.getMarks() == null || request.getMarks() != finalTotalMarks) {
            request.setMarks(finalTotalMarks);
        }

        String firestoreId;
        try {
            Map<String, Object> firestorePayload = new HashMap<>();
            firestorePayload.put("title", String.format("Final Exam: %s (%s)", request.getCourse(), request.getSubject()));
            firestorePayload.put("totalMarks", finalTotalMarks);
            firestorePayload.put("questions", finalQuestions);
            firestoreId = firestoreService.savePaper(firestorePayload);
        } catch (Exception e) {
            throw new RuntimeException("Failed to save paper to Firestore", e);
        }

        // 5. Create and save lightweight NeonDB Paper
        GeneratedPaper paper = GeneratedPaper.builder()
                .examRequest(request)
                .title(String.format("Final Exam: %s (%s)", request.getCourse(), request.getSubject()))
                .totalMarks(finalTotalMarks)
                .firestoreDocumentId(firestoreId)
                .status(GeneratedPaper.Status.DRAFT)
                .version(1)
                .build();

        return paperRepository.save(paper);
    }

    public List<String> runValidation(GeneratedPaper paper, List<GeneratedQuestionDTO> questions) {
        List<String> errors = new ArrayList<>();
        if (paper == null || questions == null || questions.isEmpty()) {
            errors.add("Paper does not exist or contains zero questions.");
            return errors;
        }

        boolean isAiGenerated = questions.stream().anyMatch(q -> 
            "VERTEX_AI".equalsIgnoreCase(q.getAgentType()) || 
            "UNIFIED_GENERATOR".equalsIgnoreCase(q.getAgentType()) || 
            "MOCK".equalsIgnoreCase(q.getAgentType()));

        Set<String> uniqueTexts = new HashSet<>();
        for (GeneratedQuestionDTO q : questions) {
            if (q.getQuestionText() != null) {
                String textLower = q.getQuestionText().toLowerCase().trim().replaceAll("[^a-zA-Z0-9]+", "");
                if (uniqueTexts.contains(textLower)) {
                    errors.add(String.format("Duplicate question text found: \"%s\"", q.getQuestionText()));
                }
                uniqueTexts.add(textLower);
            }
        }
        return errors;
    }

    public List<GeneratedQuestionDTO> fetchQuestionsForClient(GeneratedPaper paper) {
        try {
            Map<String, Object> doc = firestoreService.getPaper(paper.getFirestoreDocumentId());
            if (doc != null && doc.containsKey("questions")) {
                // In a real app, use ObjectMapper to safely convert the nested list back to DTOs
                return (List<GeneratedQuestionDTO>) doc.get("questions");
            }
        } catch (Exception e) {
            // log error
        }
        return new ArrayList<>();
    }
    
    public GeneratedPaperDTO toDTO(GeneratedPaper paper) {
        GeneratedPaperDTO dto = GeneratedPaperDTO.builder()
                .id(paper.getId())
                .title(paper.getTitle())
                .totalMarks(paper.getTotalMarks())
                .status(paper.getStatus().name())
                .version(paper.getVersion())
                .firestoreDocumentId(paper.getFirestoreDocumentId())
                .build();
        
        List<GeneratedQuestionDTO> qs = firestoreService.getQuestionsForPaper(paper.getFirestoreDocumentId());
        dto.setQuestions(qs);
        
        if (paper.getExamRequest() != null) {
            dto.setSubject(paper.getExamRequest().getSubject());
            dto.setCourse(paper.getExamRequest().getCourse());
        }
        return dto;
    }
}
