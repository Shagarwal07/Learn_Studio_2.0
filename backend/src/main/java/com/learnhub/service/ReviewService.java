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
                
                doc.put("questions", questions);
                firestoreService.savePaper(doc); // Or an update method
            }
            return found != null ? found : dto;
        } catch (Exception e) {
            throw new RuntimeException("Failed to update question in Firestore", e);
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
                doc.put("questions", dto.getQuestions());
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
