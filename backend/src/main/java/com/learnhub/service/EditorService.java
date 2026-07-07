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

    private static final List<Integer> ALLOWED_MARKS = Arrays.asList(1, 2, 3, 4, 5, 6, 8, 10, 12, 15);

    @Transactional
    public GeneratedPaper compileExamPaper(ExamRequest request, List<GeneratedQuestionDTO> allQuestions) {
        // 1. Sort questions into sections
        List<GeneratedQuestionDTO> listA = new ArrayList<>();
        List<GeneratedQuestionDTO> listB = new ArrayList<>();
        List<GeneratedQuestionDTO> listC = new ArrayList<>();

        for (GeneratedQuestionDTO dto : allQuestions) {
            String sec = dto.getSection();
            if ("SECTION_B".equalsIgnoreCase(sec)) {
                listB.add(dto);
            } else if ("SECTION_C".equalsIgnoreCase(sec)) {
                listC.add(dto);
            } else {
                dto.setSection("SECTION_A");
                listA.add(dto);
            }
        }

        // 2. Set question order within each section
        for (int i = 0; i < listA.size(); i++) {
            listA.get(i).setQuestionOrder(i + 1);
        }
        for (int i = 0; i < listB.size(); i++) {
            listB.get(i).setQuestionOrder(i + 1);
        }
        for (int i = 0; i < listC.size(); i++) {
            listC.get(i).setQuestionOrder(i + 1);
        }

        List<GeneratedQuestionDTO> sortedList = new ArrayList<>();
        sortedList.addAll(listA);
        sortedList.addAll(listB);
        sortedList.addAll(listC);

        // 3. Save questions to database
        List<GeneratedQuestion> savedQuestions = sortedList.stream()
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
                            .qualityStatus(dto.getQualityStatus() != null ? dto.getQualityStatus() : "APPROVED")
                            .bloomLevel(dto.getBloomLevel())
                            .markingScheme(dto.getMarkingScheme())
                            .estimatedTimeMinutes(dto.getEstimatedTimeMinutes())
                            .version(1)
                            .isApproved(dto.getIsApproved() != null ? dto.getIsApproved() : true)
                            .build();
                    return questionRepository.save(q);
                })
                .collect(Collectors.toList());

        // 4. Create and save final paper
        GeneratedPaper paper = GeneratedPaper.builder()
                .examRequest(request)
                .title(String.format("Final Exam: %s (%s)", request.getCourse(), request.getSubject()))
                .totalMarks(request.getMarks())
                .questions(savedQuestions)
                .status(GeneratedPaper.Status.DRAFT)
                .version(1)
                .duration(request.getDuration() != null ? request.getDuration() : 100)
                .testType("Parakh Test Series")
                .chapters(request.getSyllabus())
                .topics("")
                .build();

        return paperRepository.save(paper);
    }

    public List<String> runValidation(GeneratedPaper paper) {
        List<String> errors = new ArrayList<>();

        if (paper == null) {
            errors.add("Paper does not exist.");
            return errors;
        }

        List<GeneratedQuestion> questions = paper.getQuestions();
        if (questions == null || questions.isEmpty()) {
            errors.add("Paper must contain at least one question.");
            return errors;
        }

        // 1. Deduplicate check (case-insensitive check for text)
        Set<String> uniqueTexts = new HashSet<>();
        for (GeneratedQuestion q : questions) {
            if (q.getQuestionText() != null) {
                String textLower = q.getQuestionText().toLowerCase().trim().replaceAll("[^a-zA-Z0-9]+", "");
                if (uniqueTexts.contains(textLower)) {
                    errors.add(String.format("Duplicate question text found: \"%s\"", q.getQuestionText()));
                }
                uniqueTexts.add(textLower);
            }
        }

        // 2. Validate section placement & allowed marks
        int actualTotal = 0;
        int actualA = 0;
        int actualB = 0;
        int actualC = 0;

        int orderA = 1;
        int orderB = 1;
        int orderC = 1;

        List<GeneratedQuestion> sortedQuestions = questions.stream()
                .sorted(Comparator.comparing(q -> q.getSection() != null ? q.getSection() : ""))
                .collect(Collectors.toList());

        for (GeneratedQuestion q : sortedQuestions) {
            if (q.getSection() == null || q.getSection().trim().isEmpty()) {
                errors.add(String.format("Question ID %d has no section assigned.", q.getId()));
                continue;
            }

            Integer m = q.getMarks();
            if (m == null || m <= 0) {
                errors.add(String.format("Question ID %d has invalid or missing marks.", q.getId()));
                continue;
            }

            if (!ALLOWED_MARKS.contains(m)) {
                errors.add(String.format("Question ID %d has invalid marks weight (%d). Allowed marks only: %s", 
                    q.getId(), m, ALLOWED_MARKS.toString()));
            }

            actualTotal += m;
            if ("SECTION_A".equalsIgnoreCase(q.getSection())) {
                actualA += m;
                if (q.getQuestionOrder() != null && q.getQuestionOrder() != orderA++) {
                    errors.add(String.format("Section A question ID %d has wrong numbering order %d (expected %d).", q.getId(), q.getQuestionOrder(), orderA - 1));
                }
            } else if ("SECTION_B".equalsIgnoreCase(q.getSection())) {
                actualB += m;
                if (q.getQuestionOrder() != null && q.getQuestionOrder() != orderB++) {
                    errors.add(String.format("Section B question ID %d has wrong numbering order %d (expected %d).", q.getId(), q.getQuestionOrder(), orderB - 1));
                }
            } else if ("SECTION_C".equalsIgnoreCase(q.getSection())) {
                actualC += m;
                if (q.getQuestionOrder() != null && q.getQuestionOrder() != orderC++) {
                    errors.add(String.format("Section C question ID %d has wrong numbering order %d (expected %d).", q.getId(), q.getQuestionOrder(), orderC - 1));
                }
            } else {
                errors.add(String.format("Question ID %d has invalid section code: '%s'.", q.getId(), q.getSection()));
            }

            // Empty fields validation
            if (q.getQuestionText() == null || q.getQuestionText().trim().isEmpty()) {
                errors.add(String.format("Question ID %d has empty or missing question text.", q.getId()));
                continue;
            }
            if (q.getDifficulty() == null || q.getDifficulty().trim().isEmpty()) {
                errors.add(String.format("Question ID %d is missing difficulty level.", q.getId()));
            }
            if (q.getBloomLevel() == null || q.getBloomLevel().trim().isEmpty()) {
                errors.add(String.format("Question ID %d is missing Bloom's Taxonomy level.", q.getId()));
            }
            if (q.getCorrectAnswer() == null || q.getCorrectAnswer().trim().isEmpty()) {
                errors.add(String.format("Question ID %d has missing correct answer.", q.getId()));
            }
            if (q.getChapter() == null || q.getChapter().trim().isEmpty()) {
                errors.add(String.format("Question ID %d is missing target chapter details.", q.getId()));
            }

            String text = q.getQuestionText().toLowerCase().trim();
            if (text.length() < 15) {
                errors.add(String.format("Question ID %d is too short (< 15 characters).", q.getId()));
            }
            String[] placeholders = {"placeholder", "lorem ipsum", "todo", "mock question", "insert question", "test question"};
            for (String p : placeholders) {
                if (text.contains(p)) {
                    errors.add(String.format("Question ID %d contains placeholder content: '%s'.", q.getId(), p));
                }
            }
        }

        // 3. Validate paper totals
        int expectedTotal = paper.getTotalMarks();
        if (actualTotal != expectedTotal) {
            errors.add(String.format("Paper marks mismatch: Expected sum is %d, but actual sum is %d.", expectedTotal, actualTotal));
        }

        // 4. Validate section totals against blueprint target totals
        try {
            ManagerService.PaperBlueprint blueprint = ManagerService.createBlueprint(expectedTotal, questions.size());
            if (actualA != blueprint.sectionA.targetMarks) {
                errors.add(String.format("Section A total mismatch: Expected target of %d marks, but has %d marks.", 
                    blueprint.sectionA.targetMarks, actualA));
            }
            if (actualB != blueprint.sectionB.targetMarks) {
                errors.add(String.format("Section B total mismatch: Expected target of %d marks, but has %d marks.", 
                    blueprint.sectionB.targetMarks, actualB));
            }
            if (actualC != blueprint.sectionC.targetMarks) {
                errors.add(String.format("Section C total mismatch: Expected target of %d marks, but has %d marks.", 
                    blueprint.sectionC.targetMarks, actualC));
            }
        } catch (Exception e) {
            errors.add("Deterministic section distribution failure: " + e.getMessage());
        }

        return errors;
    }

    public GeneratedPaperDTO toDTO(GeneratedPaper paper) {
        if (paper == null) return null;
        
        List<GeneratedQuestionDTO> questionDTOs = new ArrayList<>();
        List<GeneratedQuestion> questions = paper.getQuestions();
        
        for (GeneratedQuestion q : questions) {
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
                    .section(q.getSection())
                    .questionOrder(q.getQuestionOrder())
                    .qualityStatus(q.getQualityStatus())
                    .bloomLevel(q.getBloomLevel())
                    .markingScheme(q.getMarkingScheme())
                    .estimatedTimeMinutes(q.getEstimatedTimeMinutes())
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
