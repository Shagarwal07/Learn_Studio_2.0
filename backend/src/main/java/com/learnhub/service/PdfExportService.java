package com.learnhub.service;

import com.learnhub.dto.GeneratedPaperDTO;
import com.learnhub.dto.GeneratedQuestionDTO;
import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import com.lowagie.text.pdf.draw.LineSeparator;
import org.springframework.stereotype.Service;
import java.io.ByteArrayOutputStream;
import java.awt.Color;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import java.util.stream.Collectors;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class PdfExportService {

    private final ObjectMapper objectMapper = new ObjectMapper();

    public byte[] generatePdf(GeneratedPaperDTO paper) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            // A4 page with comfortable studio margins (36pt = 12.7mm)
            Document document = new Document(PageSize.A4, 36, 36, 36, 36);
            PdfWriter writer = PdfWriter.getInstance(document, out);

            boolean isWorksheet = (paper.getTotalMarks() == null || paper.getTotalMarks() == 0 
                || "Categorized Practice".equalsIgnoreCase(paper.getTestType()) 
                || (paper.getTitle() != null && paper.getTitle().toLowerCase().contains("worksheet")));

            // Draw clean formal double border on every page if it's a formal exam
            if (!isWorksheet) {
                writer.setPageEvent(new PdfPageEventHelper() {
                    @Override
                    public void onEndPage(PdfWriter writer, Document document) {
                        PdfContentByte cb = writer.getDirectContent();
                        cb.setColorStroke(Color.BLACK);
                        cb.setLineWidth(1.2f);
                        cb.rectangle(18, 18, PageSize.A4.getWidth() - 36, PageSize.A4.getHeight() - 36);
                        cb.stroke();
                        cb.setLineWidth(0.6f);
                        cb.rectangle(22, 22, PageSize.A4.getWidth() - 44, PageSize.A4.getHeight() - 44);
                        cb.stroke();
                    }
                });
            }

            document.open();

            // Typography fonts (Times-Roman studio series)
            Font titleFont = FontFactory.getFont(FontFactory.TIMES_BOLD, isWorksheet ? 18 : 22);
            Font subtitleFont = FontFactory.getFont(FontFactory.TIMES_BOLD, 12);
            Font metaFont = FontFactory.getFont(FontFactory.TIMES_BOLD, 11);
            Font secHeaderFont = FontFactory.getFont(FontFactory.TIMES_BOLD, 12);
            Font qNumFont = FontFactory.getFont(FontFactory.TIMES_BOLD, 11);
            Font qTextFont = FontFactory.getFont(FontFactory.TIMES_ROMAN, 11);
            Font marksFont = FontFactory.getFont(FontFactory.TIMES_BOLD, 11);
            Font optionFont = FontFactory.getFont(FontFactory.TIMES_ROMAN, 10.5f);
            Font optionLabelFont = FontFactory.getFont(FontFactory.TIMES_BOLD, 10.5f);

            // 1. Header & Title
            String institute = (isWorksheet && (paper.getTestType() == null || "Categorized Practice".equalsIgnoreCase(paper.getTestType()))) 
                ? "R. K. COACHING CLASSES, BALOTRA" 
                : (paper.getTestType() != null ? paper.getTestType() : "R. K. COACHING CLASSES");
            
            Paragraph titlePara = new Paragraph(institute.toUpperCase(), titleFont);
            titlePara.setAlignment(Element.ALIGN_CENTER);
            titlePara.setSpacingAfter(4f);
            document.add(titlePara);

            if (isWorksheet) {
                String subject = paper.getSubject() != null && !paper.getSubject().isBlank() ? paper.getSubject() : "Mathematics";
                Paragraph subPara = new Paragraph(subject + " Worksheet – Categorized Practice", FontFactory.getFont(FontFactory.TIMES_ITALIC, 13));
                subPara.setAlignment(Element.ALIGN_CENTER);
                subPara.setSpacingAfter(8f);
                document.add(subPara);

                LineSeparator line = new LineSeparator(1f, 100f, Color.BLACK, Element.ALIGN_CENTER, -2f);
                document.add(new Chunk(line));
                document.add(new Paragraph(" "));
            } else {
                LineSeparator lineTop = new LineSeparator(1.5f, 100f, Color.BLACK, Element.ALIGN_CENTER, -2f);
                document.add(new Chunk(lineTop));

                String titleStr = paper.getTitle() != null ? paper.getTitle() : "Examination Paper";
                String classLevel = paper.getCourse() != null ? paper.getCourse() : "9th";
                String subject = paper.getSubject() != null ? paper.getSubject() : "Mathematics";
                Paragraph subPara = new Paragraph(titleStr + "   |   Class: " + classLevel + " (" + subject + ")", subtitleFont);
                subPara.setAlignment(Element.ALIGN_CENTER);
                subPara.setSpacingBefore(6f);
                subPara.setSpacingAfter(8f);
                document.add(subPara);

                // Metadata Table (Time | Chapters | Max Marks)
                PdfPTable metaTable = new PdfPTable(new float[]{25f, 50f, 25f});
                metaTable.setWidthPercentage(100);
                metaTable.setSpacingAfter(12f);

                PdfPCell cellTime = new PdfPCell(new Phrase("Time: " + (paper.getDuration() != null ? paper.getDuration() : 100) + " min", metaFont));
                cellTime.setBorder(Rectangle.TOP | Rectangle.BOTTOM);
                cellTime.setBorderWidth(1.2f);
                cellTime.setPaddingTop(5f);
                cellTime.setPaddingBottom(6f);
                cellTime.setHorizontalAlignment(Element.ALIGN_LEFT);
                metaTable.addCell(cellTime);

                String syllabus = paper.getChapters() != null && !paper.getChapters().isEmpty() ? paper.getChapters() : "Syllabus Core";
                PdfPCell cellSyllabus = new PdfPCell(new Phrase(syllabus.toUpperCase(), metaFont));
                cellSyllabus.setBorder(Rectangle.TOP | Rectangle.BOTTOM);
                cellSyllabus.setBorderWidth(1.2f);
                cellSyllabus.setPaddingTop(5f);
                cellSyllabus.setPaddingBottom(6f);
                cellSyllabus.setHorizontalAlignment(Element.ALIGN_CENTER);
                metaTable.addCell(cellSyllabus);

                PdfPCell cellMarks = new PdfPCell(new Phrase("Max Marks: " + paper.getTotalMarks(), metaFont));
                cellMarks.setBorder(Rectangle.TOP | Rectangle.BOTTOM);
                cellMarks.setBorderWidth(1.2f);
                cellMarks.setPaddingTop(5f);
                cellMarks.setPaddingBottom(6f);
                cellMarks.setHorizontalAlignment(Element.ALIGN_RIGHT);
                metaTable.addCell(cellMarks);

                document.add(metaTable);
            }

            // 2. Questions & Sections
            List<GeneratedQuestionDTO> questions = paper.getQuestions() != null ? paper.getQuestions() : new java.util.ArrayList<>();
            Set<String> allSections = questions.stream()
                    .map(q -> q.getSection() != null && !q.getSection().isBlank() ? q.getSection() : "SECTION_A")
                    .collect(Collectors.toCollection(TreeSet::new));
            if (allSections.isEmpty()) {
                allSections.add("SECTION_A");
            }

            for (String sec : allSections) {
                String label = sec.replace("SECTION_", "Section ").replaceAll("_", " ");
                writeSection(document, questions, sec, label, isWorksheet, secHeaderFont, qNumFont, qTextFont, marksFont, optionLabelFont, optionFont);
            }

            // Footer
            Paragraph footer = new Paragraph("— End of Examination Paper —", FontFactory.getFont(FontFactory.TIMES_BOLD, 10, Color.DARK_GRAY));
            footer.setAlignment(Element.ALIGN_CENTER);
            footer.setSpacingBefore(20f);
            document.add(footer);

            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate studio-grade PDF file: " + e.getMessage(), e);
        }
    }

    private void writeSection(Document doc, List<GeneratedQuestionDTO> questions, String sectionCode, String sectionHeader, 
                              boolean isWorksheet, Font headerFont, Font qNumFont, Font qTextFont, Font marksFont, Font optLabelFont, Font optFont) throws Exception {
        
        List<GeneratedQuestionDTO> sectionQs = questions.stream()
                .filter(q -> sectionCode.equalsIgnoreCase(q.getSection()))
                .sorted((a, b) -> (a.getQuestionOrder() != null ? a.getQuestionOrder() : 999) - (b.getQuestionOrder() != null ? b.getQuestionOrder() : 999))
                .toList();

        if (sectionQs.isEmpty()) {
            return;
        }

        // Section Title
        Paragraph secPara;
        if (isWorksheet) {
            secPara = new Paragraph("▌ " + sectionHeader, headerFont);
            secPara.setAlignment(Element.ALIGN_LEFT);
        } else {
            int totalSecMarks = sectionQs.stream().mapToInt(GeneratedQuestionDTO::getMarks).sum();
            Font underlinedFont = FontFactory.getFont(FontFactory.TIMES_BOLD, 12, Font.UNDERLINE | Font.BOLD);
            secPara = new Paragraph(sectionHeader.toUpperCase() + "  (" + sectionQs.size() + " Questions, Total: " + totalSecMarks + " Marks)", underlinedFont);
            secPara.setAlignment(Element.ALIGN_CENTER);
        }
        secPara.setSpacingBefore(10f);
        secPara.setSpacingAfter(8f);
        doc.add(secPara);

        // Render Questions
        for (int i = 0; i < sectionQs.size(); i++) {
            GeneratedQuestionDTO q = sectionQs.get(i);

            // Create 2-column table for question text + right-aligned mark badge
            PdfPTable qTable = new PdfPTable(isWorksheet ? new float[]{100f} : new float[]{88f, 12f});
            qTable.setWidthPercentage(100);
            qTable.setSpacingAfter(4f);
            qTable.setSpacingBefore(4f);

            // Format question text with numbering and sub-question spacing
            String qNumStr = isWorksheet ? (i + 1) + ".  " : (i + 1) + ")  ";
            String rawText = q.getQuestionText() != null ? q.getQuestionText() : "";
            
            // Apply formatting for blanks if needed
            if (sectionCode.toUpperCase().contains("SECTION_B") || "FILL_IN_THE_BLANK".equalsIgnoreCase(q.getQuestionType())) {
                if (!rawText.contains("___") && !rawText.contains("...")) {
                    if (rawText.endsWith(".") || rawText.endsWith("?")) {
                        rawText = rawText.substring(0, rawText.length() - 1) + " __________" + rawText.substring(rawText.length() - 1);
                    } else {
                        rawText += " __________";
                    }
                }
            }

            Paragraph qTextPara = new Paragraph();
            qTextPara.add(new Chunk(qNumStr, qNumFont));

            // Split into sub-lines for Case Studies / Section G so points are cleanly separated
            String[] lines = rawText.split("\\r?\\n");
            for (int l = 0; l < lines.length; l++) {
                String line = lines[l].trim();
                if (line.isEmpty()) continue;
                if (l > 0) {
                    qTextPara.add(Chunk.NEWLINE);
                    qTextPara.add(new Chunk("    ")); // Indent sub-questions
                }
                qTextPara.add(new Chunk(line, qTextFont));
            }

            PdfPCell textCell = new PdfPCell(qTextPara);
            textCell.setBorder(Rectangle.NO_BORDER);
            textCell.setPadding(0);
            textCell.setPaddingBottom(4f);
            qTable.addCell(textCell);

            // Right-aligned mark badge for formal exams
            if (!isWorksheet) {
                Paragraph markPara = new Paragraph(" [" + q.getMarks() + "]", marksFont);
                markPara.setAlignment(Element.ALIGN_RIGHT);
                PdfPCell markCell = new PdfPCell(markPara);
                markCell.setBorder(Rectangle.NO_BORDER);
                markCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
                markCell.setVerticalAlignment(Element.ALIGN_TOP);
                markCell.setPadding(0);
                qTable.addCell(markCell);
            }

            doc.add(qTable);

            // Render MCQ Options in 2x2 grid table
            if ("MCQ".equalsIgnoreCase(q.getQuestionType()) && q.getOptions() != null) {
                try {
                    Map<?, ?> opts = objectMapper.readValue(q.getOptions(), Map.class);
                    if (opts != null && !opts.isEmpty()) {
                        PdfPTable optTable = new PdfPTable(new float[]{50f, 50f});
                        optTable.setWidthPercentage(93); // slightly narrower for indent
                        optTable.setHorizontalAlignment(Element.ALIGN_RIGHT);
                        optTable.setSpacingAfter(8f);

                        String[] alpha = {"a", "b", "c", "d", "e", "f"};
                        int optIdx = 0;
                        for (Map.Entry<?, ?> entry : opts.entrySet()) {
                            String label = (optIdx < alpha.length) ? alpha[optIdx] : entry.getKey().toString().toLowerCase();
                            Paragraph optPara = new Paragraph();
                            optPara.add(new Chunk("(" + label + ") ", optLabelFont));
                            optPara.add(new Chunk(entry.getValue().toString(), optFont));

                            PdfPCell optCell = new PdfPCell(optPara);
                            optCell.setBorder(Rectangle.NO_BORDER);
                            optCell.setPaddingBottom(5f);
                            optTable.addCell(optCell);
                            optIdx++;
                        }
                        // If odd number of options, add empty cell to balance grid
                        if (opts.size() % 2 != 0) {
                            PdfPCell emptyCell = new PdfPCell(new Phrase(""));
                            emptyCell.setBorder(Rectangle.NO_BORDER);
                            optTable.addCell(emptyCell);
                        }
                        doc.add(optTable);
                    }
                } catch (Exception e) {
                    System.err.println("Studio PDF render: Failed to parse MCQ options: " + e.getMessage());
                }
            }
        }
    }
}
