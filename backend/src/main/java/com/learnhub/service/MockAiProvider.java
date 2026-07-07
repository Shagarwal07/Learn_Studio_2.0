package com.learnhub.service;

import org.springframework.stereotype.Service;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class MockAiProvider implements AiProvider {

    @Override
    public String ask(String prompt, String dynamicApiKey) {
        System.out.println("MOCK_AI_PROVIDER_USED");

        // 1. QuestionGeneratorService Mock
        if (prompt.contains("expert school teacher and curriculum author")) {
            return generateMockQuestions(prompt);
        }
        
        // 2. SolverService Mock
        if (prompt.contains("expert Subject Matter Expert (SME) and Solver Agent")) {
            return "{\n" +
                   "  \"calculations\": \"Mock calculations done here.\",\n" +
                   "  \"solutionSteps\": \"Step 1: Mock step. Step 2: Mock step.\",\n" +
                   "  \"finalAnswer\": \"Mock Final Answer\",\n" +
                   "  \"markingScheme\": \"1 mark for formula, 1 mark for answer\"\n" +
                   "}";
        }
        
        // 3. VerificationService Mock
        if (prompt.contains("independent, extremely rigorous Senior Examiner")) {
            return "{\n" +
                   "  \"isPassed\": true,\n" +
                   "  \"rejectionReason\": \"Valid\"\n" +
                   "}";
        }
        
        // 4. AnalysisService Mock
        if (prompt.contains("strict curriculum quality auditor and exam paper validator")) {
            return "STATUS: PASS\nREASON: AI checked successfully.";
        }

        return "{}";
    }

    @Override
    public boolean supports(String providerName) {
        return "mock".equalsIgnoreCase(providerName);
    }

    private String generateMockQuestions(String prompt) {
        StringBuilder json = new StringBuilder();
        json.append("[\n");

        // Extract slots from prompt using regex
        Pattern pattern = Pattern.compile("Slot (\\d+): \\d+ marks \\| (\\w+) \\|");
        Matcher matcher = pattern.matcher(prompt);
        
        boolean first = true;
        while (matcher.find()) {
            if (!first) {
                json.append(",\n");
            }
            String slotIndex = matcher.group(1);
            String type = matcher.group(2);
            
            json.append("  {\n");
            json.append("    \"slotIndex\": ").append(slotIndex).append(",\n");
            if ("MCQ".equalsIgnoreCase(type)) {
                json.append("    \"questionText\": \"Which of the following is a unit of force? (Mock MCQ for Slot ").append(slotIndex).append(")\",\n");
                json.append("    \"questionType\": \"MCQ\",\n");
                json.append("    \"chapter\": \"Force and Laws of Motion\",\n");
                json.append("    \"topic\": \"Force\",\n");
                json.append("    \"options\": [\"Newton\", \"Joule\", \"Watt\", \"Pascal\"],\n");
                json.append("    \"calculations\": \"F = ma\",\n");
                json.append("    \"solutionSteps\": \"1. Identify units of force. 2. Newton is correct.\",\n");
                json.append("    \"finalAnswer\": \"Newton\",\n");
                json.append("    \"markingScheme\": \"1 mark for correct answer\"\n");
            } else {
                json.append("    \"questionText\": \"Explain the concept of force with one real-life example. (Mock Question for Slot ").append(slotIndex).append(")\",\n");
                json.append("    \"questionType\": \"").append(type).append("\",\n");
                json.append("    \"chapter\": \"Force and Laws of Motion\",\n");
                json.append("    \"topic\": \"Force\",\n");
                json.append("    \"options\": [],\n");
                json.append("    \"calculations\": \"Conceptual explanation\",\n");
                json.append("    \"solutionSteps\": \"1. Define force. 2. Give example.\",\n");
                json.append("    \"finalAnswer\": \"Force is a push or pull.\",\n");
                json.append("    \"markingScheme\": \"1 mark for definition, 1 mark for example\"\n");
            }
            json.append("  }");
            first = false;
        }

        json.append("\n]");
        return json.toString();
    }
}
