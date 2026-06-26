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
public class MathematicsService {

    private final AiService aiService;
    private final ObjectMapper objectMapper;

    public List<GeneratedQuestionDTO> generateQuestions(
            String subject, String course, String syllabus, int marks, String difficulty, int count) {
        
        String prompt = String.format(
            "Generate exactly %d mathematical or numerical calculation questions " +
            "on the subject '%s', for the course '%s', matching syllabus: '%s', with difficulty '%s'.\n" +
            "Each question must be a numerical or formula-based problem with step-by-step solutions.\n" +
            "Each question must be worth a portion of the marks. The total marks of all these generated questions combined must be exactly %d.\n" +
            "Respond ONLY with a valid JSON array. Do not include markdown code blocks like ```json or any explanation.\n" +
            "Format:\n" +
            "[\n" +
            "  {\n" +
            "    \"questionText\": \"Numerical question here...\",\n" +
            "    \"options\": null,\n" +
            "    \"correctAnswer\": \"Final answer value\",\n" +
            "    \"solutionSteps\": \"Step 1: Formula. Step 2: Calculation.\",\n" +
            "    \"marks\": 5,\n" +
            "    \"difficulty\": \"%s\",\n" +
            "    \"questionType\": \"NUMERICAL\"\n" +
            "  }\n" +
            "]",
            count, subject, course, syllabus, difficulty, marks, difficulty
        );

        try {
            String response = aiService.askWithFallback(prompt, "gemini");
            return parseQuestions(response, "MATHEMATICS", subject, difficulty);
        } catch (Exception e) {
            System.err.println("Mathematics Agent generation failed: " + e.getMessage());
            return generateMockMathQuestions(subject, difficulty, marks, count);
        }
    }

    private List<GeneratedQuestionDTO> parseQuestions(String jsonResponse, String agentType, String subject, String difficulty) {
        try {
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
            throw new RuntimeException("Failed to parse AI generated math questions: " + e.getMessage(), e);
        }
    }

    private List<GeneratedQuestionDTO> generateMockMathQuestions(String subject, String difficulty, int totalMarks, int count) {
        List<GeneratedQuestionDTO> mockList = new ArrayList<>();
        int marksPerQuestion = totalMarks / count;
        for (int i = 1; i <= count; i++) {
            int currentMarks = (i == count) ? (totalMarks - (marksPerQuestion * (count - 1))) : marksPerQuestion;
            mockList.add(GeneratedQuestionDTO.builder()
                    .questionText(String.format("Calculate the optimal value for the %s equation under system parameters (Numerical Question %d)", subject, i))
                    .options(null)
                    .correctAnswer("Value: " + (i * 10))
                    .solutionSteps(String.format("Step 1: Identify variables. Step 2: Apply %s theorem. Step 3: Solve.", subject))
                    .marks(currentMarks)
                    .difficulty(difficulty)
                    .questionType("NUMERICAL")
                    .agentType("MATHEMATICS")
                    .subject(subject)
                    .version(1)
                    .isApproved(true)
                    .build());
        }
        return mockList;
    }
}
