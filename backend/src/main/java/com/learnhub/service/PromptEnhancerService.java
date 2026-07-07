package com.learnhub.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PromptEnhancerService {

    private final AiService aiService;

    public String enhanceSyllabus(Long userId, String subject, String syllabus) {
        if (syllabus == null || syllabus.trim().isEmpty()) {
            return "";
        }
        
        String prompt = String.format(
            "You are an education consultant. Clean up, format, and enhance the following syllabus/topics/chapters text " +
            "for the subject '%s' into a clear, detailed, comma-separated list of core concepts, subtopics, and key terms. " +
            "Make sure it is professional and relevant. Do not change the class level or subject scope. " +
            "Provide ONLY the plain text comma-separated list of topics. Do not include any introductory words, explanations, " +
            "formatting, or markdown blocks like ```.\n\n" +
            "Syllabus to enhance: %s",
            subject, syllabus
        );

        try {
            String response = aiService.askWithFallback(userId, "PROMPT_ENHANCER", prompt, "gemini").trim();
            if (response.startsWith("```")) {
                response = response.replaceAll("```[a-zA-Z]*\\n", "").replaceAll("```", "").trim();
            }
            return response.isEmpty() ? syllabus : response;
        } catch (Exception e) {
            System.err.println("Warning: Prompt Enhancer service failed, using original syllabus: " + e.getMessage());
            return syllabus;
        }
    }
}
