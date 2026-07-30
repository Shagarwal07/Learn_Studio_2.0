'use client';

import React from 'react';
import { Printer, Save } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { PaperDTO, DynamicSection } from './types';

interface PrintLayoutViewProps {
  paper: PaperDTO;
  dynamicSections: DynamicSection[];
  printLayoutMode: 'formal' | 'worksheet';
  setPrintLayoutMode: (mode: 'formal' | 'worksheet') => void;
  handlePrintTrigger: () => void;
  handleDownloadDocx: () => void;
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
  handlePrintTrigger,
  handleDownloadDocx,
  editTestType,
  editClass,
  editSubject,
  editDuration,
  editChapters,
  editTotalMarks,
}: PrintLayoutViewProps) {
  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Toolbar */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 backdrop-blur-md no-print">
        <div>
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">Print / Export Exam Paper</h4>
          <p className="text-[10px] text-slate-455 mt-1.5 leading-normal">Confirm formatting matches school or practice requirements. Select layout template below.</p>
          
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <span className="text-[11px] font-extrabold text-slate-300 mr-1">Layout Template:</span>
            <button
              onClick={() => setPrintLayoutMode('formal')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer border ${
                printLayoutMode === 'formal'
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                  : 'bg-slate-955 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              📑 Formal Exam (With Marks & Table)
            </button>
            <button
              onClick={() => setPrintLayoutMode('worksheet')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer border ${
                printLayoutMode === 'worksheet'
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                  : 'bg-slate-955 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              📝 Categorized Worksheet (Compact Grid, Zero-Marks)
            </button>
          </div>
        </div>
        <div className="flex gap-2.5 self-start xl:self-auto">
          <button
            onClick={handlePrintTrigger}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer shrink-0 shadow-lg shadow-indigo-500/25"
          >
            <Printer className="w-4 h-4" />
            Download PDF / Print
          </button>
          <button
            onClick={handleDownloadDocx}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer shrink-0 shadow-lg shadow-emerald-500/25"
          >
            <Save className="w-4 h-4" />
            Download MS Word (.docx)
          </button>
        </div>
      </div>

      {/* A4 Container */}
      <div className="overflow-auto bg-slate-955/60 border border-slate-900 rounded-2xl p-4 sm:p-8 flex justify-center shadow-inner print-container">
        <div id="printable-exam-paper" className={`bg-white text-black font-serif rounded-none shadow-2xl mx-auto w-[210mm] min-h-[297mm] flex flex-col space-y-6 text-left relative select-text ${
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
                font-size: 12pt !important;
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
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                margin-bottom: 12px !important;
                font-size: ${printLayoutMode === 'worksheet' ? '12.5pt' : '12pt'} !important;
                line-height: 1.45 !important;
              }
              .print-math-container, .print-math-container p, .print-math-container span {
                font-size: ${printLayoutMode === 'worksheet' ? '12.5pt' : '12pt'} !important;
                line-height: 1.45 !important;
                color: black !important;
                margin: 0 !important;
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
          {printLayoutMode !== 'worksheet' && (
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
          {printLayoutMode === 'worksheet' ? (
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
                const isMcqPresent = sec.questions.some(q => q.questionType === 'MCQ' || (q.options && q.options !== 'null' && q.options !== '{}'));
                
                // Antigravity Continuous Flow Grid calculation for worksheets
                let isCompactGrid = false;
                let gridClass = "space-y-3.5 pt-1.5";
                if (printLayoutMode === 'worksheet' && !isMcqPresent && sec.questions.length >= 3) {
                  if (avgLen <= 26) {
                    isCompactGrid = true;
                    gridClass = "grid grid-cols-4 gap-x-6 gap-y-3.5 pt-2.5 space-y-0";
                  } else if (avgLen <= 48) {
                    isCompactGrid = true;
                    gridClass = "grid grid-cols-2 gap-x-10 gap-y-3.5 pt-2.5 space-y-0";
                  } else if (avgLen <= 70) {
                    gridClass = "space-y-2.5 pt-2";
                  } else {
                    gridClass = "space-y-3.5 pt-2";
                  }
                } else if (printLayoutMode === 'worksheet') {
                  gridClass = "space-y-3.5 pt-2";
                }

                return (
                  <div key={sec.key} className="space-y-2 print-section-container">
                    {printLayoutMode === 'worksheet' ? (
                      <div className="text-left font-extrabold font-serif text-[16px] tracking-wide pt-2.5 pb-0.5 text-black flex items-center gap-2 print-section-header">
                        {!sec.displayLabel.trim().match(/^\d+\./) && <span className="border-l-[4px] border-black h-4.5 inline-block my-auto shrink-0" />}
                        <span>{sec.displayLabel}</span>
                      </div>
                    ) : (
                      <div className="text-center font-bold font-serif text-[14px] tracking-wide pt-1.5 print-section-header">
                        <span className="underline uppercase font-extrabold">{sec.displayLabel}</span>
                        <span className="font-extrabold ml-1.5">
                          {sec.allSameMarks
                            ? `(${sec.count} × ${sec.avgMarks} = ${sec.totalMarks} Marks)`
                            : `(${sec.count} Questions, Total: ${sec.totalMarks} Marks)`
                          }
                        </span>
                      </div>
                    )}

                    <div className={gridClass}>
                      {sec.questions.slice().sort((a, b) => (a.questionOrder || 999) - (b.questionOrder || 999)).map((q, qIdx) => (
                        <div key={q.id} className={`text-[15px] sm:text-[15.5px] relative leading-relaxed text-black print-question-item ${isCompactGrid ? '' : 'space-y-1.5'}`}>
                          <div className={`flex items-baseline justify-between w-full gap-4 ${isCompactGrid ? 'justify-start' : ''}`}>
                            <div className="flex gap-2 items-baseline flex-1 min-w-0">
                              {!isCompactGrid && (
                                <span className="font-extrabold shrink-0 min-w-[22px] text-right text-[15px] select-none">
                                  {qIdx + 1}{printLayoutMode === 'worksheet' ? '.' : ')'}
                                </span>
                              )}
                              <div className="flex-1 font-medium text-black text-left prose prose-slate max-w-none print-math-container text-[15px] sm:text-[15.5px]">
                                <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                                  {formatQuestionText(q.questionText, sec.displayLabel, q.questionType)}
                                </ReactMarkdown>
                              </div>
                            </div>
                            {printLayoutMode !== 'worksheet' && Number(q.marks) > 0 && (
                              <span className="font-extrabold text-[13.5px] sm:text-[14px] shrink-0 ml-auto pl-4 text-right select-none min-w-[40px]">
                                [{q.marks}]
                              </span>
                            )}
                          </div>

                          {q.options && (() => {
                            try {
                              const parsed = JSON.parse(q.options);
                              return (
                                <div className="grid grid-cols-2 w-full gap-x-12 gap-y-2 pl-8 pt-1 text-black print-mcq-options">
                                  {Object.entries(parsed).map(([key, val], optIdx) => {
                                    const stdLabel = ['a', 'b', 'c', 'd', 'e', 'f'][optIdx] || key.toLowerCase();
                                    return (
                                      <div key={key} className="text-[13.5px] sm:text-[14px] text-black flex items-baseline gap-1.5">
                                        <span className="font-extrabold mr-1 text-black shrink-0 select-none">({stdLabel})</span>
                                        <div className="inline-block flex-1 prose prose-slate max-w-none text-black text-[13.5px] sm:text-[14px]">
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
                        </div>
                      ))}
                    </div>
                  </div>
                );
              });
            })()}
          </div>

          {/* Footer divider */}
          <div className="text-center text-[10px] font-bold border-t border-black/25 pt-6 text-slate-500 uppercase tracking-widest mt-auto z-10 print-section-header">
            — End of Examination Paper —
          </div>

          <div className="flex justify-between items-center text-[7.5px] font-mono text-slate-400 pt-2 border-t border-black/10 w-full z-10">
            <span className="font-semibold tracking-wider">LEARNSTUDIO SECURE AUTO-TA SYSTEM</span>
            <span>DOC-ID: LS-TA-{paper.id}-V{paper.version}</span>
            <span>GENERATED: {new Date(paper.createdAt).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
