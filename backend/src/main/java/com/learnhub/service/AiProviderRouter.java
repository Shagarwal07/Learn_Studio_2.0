package com.learnhub.service;

import com.learnhub.entity.User;
import com.learnhub.entity.UserAiCredential;
import com.learnhub.entity.UserAiPlan;
import com.learnhub.repository.UserAiCredentialRepository;
import com.learnhub.security.AesEncryptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AiProviderRouter {

    private final AiPlanService aiPlanService;
    private final UserAiCredentialRepository credentialRepository;
    private final AesEncryptionService encryptionService;

    @Value("${openrouter.api.key}")
    private String defaultOpenRouterKey;

    @Value("${gemini.api.key:fallback}")
    private String defaultGeminiKey;

    @Value("${autota.ai.provider:}")
    private String configuredAiProvider;

    public RoutingDecision routeRequest(User user) {
        if ("mock".equalsIgnoreCase(configuredAiProvider)) {
            return new RoutingDecision("mock", "mock-key", "FREE");
        }
        if ("vertex".equalsIgnoreCase(configuredAiProvider)) {
            return new RoutingDecision("vertex", null, "PREMIUM");
        }

        if (!aiPlanService.hasAvailableQuota(user)) {
            throw new RuntimeException("QUOTA_EXCEEDED: Upgrade your plan to continue generating AI content.");
        }

        UserAiPlan plan = aiPlanService.getUserPlan(user);

        // 1. Check for Active BYOK
        List<UserAiCredential> credentials = credentialRepository.findByUserIdAndActiveTrue(user.getId());
        if (!credentials.isEmpty()) {
            UserAiCredential cred = credentials.get(0); // Take the primary active key
            String decryptedKey = encryptionService.decrypt(cred.getEncryptedApiKey());
            return new RoutingDecision(cred.getProvider(), decryptedKey, "BYOK");
        }

        // 2. Route based on Plan
        if ("PREMIUM".equals(plan.getPlanType())) {
            // For PREMIUM users, route them directly to the premium developer key
            return new RoutingDecision("GEMINI_PRO", defaultGeminiKey, "PREMIUM");
        } else {
            // For FREE users, route them to Gemini Free, then OpenRouter
            return new RoutingDecision("OPENROUTER", defaultOpenRouterKey, "FREE");
        }
    }

    public static class RoutingDecision {
        private final String provider;
        private final String apiKey;
        private final String billingType;

        public RoutingDecision(String provider, String apiKey, String billingType) {
            this.provider = provider;
            this.apiKey = apiKey;
            this.billingType = billingType;
        }

        public String getProvider() { return provider; }
        public String getApiKey() { return apiKey; }
        public String getBillingType() { return billingType; }
    }
}
