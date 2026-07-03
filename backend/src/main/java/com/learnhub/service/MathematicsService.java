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
            String subject, String course, String syllabus, List<Integer> weights, List<String> sections, String difficulty) {
        
        String weightsStr = weights.toString();
        String prompt = String.format(
            "Generate exactly %d mathematical or numerical calculation questions " +
            "on the subject '%s', for the course/class '%s', matching syllabus: '%s', with difficulty '%s'.\n" +
            "CRITICAL SYLLABUS DIRECTIVE: All generated questions must strictly belong to the specified class level '%s' and chapters in the syllabus '%s'. For example, if class is 9th and syllabus has HCF/LCM, you MUST ONLY generate questions on HCF and LCM suitable for class 9th level. Do NOT generate unrelated or advanced topics such as derivatives, calculus, limits, integration, trigonometry, or college-level math. Keep questions strictly relevant and age-appropriate!\n" +
            "CRITICAL MARKS & STRUCTURE DIRECTIVE: You must generate exactly %d questions. The marks/weights for each question are pre-determined by the backend. You do NOT assign or decide marks. The list of weights for the questions to generate is: %s.\n" +
            "The first question in the JSON array must correspond to a weight of %d marks. The second must be %s marks, and so on.\n" +
            "Each question must be a numerical or formula-based problem with step-by-step solutions.\n" +
            "Include 'chapter' (the specific chapter name), 'topic' (the specific topic name), and 'learningOutcome' (what learning outcome is evaluated) in each question object.\n" +
            "Respond ONLY with a valid JSON array. Do not include markdown code blocks like ```json or any explanation.\n" +
            "Format:\n" +
            "[\n" +
            "  {\n" +
            "    \"questionText\": \"Numerical question here...\",\n" +
            "    \"options\": null,\n" +
            "    \"correctAnswer\": \"Final answer value\",\n" +
            "    \"solutionSteps\": \"Step 1: Formula. Step 2: Calculation.\",\n" +
            "    \"difficulty\": \"%s\",\n" +
            "    \"questionType\": \"NUMERICAL\",\n" +
            "    \"chapter\": \"Chapter name here\",\n" +
            "    \"topic\": \"Topic name here\",\n" +
            "    \"learningOutcome\": \"Learning outcome description\"\n" +
            "  }\n" +
            "]",
            weights.size(), subject, course, syllabus, difficulty, course, syllabus, weights.size(), weightsStr, weights.get(0), (weights.size() > 1 ? weights.get(1) : "N/A"), difficulty
        );

        try {
            String response = aiService.askWithFallback(prompt, "gemini");
            List<GeneratedQuestionDTO> questions = parseQuestions(response, "MATHEMATICS", subject, difficulty);
            
            // Deterministically overwrite marks and sections from backend blueprint weights
            for (int i = 0; i < Math.min(questions.size(), weights.size()); i++) {
                questions.get(i).setMarks(weights.get(i));
                questions.get(i).setSection(sections.get(i));
            }
            return questions;
        } catch (Exception e) {
            System.err.println("Mathematics Agent generation failed: " + e.getMessage());
            return generateMockMathQuestions(subject, difficulty, weights, sections);
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

    private List<GeneratedQuestionDTO> generateMockMathQuestions(String subject, String difficulty, List<Integer> weights, List<String> sections) {
        List<GeneratedQuestionDTO> mockList = new ArrayList<>();
        for (int i = 0; i < weights.size(); i++) {
            int currentMarks = weights.get(i);
            mockList.add(GeneratedQuestionDTO.builder()
                    .questionText(String.format("Calculate the optimal value for the %s equation under system parameters (Numerical Question %d)", subject, i + 1))
                    .options(null)
                    .correctAnswer("Value: " + ((i + 1) * 10))
                    .solutionSteps(String.format("Step 1: Identify variables. Step 2: Apply %s theorem. Step 3: Solve.", subject))
                    .marks(currentMarks)
                    .difficulty(difficulty)
                    .questionType("NUMERICAL")
                    .agentType("MATHEMATICS")
                    .subject(subject)
                    .chapter(subject + " Mathematics")
                    .topic("Calculations")
                    .learningOutcome("Apply numerical methods")
                    .section(sections.get(i))
                    .version(1)
                    .isApproved(true)
                    .build());
        }
        return mockList;
    }
}
