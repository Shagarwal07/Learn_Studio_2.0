package com.learnhub.service;

import com.google.auth.oauth2.GoogleCredentials;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import java.io.FileInputStream;
import java.util.List;
import java.util.Map;

@Component
public class VertexAiProvider implements AiProvider {

    @Value("${google.cloud.project:}")
    private String projectId;

    @Value("${google.cloud.location:}")
    private String location;

    @Value("${google.application.credentials:}")
    private String credentialsPath;

    @Value("${vertex.model:gemini-2.5-flash}")
    private String model;

    private final WebClient webClient = WebClient.builder().build();

    @Override
    public String ask(String prompt, String dynamicApiKey) {
        long start = System.currentTimeMillis();
        System.out.println("VERTEX_AI_PROVIDER_USED");
        
        try {
            GoogleCredentials credentials;
            if (credentialsPath != null && !credentialsPath.isEmpty()) {
                credentials = GoogleCredentials.fromStream(new FileInputStream(credentialsPath))
                    .createScoped("https://www.googleapis.com/auth/cloud-platform");
            } else {
                credentials = GoogleCredentials.getApplicationDefault()
                    .createScoped("https://www.googleapis.com/auth/cloud-platform");
            }
            credentials.refreshIfExpired();
            String token = credentials.getAccessToken().getTokenValue();

            String apiUrl = String.format("https://%s-aiplatform.googleapis.com/v1/projects/%s/locations/%s/publishers/google/models/%s:generateContent", 
                location, projectId, location, model);

            Map<String, Object> body = Map.of(
                "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt)))),
                "generationConfig", Map.of("maxOutputTokens", 8192, "temperature", 0.2)
            );

            Map response = webClient.post()
                .uri(apiUrl)
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + token)
                .bodyValue(body)
                .retrieve()
                .onStatus(s -> s.is4xxClientError() || s.is5xxServerError(),
                    r -> r.bodyToMono(String.class).map(b -> new RuntimeException("API_ERROR: " + b)))
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
            if (content == null) {
                throw new RuntimeException("Vertex AI returned no content object");
            }
            var parts = (List<?>) content.get("parts");
            if (parts == null || parts.isEmpty()) {
                throw new RuntimeException("Vertex AI returned no parts");
            }
            Object text = ((Map<?, ?>) parts.get(0)).get("text");
            if (text == null) {
                throw new RuntimeException("Vertex AI returned null text");
            }

            String resultText = text.toString();
            long latency = System.currentTimeMillis() - start;
            System.out.println("model: " + model);
            System.out.println("latency: " + latency + "ms");
            System.out.println("raw response length: " + resultText.length());

            return resultText;

        } catch (Exception e) {
            throw new RuntimeException("Vertex AI Request Failed: " + e.getMessage(), e);
        }
    }

    @Override
    public boolean supports(String providerName) {
        return "vertex".equalsIgnoreCase(providerName);
    }
}
