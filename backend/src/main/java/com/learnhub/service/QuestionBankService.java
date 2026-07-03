package com.learnhub.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.learnhub.dto.GeneratedQuestionDTO;
import com.learnhub.entity.QuestionBank;
import com.learnhub.repository.QuestionBankRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class QuestionBankService {

    private final QuestionBankRepository questionBankRepository;
    private final AiService aiService;
    private final ObjectMapper objectMapper;

    public List<GeneratedQuestionDTO> fetchQuestions(String subject, String course, String syllabus, String difficulty, List<Integer> weights, List<String> sections) {
        int count = weights.size();
        List<QuestionBank> dbQuestions = questionBankRepository.findBySubject(subject);
        List<GeneratedQuestionDTO> result = new ArrayList<>();
        
        List<QuestionBank> eligible = dbQuestions.stream()
                .filter(q -> q.getDifficulty().equalsIgnoreCase(difficulty))
                .toList();
        if (eligible.isEmpty()) {
            eligible = dbQuestions;
        }

        Random rand = new Random();
        int fetched = 0;

        if (!eligible.isEmpty()) {
            List<QuestionBank> mutableEligible = new ArrayList<>(eligible);
            for (int i = 0; i < Math.min(count, mutableEligible.size()); i++) {
                int index = rand.nextInt(mutableEligible.size());
                QuestionBank q = mutableEligible.remove(index);
                
                q.setLastUsedAt(LocalDate.now());
                questionBankRepository.save(q);

                int currentMarks = weights.get(fetched);
                String currentSection = sections.get(fetched);

                result.add(GeneratedQuestionDTO.builder()
                        .questionText(q.getQuestionText())
                        .options(q.getOptions())
                        .correctAnswer(q.getCorrectAnswer())
                        .marks(currentMarks)
                        .difficulty(q.getDifficulty())
                        .questionType(q.getQuestionType())
                        .agentType("QUESTION_BANK")
                        .subject(subject)
                        .chapter(q.getQuestionText().length() > 20 ? q.getQuestionText().substring(0, 20) : "General")
                        .topic("General")
                        .learningOutcome("Core understanding")
                        .section(currentSection)
                        .version(1)
                        .isApproved(true)
                        .build());
                fetched++;
            }
        }

        if (fetched < count) {
            int neededCount = count - fetched;
            List<Integer> neededWeights = weights.subList(fetched, count);
            List<String> neededSections = sections.subList(fetched, count);
            String neededWeightsStr = neededWeights.toString();

            String prompt = String.format(
                "Generate exactly %d high-quality question bank problems " +
                "on the subject '%s', for the class/course '%s', matching syllabus/topics: '%s', with difficulty '%s'.\n" +
                "You must strictly adhere to the syllabus and class level. " +
                "CRITICAL: If the class is '%s' and chapters/syllabus are '%s', you MUST NOT generate questions about advanced topics outside this syllabus (for example, if class is 9th Math and syllabus has HCF/LCM, do not generate calculus, limits, integration, derivatives, or college-level problems. Stick strictly to standard class 9th HCF/LCM problems).\n" +
                "DO NOT use vague placeholder text like 'Standard Question Bank reference problem...'. Generate complete, fully-formed questions.\n" +
                "CRITICAL MARKS & STRUCTURE DIRECTIVE: You must generate exactly %d questions. The marks/weights for each question are pre-determined by the backend. You do NOT assign or decide marks. The list of weights for the questions to generate is: %s.\n" +
                "The first question in the JSON array must correspond to a weight of %d marks. The second must be %s marks, and so on.\n" +
                "Include 'chapter' (the specific chapter name), 'topic' (the specific topic name), and 'learningOutcome' (what learning outcome is evaluated) in each question object.\n" +
                "Respond ONLY with a valid JSON array. Do not include markdown code blocks like ```json or any explanation.\n" +
                "Format:\n" +
                "[\n" +
                "  {\n" +
                "    \"questionText\": \"Question text here...\",\n" +
                "    \"options\": null,\n" +
                "    \"correctAnswer\": \"Answer here\",\n" +
                "    \"difficulty\": \"%s\",\n" +
                "    \"questionType\": \"SHORT\",\n" +
                "    \"chapter\": \"Chapter name here\",\n" +
                "    \"topic\": \"Topic name here\",\n" +
                "    \"learningOutcome\": \"Learning outcome description\"\n" +
                "  }\n" +
                "]",
                neededCount, subject, course, syllabus, difficulty, course, syllabus, neededCount, neededWeightsStr, neededWeights.get(0), (neededWeights.size() > 1 ? neededWeights.get(1) : "N/A"), difficulty
            );

            try {
                String response = aiService.askWithFallback(prompt, "gemini");
                List<GeneratedQuestionDTO> aiQuestions = parseQuestions(response, "QUESTION_BANK", subject, difficulty);
                
                for (int i = 0; i < Math.min(aiQuestions.size(), neededWeights.size()); i++) {
                    GeneratedQuestionDTO q = aiQuestions.get(i);
                    q.setMarks(neededWeights.get(i));
                    q.setSection(neededSections.get(i));
                    result.add(q);
                    fetched++;
                }
            } catch (Exception e) {
                System.err.println("QuestionBank AI fallback generation failed: " + e.getMessage());
                while (fetched < count) {
                    int currentMarks = weights.get(fetched);
                    String currentSection = sections.get(fetched);
                    result.add(GeneratedQuestionDTO.builder()
                            .questionText(String.format("Solve the problem on %s from chapter: %s (Marks: %d)", subject, syllabus, currentMarks))
                            .options(null)
                            .correctAnswer("Refer to standard textbook guidelines.")
                            .marks(currentMarks)
                            .difficulty(difficulty)
                            .questionType("SHORT")
                            .agentType("QUESTION_BANK")
                            .subject(subject)
                            .chapter(syllabus)
                            .topic("Review")
                            .learningOutcome("Syllabus mastery")
                            .section(currentSection)
                            .version(1)
                            .isApproved(true)
                            .build());
                    fetched++;
                }
            }
        }

        return result;
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
            throw new RuntimeException("Failed to parse AI generated bank questions: " + e.getMessage(), e);
        }
    }
}
