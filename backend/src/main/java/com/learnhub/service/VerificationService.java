package com.learnhub.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.learnhub.dto.GeneratedQuestionDTO;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
public class VerificationService {

    private final AiService aiService;
    private final ObjectMapper objectMapper;

    private static final Set<String> ALLOWED_BLOOM_LEVELS = new HashSet<>(Arrays.asList(
        "Remembering", "Understanding", "Applying", "Analyzing", "Evaluating", "Creating"
    ));

    @Data
    public static class VerificationResult {
        private boolean isPassed;
        private boolean isCritical;
        private String rejectionReason;
        
        public VerificationResult() {}
        public VerificationResult(boolean isPassed, boolean isCritical, String rejectionReason) {
            this.isPassed = isPassed;
            this.isCritical = isCritical;
            this.rejectionReason = rejectionReason;
        }
    }

    public VerificationResult verifySolution(Long userId, GeneratedQuestionDTO question, String subject, String course, String syllabus, List<String> existingQuestionTexts) {
        
        // 1. Local Rule-Based Validation (from old AnalysisService)
        VerificationResult localCheck = runLocalRules(question, existingQuestionTexts);
        if (!localCheck.isPassed() && localCheck.isCritical()) {
            return localCheck;
        }

        // 2. AI Audit via Unified Prompt
        StringBuilder prompt = new StringBuilder();

        prompt.append("=== SYSTEM INSTRUCTIONS ===\n");
        prompt.append("You are an independent, extremely rigorous Senior Examiner and Auditor Agent.\n");
        prompt.append("Your EXCLUSIVE responsibility is to verify the mathematical/logical correctness of a provided Question and Solution, AND audit its quality for the syllabus.\n");
        prompt.append(String.format("Subject: %s | Class/Grade Level: %s\n", subject, course));
        prompt.append(String.format("Syllabus/Topics: %s\n\n", syllabus));

        prompt.append("=== THE QUESTION ===\n");
        prompt.append("Question Text:\n").append(question.getQuestionText()).append("\n\n");
        if (question.getOptions() != null && !question.getOptions().trim().isEmpty() && !question.getOptions().equals("null")) {
            prompt.append("Options Provided:\n").append(question.getOptions()).append("\n\n");
        }

        prompt.append("=== THE PROPOSED SOLUTION ===\n");
        prompt.append("Final Answer:\n").append(question.getFinalAnswer()).append("\n\n");
        prompt.append("Solution Steps:\n").append(question.getSolutionSteps()).append("\n\n");
        prompt.append("Calculations:\n").append(question.getCalculations()).append("\n\n");

        prompt.append("=== VERIFICATION RULES ===\n");
        prompt.append("1. Re-read the question and options carefully. Verify age-appropriateness.\n");
        prompt.append("2. Audit the 'Calculations' and 'Solution Steps' for any algebraic, arithmetic, or logical errors.\n");
        prompt.append("3. Verify that the 'Final Answer' matches the actual correct mathematical result.\n");
        prompt.append("4. If the question has 'Options Provided', verify that the Final Answer exactly matches one of the options. If not, REJECT.\n");
        prompt.append("5. If there is ANY mathematical error, discrepancy, placeholder text, or missing option, you MUST REJECT it.\n\n");

        prompt.append("=== OUTPUT FORMAT ===\n");
        prompt.append("Respond ONLY with a valid JSON object matching this exact schema. Do not add markdown blocks.\n");
        prompt.append("{\n");
        prompt.append("  \"isPassed\": true (or false),\n");
        prompt.append("  \"isCritical\": true (or false),\n");
        prompt.append("  \"rejectionReason\": \"If isPassed is false, provide a highly detailed mathematical explanation of exactly what is wrong so it can be fixed on retry. If true, leave empty.\"\n");
        prompt.append("}\n");

        try {
            int maxRetries = 3;
            for (int attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    String response = aiService.askWithFallback(userId, "AUTO_TA_VERIFICATION", prompt.toString(), "gemini").trim();
                    String cleaned = com.learnhub.util.AiJsonParser.extractJson(response);
                    ObjectMapper aiMapper = com.learnhub.util.AiJsonParser.getMapper();
                    Map<String, Object> map = aiMapper.readValue(cleaned, new com.fasterxml.jackson.core.type.TypeReference<Map<String, Object>>() {});
            
                    VerificationResult result = new VerificationResult();
                    if (map.get("isPassed") instanceof Boolean) {
                        result.setPassed((Boolean) map.get("isPassed"));
                    } else if (map.get("isPassed") instanceof String) {
                        result.setPassed(Boolean.parseBoolean((String) map.get("isPassed")));
                    }
                    if (map.get("isCritical") instanceof Boolean) {
                        result.setCritical((Boolean) map.get("isCritical"));
                    } else if (map.get("isCritical") instanceof String) {
                        result.setCritical(Boolean.parseBoolean((String) map.get("isCritical")));
                    }
                    result.setRejectionReason(safeExtractString(map.get("rejectionReason"), aiMapper));
                    
                    // Combine with local warnings
                    if (localCheck != null && !localCheck.isPassed()) {
                        result.setPassed(false);
                        result.setRejectionReason(localCheck.getRejectionReason() + " | AI: " + result.getRejectionReason());
                    }
                    
                    return result;
                } catch (Exception e) {
                    if (attempt == maxRetries) throw e;
                    System.err.println("⚠️ Verification Agent failed (Attempt " + attempt + "). Retrying... Error: " + e.getMessage());
                    try { Thread.sleep(2000); } catch (InterruptedException ie) { Thread.currentThread().interrupt(); }
                }
            }
        } catch (Exception e) {
            System.err.println("Verification Agent failed to parse response after retries: " + e.getMessage());
            return new VerificationResult(false, true, "Verification Agent encountered an error while auditing this question: " + e.getMessage());
        }
        return new VerificationResult(true, false, "Passed");
    }

    private VerificationResult runLocalRules(GeneratedQuestionDTO q, List<String> existingQuestionTexts) {
        String text = q.getQuestionText();
        
        if (text == null || text.trim().length() < 15) {
            return new VerificationResult(false, true, "CRITICAL: Question text is too short or empty.");
        }

        String textNorm = text.toLowerCase().trim().replaceAll("[^a-zA-Z0-9]+", "");
        for (String hist : existingQuestionTexts) {
            if (hist != null) {
                String histNorm = hist.toLowerCase().trim().replaceAll("[^a-zA-Z0-9]+", "");
                if (textNorm.equals(histNorm) || textNorm.contains(histNorm) || histNorm.contains(textNorm)) {
                    return new VerificationResult(false, true, "CRITICAL: Question duplicates an existing question on this paper.");
                }
            }
        }

        String lowerText = text.toLowerCase();
        String[] placeholders = { "placeholder", "lorem ipsum", "todo", "insert diagram" };
        for (String p : placeholders) {
            if (lowerText.contains(p)) {
                return new VerificationResult(false, true, "CRITICAL: Question text contains placeholder word: '" + p + "'.");
            }
        }
        
        if (q.getMarks() == null || q.getMarks() <= 0) return new VerificationResult(false, true, "CRITICAL: Invalid Marks.");
        if (q.getSection() == null || q.getSection().isEmpty()) return new VerificationResult(false, true, "CRITICAL: Missing Section.");
        if (q.getFinalAnswer() == null || q.getFinalAnswer().trim().isEmpty()) return new VerificationResult(false, true, "CRITICAL: Question must specify a final answer.");
        
        if ("MCQ".equalsIgnoreCase(q.getQuestionType())) {
            String opts = q.getOptions();
            if (opts == null || opts.trim().isEmpty()) {
                return new VerificationResult(false, true, "CRITICAL: MCQ question has empty options.");
            }
            try {
                Map<?, ?> parsed = objectMapper.readValue(opts, Map.class);
                if (parsed == null || parsed.size() < 2) {
                    return new VerificationResult(false, true, "CRITICAL: MCQ must have at least 2 options.");
                }
            } catch (Exception e) {
                return new VerificationResult(false, true, "CRITICAL: Options must be a valid JSON dictionary.");
            }
        }

        if (q.getDifficulty() == null || q.getDifficulty().isEmpty()) return new VerificationResult(false, false, "WARNING: Missing Difficulty.");
        if (q.getChapter() == null || q.getChapter().trim().isEmpty()) return new VerificationResult(false, false, "WARNING: Question missing chapter mapping.");
        
        String bloom = q.getBloomLevel();
        if (bloom == null || bloom.trim().isEmpty() || !ALLOWED_BLOOM_LEVELS.contains(bloom.trim())) {
            return new VerificationResult(false, false, "WARNING: Invalid or missing Bloom Level.");
        }

        return new VerificationResult(true, false, "Local rules passed.");
    }

    private String safeExtractString(Object obj, ObjectMapper mapper) {
        if (obj == null) return null;
        if (obj instanceof String) return (String) obj;
        try {
            return mapper.writeValueAsString(obj);
        } catch (Exception e) {
            return obj.toString();
        }
    }
}
