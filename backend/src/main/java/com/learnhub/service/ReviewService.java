package com.learnhub.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.learnhub.dto.GeneratedPaperDTO;
import com.learnhub.dto.GeneratedQuestionDTO;
import com.learnhub.dto.ReviewRequestDTO;
import com.learnhub.entity.ExamRequest;
import com.learnhub.entity.GeneratedPaper;
import com.learnhub.entity.QuestionBank;
import com.learnhub.entity.User;
import com.learnhub.repository.ExamRequestRepository;
import com.learnhub.repository.GeneratedPaperRepository;
import com.learnhub.repository.QuestionBankRepository;
import com.learnhub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final GeneratedPaperRepository paperRepository;
    private final UserRepository userRepository;
    private final ExamRequestRepository examRequestRepository;
    private final QuestionBankRepository questionBankRepository;
    private final EditorService editorService;
    private final FirestoreService firestoreService;
    private final ObjectMapper objectMapper;
    private final QuestionGeneratorService questionGeneratorService;

    @Transactional
    public GeneratedPaperDTO submitReview(String email, Long paperId, ReviewRequestDTO dto) {
        User reviewer = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Reviewer not found"));

        GeneratedPaper paper = paperRepository.findById(paperId)
                .orElseThrow(() -> new RuntimeException("Paper not found"));

        String actionStr = dto.getAction();

        if ("APPROVE".equalsIgnoreCase(actionStr)) {
            List<GeneratedQuestionDTO> questions = firestoreService.getQuestionsForPaper(paper.getFirestoreDocumentId());
            List<String> validationErrors = editorService.runValidation(paper, questions);
            if (!validationErrors.isEmpty()) {
                throw new IllegalStateException("Paper approval blocked due to validation errors: " + String.join(", ", validationErrors));
            }

            paper.setStatus(GeneratedPaper.Status.APPROVED);

            for (GeneratedQuestionDTO q : questions) {
                QuestionBank qb = QuestionBank.builder()
                        .questionText(q.getQuestionText())
                        .options(q.getOptions())
                        .correctAnswer(q.getCorrectAnswer())
                        .marks(q.getMarks())
                        .difficulty(q.getDifficulty())
                        .questionType(q.getQuestionType())
                        .subject(q.getSubject())
                        .classLevel(paper.getExamRequest().getCourse())
                        .chapter(q.getChapter())
                        .topic(q.getTopic())
                        .solution(q.getSolutionSteps())
                        .sourceAgent(q.getAgentType())
                        .qualityStatus(q.getQualityStatus())
                        .build();
                questionBankRepository.save(qb);
            }
        } else if ("REQUEST_REGENERATION".equalsIgnoreCase(actionStr) || "REJECT".equalsIgnoreCase(actionStr)) {
            paper.setStatus(GeneratedPaper.Status.REVISION_NEEDED);
            // Feedback loop logic goes here if needed.
        }

        GeneratedPaper saved = paperRepository.save(paper);
        return toDTO(saved);
    }

    @Transactional
    public GeneratedQuestionDTO updateQuestion(Long paperId, Long questionId, GeneratedQuestionDTO dto) {
        GeneratedPaper paper = paperRepository.findById(paperId)
                .orElseThrow(() -> new RuntimeException("Paper not found"));

        try {
            Map<String, Object> doc = firestoreService.getPaper(paper.getFirestoreDocumentId());
            List<GeneratedQuestionDTO> questions = firestoreService.getQuestionsForPaper(paper.getFirestoreDocumentId());
            
            saveVersionSnapshot(paper, null, "Direct inline question edit");
            
            // Note: Since questionId was previously an SQL ID, we now use the DTO ID if it exists, or index
            GeneratedQuestionDTO found = null;
            for (GeneratedQuestionDTO q : questions) {
                if (q.getId() != null && q.getId().equals(questionId)) {
                    found = q;
                    break;
                }
            }
            if (found != null) {
                found.setQuestionText(dto.getQuestionText());
                found.setOptions(dto.getOptions());
                found.setCorrectAnswer(dto.getCorrectAnswer());
                found.setSolutionSteps(dto.getSolutionSteps());
                found.setMarks(dto.getMarks());
                found.setDifficulty(dto.getDifficulty() != null ? dto.getDifficulty() : found.getDifficulty());
                found.setQuestionType(dto.getQuestionType() != null ? dto.getQuestionType() : found.getQuestionType());
                found.setChapter(dto.getChapter());
                found.setTopic(dto.getTopic());
                found.setLearningOutcome(dto.getLearningOutcome());
                found.setSection(dto.getSection());
                found.setBloomLevel(dto.getBloomLevel());
                found.setMarkingScheme(dto.getMarkingScheme());
                found.setEstimatedTimeMinutes(dto.getEstimatedTimeMinutes());
                
                // Fix Firestore serialization bug by explicitly converting POJOs to Maps using Jackson
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                java.util.List<Map<String, Object>> questionsMapList = mapper.convertValue(
                    questions, 
                    new com.fasterxml.jackson.core.type.TypeReference<java.util.List<Map<String, Object>>>() {}
                );
                doc.put("questions", questionsMapList);
                firestoreService.savePaper(doc); // Or an update method
            }
            return found != null ? found : dto;
        } catch (Exception e) {
            throw new RuntimeException("Failed to update question in Firestore", e);
        }
    }
    @Transactional
    public GeneratedPaperDTO regenerateQuestion(Long paperId, Long questionId, String email) {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        GeneratedPaper paper = paperRepository.findById(paperId).orElseThrow(() -> new RuntimeException("Paper not found"));

        try {
            Map<String, Object> doc = firestoreService.getPaper(paper.getFirestoreDocumentId());
            List<GeneratedQuestionDTO> questions = firestoreService.getQuestionsForPaper(paper.getFirestoreDocumentId());

            saveVersionSnapshot(paper, user, "Regenerated single question");

            GeneratedQuestionDTO found = null;
            int foundIndex = -1;
            for (int i = 0; i < questions.size(); i++) {
                GeneratedQuestionDTO q = questions.get(i);
                // DTO ID is used to identify the question from the frontend
                if (q.getId() != null && q.getId().equals(questionId)) {
                    found = q;
                    foundIndex = i;
                    break;
                }
            }
            
            // Fallback to match by questionOrder if ID fails
            if (found == null) {
                for (int i = 0; i < questions.size(); i++) {
                    GeneratedQuestionDTO q = questions.get(i);
                    if (q.getQuestionOrder() != null && q.getQuestionOrder().longValue() == questionId.longValue()) {
                        found = q;
                        foundIndex = i;
                        break;
                    }
                }
            }

            if (found != null && foundIndex != -1) {
                ExamRequest req = paper.getExamRequest();
                QuestionGeneratorService.QuestionSlot slot = QuestionGeneratorService.QuestionSlot.builder()
                        .section(found.getSection())
                        .marks(found.getMarks() != null ? found.getMarks() : 1)
                        .questionType(found.getQuestionType())
                        .targetDifficulty(found.getDifficulty())
                        .targetChapter(found.getChapter())
                        .bloomLevel(found.getBloomLevel())
                        .slotIndex(foundIndex)
                        .build();

                GeneratedQuestionDTO regenerated = questionGeneratorService.generateSingleQuestion(
                        user.getId(),
                        req != null ? req.getSubject() : "General",
                        req != null ? req.getCourse() : "General",
                        req != null ? req.getSyllabus() : "",
                        slot,
                        "",
                        new ArrayList<>(),
                        "User manually requested regeneration."
                );

                // Preserve original ID and order
                regenerated.setId(found.getId());
                regenerated.setQuestionOrder(found.getQuestionOrder());
                
                questions.set(foundIndex, regenerated);

                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                java.util.List<Map<String, Object>> questionsMapList = mapper.convertValue(
                        questions,
                        new com.fasterxml.jackson.core.type.TypeReference<java.util.List<Map<String, Object>>>() {}
                );
                doc.put("questions", questionsMapList);
                firestoreService.savePaper(doc);
            }
            return toDTO(paper);
        } catch (Exception e) {
            throw new RuntimeException("Failed to regenerate question in Firestore", e);
        }
    }

    @Transactional
    public GeneratedPaperDTO updatePaper(Long paperId, GeneratedPaperDTO dto, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        GeneratedPaper paper = paperRepository.findById(paperId)
                .orElseThrow(() -> new RuntimeException("Paper not found"));

        saveVersionSnapshot(paper, user, "Draft edit by teacher");

        paper.setTitle(dto.getTitle());
        paper.setTotalMarks(dto.getTotalMarks());
        if (dto.getStatus() != null) {
            paper.setStatus(GeneratedPaper.Status.valueOf(dto.getStatus()));
        }

        ExamRequest request = paper.getExamRequest();
        if (request != null) {
            if (dto.getSubject() != null) request.setSubject(dto.getSubject());
            if (dto.getCourse() != null) request.setCourse(dto.getCourse());
            if (dto.getSyllabus() != null) request.setSyllabus(dto.getSyllabus());
            if (dto.getTotalMarks() != null) request.setMarks(dto.getTotalMarks());
            examRequestRepository.save(request);
        }

        try {
            Map<String, Object> doc = firestoreService.getPaper(paper.getFirestoreDocumentId());
            if (doc != null) {
                doc.put("title", dto.getTitle());
                doc.put("totalMarks", dto.getTotalMarks());
                // Fix Firestore serialization bug by explicitly converting POJOs to Maps using Jackson
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                java.util.List<Map<String, Object>> questionsMapList = mapper.convertValue(
                    dto.getQuestions(), 
                    new com.fasterxml.jackson.core.type.TypeReference<java.util.List<Map<String, Object>>>() {}
                );
                doc.put("questions", questionsMapList);
                firestoreService.savePaper(doc); // overwrites/updates the doc (need a proper update in real app)
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to sync paper to Firestore", e);
        }

        paperRepository.save(paper);
        return toDTO(paper);
    }

    private void saveVersionSnapshot(GeneratedPaper paper, User user, String changeDescription) {
        try {
            Map<String, Object> doc = firestoreService.getPaper(paper.getFirestoreDocumentId());
            if (doc != null) {
                doc.put("changeDescription", changeDescription);
                doc.put("timestamp", new Date());
                doc.put("userId", user != null ? user.getId() : null);
                firestoreService.savePaperVersion(paper.getFirestoreDocumentId(), doc);
            }
        } catch (Exception e) {
            // log error
        }
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
