package com.learnhub.service.blueprint;

import com.learnhub.service.PromptSanitizerService.SectionRequirement;
import java.util.ArrayList;
import java.util.List;

/**
 * Handles the generation of the 7-section Super Duper Blueprint structure
 * (Sections A through G) strictly with zero calculations for 50 or 100 mark papers.
 */
public class SuperDuperBlueprint {

    public static List<SectionRequirement> generate(int targetMarks) {
        List<SectionRequirement> result = new ArrayList<>();
        // Pure static, zero-calculation blueprints strictly matching instructor's 7-section framework (50 or 100 marks)
        if (targetMarks >= 75) {
            // 100 Marks Blueprint (A:10m, B:10m, C:4m, D:16m, E:20m, F:16m, G:24m = 100 Marks)
            result.add(SectionRequirement.builder().sectionName("SECTION_A - Multiple Choice Questions").questionType("MCQ").count(10).marksPerQuestion(1).build());
            result.add(SectionRequirement.builder().sectionName("SECTION_B - Fill in the Blanks").questionType("FILL_IN_THE_BLANK").count(10).marksPerQuestion(1).build());
            result.add(SectionRequirement.builder().sectionName("SECTION_C - Assertion Reason Questions").questionType("ASSERTION_REASON").count(4).marksPerQuestion(1).build());
            result.add(SectionRequirement.builder().sectionName("SECTION_D - Very Short Answer Type Questions").questionType("VERY_SHORT_ANSWER").count(8).marksPerQuestion(2).build());
            result.add(SectionRequirement.builder().sectionName("SECTION_E - Short Answer Type Questions").questionType("SHORT_ANSWER").count(5).marksPerQuestion(4).build());
            result.add(SectionRequirement.builder().sectionName("SECTION_F - Long Answer Type Questions").questionType("LONG_ANSWER").count(2).marksPerQuestion(8).build());
            result.add(SectionRequirement.builder().sectionName("SECTION_G - Case Study Questions").questionType("CASE_STUDY").count(3).marksPerQuestion(8).build());
        } else {
            // 50 Marks Blueprint (A:5m, B:5m, C:2m, D:8m, E:10m, F:8m, G:12m = 50 Marks)
            result.add(SectionRequirement.builder().sectionName("SECTION_A - Multiple Choice Questions").questionType("MCQ").count(5).marksPerQuestion(1).build());
            result.add(SectionRequirement.builder().sectionName("SECTION_B - Fill in the Blanks").questionType("FILL_IN_THE_BLANK").count(5).marksPerQuestion(1).build());
            result.add(SectionRequirement.builder().sectionName("SECTION_C - Assertion Reason Questions").questionType("ASSERTION_REASON").count(2).marksPerQuestion(1).build());
            result.add(SectionRequirement.builder().sectionName("SECTION_D - Very Short Answer Type Questions").questionType("VERY_SHORT_ANSWER").count(8).marksPerQuestion(1).build());
            result.add(SectionRequirement.builder().sectionName("SECTION_E - Short Answer Type Questions").questionType("SHORT_ANSWER").count(5).marksPerQuestion(2).build());
            result.add(SectionRequirement.builder().sectionName("SECTION_F - Long Answer Type Questions").questionType("LONG_ANSWER").count(2).marksPerQuestion(4).build());
            result.add(SectionRequirement.builder().sectionName("SECTION_G - Case Study Questions").questionType("CASE_STUDY").count(3).marksPerQuestion(4).build());
        }
        return result;
    }
}
