package com.learnhub.service;

import lombok.Builder;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@Slf4j
public class PromptSanitizerService {

    @Data
    @Builder
    public static class SectionRequirement {
        private String sectionName;
        private String questionType; // MCQ, SHORT_ANSWER, LONG_ANSWER, NUMERICAL
        private int count;
        private int marksPerQuestion;
    }

    @Data
    @Builder
    public static class SanitizedPromptResult {
        private String sanitizedPrompt;
        private List<SectionRequirement> sectionRequirements;
        private int totalMarks;
        private int totalQuestions;
        private boolean isMcqOnly;
        private boolean removeTickMarks;
        private boolean generateNewQuestions;
    }

    public SanitizedPromptResult sanitizePrompt(String rawPrompt, String subjectName, String batchName) {
        String input = rawPrompt != null ? rawPrompt.trim() : "";
        log.info("Sanitizing prompt for subject '{}', batch '{}': '{}'", subjectName, batchName, input);

        boolean removeTickMarks = true; // Always clean vision photos
        boolean generateNewQuestions = containsKeywords(input, "new", "fresh", "numerical", "change values", "different numbers", "create new");

        List<SectionRequirement> sections = parseSectionsFromPrompt(input);
        boolean isMcqOnly = sections.size() == 1 && "MCQ".equalsIgnoreCase(sections.get(0).getQuestionType());

        if (sections.isEmpty()) {
            if (containsKeywords(input, "mcq", "objective", "multiple choice") && !containsKeywords(input, "long", "short")) {
                isMcqOnly = true;
                sections.add(SectionRequirement.builder()
                        .sectionName("Section A - Multiple Choice Questions")
                        .questionType("MCQ")
                        .count(20)
                        .marksPerQuestion(1)
                        .build());
            } else {
                // Balanced Default Section Breakdown
                sections.add(SectionRequirement.builder()
                        .sectionName("Section A - Multiple Choice Questions")
                        .questionType("MCQ")
                        .count(5)
                        .marksPerQuestion(1)
                        .build());
                sections.add(SectionRequirement.builder()
                        .sectionName("Section B - Short Answer Questions")
                        .questionType("SHORT_ANSWER")
                        .count(3)
                        .marksPerQuestion(3)
                        .build());
                sections.add(SectionRequirement.builder()
                        .sectionName("Section C - Long Answer / Problem Solving")
                        .questionType("LONG_ANSWER")
                        .count(2)
                        .marksPerQuestion(5)
                        .build());
            }
        }

        int totalQuestions = sections.stream().mapToInt(SectionRequirement::getCount).sum();
        int totalMarks = sections.stream().mapToInt(s -> s.getCount() * s.getMarksPerQuestion()).sum();

        Pattern marksPattern = Pattern.compile("(\\d+)\\s*(?:marks?|mks|pts?|points?)", Pattern.CASE_INSENSITIVE);
        Matcher marksMatcher = marksPattern.matcher(input);
        if (marksMatcher.find()) {
            int requestedMarks = Integer.parseInt(marksMatcher.group(1));
            if (requestedMarks > 0) {
                totalMarks = requestedMarks;
                log.info("Parsed instructor explicit target total marks: {}", totalMarks);
            }
        }

        StringBuilder promptBuilder = new StringBuilder();
        if (input.isBlank()) {
            promptBuilder.append(String.format(
                "Extract text from the provided materials for %s as-is, remove all handwritten tick marks, circled answers, and teacher annotations, and convert the content directly into clean question style.",
                subjectName != null ? subjectName : "Subject"
            ));
        } else {
            promptBuilder.append(String.format("Subject: %s (Batch: %s). ", subjectName != null ? subjectName : "General", batchName != null ? batchName : "General"));
            promptBuilder.append("Instructor Special Instructions: ").append(input).append(". ");
            promptBuilder.append(String.format("IMPORTANT: The total exam paper marks MUST sum up to exactly %d marks. Assign sensible individual marks (e.g. 1-2 for MCQs, 3-4 for short answers, 5-10 for long essay questions) so the total sum matches %d. ", totalMarks, totalMarks));
            if (removeTickMarks) {
                promptBuilder.append("Automatically detect and eliminate any handwritten tick marks, circled options, red ink, or previous answers in images. ");
            }
            if (generateNewQuestions) {
                promptBuilder.append("Synthesize fresh, new conceptual questions and numerical variations based on the study materials. ");
            }
        }

        return SanitizedPromptResult.builder()
                .sanitizedPrompt(promptBuilder.toString().trim())
                .sectionRequirements(sections)
                .totalMarks(totalMarks)
                .totalQuestions(totalQuestions)
                .isMcqOnly(isMcqOnly)
                .removeTickMarks(removeTickMarks)
                .generateNewQuestions(generateNewQuestions)
                .build();
    }

    private List<SectionRequirement> parseSectionsFromPrompt(String prompt) {
        List<SectionRequirement> sections = new ArrayList<>();
        if (prompt == null || prompt.isBlank()) return sections;

        String lower = prompt.toLowerCase();

        // Pattern for "6 mcq, 2 long" or "10 mcqs, 3 short, 1 long"
        Pattern mcqPattern = Pattern.compile("(\\d+)\\s*(?:mcq|mcqs|objective|multiple choice)");
        Pattern shortPattern = Pattern.compile("(\\d+)\\s*(?:short|brief)");
        Pattern longPattern = Pattern.compile("(\\d+)\\s*(?:long|descriptive|essay)");

        Matcher mcqMatcher = mcqPattern.matcher(lower);
        if (mcqMatcher.find()) {
            int count = Integer.parseInt(mcqMatcher.group(1));
            sections.add(SectionRequirement.builder()
                    .sectionName("Section A - Multiple Choice Questions")
                    .questionType("MCQ")
                    .count(count)
                    .marksPerQuestion(1)
                    .build());
        }

        Matcher shortMatcher = shortPattern.matcher(lower);
        if (shortMatcher.find()) {
            int count = Integer.parseInt(shortMatcher.group(1));
            sections.add(SectionRequirement.builder()
                    .sectionName("Section B - Short Answer Questions")
                    .questionType("SHORT_ANSWER")
                    .count(count)
                    .marksPerQuestion(3)
                    .build());
        }

        Matcher longMatcher = longPattern.matcher(lower);
        if (longMatcher.find()) {
            int count = Integer.parseInt(longMatcher.group(1));
            sections.add(SectionRequirement.builder()
                    .sectionName(sections.isEmpty() ? "Section A - Long Answer Questions" : "Section C - Long Answer Questions")
                    .questionType("LONG_ANSWER")
                    .count(count)
                    .marksPerQuestion(5)
                    .build());
        }

        return sections;
    }

    private boolean containsKeywords(String text, String... keywords) {
        if (text == null || text.isBlank()) return false;
        String lower = text.toLowerCase();
        for (String kw : keywords) {
            if (lower.contains(kw)) return true;
        }
        return false;
    }
}
