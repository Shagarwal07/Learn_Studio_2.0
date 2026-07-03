package com.learnhub.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.learnhub.dto.GeneratedPaperDTO;
import com.learnhub.dto.GeneratedQuestionDTO;
import com.learnhub.dto.ReviewRequestDTO;
import com.learnhub.entity.*;
import com.learnhub.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final GeneratedPaperRepository paperRepository;
    private final GeneratedQuestionRepository questionRepository;
    private final ReviewHistoryRepository reviewHistoryRepository;
    private final PaperVersionRepository paperVersionRepository;
    private final UserRepository userRepository;
    private final ExamRequestRepository examRequestRepository;
    private final TheoryService theoryService;
    private final MathematicsService mathematicsService;
    private final QuestionBankService questionBankService;
    private final ObjectMapper objectMapper;

    @Transactional
    public GeneratedPaperDTO submitReview(String email, Long paperId, ReviewRequestDTO dto) {
        User reviewer = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Reviewer not found"));

        GeneratedPaper paper = paperRepository.findById(paperId)
                .orElseThrow(() -> new RuntimeException("Paper not found"));

        ReviewHistory.Action action = ReviewHistory.Action.valueOf(dto.getAction());

        // 1. Save Review History
        ReviewHistory history = ReviewHistory.builder()
                .generatedPaper(paper)
                .action(action)
                .comments(dto.getComments())
                .reviewedBy(reviewer)
                .build();
        reviewHistoryRepository.save(history);

        // 2. Handle Action
        if (action == ReviewHistory.Action.APPROVE) {
            paper.setStatus(GeneratedPaper.Status.APPROVED);
        } else if (action == ReviewHistory.Action.REQUEST_REGENERATION || action == ReviewHistory.Action.REJECT) {
            paper.setStatus(GeneratedPaper.Status.REVISION_NEEDED);
            
            // Trigger Feedback Loop if specific questions are marked for rejection
            if (dto.getRejectedQuestionIds() != null && !dto.getRejectedQuestionIds().isEmpty()) {
                executeFeedbackLoop(paper, dto.getRejectedQuestionIds(), reviewer, dto.getComments());
            }
        }

        GeneratedPaper saved = paperRepository.save(paper);
        return toDTO(saved);
    }

    @Transactional
    public GeneratedQuestionDTO updateQuestion(Long paperId, Long questionId, GeneratedQuestionDTO dto) {
        GeneratedPaper paper = paperRepository.findById(paperId)
                .orElseThrow(() -> new RuntimeException("Paper not found"));

        GeneratedQuestion question = questionRepository.findById(questionId)
                .orElseThrow(() -> new RuntimeException("Question not found"));

        // Save a version snapshot BEFORE making direct edits (if this is the first edit for this version)
        saveVersionSnapshot(paper, null, "Direct inline question edit by professor");

        question.setQuestionText(dto.getQuestionText());
        question.setOptions(dto.getOptions());
        question.setCorrectAnswer(dto.getCorrectAnswer());
        question.setSolutionSteps(dto.getSolutionSteps());
        question.setMarks(dto.getMarks());
        question.setDifficulty(dto.getDifficulty());
        question.setQuestionType(dto.getQuestionType());
        question.setVersion(question.getVersion() + 1);

        GeneratedQuestion saved = questionRepository.save(question);
        return toQuestionDTO(saved);
    }

    @Transactional
    public GeneratedPaperDTO updatePaper(Long paperId, GeneratedPaperDTO dto, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        GeneratedPaper paper = paperRepository.findById(paperId)
                .orElseThrow(() -> new RuntimeException("Paper not found"));

        // Save a version snapshot of the current paper before updating
        saveVersionSnapshot(paper, user, "Draft edit by teacher");

        // Update paper metadata
        paper.setTitle(dto.getTitle());
        paper.setTotalMarks(dto.getTotalMarks());
        if (dto.getStatus() != null) {
            paper.setStatus(GeneratedPaper.Status.valueOf(dto.getStatus()));
        }

        // Update custom metadata fields
        paper.setDuration(dto.getDuration());
        paper.setTestType(dto.getTestType());
        paper.setChapters(dto.getChapters());
        paper.setTopics(dto.getTopics());

        // Update the associated ExamRequest metadata as well
        ExamRequest request = paper.getExamRequest();
        if (request != null) {
            if (dto.getSubject() != null) {
                request.setSubject(dto.getSubject());
            }
            if (dto.getCourse() != null) {
                request.setCourse(dto.getCourse());
            }
            if (dto.getSyllabus() != null) {
                request.setSyllabus(dto.getSyllabus());
            }
            if (dto.getTotalMarks() != null) {
                request.setMarks(dto.getTotalMarks());
            }
            examRequestRepository.save(request);
        }

        // Sync/Update questions
        List<GeneratedQuestion> updatedQuestions = new ArrayList<>();
        if (dto.getQuestions() != null) {
            for (GeneratedQuestionDTO qDto : dto.getQuestions()) {
                GeneratedQuestion question;
                if (qDto.getId() != null && qDto.getId() > 0) {
                    question = questionRepository.findById(qDto.getId())
                            .orElse(new GeneratedQuestion());
                } else {
                    question = new GeneratedQuestion();
                }
                
                question.setQuestionText(qDto.getQuestionText());
                question.setOptions(qDto.getOptions());
                question.setCorrectAnswer(qDto.getCorrectAnswer());
                question.setSolutionSteps(qDto.getSolutionSteps());
                question.setMarks(qDto.getMarks());
                question.setDifficulty(qDto.getDifficulty() != null ? qDto.getDifficulty() : "MEDIUM");
                question.setQuestionType(qDto.getQuestionType() != null ? qDto.getQuestionType() : "SHORT");
                question.setAgentType(qDto.getAgentType() != null ? qDto.getAgentType() : "THEORY");
                question.setSubject(dto.getSubject() != null ? dto.getSubject() : (request != null ? request.getSubject() : "Mathematics"));
                question.setChapter(qDto.getChapter());
                question.setTopic(qDto.getTopic());
                question.setLearningOutcome(qDto.getLearningOutcome());
                question.setSection(qDto.getSection());
                question.setQuestionOrder(qDto.getQuestionOrder());
                
                if (question.getId() == null) {
                    question.setVersion(1);
                } else {
                    question.setVersion(question.getVersion() + 1);
                }
                
                GeneratedQuestion savedQ = questionRepository.save(question);
                updatedQuestions.add(savedQ);
            }
        }
        
        paper.setQuestions(updatedQuestions);
        paper.setVersion(paper.getVersion() + 1);
        GeneratedPaper savedPaper = paperRepository.save(paper);

        // Save a version snapshot AFTER updating
        saveVersionSnapshot(savedPaper, user, "Saved draft update: " + dto.getTitle());

        return toDTO(savedPaper);
    }

    @Transactional
    public GeneratedPaperDTO regenerateSingleQuestion(Long paperId, Long questionId, String email) {
        User reviewer = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        GeneratedPaper paper = paperRepository.findById(paperId)
                .orElseThrow(() -> new RuntimeException("Paper not found"));

        // Trigger feedback loop for just one question
        executeFeedbackLoop(paper, List.of(questionId), reviewer, "Single question regeneration requested.");

        GeneratedPaper saved = paperRepository.save(paper);
        return toDTO(saved);
    }

    private void executeFeedbackLoop(GeneratedPaper paper, List<Long> rejectedIds, User reviewer, String comments) {
        // Save version snapshot of the current paper before modifying it
        saveVersionSnapshot(paper, reviewer, "Snapshot before executing feedback loop revision");

        List<GeneratedQuestion> currentQuestions = new ArrayList<>(paper.getQuestions());
        List<GeneratedQuestion> updatedQuestions = new ArrayList<>();

        ExamRequest request = paper.getExamRequest();

        for (GeneratedQuestion q : currentQuestions) {
            if (rejectedIds.contains(q.getId())) {
                // This question was rejected! Identify responsible agent and regenerate it.
                System.out.println(String.format("Feedback Loop: Regenerating rejected question ID %d (Agent: %s)", q.getId(), q.getAgentType()));
                
                List<GeneratedQuestionDTO> regenerated = null;
                String agentType = q.getAgentType();
                
                if ("THEORY".equalsIgnoreCase(agentType)) {
                    regenerated = theoryService.generateQuestions(
                            q.getSubject(), request.getCourse(), request.getSyllabus(), List.of(q.getMarks()), List.of(q.getSection() != null ? q.getSection() : "SECTION_A"), q.getDifficulty(), request.getQuestionPattern()
                    );
                } else if ("MATHEMATICS".equalsIgnoreCase(agentType)) {
                    regenerated = mathematicsService.generateQuestions(
                            q.getSubject(), request.getCourse(), request.getSyllabus(), List.of(q.getMarks()), List.of(q.getSection() != null ? q.getSection() : "SECTION_A"), q.getDifficulty()
                    );
                } else { // QUESTION_BANK
                    regenerated = questionBankService.fetchQuestions(
                            q.getSubject(), request.getCourse(), request.getSyllabus(), q.getDifficulty(), List.of(q.getMarks()), List.of(q.getSection() != null ? q.getSection() : "SECTION_A")
                    );
                }

                if (regenerated != null && !regenerated.isEmpty()) {
                    GeneratedQuestionDTO newDto = regenerated.get(0);
                    GeneratedQuestion newQ = GeneratedQuestion.builder()
                            .questionText(newDto.getQuestionText())
                            .options(newDto.getOptions())
                            .correctAnswer(newDto.getCorrectAnswer())
                            .solutionSteps(newDto.getSolutionSteps())
                            .marks(q.getMarks())
                            .difficulty(newDto.getDifficulty())
                            .questionType(newDto.getQuestionType())
                            .agentType(agentType)
                            .subject(q.getSubject())
                            .section(q.getSection())
                            .questionOrder(q.getQuestionOrder())
                            .version(1)
                            .isApproved(true)
                            .build();
                    updatedQuestions.add(questionRepository.save(newQ));
                } else {
                    // Fallback to preserve the question if regeneration fails
                    updatedQuestions.add(q);
                }
            } else {
                // Keep unaffected questions completely intact
                updatedQuestions.add(q);
            }
        }

        paper.setQuestions(updatedQuestions);
        paper.setVersion(paper.getVersion() + 1);
        paperRepository.save(paper);

        // Save a snapshot of the new version
        saveVersionSnapshot(paper, reviewer, "Snapshot after feedback loop revision: " + comments);
    }

    private void saveVersionSnapshot(GeneratedPaper paper, User user, String reason) {
        try {
            List<GeneratedQuestionDTO> dtos = paper.getQuestions().stream()
                    .map(this::toQuestionDTO)
                    .collect(Collectors.toList());

            String questionsJson = objectMapper.writeValueAsString(dtos);

            // Check if this exact version snapshot already exists to avoid duplicate snaps
            List<PaperVersion> existing = paperVersionRepository.findByGeneratedPaperIdOrderByVersionDesc(paper.getId());
            if (!existing.isEmpty() && existing.get(0).getVersion().equals(paper.getVersion())) {
                // Just update the reason/timestamp or do nothing
                return;
            }

            PaperVersion version = PaperVersion.builder()
                    .generatedPaper(paper)
                    .version(paper.getVersion())
                    .questionsJson(questionsJson)
                    .changeReason(reason)
                    .changedBy(user)
                    .build();
            paperVersionRepository.save(version);
        } catch (Exception e) {
            System.err.println("Failed to save paper version snapshot: " + e.getMessage());
        }
    }

    public List<PaperVersion> getVersionHistory(Long paperId) {
        return paperVersionRepository.findByGeneratedPaperIdOrderByVersionDesc(paperId);
    }

    private GeneratedQuestionDTO toQuestionDTO(GeneratedQuestion q) {
        return GeneratedQuestionDTO.builder()
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
                .chapter(q.getChapter())
                .topic(q.getTopic())
                .learningOutcome(q.getLearningOutcome())
                .section(q.getSection())
                .questionOrder(q.getQuestionOrder())
                .build();
    }

    private GeneratedPaperDTO toDTO(GeneratedPaper paper) {
        List<GeneratedQuestionDTO> questionDTOs = paper.getQuestions().stream()
                .map(this::toQuestionDTO)
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
