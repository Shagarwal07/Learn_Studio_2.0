package com.learnhub.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import java.util.List;
import java.util.Map;

@Component
public class OpenRouterAiProvider implements AiProvider {

    @Value("${openrouter.api.key}")
    private String apiKey;

    @Value("${openrouter.api.url}")
    private String apiUrl;

    @Value("${openrouter.model}")
    private String model;

    private final WebClient webClient = WebClient.builder().build();

    @Override
    public String ask(String prompt) {
        Map<String, Object> body = Map.of(
            "model", model,
            "messages", List.of(Map.of("role", "user", "content", prompt))
        );

        Map response = webClient.post()
            .uri(apiUrl)
            .header("Content-Type", "application/json")
            .header("Authorization", "Bearer " + apiKey)
            .bodyValue(body)
            .retrieve()
            .onStatus(s -> s.value() == 429,
                r -> r.bodyToMono(String.class).map(b -> new RuntimeException("QUOTA_EXCEEDED")))
            .onStatus(s -> s.is4xxClientError() || s.is5xxServerError(),
                r -> r.bodyToMono(String.class).map(b -> new RuntimeException("API_ERROR: " + b)))
            .bodyToMono(Map.class)
            .block();

        if (response == null) {
            throw new RuntimeException("Empty response from OpenRouter AI");
        }

        var choices = (List<?>) response.get("choices");
        var message = (Map<?, ?>) ((Map<?, ?>) choices.get(0)).get("message");
        return message.get("content").toString();
    }

    @Override
    public boolean supports(String providerName) {
        return "openrouter".equalsIgnoreCase(providerName) || "grok".equalsIgnoreCase(providerName);
    }
}
