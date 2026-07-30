package com.learnhub.service.blueprint;

import com.learnhub.service.PromptSanitizerService.SectionRequirement;
import java.util.ArrayList;
import java.util.List;

/**
 * Handles single-section overrides when instructor specifies keywords like
 * "only mcq", "only short", "only long", or "only fill in the blanks".
 * Receives the clean target total marks from PromptSanitizerService and purely divides by individual question mark limits.
 */
public class SingleSectionBlueprint {

    public static List<SectionRequirement> generateMcqOnly(int targetMarks) {
        List<SectionRequirement> result = new ArrayList<>();
        int marksPerQ = 1;
        result.add(SectionRequirement.builder()
                .sectionName("SECTION_A - Multiple Choice Questions")
                .questionType("MCQ")
                .count(Math.max(1, targetMarks / marksPerQ))
                .marksPerQuestion(marksPerQ)
                .build());
        return result;
    }

    public static List<SectionRequirement> generateShortOnly(int targetMarks) {
        List<SectionRequirement> result = new ArrayList<>();
        int marksPerQ = 2;
        result.add(SectionRequirement.builder()
                .sectionName("SECTION_B - Short Answer Questions")
                .questionType("SHORT_ANSWER")
                .count(Math.max(1, targetMarks / marksPerQ))
                .marksPerQuestion(marksPerQ)
                .build());
        return result;
    }

    public static List<SectionRequirement> generateLongOnly(int targetMarks) {
        List<SectionRequirement> result = new ArrayList<>();
        int marksPerQ = 5;
        result.add(SectionRequirement.builder()
                .sectionName("SECTION_C - Long Answer / Problem Solving")
                .questionType("LONG_ANSWER")
                .count(Math.max(1, targetMarks / marksPerQ))
                .marksPerQuestion(marksPerQ)
                .build());
        return result;
    }

    public static List<SectionRequirement> generateFillOnly(int targetMarks) {
        List<SectionRequirement> result = new ArrayList<>();
        int marksPerQ = 1;
        result.add(SectionRequirement.builder()
                .sectionName("SECTION_B - Fill in the Blanks")
                .questionType("FILL_IN_THE_BLANK")
                .count(Math.max(1, targetMarks / marksPerQ))
                .marksPerQuestion(marksPerQ)
                .build());
        return result;
    }
}
