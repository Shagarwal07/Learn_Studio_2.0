package com.learnhub.service;

import com.learnhub.dto.GeneratedPaperDTO;
import com.learnhub.dto.GeneratedQuestionDTO;
import com.learnhub.entity.ExamRequest;
import com.learnhub.entity.GeneratedPaper;
import com.learnhub.repository.GeneratedPaperRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
import java.util.stream.Collectors;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.annotation.PostConstruct;

@Service
@RequiredArgsConstructor
@Slf4j
public class EditorService {

    private final GeneratedPaperRepository paperRepository;
    private final FirestoreService firestoreService;

    @PersistenceContext
    private EntityManager entityManager;

    @PostConstruct
    @Transactional
    public void init() {
        try {
            entityManager.createNativeQuery("ALTER TABLE generated_papers DROP CONSTRAINT IF EXISTS generated_papers_status_check").executeUpdate();
            log.info("Dropped generated_papers_status_check constraint if it existed.");
        } catch (Exception e) {
            log.warn("Could not drop constraint on generated_papers: {}", e.getMessage());
        }
    }

    private static final List<Integer> ALLOWED_MARKS = Arrays.asList(1, 2, 3, 4, 5, 6, 8, 10, 12, 15);

    @Transactional
    public GeneratedPaper compileExamPaper(ExamRequest request, List<GeneratedQuestionDTO> allQuestions) {
        // 1. Sort questions dynamically into sections
        Map<String, List<GeneratedQuestionDTO>> sectionMap = new TreeMap<>();
        for (GeneratedQuestionDTO dto : allQuestions) {
            String sec = sanitizeSection(dto.getSection(), dto.getQuestionType());
            dto.setSection(sec);
            sectionMap.computeIfAbsent(sec, k -> new ArrayList<>()).add(dto);
        }

        // 2. Set question order within each section
        List<GeneratedQuestionDTO> sortedList = new ArrayList<>();
        long tempIdCounter = System.currentTimeMillis();
        for (List<GeneratedQuestionDTO> list : sectionMap.values()) {
            for (int i = 0; i < list.size(); i++) {
                list.get(i).setQuestionOrder(i + 1);
                if (list.get(i).getId() == null) {
                    list.get(i).setId(tempIdCounter++);
                }
            }
            sortedList.addAll(list);
        }

        // 3. Auto-deduplication on DTOs directly
        Set<String> seenTexts = new HashSet<>();
        List<GeneratedQuestionDTO> finalQuestions = new ArrayList<>();
        for (GeneratedQuestionDTO dto : sortedList) {
            String origText = dto.getQuestionText() != null ? dto.getQuestionText().trim() : "Question";
            String normText = origText.toLowerCase().replaceAll("[^a-zA-Z0-9]+", "");
            int varCount = 2;
            while (seenTexts.contains(normText)) {
                normText = origText.toLowerCase().replaceAll("[^a-zA-Z0-9]+", "") + varCount;
                varCount++;
            }
            seenTexts.add(normText);
            dto.setQuestionText(origText);
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
            
            // Fix Firestore serialization bug by explicitly converting POJOs to Maps using Jackson
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            java.util.List<Map<String, Object>> questionsMapList = mapper.convertValue(
                finalQuestions, 
                new com.fasterxml.jackson.core.type.TypeReference<java.util.List<Map<String, Object>>>() {}
            );
            firestorePayload.put("questions", questionsMapList);
            
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
        if (qs != null) {
            for (GeneratedQuestionDTO q : qs) {
                q.setSection(sanitizeSection(q.getSection(), q.getQuestionType()));
            }
        }
        dto.setQuestions(qs);
        
        if (paper.getExamRequest() != null) {
            dto.setSubject(paper.getExamRequest().getSubject());
            dto.setCourse(paper.getExamRequest().getCourse());
        }
        return dto;
    }

    private String sanitizeSection(String sec, String qType) {
        if (sec == null || sec.isBlank()) return "SECTION_A";
        
        boolean hasWordBank = sec.contains("(") && sec.contains(")");
        int maxLength = hasWordBank ? 100 : 35;
        int maxWords = hasWordBank ? 15 : 6;
        
        // If the section looks like a hallucinated question text
        if (sec.length() > maxLength || sec.contains("?") || sec.split("\\s+").length > maxWords || sec.split("_").length > maxWords) {
            if ("MCQ".equalsIgnoreCase(qType) || "TRUE_FALSE".equalsIgnoreCase(qType) || "FILL_BLANK".equalsIgnoreCase(qType) || "FILL_IN_THE_BLANK".equalsIgnoreCase(qType)) {
                return "SECTION_OBJECTIVE_QUESTIONS";
            } else {
                return "SECTION_ANSWER_THE_FOLLOWING_QUESTIONS";
            }
        }
        
        sec = sec.toUpperCase().trim().replace(" ", "_");
        if (!sec.startsWith("SECTION_")) {
            sec = sec.startsWith("SEC_") ? sec.replace("SEC_", "SECTION_") : "SECTION_" + sec;
        }
        return sec;
    }
}
