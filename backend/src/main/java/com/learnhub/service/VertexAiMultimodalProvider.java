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

            combinedText.append("\nStrict Output Requirement: Respond ONLY with a valid JSON array of Question objects representing the exam paper. Use appropriate individual mark weights based on question depth (e.g. 1-2 for MCQ, 3-4 for SHORT_ANSWER, 5-10 for LONG_ANSWER or NUMERICAL). Example schema:\n");
            combinedText.append("[\n  {\"questionText\":\"...\",\"questionType\":\"MCQ\",\"options\":[\"Option A\",\"Option B\",\"Option C\",\"Option D\"],\"correctOption\":\"A\",\"solutionExplanation\":\"...\",\"marks\":1,\"difficulty\":\"MEDIUM\",\"bloomLevel\":\"Understanding\",\"chapter\":\"Unit 1\"},\n  {\"questionText\":\"...\",\"questionType\":\"LONG_ANSWER\",\"options\":[],\"correctOption\":\"N/A\",\"solutionExplanation\":\"Detailed step-by-step answer...\",\"marks\":5,\"difficulty\":\"HARD\",\"bloomLevel\":\"Application\",\"chapter\":\"Unit 1\"}\n]\n");

            partsList.add(Map.of("text", combinedText.toString()));

            // 2. Add Inline Multimodal Images (Vision OCR)
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

            Map<String, Object> requestBody = Map.of(
                    "contents", List.of(Map.of(
                            "role", "user",
                            "parts", partsList
                    ))
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
                    .timeout(java.time.Duration.ofSeconds(90))
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
