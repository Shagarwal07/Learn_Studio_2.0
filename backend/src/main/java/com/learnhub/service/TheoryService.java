package com.learnhub.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.learnhub.dto.GeneratedQuestionDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TheoryService {

    private final AiService aiService;
    private final ObjectMapper objectMapper;

    public List<GeneratedQuestionDTO> generateQuestions(
            String subject, String course, String syllabus, int marks, String difficulty, String pattern, int count) {
        
        String prompt = String.format(
            "Generate exactly %d theory questions (mix of MCQ, short answers, long answers, or conceptual as requested by pattern: '%s') " +
            "on the subject '%s', for the course '%s', matching syllabus: '%s', with difficulty '%s'.\n" +
            "Each question must be worth a portion of the marks. The total marks of all these generated questions combined must be exactly %d.\n" +
            "Respond ONLY with a valid JSON array. Do not include markdown code blocks like ```json or any explanation.\n" +
            "Format:\n" +
            "[\n" +
            "  {\n" +
            "    \"questionText\": \"Question here...\",\n" +
            "    \"options\": \"[\\\"Option A\\\", \\\"Option B\\\", \\\"Option C\\\", \\\"Option D\\\"]\",\n" +
            "    \"correctAnswer\": \"A\",\n" +
            "    \"solutionSteps\": null,\n" +
            "    \"marks\": 5,\n" +
            "    \"difficulty\": \"%s\",\n" +
            "    \"questionType\": \"MCQ\"\n" +
            "  }\n" +
            "]",
            count, pattern, subject, course, syllabus, difficulty, marks, difficulty
        );

        try {
            String response = aiService.askWithFallback(prompt, "gemini");
            return parseQuestions(response, "THEORY", subject, difficulty);
        } catch (Exception e) {
            System.err.println("Theory Agent generation failed: " + e.getMessage());
            // Fallback: generate mock questions if AI fails
            return generateMockTheoryQuestions(subject, difficulty, marks, count);
        }
    }

    private List<GeneratedQuestionDTO> parseQuestions(String jsonResponse, String agentType, String subject, String difficulty) {
        try {
            // Clean up markdown block wrappers if present
            String cleaned = jsonResponse.trim();
            if (cleaned.startsWith("```json")) {
                cleaned = cleaned.substring(7);
            } else if (cleaned.startsWith("```")) {
                cleaned = cleaned.substring(3);
            }
            if (cleaned.endsWith("```")) {
                cleaned = cleaned.substring(0, cleaned.length() - 3);
            }
            cleaned = cleaned.trim();

            List<GeneratedQuestionDTO> list = objectMapper.readValue(cleaned, new TypeReference<List<GeneratedQuestionDTO>>() {});
            for (GeneratedQuestionDTO dto : list) {
                dto.setAgentType(agentType);
                dto.setSubject(subject);
                if (dto.getDifficulty() == null) {
                    dto.setDifficulty(difficulty);
                }
                dto.setVersion(1);
                dto.setIsApproved(true);
            }
            return list;
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse AI generated questions: " + e.getMessage(), e);
        }
    }

    private List<GeneratedQuestionDTO> generateMockTheoryQuestions(String subject, String difficulty, int totalMarks, int count) {
        List<GeneratedQuestionDTO> mockList = new ArrayList<>();
        int marksPerQuestion = totalMarks / count;
        for (int i = 1; i <= count; i++) {
            int currentMarks = (i == count) ? (totalMarks - (marksPerQuestion * (count - 1))) : marksPerQuestion;
            mockList.add(GeneratedQuestionDTO.builder()
                    .questionText(String.format("What are the fundamental core principles of %s? (Conceptual Question %d)", subject, i))
                    .options(null)
                    .correctAnswer("A complete overview of concepts related to " + subject)
                    .marks(currentMarks)
                    .difficulty(difficulty)
                    .questionType("CONCEPTUAL")
                    .agentType("THEORY")
                    .subject(subject)
                    .version(1)
                    .isApproved(true)
                    .build());
        }
        return mockList;
    }
}
