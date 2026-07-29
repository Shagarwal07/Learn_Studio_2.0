package com.learnhub.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import java.util.List;
import java.util.Map;

@Component
public class GeminiAiProvider implements AiProvider {

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.api.url}")
    private String apiUrl;

    private final WebClient webClient = WebClient.builder().build();

    @Override
    public String ask(String prompt, String dynamicApiKey) {
        int attempts = 0;
        String activeKey = (dynamicApiKey != null && !dynamicApiKey.isEmpty()) ? dynamicApiKey : apiKey;
        
        while (attempts < 3) {
            try {
                Thread.sleep(6500);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }

            try {
                Map<String, Object> body = Map.of(
                    "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt))))
                );

                Map response = webClient.post()
                    .uri(apiUrl + "?key=" + activeKey)
                    .header("Content-Type", "application/json")
                    .bodyValue(body)
                    .retrieve()
                    .onStatus(s -> s.value() == 429,
                        r -> r.bodyToMono(String.class).map(b -> new RuntimeException("QUOTA_EXCEEDED")))
                    .onStatus(s -> s.is4xxClientError() || s.is5xxServerError(),
                        r -> r.bodyToMono(String.class).map(b -> new RuntimeException("API_ERROR: " + b)))
                    .bodyToMono(Map.class)
                    .timeout(java.time.Duration.ofSeconds(300))
                    .block();

                if (response == null) {
                    throw new RuntimeException("Empty response from Gemini AI");
                }

                var candidates = (List<?>) response.get("candidates");
                var content    = (Map<?, ?>) ((Map<?, ?>) candidates.get(0)).get("content");
                var parts      = (List<?>) content.get("parts");
                return ((Map<?, ?>) parts.get(0)).get("text").toString();

            } catch (Exception e) {
                attempts++;
                if (attempts >= 3) {
                    throw e;
                }
                String msg = e.getMessage();
                if (msg != null && (msg.contains("QUOTA_EXCEEDED") || msg.contains("503") || msg.contains("UNAVAILABLE") || msg.contains("429"))) {
                    System.out.println("Gemini rate limit or unavailable. Sleeping 18s before retry " + attempts);
                    try {
                        Thread.sleep(18000);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                    }
                } else {
                    throw e;
                }
            }
        }
        throw new RuntimeException("Gemini provider run failed after retries");
    }

    @Override
    public boolean supports(String providerName) {
        return "gemini".equalsIgnoreCase(providerName);
    }
}
