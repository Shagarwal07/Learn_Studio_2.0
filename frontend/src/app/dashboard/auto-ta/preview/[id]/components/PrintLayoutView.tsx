'use client';

import React, { useState, useRef } from 'react';
import { Printer, Save, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { PaperDTO, DynamicSection } from './types';

interface PrintLayoutViewProps {
  paper: PaperDTO;
  dynamicSections: DynamicSection[];
  printLayoutMode: 'formal' | 'worksheet' | 'answerKey';
  setPrintLayoutMode: (mode: 'formal' | 'worksheet' | 'answerKey') => void;
  handleDownloadPrettyPrintPdf: () => void;
  handleDownloadDocx: () => void;
  handleDownloadStudioPdf?: () => void;
  editTestType: string;
  editClass: string;
  editSubject: string;
  editDuration: number;
  editChapters: string;
  editTotalMarks: number;
}

export function PrintLayoutView({
  paper,
  dynamicSections,
  printLayoutMode,
  setPrintLayoutMode,
  handleDownloadPrettyPrintPdf,
  handleDownloadDocx,
  handleDownloadStudioPdf,
  editTestType,
  editClass,
  editSubject,
  editDuration,
  editChapters,
  editTotalMarks,
}: PrintLayoutViewProps) {
  const [lineMultiplier, setLineMultiplier] = useState(1);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScrollPage = (direction: 1 | -1) => {
    if (scrollContainerRef.current) {
      // 297mm height is roughly 1122px at 96dpi
      scrollContainerRef.current.scrollBy({ top: direction * 1122, behavior: 'smooth' });
    }
  };

  const printSizeMain = printLayoutMode === 'worksheet' ? 'print:!text-[16pt]' : 'print:!text-[14pt]';
  const printSizeSub = printLayoutMode === 'worksheet' ? 'print:!text-[14pt]' : 'print:!text-[12pt]';

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Toolbar */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 backdrop-blur-md no-print">
        <div>
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">Print / Export Exam Paper</h4>
          <p className="text-[10px] text-slate-455 mt-1.5 leading-normal">Confirm formatting matches school or practice requirements. Select layout template below.</p>
          
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <span className="text-[11px] font-extrabold text-slate-300 mr-1">Layout Template:</span>
            <select
              value={printLayoutMode}
              onChange={(e) => setPrintLayoutMode(e.target.value as any)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-955 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer appearance-none pr-8 relative"
              style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2394a3b8%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right .7rem top 50%', backgroundSize: '.65rem auto' }}
            >
              <option value="formal" className="bg-slate-900 text-slate-200">📑 Formal Extract</option>
              <option value="worksheet" className="bg-slate-900 text-slate-200">📝 Practice Worksheet</option>
              <option value="answerKey" className="bg-slate-900 text-slate-200">🔑 Answer Key</option>
            </select>
            {printLayoutMode === 'worksheet' && (
              <div className="flex items-center gap-1 ml-2 xl:ml-4 border border-slate-700 bg-slate-900 rounded-lg overflow-hidden h-[30px]">
                <button onClick={() => setLineMultiplier(Math.max(1, lineMultiplier - 1))} className="px-2.5 text-slate-400 hover:text-white hover:bg-slate-800 font-bold transition-all">-</button>
                <span className="text-[11px] font-mono text-slate-300 min-w-[44px] text-center border-x border-slate-700/50 leading-[30px]">{lineMultiplier}x Lines</span>
                <button onClick={() => setLineMultiplier(Math.min(5, lineMultiplier + 1))} className="px-2.5 text-slate-400 hover:text-white hover:bg-slate-800 font-bold transition-all">+</button>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-3 xl:mt-0 xl:self-auto self-start">
          {handleDownloadStudioPdf && (
            <button
              onClick={handleDownloadStudioPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-bold transition-all cursor-pointer shrink-0 shadow-sm"
            >
              <FileText className="w-3.5 h-3.5" />
              PDF
            </button>
          )}
          <button
            onClick={handleDownloadPrettyPrintPdf}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold transition-all cursor-pointer shrink-0 shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            Pretty print
          </button>
          <button
            onClick={handleDownloadDocx}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition-all cursor-pointer shrink-0 shadow-sm"
          >
            <Save className="w-3.5 h-3.5" />
            Word
          </button>
        </div>
      </div>

      {/* A4 Container */}
      <div className="relative group">
        <div ref={scrollContainerRef} className="overflow-auto bg-slate-955/60 border border-slate-900 rounded-2xl p-4 sm:p-8 shadow-inner print-container max-h-[85vh]">
        <div id="printable-exam-paper" className={`bg-white text-black font-serif rounded-none shadow-2xl mx-auto w-[210mm] min-w-[210mm] shrink-0 print:max-w-none print:w-[210mm] min-h-[297mm] h-fit block overflow-visible space-y-6 text-left relative select-text ${
          printLayoutMode === 'worksheet' ? 'p-8 sm:p-10 border-none' : 'p-9 sm:p-12 border-[5px] border-double border-black'
        }`}>
          
          {/* Print Stylesheet injection for clean multi-page pagination and optimal typography */}
          <style dangerouslySetInnerHTML={{ __html: `
            @page {
              size: A4 portrait;
              margin: ${printLayoutMode === 'worksheet' ? '12mm 15mm 12mm 15mm' : '14mm 12mm 14mm 12mm'};
              border: ${printLayoutMode === 'worksheet' ? 'none' : '3.5px double #000000'};
              padding: ${printLayoutMode === 'worksheet' ? '0' : '4.5mm'};
            }
            @media print {
              html, body {
                width: 210mm !important;
                height: auto !important;
                overflow: visible !important;
                background: white !important;
                color: black !important;
                margin: 0 !important;
                padding: 0 !important;
              }
              aside, nav, header, button, .no-print, .tab-selector, .print-toolbar, .lg\\:col-span-3, .review-decision-panel {
                display: none !important;
              }
              main, .max-w-7xl, .lg\\:col-span-2, .space-y-5, .overflow-auto, .print-container {
                width: 100% !important;
                max-width: 100% !important;
                height: auto !important;
                max-height: none !important;
                overflow: visible !important;
                display: block !important;
                padding: 0 !important;
                margin: 0 !important;
                background: transparent !important;
                border: none !important;
                box-shadow: none !important;
              }
              /* Override Tailwind Prose locking font sizes to 1rem (12pt) */
              .prose, .prose p, .prose span, .prose strong, .prose em, .prose ul, .prose li {
                font-size: inherit !important;
                line-height: inherit !important;
              }
              #printable-exam-paper {
                position: static !important;
                width: 100% !important;
                max-width: 100% !important;
                min-height: auto !important;
                height: auto !important;
                padding: 0 !important;
                margin: 0 !important;
                background: white !important;
                color: black !important;
                font-family: "Times New Roman", Times, Georgia, serif !important;
                box-shadow: none !important;
                border: none !important;
                display: block !important;
                overflow: visible !important;
              }
              .print-section-container {
                margin-bottom: 18px !important;
                display: block !important;
                overflow: visible !important;
              }
              .print-section-header {
                page-break-after: avoid !important;
                break-after: avoid !important;
                font-size: 13.5pt !important;
                font-weight: bold !important;
                padding-top: 8px !important;
                padding-bottom: 4px !important;
              }
              .print-question-item {
                page-break-inside: auto !important;
                break-inside: auto !important;
                margin-bottom: 16px !important;
                font-size: ${printLayoutMode === 'worksheet' ? '12.5pt' : '12pt'} !important;
                line-height: 1.45 !important;
                display: block !important;
                overflow: visible !important;
              }
              .print-math-container, .print-math-container p, .print-math-container span {
                font-size: ${printLayoutMode === 'worksheet' ? '12.5pt' : '12pt'} !important;
                line-height: 1.45 !important;
                color: black !important;
                margin: 0 !important;
                overflow: visible !important;
              }
              .print-mcq-options {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                font-size: 11pt !important;
                margin-top: 4px !important;
              }
              .print-mcq-options div, .print-mcq-options p {
                font-size: 11pt !important;
                line-height: 1.35 !important;
                color: black !important;
                margin: 0 !important;
              }
            }
          ` }} />

          {/* Circular Watermark Logo (Only in Formal Exam Layout) */}
          {printLayoutMode === 'worksheet' && (
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.035] pointer-events-none select-none z-0">
              <div className="w-[440px] h-[440px] rounded-full border-[8px] border-double border-black flex items-center justify-center relative">
                <div className="w-[410px] h-[410px] rounded-full border-2 border-dashed border-black flex items-center justify-center">
                  <div className="w-[320px] h-[320px] rounded-full border-4 border-black flex flex-col items-center justify-center bg-transparent">
                    <span className="text-9xl font-black font-serif tracking-tighter text-black leading-none">RK</span>
                    <span className="text-[10px] font-black tracking-[0.25em] uppercase mt-4 text-black">ESTD 2015</span>
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-full h-full rotate-[-90deg]" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                    <path id="watermarkCirclePath" d="M 50,50 m -40,0 a 40,40 0 1,1 80,0 a 40,40 0 1,1 -80,0" fill="none" />
                    <text className="text-[7px] font-black uppercase tracking-[0.165em]" fill="black">
                      <textPath href="#watermarkCirclePath" startOffset="50%" textAnchor="middle">
                        • R. K. COACHING CLASSES • SUCCESS THROUGH DEDICATION •
                      </textPath>
                    </text>
                  </svg>
                </div>
              </div>
            </div>
          )}

          {/* Header */}
          {printLayoutMode !== 'worksheet' ? (
            <div className="pb-1.5 relative z-10 w-full text-center">
              <h1 className="text-2xl sm:text-[28px] font-black tracking-wider uppercase text-black font-serif my-1 leading-none">
                {editTestType && editTestType.length < 45 ? editTestType : 'R. K. COACHING CLASSES, BALOTRA'}
              </h1>
              <div className="text-sm sm:text-[15px] font-bold italic text-black pb-1.5 font-serif">
                {editSubject || 'Mathematics'} Worksheet – Categorized Practice
              </div>
              <div className="border-b-[2.5px] border-black w-full my-1.5"></div>
            </div>
          ) : (
            <div className="pb-1.5 relative z-10 w-full text-center">
              <h1 className="text-2xl sm:text-[32px] font-black tracking-wider uppercase text-black font-serif my-1.5 leading-none whitespace-nowrap">
                R. K. COACHING CLASSES
              </h1>
              <div className="border-b-[3.5px] border-black w-full my-1"></div>
              
              <div className="text-center font-bold text-sm sm:text-base my-2 flex items-center justify-center gap-2">
                <span className="bg-yellow-200 border border-black text-black px-3 py-0.5 font-extrabold uppercase text-[11px] tracking-wider">{editTestType}</span>
                <span className="text-black font-extrabold text-[15px] font-serif">Class – {editClass || '9th'} ({editSubject || 'Mathematics'})</span>
              </div>
              
              <div className="grid grid-cols-3 items-center text-xs sm:text-[13px] font-bold font-serif py-1.5 border-t-2 border-b-4 border-double border-black mt-2">
                <div className="justify-self-start border-2 border-black px-2.5 py-0.5 text-black">
                  Time – {editDuration} min
                </div>
                <div className="justify-self-center text-black font-black tracking-wide uppercase text-center max-w-[340px] line-clamp-2 text-ellipsis overflow-hidden">
                  {editChapters || 'Syllabus Core'}
                </div>
                <div className="justify-self-end border-2 border-black px-2.5 py-0.5 text-black">
                  M.Marks – {editTotalMarks}
                </div>
              </div>
            </div>
          )}

          {/* Question Sections dynamically mapped across all pages */}
          <div className="space-y-6 pt-1 flex-1 text-black relative z-10">
            {(() => {
              const formatQuestionText = (text: string, secName: string, qType: string): string => {
                let t = text ? text.trim() : '';
                if (!t) return '';

                const secUpper = (secName || '').toUpperCase();
                const typeUpper = (qType || '').toUpperCase();

                // 1. Fill-in-the-Blanks: Add Blank Lines in Section B or FILL_IN_THE_BLANK
                if (secUpper.includes('SECTION_B') || secUpper.includes('FILL') || typeUpper === 'FILL_IN_THE_BLANK') {
                  if (!t.includes('___') && !t.includes('...')) {
                    if (t.endsWith('.') || t.endsWith('?')) {
                      t = t.slice(0, -1) + ' __________' + t.slice(-1);
                    } else {
                      t += ' __________';
                    }
                  }
                }

                // 2. Label Sub-questions in Section G / Case Study / Long form
                if (secUpper.includes('SECTION_G') || secUpper.includes('CASE') || typeUpper === 'CASE_STUDY' || typeUpper === 'LONG_ANSWER') {
                  const lines = t.split(/\n+/).map(l => l.trim()).filter(Boolean);
                  if (lines.length > 1) {
                    const alpha = ['(a)', '(b)', '(c)', '(d)', '(e)', '(f)', '(g)', '(h)'];
                    let subIdx = 0;
                    return lines.map((line, idx) => {
                      if (idx === 0 && !line.match(/^[\-\*\•\d]+\.?\s/) && !line.match(/^\([a-zA-Z\d]+\)\s/)) {
                        return line;
                      }
                      if (line.match(/^\([a-zA-Z\d]+\)\s/)) {
                        return `\n\n${line}`;
                      }
                      const cleaned = line.replace(/^[\-\*\•\d]+\.?\s+/, '').trim();
                      const lbl = alpha[subIdx++] || `(${subIdx})`;
                      return `\n\n**${lbl}** ${cleaned}`;
                    }).join('');
                  }
                }

                return t;
              };

              return dynamicSections.map((sec) => {
                const avgLen = sec.questions.reduce((sum, q) => sum + (q.questionText?.length || 0), 0) / (sec.questions.length || 1);
                const isMcqPresent = sec.questions.some(q => q.questionType === 'MCQ' || (q.options && q.options !== 'null' && q.options !== '{}' && q.options !== '[]' && q.options.length > 2));
                
                // Antigravity Continuous Flow Grid calculation for worksheets
                let isCompactGrid = false;
                let gridClass = "space-y-3.5 pt-1.5";
                if (!isMcqPresent && sec.questions.length >= 3) {
                  // Only apply 2-column grid for very short single-word type questions (like antonyms, word meanings)
                  if (avgLen <= 15) {
                    isCompactGrid = true;
                    gridClass = "grid grid-cols-2 gap-x-10 gap-y-4 pt-2.5 space-y-0";
                  } else {
                    gridClass = "space-y-3.5 pt-2";
                  }
                } else if (printLayoutMode === 'worksheet') {
                  gridClass = "space-y-3.5 pt-2";
                }

                // Word Bank parsing logic
                let cleanLabel = sec.displayLabel;
                let wordBank = null;
                const wbMatch = sec.displayLabel.match(/\(([^)]+)\)/) || sec.displayLabel.match(/\[([^\]]+)\]/);
                if (wbMatch && (wbMatch[1].includes("/") || wbMatch[1].includes(","))) {
                  wordBank = wbMatch[1];
                  cleanLabel = sec.displayLabel.replace(wbMatch[0], "").trim();
                }

                return (
                  <div key={sec.key} className="space-y-2 print-section-container">
                    {printLayoutMode === 'worksheet' ? (
                      <div className={`text-left font-extrabold font-serif text-[18px] tracking-wide pt-2.5 pb-0.5 text-black flex items-center gap-2 print-section-header ${printSizeMain}`}>
                        {!cleanLabel.trim().match(/^\d+\./) && <span className="border-l-[4px] border-black h-5 inline-block my-auto shrink-0" />}
                        <span>{cleanLabel}</span>
                      </div>
                    ) : (
                      <div className={`text-left font-bold font-serif text-[16px] tracking-wide pt-1.5 print-section-header ${printSizeMain}`}>
                        <span className="underline uppercase font-extrabold">{cleanLabel}</span>
                        {Number(sec.totalMarks) > 0 && (
                          <span className="font-extrabold ml-1.5">
                            {sec.allSameMarks
                              ? `(${sec.count} × ${sec.avgMarks} = ${sec.totalMarks} Marks)`
                              : `(${sec.count} Questions, Total: ${sec.totalMarks} Marks)`
                            }
                          </span>
                        )}
                      </div>
                    )}

                    {wordBank && (
                      <div className="flex flex-wrap gap-x-8 gap-y-3 justify-center border-2 border-black border-dashed py-3 px-8 mx-auto my-4 w-11/12">
                        {wordBank.split(/[\/,]/).map((w, i) => (
                          <span key={i} className="font-bold text-black tracking-widest text-[15px]">{w.trim()}</span>
                        ))}
                      </div>
                    )}

                    <div className={gridClass}>
                      {sec.questions.slice().sort((a, b) => (a.questionOrder || 999) - (b.questionOrder || 999)).map((q, qIdx) => (
                        <div key={q.id} className={`text-[18px] sm:text-[19px] relative leading-relaxed text-black print-question-item block overflow-visible ${printSizeMain} ${isCompactGrid ? '' : 'space-y-3 mb-6'}`}>
                          <div className="block w-full overflow-visible relative">
                            {printLayoutMode !== 'worksheet' && Number(q.marks) > 0 && (
                              <span className={`float-right font-extrabold text-[15px] sm:text-[16px] pl-4 text-right select-none min-w-[40px] print-mark-badge ${printSizeSub}`}>
                                [{q.marks}]
                              </span>
                            )}
                            <div className={`font-medium text-black text-left prose prose-slate max-w-none print-math-container text-[18px] sm:text-[19px] block overflow-visible ${printSizeMain}`}>
                              {!(/^\s*\d+[\)\.]\s*/.test(q.questionText || '')) && (
                                <span className={`font-extrabold mr-2 float-left select-none inline-block text-[18px] ${printSizeMain}`}>
                                  {qIdx + 1}{printLayoutMode === 'worksheet' ? '.' : ')'}
                                </span>
                              )}
                              <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                                {formatQuestionText(q.questionText, sec.displayLabel, q.questionType)}
                              </ReactMarkdown>
                            </div>
                            <div className="clear-both"></div>
                          </div>

                          {q.options && (() => {
                            try {
                              const parsed = JSON.parse(q.options);
                              if (Array.isArray(parsed) && parsed.length === 0) return null;
                              return (
                                <div className={printLayoutMode === 'worksheet' ? "grid grid-cols-2 w-full gap-x-12 gap-y-2 pl-8 pt-1 text-black print-mcq-options" : "flex flex-wrap w-full gap-x-10 gap-y-2 pl-8 pt-1 text-black print-mcq-options"}>
                                  {Object.entries(parsed).map(([key, val], optIdx) => {
                                    const stdLabel = ['a', 'b', 'c', 'd', 'e', 'f'][optIdx] || key.toLowerCase();
                                    return (
                                        <div key={key} className={`text-[16px] sm:text-[17px] text-black flex items-baseline gap-2 ${printSizeSub}`}>
                                          <span className="font-extrabold mr-1 text-black shrink-0 select-none">({stdLabel})</span>
                                          <div className={`inline-block flex-1 prose prose-slate max-w-none text-black text-[16px] sm:text-[17px] ${printSizeSub}`}>
                                          <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                                            {val as string}
                                          </ReactMarkdown>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            } catch (e) {
                              return null;
                            }
                          })()}
                          
                          {/* Dynamic Spacing for Worksheet Mode */}
                          {printLayoutMode === 'worksheet' && (() => {
                            const qt = (q.questionType || '').toUpperCase();
                            if (qt === 'LONG_ANSWER' || qt === 'LONG' || qt === 'ESSAY') {
                              return (
                                <div className="w-full mt-5 space-y-6">
                                  {Array.from({ length: 4 * lineMultiplier }).map((_, i) => (
                                    <div key={i} className="border-b border-black/30 border-dashed w-full h-1"></div>
                                  ))}
                                </div>
                              );
                            } else if (qt === 'SHORT_ANSWER' || qt === 'SHORT' || qt === 'VERY_SHORT_ANSWER') {
                              return (
                                <div className="w-full mt-5 space-y-6">
                                  {Array.from({ length: 2 * lineMultiplier }).map((_, i) => (
                                    <div key={i} className="border-b border-black/30 border-dashed w-full h-1"></div>
                                  ))}
                                </div>
                              );
                            }
                            return null;
                          })()}
                          {/* Answer Key Rendering */}
                          {printLayoutMode === 'answerKey' && (
                            <div className="w-full mt-4 bg-emerald-50/50 print:bg-transparent print:border-l-2 print:border-emerald-500 rounded-lg p-4 border border-emerald-500/20 text-[15px] sm:text-[16px]">
                              {q.correctAnswer && (
                                <div className="mb-3">
                                  <span className="font-extrabold text-emerald-700 print:text-black uppercase tracking-widest text-[11px] block mb-1">Correct Answer</span>
                                  <div className="prose prose-sm max-w-none text-black print-math-container">
                                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                                      {q.correctAnswer}
                                    </ReactMarkdown>
                                  </div>
                                </div>
                              )}
                              {q.solutionSteps && (
                                <div className="mb-3">
                                  <span className="font-extrabold text-emerald-700 print:text-black uppercase tracking-widest text-[11px] block mb-1">Solution / Explanation</span>
                                  <div className="prose prose-sm max-w-none text-black print-math-container">
                                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                                      {q.solutionSteps}
                                    </ReactMarkdown>
                                  </div>
                                </div>
                              )}
                              {q.markingScheme && (
                                <div>
                                  <span className="font-extrabold text-emerald-700 print:text-black uppercase tracking-widest text-[11px] block mb-1">Marking Scheme</span>
                                  <div className="prose prose-sm max-w-none text-black print-math-container">
                                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                                      {q.markingScheme}
                                    </ReactMarkdown>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              });
            })()}
          </div>

          {/* Footer divider */}
          <div className="text-center text-[10px] font-bold border-t border-black/25 pt-6 text-slate-500 uppercase tracking-widest mt-16 z-10 print-section-header block overflow-visible">
            — End of Examination Paper —
          </div>

          <div className="flex justify-between items-center text-[7.5px] font-mono text-slate-400 pt-2 border-t border-black/10 w-full z-10">
            <span className="font-semibold tracking-wider">LEARNSTUDIO SECURE AUTO-TA SYSTEM</span>
            <span>DOC-ID: LS-TA-{paper.id}-V{paper.version}</span>
            <span>GENERATED: {new Date(paper.createdAt).toLocaleString()}</span>
          </div>
        </div>
      </div>
        
      {/* Floating Pagination Controls */}
      <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 no-print">
        <button 
          onClick={() => handleScrollPage(-1)}
          className="w-10 h-10 rounded-full bg-slate-800 hover:bg-indigo-600 text-white flex items-center justify-center shadow-lg border border-slate-700 hover:border-indigo-500 transition-all cursor-pointer"
          title="Previous Page"
        >
          <span className="text-xl leading-none -mt-1">↑</span>
        </button>
        <button 
          onClick={() => handleScrollPage(1)}
          className="w-10 h-10 rounded-full bg-slate-800 hover:bg-indigo-600 text-white flex items-center justify-center shadow-lg border border-slate-700 hover:border-indigo-500 transition-all cursor-pointer"
          title="Next Page"
        >
          <span className="text-xl leading-none mt-1">↓</span>
        </button>
      </div>
      </div>
    </div>
  );
}
