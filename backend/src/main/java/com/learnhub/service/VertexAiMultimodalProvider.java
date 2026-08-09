package com.learnhub.service;

import com.google.auth.oauth2.GoogleCredentials;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.multipart.MultipartFile;

import java.io.FileInputStream;
import java.util.*;

@Component
@Slf4j
public class VertexAiMultimodalProvider {

    @Value("${GOOGLE_DRIVE_CREDENTIALS_JSON:}")
    private String rawCredentialsJson;

    @Value("${google.cloud.project:learnstudio-503107}")
    private String projectId;

    @Value("${google.cloud.location:us-central1}")
    private String location;

    @Value("${google.application.credentials:../resources/google-credentials.json}")
    private String credentialsPath;

    @Value("${vertex.model:gemini-1.5-flash}")
    private String model;

    private final WebClient webClient = WebClient.builder().build();

    private GoogleCredentials getGoogleCredentials() {
        try {
            if (rawCredentialsJson != null && !rawCredentialsJson.trim().isEmpty()) {
                log.info("Loading GoogleCredentials from raw JSON environment variable.");
                return GoogleCredentials.fromStream(new java.io.ByteArrayInputStream(rawCredentialsJson.getBytes(java.nio.charset.StandardCharsets.UTF_8)))
                        .createScoped("https://www.googleapis.com/auth/cloud-platform");
            }

            java.io.InputStream classPathStream = getClass().getClassLoader().getResourceAsStream("google-credentials.json");
            if (classPathStream != null) {
                log.info("Loading GoogleCredentials from classpath.");
                return GoogleCredentials.fromStream(classPathStream)
                        .createScoped("https://www.googleapis.com/auth/cloud-platform");
            }

            String[] candidatePaths = {
                credentialsPath,
                "../resources/google-credentials.json",
                "resources/google-credentials.json",
                "../google-credentials.json",
                "google-credentials.json"
            };

            for (String p : candidatePaths) {
                if (p != null && !p.isBlank()) {
                    java.io.File file = new java.io.File(p);
                    if (file.exists()) {
                        log.info("Loading GoogleCredentials from file path: {}", file.getAbsolutePath());
                        return GoogleCredentials.fromStream(new java.io.FileInputStream(file))
                                .createScoped("https://www.googleapis.com/auth/cloud-platform");
                    }
                }
            }

            log.info("Falling back to Google Application Default Credentials.");
            return GoogleCredentials.getApplicationDefault()
                    .createScoped("https://www.googleapis.com/auth/cloud-platform");
        } catch (Exception e) {
            log.error("Failed to load GoogleCredentials: {}", e.getMessage());
            throw new RuntimeException("Could not load Google Credentials: " + e.getMessage(), e);
        }
    }

