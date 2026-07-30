package com.learnhub.service;

import lombok.Builder;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import com.learnhub.service.blueprint.SuperDuperBlueprint;
import com.learnhub.service.blueprint.SingleSectionBlueprint;
import com.learnhub.service.blueprint.DefaultBalancedBlueprint;

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
        return sanitizePrompt(rawPrompt, subjectName, batchName, false);
    }

    public SanitizedPromptResult sanitizePrompt(String rawPrompt, String subjectName, String batchName, boolean hasUploadedImages) {
        String input = rawPrompt != null ? rawPrompt.trim() : "";
        log.info("Sanitizing prompt for subject '{}', batch '{}', hasUploadedImages {}: '{}'", subjectName, batchName, hasUploadedImages, input);

        boolean removeTickMarks = true; // Always clean vision photos
        boolean generateNewQuestions = containsKeywords(input, "new", "fresh", "numerical", "change values", "different numbers", "create new");

        if (hasUploadedImages) {
            log.info("Processing UI Photo Upload mode: Applying Antigravity Document Architect digitization prompt without forced mark blueprints.");
            StringBuilder visionPrompt = new StringBuilder();
            visionPrompt.append(String.format("Subject: %s (Batch: %s). [SYSTEM: EXPERT DOCUMENT ARCHITECT]\n", 
                subjectName != null ? subjectName : "Subject", batchName != null ? batchName : "General"));
            visionPrompt.append("You are an elite educational material document architect specializing in high-fidelity worksheet digitization. Your primary directive is to transform images of printed worksheets into pristine, semantic, continuous-flow categorized JSON structures.\n\n");
            if (!input.isBlank()) {
                visionPrompt.append("Instructor Note: ").append(input).append(".\n\n");
            }
            visionPrompt.append("[COGNITIVE FORCING: THE PRE-FLIGHT CHECK]\n");
            visionPrompt.append("Before generating the output items, silently analyze the attached images and adhere to these structural checks:\n");
            visionPrompt.append("1. Identify the main category instruction headings (e.g., '1. Write the number which comes just before:', '2. Fill in the blanks:', '3. Word Problems').\n");
            visionPrompt.append("2. Determine the optimal grouping required to maintain a continuous, flowing practice layout (strictly avoiding repetitive single-column Q&A boilerplate formats).\n");
            visionPrompt.append("3. Identify all handwritten text, red ink marks, tick marks, and student solutions that must be completely eradicated and replaced with standardized blank input spaces (e.g., '______').\n\n");
            visionPrompt.append("[ARCHITECTURAL RULES FOR EXTRACTION]\n");
            visionPrompt.append("1. **Zero-Inference Digitization:** Extract ONLY the original printed exercise text. Do not hallucinate questions or alter the phrasing.\n");
            visionPrompt.append("2. **Structural Integrity & Grouping (CRITICAL):** Group all related practice exercises under their respective category headings by setting 'section' to the exact instruction title (e.g., '1. Write the number which comes just before:'). Do NOT repeat these instructions inside every individual item! For each sub-item, put ONLY the clean target exercise expression (e.g., '_____ 174', '400 _____ 402', or '98 × (24 × 56) = ____________') into 'questionText'. Do NOT split grouped exercises into verbose single-column questions.\n");
            visionPrompt.append("3. **The Blank Canvas:** Replace all handwritten student answers and completed blanks with a uniform underline representation ('______') representing the physical space to write.\n");
            visionPrompt.append("4. **Brand Header & Zero-Marks Rule:** Format under 'R.K. Coaching Classes' practice series. Set 'marks': 0 for all items since this is an ungraded categorized practice worksheet. Keep 'solutionExplanation' under 20 words per question so the entire paper generates completely without token truncation.\n");

            return SanitizedPromptResult.builder()
                    .sanitizedPrompt(visionPrompt.toString().trim())
                    .sectionRequirements(new ArrayList<>())
                    .totalMarks(0) // No forced marks (null/0 value)
                    .totalQuestions(0) // No forced question counts
                    .isMcqOnly(false)
                    .removeTickMarks(true)
                    .generateNewQuestions(generateNewQuestions)
                    .build();
        }

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

        // Validate and normalize target total marks before checking categories or generating blueprints
        if (explicitTotalMarks <= 0) {
            explicitTotalMarks = 20; // Default paper total marks when not explicitly specified
        } else if (explicitTotalMarks < 20 && explicitTotalMarks != 10) {
            throw new IllegalArgumentException("Please give correct marks. Supported paper totals are 10 marks, or round values greater than or equal to 20.");
        } else if (explicitTotalMarks >= 20 && explicitTotalMarks % 10 != 0) {
            int original = explicitTotalMarks;
            explicitTotalMarks = ((explicitTotalMarks + 5) / 10) * 10;
            log.info("Rounded target marks from {} to nearest roundoff {}", original, explicitTotalMarks);
        }

        // 2. Parse section instructions if specified (e.g., "5 mcq, 2 long")
        List<SectionRequirement> sections = parseSectionsFromPrompt(input);
        
        boolean isSuperDuperBlueprint = input != null && (input.toLowerCase().contains("super duper blueprint") || input.toLowerCase().contains("super duper"));
        boolean hasFillInTheBlanks = input != null && (input.toLowerCase().contains("fill in the blank") || input.toLowerCase().contains("fill in the blanks") || input.toLowerCase().contains("fib"));
        
        boolean isMcqOnly = (sections.size() == 1 && "MCQ".equalsIgnoreCase(sections.get(0).getQuestionType()))
                || (containsKeywords(input, "mcq", "objective", "multiple choice", "mcqs only", "all mcqs") 
                    && !containsKeywords(input, "long", "short", "fill in", "direct", "section b", "section c", "subjective"));
        
        boolean isShortOnly = (sections.size() == 1 && "SHORT_ANSWER".equalsIgnoreCase(sections.get(0).getQuestionType()))
                || (containsKeywords(input, "short only", "only short", "all short", "short answer only", "only short questions", "short questions only", "short answers only", "all short answer") 
                    && !containsKeywords(input, "mcq", "objective", "multiple choice", "long", "essay", "fill", "section a", "section c"));

        boolean isLongOnly = (sections.size() == 1 && "LONG_ANSWER".equalsIgnoreCase(sections.get(0).getQuestionType()))
                || (containsKeywords(input, "long only", "only long", "all long", "long answer only", "only long questions", "long questions only", "long answers only", "all long answer", "essay only") 
                    && !containsKeywords(input, "mcq", "objective", "multiple choice", "short", "brief", "fill", "section a", "section b"));

        boolean isFillOnly = (sections.size() == 1 && "FILL_IN_THE_BLANK".equalsIgnoreCase(sections.get(0).getQuestionType()))
                || (containsKeywords(input, "fill only", "only fill", "all fill in the blanks", "only fill in the blanks", "only fill in the blank", "fill in the blanks only") 
                    && !containsKeywords(input, "mcq", "objective", "multiple choice", "short", "long", "section a", "section c"));

        if (sections.isEmpty() || isSuperDuperBlueprint) {
            sections.clear();
            if (isSuperDuperBlueprint) {
                sections.addAll(SuperDuperBlueprint.generate(explicitTotalMarks));
            } else if (isMcqOnly) {
                sections.addAll(SingleSectionBlueprint.generateMcqOnly(explicitTotalMarks));
            } else if (isShortOnly) {
                sections.addAll(SingleSectionBlueprint.generateShortOnly(explicitTotalMarks));
            } else if (isLongOnly) {
                sections.addAll(SingleSectionBlueprint.generateLongOnly(explicitTotalMarks));
            } else if (isFillOnly) {
                sections.addAll(SingleSectionBlueprint.generateFillOnly(explicitTotalMarks));
            } else {
                sections.addAll(DefaultBalancedBlueprint.generate(explicitTotalMarks, hasFillInTheBlanks));
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
            
            if (isSuperDuperBlueprint) {
                promptBuilder.append("\nSPECIAL CASE ACTIVATED: SUPER DUPER BLUEPRINT (7-SECTION PEDAGOGICAL FRAMEWORK FROM SECTIONS A TO G).\n");
            }

            promptBuilder.append(String.format("\nEXACT PAPER BLUEPRINT & MARKING STRUCTURE (CRITICAL REQUIREMENT):\n" +
                "You MUST generate exactly %d total questions with an overall total of exactly %d marks. " +
                "Do NOT generate only MCQs unless explicitly demanded by the instructor. " +
                "You MUST rigorously follow this precise section-by-section distribution without skipping or altering counts or mark weights:\n", totalQuestions, totalMarks));
            
            for (SectionRequirement sec : sections) {
                boolean needsOptions = "MCQ".equalsIgnoreCase(sec.getQuestionType()) || "ASSERTION_REASON".equalsIgnoreCase(sec.getQuestionType());
                String optionInstruction = needsOptions 
                    ? "MUST populate the 'options' array with exactly 4 viable choices and set 'questionType' to '" + sec.getQuestionType() + "'."
                    : "MUST leave the 'options' array completely empty [] and set 'questionType' to '" + sec.getQuestionType() + "'. Do NOT provide multiple choice options or MCQ format for this section.";
                
                String secId = sec.getSectionName().contains(" - ") ? sec.getSectionName().split(" - ")[0].trim() : sec.getSectionName().replace(" ", "_").toUpperCase();
                if (!secId.startsWith("SECTION_")) {
                    secId = secId.replace("Section ", "SECTION_").replace("SECTION ", "SECTION_");
                }
                
                promptBuilder.append(String.format("- %s (Set JSON field 'section' to '%s'): Exactly %d questions, Question Type: %s, Marks per question: %d (Section Total: %d marks). Instruction: %s\n",
                    sec.getSectionName(), secId, sec.getCount(), sec.getQuestionType(), sec.getMarksPerQuestion(), sec.getCount() * sec.getMarksPerQuestion(), optionInstruction));
            }
            
            promptBuilder.append(String.format("\nFINAL JSON VERIFICATION AND FORMATTING CHECKLIST:\n" +
                "1. The JSON array MUST contain exactly %d elements in total (no more, no less).\n" +
                "2. The sum of the 'marks' field across all %d objects in the JSON array MUST equal exactly %d marks.\n" +
                "3. Only MCQ and ASSERTION_REASON questions should contain options. For FILL_IN_THE_BLANK, SHORT_ANSWER, VERY_SHORT_ANSWER, LONG_ANSWER, or CASE_STUDY sections, you MUST leave the 'options' array completely empty [].\n" +
                "4. Every question in the generated JSON array MUST have completely unique text, concepts, and scenarios. Absolutely NO duplicates or repeating questions are allowed.\n" +
                "5. CONCISE METADATA RULE: Keep 'solutionExplanation' and 'markingScheme' strictly under 30 words per question so the entire exam paper generates completely without token truncation.\n" +
                "6. MCQ LABELS: Ensure MCQ options are cleanly structured without unnatural numerical numbering (0, 1, 2, 3).\n" +
                "7. FILL-IN-THE-BLANKS: For Fill-in-the-Blank questions (Section B), embed explicit underscores (e.g., '__________') at the exact target word position.\n" +
                "8. SUB-QUESTIONS: For Case Study or Long Answer questions (Section G) containing multiple sub-prompts, explicitly prefix each sub-question with lowercase alphabetical letters '(a)', '(b)', '(c)', '(d)' on new lines.\n", 
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
