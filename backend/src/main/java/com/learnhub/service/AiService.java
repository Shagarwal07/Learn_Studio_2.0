package com.learnhub.service;

import com.learnhub.dto.QuizAttemptDTO;
import com.learnhub.entity.QuizAttempt;
import com.learnhub.entity.User;
import com.learnhub.repository.QuizAttemptRepository;
import com.learnhub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AiService {

    private final List<AiProvider> providers;
    private final QuizAttemptRepository quizAttemptRepository;
    private final UserRepository userRepository;
    private final AiProviderRouter aiProviderRouter;
    private final AiPlanService aiPlanService;

    // Ask with automatic fallback handling and Model Routing
    public String askWithFallback(Long userId, String feature, String prompt, String preferredProvider) {
        if (userId == null) {
            throw new IllegalArgumentException("User ID must be provided to evaluate AI quotas");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        long start = System.currentTimeMillis();
        
        // 1. Evaluate Plan and Resolve Route (BYOK -> PREMIUM -> FREE)
        AiProviderRouter.RoutingDecision decision = aiProviderRouter.routeRequest(user);
        
        // Map the router provider name back to our AiProvider beans (e.g. GEMINI_PRO -> gemini, OPENROUTER -> openrouter)
        String initialProviderName = decision.getProvider().toLowerCase().contains("openrouter") ? "openrouter" : 
                             (decision.getProvider().equalsIgnoreCase("mock") ? "mock" : 
                             (decision.getProvider().equalsIgnoreCase("vertex") ? "vertex" : "gemini"));
        
        boolean isByokOrForced = "BYOK".equals(decision.getBillingType()) || 
                                 "mock".equals(initialProviderName) || 
                                 "vertex".equals(initialProviderName);

        List<String> providerChain;
        if (isByokOrForced) {
            providerChain = List.of(initialProviderName); // No fallback for BYOK or explicitly forced
        } else {
            // Standard user fallback chain
            providerChain = List.of("gemini", "groq", "openrouter");
        }
        
        Exception lastException = null;

        for (String providerName : providerChain) {
            try {
                AiProvider provider = getProvider(providerName);
                
                // If it's BYOK, pass the decision's API key. Otherwise pass null (let provider use defaults)
                String apiKeyToUse = "BYOK".equals(decision.getBillingType()) ? decision.getApiKey() : null;
                
                // 2. Execute Prompt
                String response = provider.ask(prompt, apiKeyToUse);
                
                long latency = System.currentTimeMillis() - start;
                System.out.println(String.format("✅ [AiService] Successfully routed via %s (Latency: %dms, BYOK: %b)", providerName.toUpperCase(), latency, "BYOK".equals(decision.getBillingType())));
                
                // 3. Log Usage and Increment Quota
                aiPlanService.incrementUsage(user, feature, providerName, "default", 0, java.math.BigDecimal.ZERO, true, null);
                
                return response;
            } catch (Exception e) {
                System.err.println("⚠️ [AiService] Request to " + providerName + " failed: " + e.getMessage() + ". Attempting next fallback...");
                lastException = e;
            }
        }
        
        // If we exhausted the chain
        long latency = System.currentTimeMillis() - start;
        System.err.println("❌ [AiService] All providers in fallback chain failed.");
        try {
            aiPlanService.incrementUsage(user, feature, "FAILED", "unknown", 0, java.math.BigDecimal.ZERO, false, lastException != null ? lastException.getMessage() : "Unknown error");
        } catch (Exception loggingEx) {
            // ignore
        }
        throw new RuntimeException("AI Routing failed after exhausting fallback chain: " + (lastException != null ? lastException.getMessage() : "Unknown error"), lastException);
    }

    private AiProvider getProvider(String providerName) {
        return providers.stream()
                .filter(p -> p.supports(providerName))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unsupported AI provider: " + providerName));
    }

    // ── AI Features ──────────────────────────────────────────
    
    public String solveDoubt(Long userId, String question, String courseName, String model) {
        String prompt = String.format(
            "You are a helpful tutor for the course '%s'. " +
            "Answer this student's question clearly and concisely in 3-5 lines: %s",
            courseName, question);
        return askWithFallback(userId, "SOLVE_DOUBT", prompt, model);
    }

    public String recommendCourses(Long userId, List<String> enrolledCourses, String model) {
        String enrolled = enrolledCourses.isEmpty() ? "none yet" : String.join(", ", enrolledCourses);
        String prompt = String.format(
            "A student is enrolled in these courses: %s. " +
            "Recommend 3 next courses they should take to advance their career. " +
            "Format as a numbered list with course name and one-line reason. Keep it brief.", enrolled);
        return askWithFallback(userId, "COURSE_RECOMMEND", prompt, model);
    }

    public String generateQuiz(Long userId, String topic, String model) {
        String prompt = String.format(
            "Generate exactly 5 multiple choice questions about '%s'. " +
            "Respond ONLY with a valid JSON array, no markdown, no explanation. " +
            "Format: [{\"question\":\"...\",\"options\":{\"A\":\"...\",\"B\":\"...\",\"C\":\"...\",\"D\":\"...\"},\"answer\":\"A\"}]. " +
            "Keep questions practical and beginner-friendly.", topic);
        return askWithFallback(userId, "GENERATE_QUIZ", prompt, model);
    }

    public String generateVivaQuestions(Long userId, String topic, String model) {
        String prompt = String.format(
            "Generate 5 interview/viva questions about the topic '%s' to help a student prepare. " +
            "Provide both the question and a brief, ideal model answer (2-3 lines) for each. " +
            "Format clearly with bold headers for Question and Answer.", topic);
        return askWithFallback(userId, "GENERATE_VIVA", prompt, model);
    }

    // ── Quiz Attempt Database Storage ────────────────────────
    
    @Transactional
    public QuizAttemptDTO saveQuizAttempt(String email, String topic, Integer score, Integer totalQuestions) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        QuizAttempt attempt = QuizAttempt.builder()
                .user(user)
                .topic(topic)
                .score(score)
                .totalQuestions(totalQuestions)
                .build();

        QuizAttempt saved = quizAttemptRepository.save(attempt);
        return toAttemptDTO(saved);
    }

    public List<QuizAttemptDTO> getMyQuizAttempts(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return quizAttemptRepository.findByUserId(user.getId()).stream()
                .map(this::toAttemptDTO)
                .toList();
    }

    private QuizAttemptDTO toAttemptDTO(QuizAttempt a) {
        return QuizAttemptDTO.builder()
                .id(a.getId())
                .topic(a.getTopic())
                .score(a.getScore())
                .totalQuestions(a.getTotalQuestions())
                .createdAt(a.getCreatedAt())
                .build();
    }
}
