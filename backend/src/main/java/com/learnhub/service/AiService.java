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

    // Ask with automatic fallback handling
    public String askWithFallback(String prompt, String preferredProvider) {
        try {
            return getProvider(preferredProvider).ask(prompt);
        } catch (Exception e) {
            System.err.println("Preferred provider " + preferredProvider + " failed: " + e.getMessage());
            // Attempt fallback
            String fallbackProvider = "gemini".equalsIgnoreCase(preferredProvider) ? "openrouter" : "gemini";
            try {
                System.out.println("Attempting fallback to " + fallbackProvider);
                return getProvider(fallbackProvider).ask(prompt);
            } catch (Exception ex) {
                throw new RuntimeException("Both AI providers failed. Error: " + ex.getMessage(), ex);
            }
        }
    }

    private AiProvider getProvider(String providerName) {
        return providers.stream()
                .filter(p -> p.supports(providerName))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unsupported AI provider: " + providerName));
    }

    // ── AI Features ──────────────────────────────────────────
    
    public String solveDoubt(String question, String courseName, String model) {
        String prompt = String.format(
            "You are a helpful tutor for the course '%s'. " +
            "Answer this student's question clearly and concisely in 3-5 lines: %s",
            courseName, question);
        return askWithFallback(prompt, model);
    }

    public String recommendCourses(List<String> enrolledCourses, String model) {
        String enrolled = enrolledCourses.isEmpty() ? "none yet" : String.join(", ", enrolledCourses);
        String prompt = String.format(
            "A student is enrolled in these courses: %s. " +
            "Recommend 3 next courses they should take to advance their career. " +
            "Format as a numbered list with course name and one-line reason. Keep it brief.", enrolled);
        return askWithFallback(prompt, model);
    }

    public String generateQuiz(String topic, String model) {
        String prompt = String.format(
            "Generate exactly 5 multiple choice questions about '%s'. " +
            "Respond ONLY with a valid JSON array, no markdown, no explanation. " +
            "Format: [{\"question\":\"...\",\"options\":{\"A\":\"...\",\"B\":\"...\",\"C\":\"...\",\"D\":\"...\"},\"answer\":\"A\"}]. " +
            "Keep questions practical and beginner-friendly.", topic);
        return askWithFallback(prompt, model);
    }

    public String generateVivaQuestions(String topic, String model) {
        String prompt = String.format(
            "Generate 5 interview/viva questions about the topic '%s' to help a student prepare. " +
            "Provide both the question and a brief, ideal model answer (2-3 lines) for each. " +
            "Format clearly with bold headers for Question and Answer.", topic);
        return askWithFallback(prompt, model);
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
