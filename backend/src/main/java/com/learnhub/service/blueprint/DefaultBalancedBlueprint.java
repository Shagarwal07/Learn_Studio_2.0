package com.learnhub.service.blueprint;

import com.learnhub.service.PromptSanitizerService.SectionRequirement;
import java.util.ArrayList;
import java.util.List;

/**
 * Handles default 3-section exam generation (Sections A, B, and C).
 * Receives validated and pre-rounded mark totals directly from PromptSanitizerService.
 * Supports exact 10 marks structure and standard 20/30/50 mark splits for totals >= 20.
 */
public class DefaultBalancedBlueprint {

    public static List<SectionRequirement> generate(int targetMarks, boolean useFill) {
        List<SectionRequirement> result = new ArrayList<>();
        String secBName = useFill ? "SECTION_B - Fill in the Blanks" : "SECTION_B - Short Answer Questions";
        String secBType = useFill ? "FILL_IN_THE_BLANK" : "SHORT_ANSWER";

        // Exact handling for 10-mark paper
        if (targetMarks == 10) {
            result.add(SectionRequirement.builder()
                    .sectionName("SECTION_A - Multiple Choice Questions")
                    .questionType("MCQ")
                    .count(2)
                    .marksPerQuestion(1)
                    .build());
            result.add(SectionRequirement.builder()
                    .sectionName(secBName)
                    .questionType(secBType)
                    .count(useFill ? 3 : 1)
                    .marksPerQuestion(useFill ? 1 : 3)
                    .build());
            result.add(SectionRequirement.builder()
                    .sectionName("SECTION_C - Long Answer / Problem Solving")
                    .questionType("LONG_ANSWER")
                    .count(1)
                    .marksPerQuestion(5)
                    .build());
            return result;
        }

        // For roundoff totals >= 20, strictly apply exact 20% A (MCQ @ 1m), 30% B (FIB @ 1m or Short @ 2m), and 50% C (Long @ 5m) weights
        int marksA = Math.max(1, targetMarks * 20 / 100);
        int marksB = Math.max(1, targetMarks * 30 / 100);
        int marksC = Math.max(1, targetMarks * 50 / 100);

        int limA = 1;
        int limB = useFill ? 1 : 2;
        int limC = 5;

        result.add(SectionRequirement.builder()
                .sectionName("SECTION_A - Multiple Choice Questions")
                .questionType("MCQ")
                .count(Math.max(1, marksA / limA))
                .marksPerQuestion(limA)
                .build());
        result.add(SectionRequirement.builder()
                .sectionName(secBName)
                .questionType(secBType)
                .count(Math.max(1, marksB / limB))
                .marksPerQuestion(limB)
                .build());
        result.add(SectionRequirement.builder()
                .sectionName("SECTION_C - Long Answer / Problem Solving")
                .questionType("LONG_ANSWER")
                .count(Math.max(1, marksC / limC))
                .marksPerQuestion(limC)
                .build());
        return result;
    }
}
