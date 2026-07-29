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

        // 1. Parse target marks and questions from input first
        int explicitTotalMarks = 0;
        boolean isExplicitMarksRequested = false;
        Pattern marksPattern = Pattern.compile("(\\d+)\\s*(?:marks?|mks|pts?|points?)", Pattern.CASE_INSENSITIVE);
        Matcher marksMatcher = marksPattern.matcher(input);
        String lowerInput = input.toLowerCase();
        boolean isPerQuestionMark = lowerInput.contains("for each question") || lowerInput.contains("per question") || lowerInput.contains("each question") || lowerInput.contains("marks each") || lowerInput.contains("mark each");
        if (marksMatcher.find() && !isPerQuestionMark) {
            explicitTotalMarks = Integer.parseInt(marksMatcher.group(1));
            if (explicitTotalMarks > 0) {
                isExplicitMarksRequested = true;
                log.info("Parsed instructor explicit target total marks: {}", explicitTotalMarks);
            }
        }

        Pattern generalQPattern = Pattern.compile("(\\d+)\\s*(?:questions?|ques|q's|qs\\b)", Pattern.CASE_INSENSITIVE);
        Matcher generalQMatcher = generalQPattern.matcher(input);
        int detectedQCount = 0;
        if (generalQMatcher.find()) {
            detectedQCount = Integer.parseInt(generalQMatcher.group(1));
        }
        if (isPerQuestionMark && marksMatcher.find() && detectedQCount > 0) {
            int perQMarks = Integer.parseInt(marksMatcher.group(1));
            explicitTotalMarks = detectedQCount * perQMarks;
            isExplicitMarksRequested = true;
        }

        // 2. Parse section instructions if specified (e.g., "5 mcq, 2 long")
        List<SectionRequirement> sections = parseSectionsFromPrompt(input);
        boolean isMcqOnly = (sections.size() == 1 && "MCQ".equalsIgnoreCase(sections.get(0).getQuestionType()))
                || (containsKeywords(input, "mcq", "objective", "multiple choice", "mcqs only", "all mcqs") 
                    && !containsKeywords(input, "long", "short", "fill in", "direct", "section b", "section c", "subjective"));
        
        boolean isShortOnly = (sections.size() == 1 && "SHORT_ANSWER".equalsIgnoreCase(sections.get(0).getQuestionType()))
                || (containsKeywords(input, "short only", "only short", "all short", "short answer only", "only short questions", "short questions only", "short answers only", "all short answer") 
                    && !containsKeywords(input, "mcq", "objective", "multiple choice", "long", "essay", "section a", "section c"));

        boolean isLongOnly = (sections.size() == 1 && "LONG_ANSWER".equalsIgnoreCase(sections.get(0).getQuestionType()))
                || (containsKeywords(input, "long only", "only long", "all long", "long answer only", "only long questions", "long questions only", "long answers only", "all long answer", "essay only") 
                    && !containsKeywords(input, "mcq", "objective", "multiple choice", "short", "brief", "section a", "section b"));

        if (sections.isEmpty()) {
            if (isMcqOnly) {
                int count = detectedQCount > 0 ? detectedQCount : (explicitTotalMarks > 0 ? explicitTotalMarks : 20);
                int marksPerQ = 1;
                if (explicitTotalMarks > 0 && count > 0) {
                    marksPerQ = Math.max(1, explicitTotalMarks / count);
                }
                sections.add(SectionRequirement.builder()
                        .sectionName("Section A - Multiple Choice Questions")
                        .questionType("MCQ")
                        .count(count)
                        .marksPerQuestion(marksPerQ)
                        .build());
            } else if (isShortOnly) {
                int count = detectedQCount;
                int marksPerQ = 3;
                if (explicitTotalMarks > 0 && count > 0) {
                    marksPerQ = Math.max(1, explicitTotalMarks / count);
                } else if (explicitTotalMarks > 0) {
                    marksPerQ = (explicitTotalMarks % 3 == 0) ? 3 : ((explicitTotalMarks % 4 == 0) ? 4 : 2);
                    count = Math.max(1, explicitTotalMarks / marksPerQ);
                } else if (count == 0) {
                    count = 10;
                }
                sections.add(SectionRequirement.builder()
                        .sectionName("Section B - Short Answer Questions")
                        .questionType("SHORT_ANSWER")
                        .count(count)
                        .marksPerQuestion(marksPerQ)
                        .build());
            } else if (isLongOnly) {
                int count = detectedQCount;
                int marksPerQ = 5;
                if (explicitTotalMarks > 0 && count > 0) {
                    marksPerQ = Math.max(1, explicitTotalMarks / count);
                } else if (explicitTotalMarks > 0) {
                    marksPerQ = (explicitTotalMarks >= 50 && explicitTotalMarks % 10 == 0) ? 10 : 5;
                    count = Math.max(1, explicitTotalMarks / marksPerQ);
                } else if (count == 0) {
                    count = 5;
                }
                sections.add(SectionRequirement.builder()
                        .sectionName("Section C - Long Answer / Problem Solving")
                        .questionType("LONG_ANSWER")
                        .count(count)
                        .marksPerQuestion(marksPerQ)
                        .build());
            } else if (explicitTotalMarks > 0) {
                // Dynamically build a rigid, mathematically balanced blueprint matching the requested marks exactly
                sections.addAll(buildBalancedSectionsForMarks(explicitTotalMarks, detectedQCount));
            } else if (detectedQCount > 0) {
                int countA = Math.max(1, (int) Math.round(detectedQCount * 0.4));
                int countB = Math.max(1, (int) Math.round(detectedQCount * 0.4));
                int countC = Math.max(1, detectedQCount - countA - countB);
                sections.add(SectionRequirement.builder()
                        .sectionName("Section A - Multiple Choice Questions")
                        .questionType("MCQ")
                        .count(countA)
                        .marksPerQuestion(1)
                        .build());
                sections.add(SectionRequirement.builder()
                        .sectionName("Section B - Short Answer Questions")
                        .questionType("SHORT_ANSWER")
                        .count(countB)
                        .marksPerQuestion(3)
                        .build());
                sections.add(SectionRequirement.builder()
                        .sectionName("Section C - Long Answer / Problem Solving")
                        .questionType("LONG_ANSWER")
                        .count(countC)
                        .marksPerQuestion(5)
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
        
        // If totalMarks was overridden by explicit sections or our balanced blueprint, ensure consistency
        if (isExplicitMarksRequested && totalMarks != explicitTotalMarks) {
            log.info("Adjusting total marks from explicit request {} to exact section sum {}", explicitTotalMarks, totalMarks);
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
            
            promptBuilder.append(String.format("\nEXACT PAPER BLUEPRINT & MARKING STRUCTURE (CRITICAL REQUIREMENT):\n" +
                "You MUST generate exactly %d total questions with an overall total of exactly %d marks. " +
                "Do NOT generate only MCQs unless explicitly demanded by the instructor. " +
                "You MUST rigorously follow this precise section-by-section distribution without skipping or altering counts or mark weights:\n", totalQuestions, totalMarks));
            
            for (SectionRequirement sec : sections) {
                String optionInstruction = "MCQ".equalsIgnoreCase(sec.getQuestionType()) 
                    ? "MUST populate the 'options' array with exactly 4 viable choices and set 'questionType' to 'MCQ'."
                    : "MUST leave the 'options' array completely empty [] and set 'questionType' to '" + sec.getQuestionType() + "'. Do NOT provide multiple choice options or MCQ format for this section.";
                promptBuilder.append(String.format("- %s: Exactly %d questions, Question Type: %s, Marks per question: %d (Section Total: %d marks). Instruction: %s\n",
                    sec.getSectionName(), sec.getCount(), sec.getQuestionType(), sec.getMarksPerQuestion(), sec.getCount() * sec.getMarksPerQuestion(), optionInstruction));
            }
            
            promptBuilder.append(String.format("\nFINAL JSON VERIFICATION CHECKLIST:\n" +
                "1. The JSON array MUST contain exactly %d elements in total (no more, no less).\n" +
                "2. The sum of the 'marks' field across all %d objects in the JSON array MUST equal exactly %d marks.\n" +
                "3. Only MCQ questions should contain options. For SHORT_ANSWER or LONG_ANSWER sections (such as when only short or long questions are requested, or in Sections B & C), you MUST leave the 'options' array completely empty [].\n" +
                "4. Every question in the generated JSON array MUST have completely unique text, concepts, and scenarios. Absolutely NO duplicates or repeating questions are allowed.\n", 
                totalQuestions, totalQuestions, totalMarks));
            
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

    private List<SectionRequirement> buildBalancedSectionsForMarks(int targetMarks, int targetQCount) {
        List<SectionRequirement> result = new ArrayList<>();
        // If no custom question count was forced, use spotless pedagogical standard patterns
        if (targetQCount <= 0) {
            switch (targetMarks) {
                case 10:
                    result.add(SectionRequirement.builder().sectionName("Section A - Multiple Choice Questions").questionType("MCQ").count(2).marksPerQuestion(1).build());
                    result.add(SectionRequirement.builder().sectionName("Section B - Short Answer Questions").questionType("SHORT_ANSWER").count(1).marksPerQuestion(3).build());
                    result.add(SectionRequirement.builder().sectionName("Section C - Long Answer / Problem Solving").questionType("LONG_ANSWER").count(1).marksPerQuestion(5).build());
                    return result;
                case 15:
                    result.add(SectionRequirement.builder().sectionName("Section A - Multiple Choice Questions").questionType("MCQ").count(3).marksPerQuestion(1).build());
                    result.add(SectionRequirement.builder().sectionName("Section B - Short Answer Questions").questionType("SHORT_ANSWER").count(2).marksPerQuestion(2).build());
                    result.add(SectionRequirement.builder().sectionName("Section C - Long Answer / Problem Solving").questionType("LONG_ANSWER").count(2).marksPerQuestion(4).build());
                    return result;
                case 20:
                    result.add(SectionRequirement.builder().sectionName("Section A - Multiple Choice Questions").questionType("MCQ").count(4).marksPerQuestion(1).build());
                    result.add(SectionRequirement.builder().sectionName("Section B - Short Answer Questions").questionType("SHORT_ANSWER").count(2).marksPerQuestion(3).build());
                    result.add(SectionRequirement.builder().sectionName("Section C - Long Answer / Problem Solving").questionType("LONG_ANSWER").count(2).marksPerQuestion(5).build());
                    return result;
                case 25:
                    result.add(SectionRequirement.builder().sectionName("Section A - Multiple Choice Questions").questionType("MCQ").count(5).marksPerQuestion(1).build());
                    result.add(SectionRequirement.builder().sectionName("Section B - Short Answer Questions").questionType("SHORT_ANSWER").count(2).marksPerQuestion(4).build());
                    result.add(SectionRequirement.builder().sectionName("Section C - Long Answer / Problem Solving").questionType("LONG_ANSWER").count(2).marksPerQuestion(6).build());
                    return result;
                case 30:
                    result.add(SectionRequirement.builder().sectionName("Section A - Multiple Choice Questions").questionType("MCQ").count(6).marksPerQuestion(1).build());
                    result.add(SectionRequirement.builder().sectionName("Section B - Short Answer Questions").questionType("SHORT_ANSWER").count(3).marksPerQuestion(3).build());
                    result.add(SectionRequirement.builder().sectionName("Section C - Long Answer / Problem Solving").questionType("LONG_ANSWER").count(3).marksPerQuestion(5).build());
                    return result;
                case 40:
                    result.add(SectionRequirement.builder().sectionName("Section A - Multiple Choice Questions").questionType("MCQ").count(8).marksPerQuestion(1).build());
                    result.add(SectionRequirement.builder().sectionName("Section B - Short Answer Questions").questionType("SHORT_ANSWER").count(4).marksPerQuestion(3).build());
                    result.add(SectionRequirement.builder().sectionName("Section C - Long Answer / Problem Solving").questionType("LONG_ANSWER").count(2).marksPerQuestion(10).build());
                    return result;
                case 50:
                    result.add(SectionRequirement.builder().sectionName("Section A - Multiple Choice Questions").questionType("MCQ").count(10).marksPerQuestion(1).build());
                    result.add(SectionRequirement.builder().sectionName("Section B - Short Answer Questions").questionType("SHORT_ANSWER").count(5).marksPerQuestion(3).build());
                    result.add(SectionRequirement.builder().sectionName("Section C - Long Answer / Problem Solving").questionType("LONG_ANSWER").count(5).marksPerQuestion(5).build());
                    return result;
                case 60:
                    result.add(SectionRequirement.builder().sectionName("Section A - Multiple Choice Questions").questionType("MCQ").count(6).marksPerQuestion(2).build());
                    result.add(SectionRequirement.builder().sectionName("Section B - Short Answer Questions").questionType("SHORT_ANSWER").count(6).marksPerQuestion(3).build());
                    result.add(SectionRequirement.builder().sectionName("Section C - Long Answer / Problem Solving").questionType("LONG_ANSWER").count(3).marksPerQuestion(10).build());
                    return result;
                case 70:
                    result.add(SectionRequirement.builder().sectionName("Section A - Multiple Choice Questions").questionType("MCQ").count(7).marksPerQuestion(2).build());
                    result.add(SectionRequirement.builder().sectionName("Section B - Short Answer Questions").questionType("SHORT_ANSWER").count(7).marksPerQuestion(3).build());
                    result.add(SectionRequirement.builder().sectionName("Section C - Long Answer / Problem Solving").questionType("LONG_ANSWER").count(5).marksPerQuestion(7).build());
                    return result;
                case 75:
                    result.add(SectionRequirement.builder().sectionName("Section A - Multiple Choice Questions").questionType("MCQ").count(15).marksPerQuestion(1).build());
                    result.add(SectionRequirement.builder().sectionName("Section B - Short Answer Questions").questionType("SHORT_ANSWER").count(5).marksPerQuestion(4).build());
                    result.add(SectionRequirement.builder().sectionName("Section C - Long Answer / Problem Solving").questionType("LONG_ANSWER").count(4).marksPerQuestion(10).build());
                    return result;
                case 80:
                    result.add(SectionRequirement.builder().sectionName("Section A - Multiple Choice Questions").questionType("MCQ").count(8).marksPerQuestion(2).build());
                    result.add(SectionRequirement.builder().sectionName("Section B - Short Answer Questions").questionType("SHORT_ANSWER").count(6).marksPerQuestion(4).build());
                    result.add(SectionRequirement.builder().sectionName("Section C - Long Answer / Problem Solving").questionType("LONG_ANSWER").count(4).marksPerQuestion(10).build());
                    return result;
                case 100:
                    result.add(SectionRequirement.builder().sectionName("Section A - Multiple Choice Questions").questionType("MCQ").count(10).marksPerQuestion(2).build());
                    result.add(SectionRequirement.builder().sectionName("Section B - Short Answer Questions").questionType("SHORT_ANSWER").count(6).marksPerQuestion(5).build());
                    result.add(SectionRequirement.builder().sectionName("Section C - Long Answer / Problem Solving").questionType("LONG_ANSWER").count(5).marksPerQuestion(10).build());
                    return result;
                default:
                    // For custom mark totals, enforce strictly ~20% A, ~30% B, and ~50% C
                    if (targetMarks <= 6) {
                        result.add(SectionRequirement.builder().sectionName("Section A - Multiple Choice Questions").questionType("MCQ").count(targetMarks).marksPerQuestion(1).build());
                        return result;
                    }
                    int targetA = Math.max(1, (int) Math.round(targetMarks * 0.20));
                    int targetB = Math.max(1, (int) Math.round(targetMarks * 0.30));
                    
                    int marksPerA = targetA >= 14 ? 2 : 1;
                    int countA = Math.max(1, targetA / marksPerA);
                    targetA = countA * marksPerA;
                    
                    int marksPerB = targetB >= 15 ? (targetB % 5 == 0 ? 5 : (targetB % 4 == 0 ? 4 : 3)) : 2;
                    int countB = Math.max(1, targetB / marksPerB);
                    targetB = countB * marksPerB;
                    
                    int targetC_actual = Math.max(1, targetMarks - targetA - targetB);
                    int marksPerC = targetC_actual >= 30 && targetC_actual % 10 == 0 ? 10 : (targetC_actual >= 15 && targetC_actual % 5 == 0 ? 5 : (targetC_actual % 4 == 0 ? 4 : (targetC_actual % 3 == 0 ? 3 : (targetC_actual % 2 == 0 ? 2 : targetC_actual))));
                    int countC = Math.max(1, targetC_actual / marksPerC);
                    
                    result.add(SectionRequirement.builder().sectionName("Section A - Multiple Choice Questions").questionType("MCQ").count(countA).marksPerQuestion(marksPerA).build());
                    result.add(SectionRequirement.builder().sectionName("Section B - Short Answer Questions").questionType("SHORT_ANSWER").count(countB).marksPerQuestion(marksPerB).build());
                    result.add(SectionRequirement.builder().sectionName("Section C - Long Answer / Problem Solving").questionType("LONG_ANSWER").count(countC).marksPerQuestion(marksPerC).build());
                    return result;
            }
        } else {
            // Both marks and question count were forced by user
            ManagerService.PaperBlueprint bp = ManagerService.createBlueprint(targetMarks, targetQCount);
            if (bp.sectionA.questionCount > 0) {
                result.add(SectionRequirement.builder().sectionName("Section A - Multiple Choice Questions").questionType("MCQ").count(bp.sectionA.questionCount).marksPerQuestion(bp.sectionA.marksPerQuestion).build());
            }
            if (bp.sectionB.questionCount > 0) {
                result.add(SectionRequirement.builder().sectionName("Section B - Short Answer Questions").questionType("SHORT_ANSWER").count(bp.sectionB.questionCount).marksPerQuestion(bp.sectionB.marksPerQuestion).build());
            }
            if (bp.sectionC.questionCount > 0) {
                result.add(SectionRequirement.builder().sectionName("Section C - Long Answer / Problem Solving").questionType("LONG_ANSWER").count(bp.sectionC.questionCount).marksPerQuestion(bp.sectionC.marksPerQuestion).build());
            }
            return result;
        }
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
