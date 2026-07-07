package com.learnhub.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.learnhub.dto.GeneratedQuestionDTO;
import lombok.*;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
public class QuestionGeneratorService {

    private final AiService aiService;
    private final ObjectMapper objectMapper;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuestionSlot {
        private String section;
        private Integer marks;
        private String questionType;
        private String targetDifficulty;
        private String targetChapter;
        private String bloomLevel;
        private Integer slotIndex;
    }

    public List<GeneratedQuestionDTO> generateSectionQuestions(
            Long userId,
            String subject,
            String course,
            String syllabus,
            String sectionName,
            List<QuestionSlot> slots,
            String ragContext,
            List<String> questionHistory,
            String rejectionReason) {

        StringBuilder prompt = new StringBuilder();

        // 1. SYSTEM ROLE & PEDAGOGICAL CONTEXT
        prompt.append("=== SYSTEM INSTRUCTIONS ===\n");
        prompt.append("You are an expert school teacher and curriculum author. Your task is to generate a LIST of high-quality questions for an entire section.\n");
        prompt.append(String.format("Target Grade/Class Level: %s\n", course));
        prompt.append(String.format("Subject: %s\n", subject));
        prompt.append(String.format("Section: %s\n", sectionName));
        prompt.append("CRITICAL: The questions, answers, and language must be age-appropriate and professional.\n\n");

        // 2. REQUIRED SLOTS
        prompt.append("=== REQUIRED QUESTIONS TO GENERATE ===\n");
        prompt.append("You MUST generate exactly ").append(slots.size()).append(" questions corresponding to the slots below:\n");
        for (QuestionSlot slot : slots) {
            prompt.append(String.format("Slot %d: %d marks | %s | Difficulty: %s | Bloom: %s | Chapter: %s\n",
                    slot.getSlotIndex(), slot.getMarks(), slot.getQuestionType(),
                    slot.getTargetDifficulty(), slot.getBloomLevel(), slot.getTargetChapter()));
        }
        prompt.append("\n");

        // 3. STRICT CONTEXT / RAG ZONE
        prompt.append("=== REFERENCE NOTES CONTEXT ===\n");
        if (ragContext != null && !ragContext.trim().isEmpty()) {
            prompt.append("Study Material reference:\n");
            prompt.append(ragContext).append("\n");
            prompt.append("STRICT DIRECTIVE: Base your questions ONLY on information provided in this context. Do not use external college-level facts.\n\n");
        } else {
            prompt.append("No reference study notes available. Stick strictly to standard curriculum concepts for this grade and syllabus chapters.\n\n");
        }

        // 4. DUPLICATE PREVENTION
        if (questionHistory != null && !questionHistory.isEmpty()) {
            prompt.append("=== DUPLICATE PREVENTION ===\n");
            prompt.append("Do NOT duplicate these previously generated concepts:\n");
            for (int i = 0; i < Math.min(questionHistory.size(), 10); i++) {
                prompt.append(String.format("- %s\n", questionHistory.get(i)));
            }
            prompt.append("\n");
        }

        // 5. REVISION FEEDBACK
        if (rejectionReason != null && !rejectionReason.trim().isEmpty()) {
            prompt.append("=== REGENERATION FEEDBACK ===\n");
            prompt.append("Your previous attempt failed with the following error:\n");
            prompt.append(rejectionReason).append("\n");
            prompt.append("Fix these issues completely in this attempt.\n\n");
        }

        // 6. SUBJECT-SPECIFIC SOLVING DIRECTIVES
        prompt.append("=== SUBJECT-SPECIFIC SOLVING DIRECTIVES ===\n");
        if (subject.toLowerCase().contains("math") || subject.toLowerCase().contains("calculus") || subject.toLowerCase().contains("algebra") || subject.toLowerCase().contains("geometry")) {
            prompt.append("- Focus heavily on solving equations, showing intermediate steps, geometric reasoning, and precise algebraic manipulation.\n");
        } else if (subject.toLowerCase().contains("physic")) {
            prompt.append("- Focus on deriving formulas, explicitly stating units, and showing clear intermediate calculation values.\n");
        } else if (subject.toLowerCase().contains("chemist")) {
            prompt.append("- Focus on balancing chemical equations, stoichiometry, and accurate reaction formulas.\n");
        } else if (subject.toLowerCase().contains("comput") || subject.toLowerCase().contains("program")) {
            prompt.append("- Focus on executing the logic step-by-step, dry-running the code, and defining edge cases.\n");
        }
        prompt.append("\n");

        // 7. OUTPUT JSON SCHEMA
        prompt.append("=== RESPONSE RULES ===\n");
        prompt.append("Respond ONLY with a valid JSON ARRAY matching the schema below. Do not wrap in markdown blocks. Do not add explanations outside the JSON.\n");
        prompt.append("STRICT DIRECTIVE: You MUST generate the question, solve it step-by-step, and provide the final answer and marking scheme in one go.\n");
        prompt.append("IMPORTANT: Double-escape LaTeX backslashes (e.g. \\\\( x^2 \\\\)).\n");
        prompt.append("[\n");
        prompt.append("  {\n");
        prompt.append("    \"slotIndex\": 0,\n");
        prompt.append("    \"questionText\": \"The question wording here...\",\n");
        prompt.append("    \"questionType\": \"(MCQ, SHORT, LONG, or NUMERICAL)\",\n");
        prompt.append("    \"chapter\": \"The specific chapter name\",\n");
        prompt.append("    \"topic\": \"The specific topic name\",\n");
        prompt.append("    \"options\": [\"Option A\", \"Option B\", \"Option C\", \"Option D\"],\n");
        prompt.append("    \"calculations\": \"Show your raw, internal mathematical scratchpad reasoning here\",\n");
        prompt.append("    \"solutionSteps\": \"Write out the beautiful, final step-by-step solution\",\n");
        prompt.append("    \"finalAnswer\": \"State the exact, final correct answer clearly\",\n");
        prompt.append("    \"markingScheme\": \"Provide a detailed breakdown of how the marks should be awarded\"\n");
        prompt.append("  }\n");
        prompt.append("]\n");
        prompt.append("Note: For non-MCQ questions, leave the 'options' array empty.\n");

        try {
            int maxRetries = 3;
            for (int attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    String response = aiService.askWithFallback(userId, "AUTO_TA_GENERATOR", prompt.toString(), "gemini").trim();
                    return parseSectionQuestions(response, subject, sectionName, slots);
                } catch (Exception e) {
                    if (attempt == maxRetries) throw e;
                    System.err.println("⚠️ Section Generation failed (Attempt " + attempt + "). Retrying... Error: " + e.getMessage());
                    try { Thread.sleep(2000); } catch (InterruptedException ie) { Thread.currentThread().interrupt(); }
                }
            }
            return new java.util.ArrayList<>();
        } catch (Exception e) {
            System.err.println("Section generation failed after retries: " + e.getMessage());
            throw new RuntimeException("Section generation failed: " + e.getMessage(), e);
        }
    }

    private List<GeneratedQuestionDTO> parseSectionQuestions(String jsonResponse, String subject, String sectionName, List<QuestionSlot> originalSlots) {
        try {
            String cleaned = com.learnhub.util.AiJsonParser.extractJson(jsonResponse);
            ObjectMapper aiMapper = com.learnhub.util.AiJsonParser.getMapper();

            List<Map<String, Object>> list = aiMapper.readValue(cleaned, new com.fasterxml.jackson.core.type.TypeReference<List<Map<String, Object>>>() {});
            List<GeneratedQuestionDTO> results = new ArrayList<>();

            for (Map<String, Object> map : list) {
                Integer idx = map.get("slotIndex") != null ? ((Number) map.get("slotIndex")).intValue() : -1;
                QuestionSlot matchedSlot = originalSlots.stream().filter(s -> s.getSlotIndex().equals(idx)).findFirst().orElse(null);
                
                if (matchedSlot == null) continue; // Skip invalid slots

                String qText = safeExtractString(map.get("questionText"), aiMapper);
                String chap = safeExtractString(map.get("chapter"), aiMapper);
                String top = safeExtractString(map.get("topic"), aiMapper);

                String optionsJson = null;
                Object optsObj = map.get("options");
                if (optsObj instanceof List) {
                    List<?> optsList = (List<?>) optsObj;
                    if (!optsList.isEmpty()) {
                        Map<String, String> optionMap = new LinkedHashMap<>();
                        char optionKey = 'A';
                        for (Object opt : optsList) {
                            if (opt != null) {
                                optionMap.put(String.valueOf(optionKey), opt.toString());
                                optionKey++;
                            }
                        }
                        optionsJson = objectMapper.writeValueAsString(optionMap);
                    }
                }

                String calculations = safeExtractString(map.get("calculations"), aiMapper);
                String solutionSteps = safeExtractString(map.get("solutionSteps"), aiMapper);
                String finalAnswer = safeExtractString(map.get("finalAnswer"), aiMapper);
                String markingScheme = safeExtractString(map.get("markingScheme"), aiMapper);

                results.add(GeneratedQuestionDTO.builder()
                        .questionText(qText)
                        .questionType(matchedSlot.getQuestionType())
                        .section(sectionName)
                        .marks(matchedSlot.getMarks())
                        .difficulty(matchedSlot.getTargetDifficulty())
                        .chapter(chap != null && !chap.isEmpty() ? chap : matchedSlot.getTargetChapter())
                        .topic(top)
                        .bloomLevel(matchedSlot.getBloomLevel())
                        .options(optionsJson)
                        .calculations(calculations)
                        .solutionSteps(solutionSteps)
                        .finalAnswer(finalAnswer)
                        .correctAnswer(finalAnswer)
                        .markingScheme(markingScheme)
                        .estimatedTimeMinutes(matchedSlot.getMarks() * 2)
                        .subject(subject)
                        .agentType("GENERATOR_SOLVER")
                        .version(1)
                        .isApproved(true)
                        .qualityStatus("APPROVED")
                        .build());
            }
            
            if (results.size() < originalSlots.size()) {
                throw new RuntimeException("AI returned fewer questions than requested.");
            }

            return results;

        } catch (Exception e) {
            throw new RuntimeException("Failed to parse section JSON: " + e.getMessage(), e);
        }
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

    public GeneratedQuestionDTO generateSingleQuestion(
            Long userId,
            String subject,
            String course,
            String syllabus,
            QuestionSlot slot,
            String ragContext,
            List<String> questionHistory,
            String rejectionReason) {
        
        List<QuestionSlot> singleSlotList = Collections.singletonList(slot);
        List<GeneratedQuestionDTO> result = generateSectionQuestions(
                userId, subject, course, syllabus, slot.getSection(), singleSlotList, ragContext, questionHistory, rejectionReason);
        
        if (result != null && !result.isEmpty()) {
            return result.get(0);
        }
        return generateFallbackQuestion(slot, subject);
    }

    // Fallback template generator
    public GeneratedQuestionDTO generateFallbackQuestion(QuestionSlot slot, String subject) {
        String[] fallbackTemplates = {
            "Explain the core concepts of %s in detail.",
            "Define the key terms related to %s.",
            "Write a comprehensive short note on %s.",
            "Discuss the significance of %s in %s.",
            "Outline the main principles of %s."
        };
        String template = fallbackTemplates[new Random().nextInt(fallbackTemplates.length)];
        String qText = String.format(template, slot.getTargetChapter(), subject) + " (Q" + slot.getSlotIndex() + ")";

        return GeneratedQuestionDTO.builder()
            .questionText(qText)
            .questionType(slot.getQuestionType())
            .section(slot.getSection())
            .marks(slot.getMarks())
            .difficulty("EASY")
            .chapter(slot.getTargetChapter())
            .topic(slot.getTargetChapter())
            .bloomLevel("Remembering")
            .correctAnswer("Refer to standard textbook definition and concepts.")
            .agentType("LOCAL_TEMPLATE_FALLBACK")
            .version(1)
            .isApproved(true)
            .subject(subject)
            .qualityStatus("APPROVED")
            .build();
    }
}
