package com.learnhub.controller;

import com.learnhub.dto.ApiResponse;
import com.learnhub.dto.QuizAttemptDTO;
import com.learnhub.service.AiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;

    @PostMapping("/doubt")
    public ResponseEntity<ApiResponse<Map<String, String>>> solveDoubt(@RequestBody Map<String, String> body) {
        String answer = aiService.solveDoubt(
                body.get("question"),
                body.getOrDefault("courseName", "Programming"),
                body.getOrDefault("model", "gemini"));
        return ResponseEntity.ok(ApiResponse.success(Map.of("answer", answer), "Doubt solved successfully"));
    }

    @PostMapping("/recommend")
    public ResponseEntity<ApiResponse<Map<String, String>>> recommend(@RequestBody Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        List<String> courses = (List<String>) body.getOrDefault("enrolledCourses", List.of());
        String model = (String) body.getOrDefault("model", "gemini");
        String recommendations = aiService.recommendCourses(courses, model);
        return ResponseEntity.ok(ApiResponse.success(Map.of("recommendations", recommendations), "Recommendations generated successfully"));
    }

    @PostMapping("/quiz")
    public ResponseEntity<ApiResponse<Map<String, String>>> generateQuiz(@RequestBody Map<String, String> body) {
        String quiz = aiService.generateQuiz(
                body.getOrDefault("topic", "Programming"),
                body.getOrDefault("model", "gemini"));
        return ResponseEntity.ok(ApiResponse.success(Map.of("quiz", quiz), "Quiz generated successfully"));
    }

    @PostMapping("/viva")
    public ResponseEntity<ApiResponse<Map<String, String>>> generateViva(@RequestBody Map<String, String> body) {
        String viva = aiService.generateVivaQuestions(
                body.getOrDefault("topic", "Programming"),
                body.getOrDefault("model", "gemini"));
        return ResponseEntity.ok(ApiResponse.success(Map.of("viva", viva), "Viva preparation questions generated successfully"));
    }

    // --- Quiz Attempts Endpoints ---
    
    @PostMapping("/quiz/attempt")
    public ResponseEntity<ApiResponse<QuizAttemptDTO>> saveAttempt(
            @RequestBody Map<String, Object> body,
            Principal principal) {
        String topic = (String) body.get("topic");
        Integer score = (Integer) body.get("score");
        Integer totalQuestions = (Integer) body.get("totalQuestions");
        
        QuizAttemptDTO attempt = aiService.saveQuizAttempt(principal.getName(), topic, score, totalQuestions);
        return ResponseEntity.ok(ApiResponse.success(attempt, "Quiz attempt recorded successfully"));
    }

    @GetMapping("/quiz/attempts")
    public ResponseEntity<ApiResponse<List<QuizAttemptDTO>>> getAttempts(Principal principal) {
        List<QuizAttemptDTO> attempts = aiService.getMyQuizAttempts(principal.getName());
        return ResponseEntity.ok(ApiResponse.success(attempts, "Quiz attempts retrieved successfully"));
    }
}
