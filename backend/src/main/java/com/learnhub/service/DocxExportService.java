package com.learnhub.service;

import com.learnhub.dto.GeneratedPaperDTO;
import com.learnhub.dto.GeneratedQuestionDTO;
import org.apache.poi.xwpf.usermodel.*;
import org.openxmlformats.schemas.wordprocessingml.x2006.main.CTPageMar;
import org.openxmlformats.schemas.wordprocessingml.x2006.main.CTSectPr;
import org.springframework.stereotype.Service;
import java.io.ByteArrayOutputStream;
import java.math.BigInteger;
import java.util.List;
import java.util.Map;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class DocxExportService {

    private final ObjectMapper objectMapper = new ObjectMapper();

    public byte[] generateDocx(GeneratedPaperDTO paper) {
        try (XWPFDocument document = new XWPFDocument();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            // 1. Page Margin Settings (Standard 1 inch / 1440 dxa)
            CTSectPr sectPr = document.getDocument().getBody().addNewSectPr();
            CTPageMar pageMar = sectPr.addNewPgMar();
            pageMar.setLeft(BigInteger.valueOf(1440L));
            pageMar.setRight(BigInteger.valueOf(1440L));
            pageMar.setTop(BigInteger.valueOf(1440L));
            pageMar.setBottom(BigInteger.valueOf(1440L));

            // Check if this is Categorized Practice / Worksheet Mode (from photo extraction or explicit testType)
            boolean isWorksheet = (paper.getTotalMarks() == null || paper.getTotalMarks() == 0 
                || "Categorized Practice".equalsIgnoreCase(paper.getTestType()) 
                || (paper.getTitle() != null && paper.getTitle().toLowerCase().contains("worksheet")));

            // 2. Title Header (e.g. RK Coaching Classes / Institute Name)
            String institute = (isWorksheet && (paper.getTestType() == null || "Categorized Practice".equalsIgnoreCase(paper.getTestType()))) 
                ? "R.K. COACHING CLASSES, BALOTRA" 
                : (paper.getTestType() != null ? paper.getTestType() : "R. K. COACHING CLASSES");
            
            XWPFParagraph instParagraph = document.createParagraph();
            instParagraph.setAlignment(ParagraphAlignment.CENTER);
            XWPFRun instRun = instParagraph.createRun();
            instRun.setText(institute.toUpperCase());
            instRun.setBold(true);
            instRun.setFontSize(isWorksheet ? 18 : 20);
            instRun.setFontFamily("Times New Roman");

            if (isWorksheet) {
                // Worksheet Subtitle (e.g. Mathematics Worksheet - Categorized Practice)
                XWPFParagraph subParagraph = document.createParagraph();
                subParagraph.setAlignment(ParagraphAlignment.CENTER);
                subParagraph.setSpacingAfter(40);
                XWPFRun subRun = subParagraph.createRun();
                String subject = paper.getSubject() != null && !paper.getSubject().isBlank() ? paper.getSubject() : "Mathematics";
                subRun.setText(subject + " Worksheet - Categorized Practice");
                subRun.setItalic(true);
                subRun.setFontSize(12);
                subRun.setFontFamily("Times New Roman");

                // Single thick line divider
                XWPFParagraph linePara = document.createParagraph();
                linePara.setAlignment(ParagraphAlignment.CENTER);
                linePara.setSpacingAfter(100);
                XWPFRun lineRun = linePara.createRun();
                lineRun.setText("_________________________________________________________________________________");
                lineRun.setBold(true);
                lineRun.setFontFamily("Times New Roman");
            } else {
                // Divider Line
                XWPFParagraph linePara = document.createParagraph();
                linePara.setAlignment(ParagraphAlignment.CENTER);
                XWPFRun lineRun = linePara.createRun();
                lineRun.setText("_________________________________________________________________________________");
                lineRun.setBold(true);
                lineRun.setFontFamily("Times New Roman");

                // Subject / Class Details
                XWPFParagraph subParagraph = document.createParagraph();
                subParagraph.setAlignment(ParagraphAlignment.CENTER);
                XWPFRun subRun = subParagraph.createRun();
                String titleStr = paper.getTitle() != null ? paper.getTitle() : "Examination Paper";
                String classLevel = paper.getCourse() != null ? paper.getCourse() : "Grade Level";
                String subject = paper.getSubject() != null ? paper.getSubject() : "Subject";
                subRun.setText(titleStr + "   |   Class: " + classLevel + " (" + subject + ")");
                subRun.setBold(true);
                subRun.setFontSize(12);
                subRun.setFontFamily("Times New Roman");

                // Metadata Table (Duration, Syllabus, Marks)
                XWPFTable metaTable = document.createTable(1, 3);
                metaTable.setWidth("100%");
                XWPFTableRow row = metaTable.getRow(0);

                // Col 1: Time
                XWPFParagraph p1 = row.getCell(0).getParagraphs().get(0);
                p1.setAlignment(ParagraphAlignment.LEFT);
                XWPFRun r1 = p1.createRun();
                r1.setText("Time: " + (paper.getDuration() != null ? paper.getDuration() : 100) + " min");
                r1.setBold(true);
                r1.setFontFamily("Times New Roman");
                r1.setFontSize(10);

                // Col 2: Syllabus
                XWPFParagraph p2 = row.getCell(1).getParagraphs().get(0);
                p2.setAlignment(ParagraphAlignment.CENTER);
                XWPFRun r2 = p2.createRun();
                String syllabus = paper.getChapters() != null && !paper.getChapters().isEmpty() ? paper.getChapters() : "Syllabus";
                r2.setText(syllabus);
                r2.setBold(true);
                r2.setFontFamily("Times New Roman");
                r2.setFontSize(10);

                // Col 3: Max Marks
                XWPFParagraph p3 = row.getCell(2).getParagraphs().get(0);
                p3.setAlignment(ParagraphAlignment.RIGHT);
                XWPFRun r3 = p3.createRun();
                r3.setText("Max Marks: " + paper.getTotalMarks());
                r3.setBold(true);
                r3.setFontFamily("Times New Roman");
                r3.setFontSize(10);

                // Add spacing after header
                document.createParagraph();
            }

            // 3. Render Section lists dynamically
            List<GeneratedQuestionDTO> questions = paper.getQuestions() != null ? paper.getQuestions() : new java.util.ArrayList<>();
            java.util.Set<String> allSections = questions.stream()
                    .map(q -> q.getSection() != null && !q.getSection().isBlank() ? q.getSection() : "SECTION_A")
                    .collect(java.util.stream.Collectors.toCollection(java.util.TreeSet::new));
            if (allSections.isEmpty()) {
                allSections.add("SECTION_A");
            }
            for (String sec : allSections) {
                String label = sec.replace("SECTION_", "Section ").replaceAll("_", " ");
                writeSection(document, questions, sec, label, isWorksheet);
            }

            // Footer
            XWPFParagraph footerPara = document.createParagraph();
            footerPara.setAlignment(ParagraphAlignment.CENTER);
            XWPFRun footerRun = footerPara.createRun();
            footerRun.setText("\n— End of Examination Paper —");
            footerRun.setBold(true);
            footerRun.setFontFamily("Times New Roman");
            footerRun.setFontSize(10);

            document.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate DOCX file: " + e.getMessage(), e);
        }
    }

    private void writeSection(XWPFDocument doc, List<GeneratedQuestionDTO> questions, String sectionCode, String sectionHeader, boolean isWorksheet) {
        List<GeneratedQuestionDTO> sectionQs = questions.stream()
                .filter(q -> sectionCode.equalsIgnoreCase(q.getSection()))
                .toList();

        if (sectionQs.isEmpty()) {
            return;
        }

        // Section Title paragraph
        XWPFParagraph secTitle = doc.createParagraph();
        secTitle.setAlignment(isWorksheet ? ParagraphAlignment.LEFT : ParagraphAlignment.CENTER);
        secTitle.setSpacingBefore(120);
        secTitle.setSpacingAfter(60);
        XWPFRun secRun = secTitle.createRun();
        if (isWorksheet) {
            secRun.setText("▌ " + sectionHeader);
            secRun.setBold(true);
            secRun.setFontSize(12);
        } else {
            int sectionMarks = sectionQs.stream().mapToInt(GeneratedQuestionDTO::getMarks).sum();
            secRun.setText(sectionHeader.toUpperCase() + "  (" + sectionQs.size() + " Questions, Total: " + sectionMarks + " Marks)");
            secRun.setBold(true);
            secRun.setUnderline(UnderlinePatterns.SINGLE);
            secRun.setFontSize(11);
        }
        secRun.setFontFamily("Times New Roman");

        // Questions list
        for (int i = 0; i < sectionQs.size(); i++) {
            GeneratedQuestionDTO q = sectionQs.get(i);
            XWPFParagraph qPara = doc.createParagraph();
            qPara.setAlignment(ParagraphAlignment.LEFT);
            qPara.setSpacingAfter(isWorksheet ? 30 : 60);

            // Indentation/numbering run
            XWPFRun numRun = qPara.createRun();
            numRun.setText(isWorksheet ? (i + 1) + ".  " : (i + 1) + ")  ");
            numRun.setBold(true);
            numRun.setFontFamily("Times New Roman");
            numRun.setFontSize(11);

            // Question content run
            XWPFRun qRun = qPara.createRun();
            qRun.setText(q.getQuestionText() != null ? q.getQuestionText() : "");
            qRun.setFontFamily("Times New Roman");
            qRun.setFontSize(11);

            // Marks badge (only for formal exam)
            if (!isWorksheet) {
                XWPFRun marksRun = qPara.createRun();
                marksRun.setText("  [" + q.getMarks() + "]");
                marksRun.setBold(true);
                marksRun.setFontFamily("Times New Roman");
                marksRun.setFontSize(10);
            }

            // MCQ Options
            if ("MCQ".equalsIgnoreCase(q.getQuestionType()) && q.getOptions() != null) {
                try {
                    Map<?, ?> opts = objectMapper.readValue(q.getOptions(), Map.class);
                    if (opts != null && !opts.isEmpty()) {
                        XWPFParagraph optPara = doc.createParagraph();
                        optPara.setIndentationLeft(720); // indent options
                        optPara.setSpacingAfter(60);
                        
                        XWPFRun optRun = optPara.createRun();
                        StringBuilder optStr = new StringBuilder();
                        String[] alpha = {"a", "b", "c", "d", "e", "f"};
                        int optIdx = 0;
                        for (Map.Entry<?, ?> entry : opts.entrySet()) {
                            String label = (optIdx < alpha.length) ? alpha[optIdx] : entry.getKey().toString().toLowerCase();
                            optStr.append("(")
                                  .append(label)
                                  .append(") ")
                                  .append(entry.getValue().toString())
                                  .append("     ");
                            optIdx++;
                        }
                        optRun.setText(optStr.toString().trim());
                        optRun.setFontFamily("Times New Roman");
                        optRun.setFontSize(10);
                    }
                } catch (Exception e) {
                    System.err.println("DOCX render: Failed to parse MCQ options: " + e.getMessage());
                }
            }
        }
    }
}
