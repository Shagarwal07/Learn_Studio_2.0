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
            Pattern generalQPattern = Pattern.compile("(\\d+)\\s*(?:questions?|ques|q's|qs\\b)", Pattern.CASE_INSENSITIVE);
            Matcher generalQMatcher = generalQPattern.matcher(input);
            int detectedQCount = 0;
            if (generalQMatcher.find()) {
                detectedQCount = Integer.parseInt(generalQMatcher.group(1));
            }
            if (containsKeywords(input, "mcq", "objective", "multiple choice") && !containsKeywords(input, "long", "short", "fill in", "direct")) {
                isMcqOnly = true;
                sections.add(SectionRequirement.builder()
                        .sectionName("Section A - Multiple Choice Questions")
                        .questionType("MCQ")
                        .count(detectedQCount > 0 ? detectedQCount : 20)
                        .marksPerQuestion(1)
                        .build());
            } else if (detectedQCount > 0) {
                sections.add(SectionRequirement.builder()
                        .sectionName("Section A - Questions")
                        .questionType("MIXED")
                        .count(detectedQCount)
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
        boolean isExplicitMarksRequested = false;

        Pattern marksPattern = Pattern.compile("(\\d+)\\s*(?:marks?|mks|pts?|points?)", Pattern.CASE_INSENSITIVE);
        Matcher marksMatcher = marksPattern.matcher(input);
        if (marksMatcher.find()) {
            int requestedMarks = Integer.parseInt(marksMatcher.group(1));
            String lowerInput = input.toLowerCase();
            boolean isPerQuestionMark = lowerInput.contains("for each question") || lowerInput.contains("per question") || lowerInput.contains("each question") || lowerInput.contains("marks each") || lowerInput.contains("mark each");
            if (requestedMarks > 0 && !isPerQuestionMark) {
                totalMarks = requestedMarks;
                isExplicitMarksRequested = true;
                log.info("Parsed instructor explicit target total marks: {}", totalMarks);
            } else if (isPerQuestionMark && totalQuestions > 0) {
                totalMarks = totalQuestions * requestedMarks;
                log.info("Parsed per-question marks rule: {} marks each, estimated total marks: {}", requestedMarks, totalMarks);
            }
        }

        StringBuilder promptBuilder = new StringBuilder();
        if (input.isBlank()) {
            promptBuilder.append(String.format(
                "Subject: %s (Batch: %s). AUTONOMOUS FRAMEWORK MODE: No explicit instructor prompt was provided. You must autonomously apply our 3-Section Pedagogical Framework without skipping or truncating any questions from the provided materials or images:\n" +
                "1) SECTION_A (Objective & MCQs, Fill-in-the-Blanks, True/False - 1-2 marks each),\n" +
                "2) SECTION_B (Short Answer & Direct Conceptual Explanations - 3-4 marks each),\n" +
                "3) SECTION_C (Long Answer, Analytical, & Problem Solving / Numerical - 5-10 marks each).\n" +
                "Extract ALL questions found in the test sheets or notes exactly as they appear, remove all handwritten tick marks, circled answers, red ink, and teacher annotations, and classify each question cleanly into these three sections.",
                subjectName != null ? subjectName : "Subject",
                batchName != null ? batchName : "General"
            ));
        } else {
            promptBuilder.append(String.format("Subject: %s (Batch: %s). ", subjectName != null ? subjectName : "General", batchName != null ? batchName : "General"));
            promptBuilder.append("INSTRUCTOR EXPLICIT OVERRIDE INSTRUCTIONS: ").append(input).append(". ");
            promptBuilder.append("CRITICAL REQUIREMENT: You MUST strictly follow the instructor's special instructions above regarding question counts (e.g. 10 or 20 questions), formats, alignments, and individual marking schemes (for example, if the instructor specified 'one mark for each question' or a custom total, obey that exact rule to all questions). When explicit instructions are given, they OVERRIDE the default section framework completely. ");
            
            if (isExplicitMarksRequested) {
                promptBuilder.append(String.format("The instructor explicitly requested an overall target of approximately %d total marks. Assign sensible individual marks so the total sum aligns with this target without omitting required questions. ", totalMarks));
            } else {
                promptBuilder.append("Do NOT skip, omit, or drop any questions from the provided input images or materials unless explicitly instructed to filter them. Extract and format ALL questions found in the photos and texts. Assign sensible individual marks according to the instructor's guidance or reasonable question depth. ");
            }
            if (removeTickMarks) {
                promptBuilder.append("Automatically detect and eliminate any handwritten tick marks, circled options, red ink, or teacher annotations in images. ");
            }
            if (generateNewQuestions) {
                promptBuilder.append("Synthesize fresh, conceptual questions and numerical variations based on the study materials as requested. ");
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
