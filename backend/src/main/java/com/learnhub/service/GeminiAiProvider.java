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
    public String ask(String prompt) {
        Map<String, Object> body = Map.of(
            "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt))))
        );

        Map response = webClient.post()
            .uri(apiUrl + "?key=" + apiKey)
            .header("Content-Type", "application/json")
            .bodyValue(body)
            .retrieve()
            .onStatus(s -> s.value() == 429,
                r -> r.bodyToMono(String.class).map(b -> new RuntimeException("QUOTA_EXCEEDED")))
            .onStatus(s -> s.is4xxClientError() || s.is5xxServerError(),
                r -> r.bodyToMono(String.class).map(b -> new RuntimeException("API_ERROR: " + b)))
            .bodyToMono(Map.class)
            .block();

        if (response == null) {
            throw new RuntimeException("Empty response from Gemini AI");
        }

        var candidates = (List<?>) response.get("candidates");
        var content    = (Map<?, ?>) ((Map<?, ?>) candidates.get(0)).get("content");
        var parts      = (List<?>) content.get("parts");
        return ((Map<?, ?>) parts.get(0)).get("text").toString();
    }

    @Override
    public boolean supports(String providerName) {
        return "gemini".equalsIgnoreCase(providerName);
    }
}