    public String generatePaperJson(String systemPrompt, List<MultipartFile> images, List<String> pdfTexts) {
        long start = System.currentTimeMillis();
        log.info("Executing Vertex AI Multimodal Request using model {}", model);

        try {
            GoogleCredentials credentials = getGoogleCredentials();
            credentials.refreshIfExpired();
            String token = credentials.getAccessToken().getTokenValue();

            String activeProject = (projectId != null && !projectId.trim().isEmpty()) ? projectId.trim() : "learnstudio-503107";
            String activeLocation = (location != null && !location.trim().isEmpty()) ? location.trim() : "us-central1";
            String activeModel = (model != null && !model.trim().isEmpty()) ? model.trim() : "gemini-1.5-flash";

            String apiUrl = String.format("https://%s-aiplatform.googleapis.com/v1/projects/%s/locations/%s/publishers/google/models/%s:generateContent",
                    activeLocation, activeProject, activeLocation, activeModel);

            List<Map<String, Object>> partsList = new ArrayList<>();

            // 1. Add Text System Instructions & PDF RAG Text
            StringBuilder combinedText = new StringBuilder();
            combinedText.append(systemPrompt).append("\n\n");
            
            if (pdfTexts != null && !pdfTexts.isEmpty()) {
                combinedText.append("=== REFERENCE BATCH STUDY MATERIALS / PDF TEXT ===\n");
                for (int i = 0; i < pdfTexts.size(); i++) {
                    combinedText.append(String.format("--- Document %d ---\n%s\n\n", i + 1, pdfTexts.get(i)));
                }
            }

            combinedText.append("\nStrict Output Requirement: Respond ONLY with a valid JSON array of Question objects representing ALL extracted or generated questions in the exam paper without skipping any question. You MUST strictly obey the question counts, question types, individual mark weights, and section breakdowns ordered in the instructions above. Supported questionTypes include MCQ, SHORT_ANSWER, LONG_ANSWER, FILL_IN_THE_BLANK, TRUE_FALSE, DIRECT, NUMERICAL.\n\n" +
                    "CRITICAL RULE FOR QUESTION TYPES: The schema below is merely an illustrative formatting reference demonstrating how to format different questionTypes (MCQ, SHORT_ANSWER, LONG_ANSWER). You MUST NOT generate all three types if the instructor asked for a uniform question type. For example, if the instructor asked for ONLY SHORT_ANSWER questions (or 'only short questions'), EVERY question in your generated JSON array must have questionType 'SHORT_ANSWER' and an empty options array []. If the instructor asked for ONLY MCQs, every question must be an 'MCQ' with options populated. Only generate a multi-section balanced paper when instructed by the exact paper blueprint above.\n\n" +
                    "Example schema illustrating syntax and structure across question types:\n");
            combinedText.append("[\n" +
                    "  {\"questionText\":\"Which of the following is the correct definition of momentum?\",\"questionType\":\"MCQ\",\"options\":[\"Mass x Velocity\",\"Mass / Velocity\",\"Force x Distance\",\"Energy / Time\"],\"correctOption\":\"A\",\"solutionExplanation\":\"Momentum is mathematically defined as the product of an object's mass and its velocity (p = m*v).\",\"marks\":1,\"difficulty\":\"EASY\",\"bloomLevel\":\"Remembering\",\"chapter\":\"Unit 1\",\"section\":\"SECTION_A\"},\n" +
                    "  {\"questionText\":\"Explain the difference between mass and weight with appropriate SI units and two clear contrasting points.\",\"questionType\":\"SHORT_ANSWER\",\"options\":[],\"correctOption\":\"Mass is scalar and constant across the universe (measured in kg); weight is a gravitational force vector (measured in Newtons).\",\"solutionExplanation\":\"Define mass as quantity of matter (kg) and weight as gravitational force W=mg (N). Contrast constancy of mass vs variability of weight based on gravity.\",\"marks\":3,\"difficulty\":\"MEDIUM\",\"bloomLevel\":\"Understanding\",\"chapter\":\"Unit 1\",\"section\":\"SECTION_B\"},\n" +
                    "  {\"questionText\":\"Derive Newton's second law of motion mathematically starting from the concept of rate of change of momentum. A braking force of 5000 N is applied to a car of mass 1000 kg moving at 20 m/s. Calculate the retardation produced and the time taken to bring the car to rest.\",\"questionType\":\"LONG_ANSWER\",\"options\":[],\"correctOption\":\"Retardation a = -5 m/s^2; Time t = 4 seconds.\",\"solutionExplanation\":\"Step 1: State F is proportional to dp/dt = m(v-u)/t = ma. Step 2: For calculation, use a = F/m = -5000/1000 = -5 m/s^2. Step 3: From v = u + at, 0 = 20 - 5t => t = 4 s.\",\"marks\":5,\"difficulty\":\"HARD\",\"bloomLevel\":\"Applying\",\"chapter\":\"Unit 1\",\"section\":\"SECTION_C\"}\n" +
                    "]\n");

            // 1. Add Inline Multimodal Images (Vision OCR) FIRST (Google Best Practice)
            if (images != null) {
                for (MultipartFile img : images) {
                    if (img != null && !img.isEmpty()) {
                        byte[] bytes = img.getBytes();
                        String base64Data = Base64.getEncoder().encodeToString(bytes);
                        String mimeType = img.getContentType() != null ? img.getContentType() : "image/jpeg";

                        Map<String, Object> inlineData = Map.of(
                                "mimeType", mimeType,
                                "data", base64Data
                        );
                        partsList.add(Map.of("inlineData", inlineData));
                    }
                }
            }

            // 2. Add Text System Instructions & PDF RAG Text LAST
            partsList.add(Map.of("text", combinedText.toString()));

            Map<String, Object> generationConfig = Map.of(
                    "maxOutputTokens", 8192,
                    "temperature", 0.2,
                    "responseMimeType", "application/json"
            );

            Map<String, Object> requestBody = Map.of(
                    "contents", List.of(Map.of(
                            "role", "user",
                            "parts", partsList
                    )),
                    "generationConfig", generationConfig
            );

            Map response = webClient.post()
                    .uri(apiUrl)
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + token)
                    .bodyValue(requestBody)
                    .retrieve()
                    .onStatus(s -> s.is4xxClientError() || s.is5xxServerError(),
                            r -> r.bodyToMono(String.class).map(b -> new RuntimeException("VERTEX_AI_ERROR: " + b)))
                    .bodyToMono(Map.class)
                    .timeout(java.time.Duration.ofSeconds(300))
                    .block();

            if (response == null) {
                throw new RuntimeException("Empty response from Vertex AI");
            }

            var candidates = (List<?>) response.get("candidates");
            if (candidates == null || candidates.isEmpty()) {
                throw new RuntimeException("Vertex AI returned no candidates");
            }
            var content = (Map<?, ?>) ((Map<?, ?>) candidates.get(0)).get("content");
            var parts = (List<?>) content.get("parts");
            Object textObj = ((Map<?, ?>) parts.get(0)).get("text");

            String rawText = textObj != null ? textObj.toString() : "";
            log.info("Vertex AI generation completed in {}ms, response length: {}", System.currentTimeMillis() - start, rawText.length());
            log.debug("Vertex AI Raw Response JSON: \n{}", rawText);

            return cleanJsonText(rawText);

        } catch (Exception e) {
            log.error("Vertex AI Multimodal API error: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to generate exam paper via Vertex AI: " + e.getMessage(), e);
        }
    }

    private String cleanJsonText(String text) {
        String cleaned = text.trim();
        if (cleaned.startsWith("```json")) {
            cleaned = cleaned.substring(7);
        }
        if (cleaned.startsWith("```")) {
            cleaned = cleaned.substring(3);
        }
        if (cleaned.endsWith("```")) {
            cleaned = cleaned.substring(0, cleaned.length() - 3);
        }
        return cleaned.trim();
    }
}
