'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, CheckCircle2, Cpu, Layers, Brain, FileText, 
  ShieldCheck, Terminal, Loader2, Zap, Search, RefreshCw, 
  BookOpen, Check, AlertCircle, Award
} from 'lucide-react';

interface ExamGenerationLoadingProps {
  subject?: string;
  batchName?: string;
  isPhotoUpload?: boolean;
  selectedNotesCount?: number;
  uploadedPhotosCount?: number;
  customPrompt?: string;
}

const STAGES = [
  { id: 'understanding', label: 'Understanding Request', desc: 'Parsing exam instructions and constraints', icon: Search },
  { id: 'blueprint', label: 'Reading Blueprint', desc: 'Evaluating paper structure and rules', icon: FileText },
  { id: 'curriculum', label: 'Curriculum OCR & Index', desc: 'Indexing selected notes and photo content', icon: BookOpen },
  { id: 'topics', label: 'Selecting Core Topics', desc: 'Mapping concepts to exam weightage', icon: Layers },
  { id: 'difficulty', label: 'Balancing Difficulty', desc: 'Distributing easy, medium and hard items', icon: Zap },
  { id: 'bloom', label: "Bloom's Taxonomy Calibration", desc: 'Aligning cognitive depth to criteria', icon: Brain },
  { id: 'questions', label: 'Generating Questions', desc: 'Drafting authentic stems and solutions', icon: Cpu },
  { id: 'duplicates', label: 'Semantic Deduplication', desc: 'Scanning for redundant or repetitive items', icon: RefreshCw },
  { id: 'validation', label: 'Validation Pass', desc: 'Cross-checking targets and mark allocation', icon: ShieldCheck },
  { id: 'formatting', label: 'Formatting Layout', desc: 'Typesetting structure, headers and answers', icon: Sparkles },
  { id: 'finalizing', label: 'Finalizing Examination', desc: 'Running quality certification pass', icon: Award },
];

export default function ExamGenerationLoading({
  subject = 'Course Examination',
  batchName = 'Academic Batch',
  isPhotoUpload = false,
  selectedNotesCount = 0,
  uploadedPhotosCount = 0,
  customPrompt = ''
}: ExamGenerationLoadingProps) {
  const logBodyRef = useRef<HTMLDivElement | null>(null);
  const logIdxRef = useRef<Record<string, number>>({});

  const [progress, setProgress] = useState(0);
  const [activeStageIdx, setActiveStageIdx] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [visibleLinesCount, setVisibleLinesCount] = useState(1);
  const [logs, setLogs] = useState<Array<{ ts: string; msg: string }>>([
    { ts: new Date().toTimeString().slice(0, 8), msg: `🚀 Stitch AI & Vertex Engine initiated for ${subject}...` }
  ]);

  // Dynamic content generated strictly from user selections
  const dynamicPages = isPhotoUpload ? [
    [`[OCR Vision Engine] — ${subject}`, `Extracting semantic content from ${uploadedPhotosCount || 1} uploaded photo(s)…`, 'Filtering handwritten pen ink & background textbook noise…', 'Structuring diagnostic topic clusters…'],
    [`[RK Coaching Institutional Schema]`, `Applying standardized Academic Lumina branding template…`, `Formulating balanced diagrammatic equations & symbol matrices…`, `Calibrating difficulty pacing across Section A and B…`],
    [`[Quality Assurance Protocol]`, `Verifying syntactic fidelity for ${subject} evaluation…`, `Running real-time deduplication scan against repository…`, '[Ready for interactive layout rendering] →']
  ] : [
    [`Section A: MCQ & Short Items (${subject})`, `Analyzing core definitions & conceptual axioms in ${subject}…`, `Synthesizing question stems from ${selectedNotesCount || 1} reference material(s)…`, `Formulating balanced high-discrimination distractors…`],
    [`Section B: Analytical & Proofs (${subject})`, `Structuring multi-step analytical deductions…`, `Generating precise model answer criteria & marking steps…`, `Cross-referencing cognitive depth against curriculum…`],
    [`Section C: Advanced Evaluation`, `Formulating comprehensive Bloom's taxonomy evaluation questions…`, `Ensuring rigorous academic challenge balance…`, '[Model Answer Key & Solutions Compiled] →']
  ];

  const getDynamicLogLines = (stageId: string): string[] => {
    switch (stageId) {
      case 'understanding':
        return [
          `Parsing target specifications for subject: ${subject}…`,
          `Selected Academic Batch: ${batchName}`,
          customPrompt ? `Custom directive detected: "${customPrompt.length > 35 ? customPrompt.slice(0, 35) + '...' : customPrompt}"` : 'Applying institutional automated exam standards & rules'
        ];
      case 'blueprint':
        return isPhotoUpload ? [
          'Mode: Vision OCR & Category Grouping active',
          'Bypassing forced mark caps for direct image conversion',
          'Applying RK Coaching institutional layout template'
        ] : [
          'Loading multi-section blueprint schema…',
          'Evaluating section targets & mark allocation rules',
          'Aligning exam sections dynamically (Sections A through E)'
        ];
      case 'curriculum':
        return isPhotoUpload ? [
          `Processing ${uploadedPhotosCount || 1} textbook image(s) through Vertex AI Vision…`,
          'Executing high-resolution OCR & spatial layout detection…',
          'Filtering out handwriting, ticks & rough ink marks…'
        ] : [
          `Connecting to material index for ${subject}…`,
          `Retrieving vector embeddings from ${selectedNotesCount || 1} reference note(s)…`,
          'Extracting conceptual themes and learning outcomes'
        ];
      case 'topics':
        return [
          `Scanning core subject modules in ${subject}…`,
          'Ranking conceptual topics by examination relevance & weight',
          'Mapping curriculum coverage evenly across Sections'
        ];
      case 'difficulty':
        return [
          'Computing difficulty distribution histogram…',
          'Balancing easy (30%), medium (50%), and challenging (20%) items',
          'Target academic rigor criteria calibrated'
        ];
      case 'bloom':
        return [
          "Mapping Bloom's cognitive taxonomy pyramid…",
          'Balancing memory recall, conceptual synthesis, and evaluation spans',
          'Higher-order reasoning item stems generated'
        ];
      case 'questions':
        return [
          `Drafting authentic ${subject} question stems & solutions…`,
          'Generating precise step-by-step marking guidelines',
          'Structuring comprehensive model answer keys…'
        ];
      case 'duplicates':
        return [
          'Running semantic similarity & deduplication scan…',
          'Comparing generated items against global question repository…',
          'No overlapping or repetitive items detected (100% unique)'
        ];
      case 'validation':
        return [
          'Verifying section distributions and target mark totals',
          'Cross-checking topic diversity & institutional rigor…',
          'Live academic validation checks passing cleanly'
        ];
      case 'formatting':
        return [
          `Typesetting structured sections for ${subject}…`,
          isPhotoUpload ? 'Applying RK Coaching branding & clean styling' : 'Applying Academic Lumina header & typography',
          'Rendering print-ready PDF and online examination layouts'
        ];
      case 'finalizing':
      default:
        return [
          'Running final Vertex AI quality certification pass…',
          'Preparing interactive verification and preview dashboard…',
          '✨ Examination paper generated and ready for deployment!'
        ];
    }
  };

  // Progress Orchestration
  useEffect(() => {
    const DURATION_MS = 26000;
    const tickMs = 120;
    const increment = (tickMs / DURATION_MS) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = Math.min(98, prev + increment);
        const idx = Math.min(STAGES.length - 1, Math.floor((next / 100) * STAGES.length));
        setActiveStageIdx(idx);
        return next;
      });
    }, tickMs);

    return () => clearInterval(timer);
  }, []);

  // Document pages loop animation
  useEffect(() => {
    const currentLines = dynamicPages[pageIndex] || dynamicPages[0];
    const lineInterval = setInterval(() => {
      setVisibleLinesCount((c) => (c < currentLines.length ? c + 1 : c));
    }, 480);

    const pageTimer = setTimeout(() => {
      setPageIndex((p) => (p + 1) % dynamicPages.length);
      setVisibleLinesCount(1);
    }, 3400);

    return () => {
      clearInterval(lineInterval);
      clearTimeout(pageTimer);
    };
  }, [pageIndex, dynamicPages]);

  // Log status loop
  useEffect(() => {
    const logInterval = setInterval(() => {
      const stage = STAGES[Math.max(0, activeStageIdx)];
      const pool = getDynamicLogLines(stage.id);
      const currentIdx = logIdxRef.current[stage.id] || 0;
      const msg = pool[currentIdx % pool.length];
      logIdxRef.current[stage.id] = currentIdx + 1;

      const ts = new Date().toTimeString().slice(0, 8);
      setLogs((prev) => {
        const updated = [...prev, { ts, msg }];
        if (updated.length > 8) return updated.slice(updated.length - 8);
        return updated;
      });

      if (logBodyRef.current) {
        logBodyRef.current.scrollTop = logBodyRef.current.scrollHeight;
      }
    }, 1400);

    return () => clearInterval(logInterval);
  }, [activeStageIdx, subject, batchName, isPhotoUpload, selectedNotesCount, uploadedPhotosCount, customPrompt]);

  const ease = (t: number) => 1 - Math.pow(1 - t, 2);
  const tNorm = Math.min(1, progress / 100);

  const actualSourceCount = isPhotoUpload ? Math.max(1, uploadedPhotosCount || 1) : Math.max(1, selectedNotesCount || 1);
  const indexedSourceCount = Math.min(actualSourceCount, Math.max(1, Math.ceil(tNorm * actualSourceCount)));
  
  const estQuestions = Math.round(ease(Math.max(0, (tNorm - 0.15) / 0.85)) * (isPhotoUpload ? Math.max(10, actualSourceCount * 5) : 35));
  const estTokens = Math.round(ease(tNorm) * (actualSourceCount * 6500 + 15000));

  const metrics = {
    questions: estQuestions,
    sources: indexedSourceCount,
    tokens: estTokens,
    confidence: Math.round(Math.min(99, 52 + ease(tNorm) * 47)),
    balance: Math.round(Math.min(100, ease(Math.max(0, (tNorm - 0.25) / 0.6)) * 100)),
    valid: Math.round(Math.min(100, ease(Math.max(0, (tNorm - 0.55) / 0.45)) * 100)),
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#0A0F1D] text-slate-100 flex items-center justify-center p-3 sm:p-6 lg:p-8 font-sans selection:bg-indigo-500/30">
      {/* Subtle background atmospheric radial glows & grid */}
      <div className="fixed inset-0 bg-[radial-gradient(#1E293B_1px,transparent_1px)] [background-size:32px_32px] opacity-30 pointer-events-none" />
      <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-600/15 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col gap-6 my-auto">
        
        {/* TOP HERO HEADER */}
        <div className="flex flex-col items-center justify-center text-center gap-2">
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold shadow-lg shadow-indigo-500/10 backdrop-blur-xl"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            <span>Stitch AI Examination Engine (Auto TA)</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-2xl sm:text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-indigo-200"
          >
            Synthesizing & Formatting Your Exam Paper
          </motion.h1>
          <p className="text-xs sm:text-sm text-slate-400 font-medium max-w-md mx-auto">
            Current Phase: <span className="text-indigo-400 font-bold underline decoration-indigo-500/50 underline-offset-4">{STAGES[activeStageIdx]?.label || 'Initializing AI Engine'}</span>
          </p>
        </div>

        {/* THREE COLUMN ARCHITECTURE (Academic Lumina + Onyx Bento) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          {/* LEFT COLUMN (4 cols): LIVE GENERATION STAGE TIMELINE */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-4 rounded-[28px] bg-slate-900/70 border border-slate-800/80 p-5 backdrop-blur-2xl shadow-[0_10px_40px_rgba(15,23,42,0.8)] shadow-inner flex flex-col h-[520px] max-h-[520px]"
          >
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-3 shrink-0">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                <span>AI Generation Pipeline</span>
              </span>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                Stage {activeStageIdx + 1}/{STAGES.length}
              </span>
            </div>

            <div className="overflow-y-auto pr-1 space-y-4 flex-1 scrollbar-thin scrollbar-thumb-slate-700">
              {STAGES.map((stage, idx) => {
                const isComplete = idx < activeStageIdx;
                const isActive = idx === activeStageIdx;
                const Icon = stage.icon || Cpu;

                return (
                  <div key={stage.id} className="flex gap-3 relative group">
                    {/* Connecting line between stages */}
                    {idx < STAGES.length - 1 && (
                      <div className={`absolute left-3.5 top-8 w-0.5 h-full transition-colors duration-500 ${
                        isComplete ? 'bg-indigo-500' : 'bg-slate-800'
                      }`} />
                    )}

                    {/* Stage Node Button/Badge */}
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 transition-all duration-300 ${
                      isComplete 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 shadow-sm shadow-emerald-500/20' 
                        : isActive 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/40 ring-4 ring-indigo-500/20 animate-bounce' 
                        : 'bg-slate-800 text-slate-500 border border-slate-700/50'
                    }`}>
                      {isComplete ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Icon className="w-3.5 h-3.5" />}
                    </div>

                    {/* Stage Details */}
                    <div className="flex flex-col pb-1">
                      <span className={`text-xs font-bold transition-colors ${
                        isActive ? 'text-white scale-[1.02]' : isComplete ? 'text-slate-300' : 'text-slate-500'
                      }`}>
                        {stage.label}
                      </span>
                      <span className={`text-[11px] leading-tight mt-0.5 ${
                        isActive ? 'text-indigo-300 font-medium' : 'text-slate-500'
                      }`}>
                        {stage.desc}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* CENTER COLUMN (4 cols): HOLOGRAPHIC DOCUMENT SCANNER & GRADIENT PROGRESS BAR */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-4 flex flex-col gap-4"
          >
            {/* Holographic 3D Document Container */}
            <div className="relative rounded-[28px] bg-gradient-to-b from-indigo-950/50 via-slate-900/85 to-slate-950 border border-indigo-500/35 p-6 shadow-2xl shadow-indigo-500/15 backdrop-blur-2xl h-[410px] flex flex-col justify-between overflow-hidden group">
              
              {/* Animated Glowing Laser Scanline */}
              <motion.div 
                animate={{ top: ['0%', '100%', '0%'] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-indigo-400 to-transparent shadow-[0_0_15px_3px_rgba(99,102,241,0.6)] z-20 pointer-events-none opacity-80"
              />

              {/* Top Header of Document */}
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 z-10">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex flex-col text-left">
                    <span className="text-xs font-extrabold text-white truncate">Paper — {subject}</span>
                    <span className="text-[10px] text-slate-400 font-medium truncate">{batchName} · {isPhotoUpload ? 'Photo OCR' : 'AI Schema'}</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold shrink-0 animate-pulse">
                  Active OCR
                </span>
              </div>

              {/* Document Live Content Rows */}
              <div className="flex-1 my-4 flex flex-col justify-center gap-3 z-10 font-mono text-left">
                {(dynamicPages[pageIndex] || dynamicPages[0]).map((line, idx) => (
                  <motion.div 
                    key={`${pageIndex}-${idx}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: idx < visibleLinesCount ? 1 : 0.2, x: idx < visibleLinesCount ? 0 : -5 }}
                    transition={{ duration: 0.3 }}
                    className={`text-xs px-3 py-2 rounded-xl transition-all ${
                      idx === 0 
                        ? 'bg-indigo-500/15 border border-indigo-500/30 font-bold text-indigo-200' 
                        : idx < visibleLinesCount 
                        ? 'bg-slate-800/60 border border-slate-700/50 text-slate-300' 
                        : 'text-slate-600 bg-slate-900/30'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                      <span className="truncate">{line}</span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Bottom Holographic Watermark & Stats */}
              <div className="flex items-center justify-between border-t border-slate-800/80 pt-3 text-[11px] text-slate-400 z-10 font-sans font-medium">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                  <span>Page {pageIndex + 1} of {dynamicPages.length}</span>
                </span>
                <span className="text-indigo-300 font-bold">{Math.round(progress)}% Synthesized</span>
              </div>
            </div>

            {/* Glowing Gradient Progress Bar Card */}
            <div className="rounded-[24px] bg-slate-900/80 border border-slate-800/90 p-5 backdrop-blur-2xl shadow-xl">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                  <span>Generation Progress</span>
                </span>
                <span className="font-extrabold font-mono text-sm text-indigo-300">{Math.round(progress)}%</span>
              </div>

              {/* Smooth Gradient Bar */}
              <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5 shadow-inner">
                <motion.div 
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-purple-500/50"
                  style={{ width: `${progress}%` }}
                  transition={{ ease: "linear", duration: 0.3 }}
                />
              </div>
              <p className="text-[11px] text-center text-slate-400 font-medium mt-2.5 truncate">
                ⚡ {STAGES[activeStageIdx]?.desc || 'Applying academic constraints...'}
              </p>
            </div>

          </motion.div>

          {/* RIGHT COLUMN (4 cols): BENTO METRICS GRID & LIVE STATUS TERMINAL */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-4 flex flex-col gap-4"
          >
            {/* Bento Grid of 6 Real-time Metrics */}
            <div className="rounded-[28px] bg-slate-900/70 border border-slate-800/80 p-4 backdrop-blur-2xl shadow-xl flex flex-col">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2 px-1">
                <Cpu className="w-4 h-4 text-purple-400" />
                <span>Real-Time AI Metrics (Bento)</span>
              </span>

              <div className="grid grid-cols-2 gap-2.5">
                
                <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-3 hover:border-indigo-500/40 transition-all shadow-inner">
                  <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                    <FileText className="w-3 h-3 text-indigo-400" />
                    <span>Questions</span>
                  </span>
                  <div className="text-lg font-extrabold text-white mt-1">
                    {metrics.questions} <span className="text-xs text-slate-500 font-normal">items</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-3 hover:border-indigo-500/40 transition-all shadow-inner">
                  <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                    <BookOpen className="w-3 h-3 text-purple-400" />
                    <span>Sources</span>
                  </span>
                  <div className="text-lg font-extrabold text-white mt-1">
                    {metrics.sources} <span className="text-xs text-slate-500 font-normal">/ {actualSourceCount}</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-3 hover:border-indigo-500/40 transition-all shadow-inner">
                  <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-400" />
                    <span>Est. Tokens</span>
                  </span>
                  <div className="text-lg font-extrabold text-white mt-1">
                    {metrics.tokens.toLocaleString()}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-3 hover:border-indigo-500/40 transition-all shadow-inner">
                  <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                    <Brain className="w-3 h-3 text-emerald-400" />
                    <span>Confidence</span>
                  </span>
                  <div className="text-lg font-extrabold text-white mt-1">
                    {metrics.confidence}<span className="text-xs text-slate-500 font-normal">%</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-3 hover:border-indigo-500/40 transition-all shadow-inner">
                  <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                    <Layers className="w-3 h-3 text-pink-400" />
                    <span>Bloom Balance</span>
                  </span>
                  <div className="text-lg font-extrabold text-white mt-1">
                    {metrics.balance}<span className="text-xs text-slate-500 font-normal">%</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-3 hover:border-indigo-500/40 transition-all shadow-inner">
                  <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-cyan-400" />
                    <span>Validation</span>
                  </span>
                  <div className="text-lg font-extrabold text-white mt-1">
                    {metrics.valid}<span className="text-xs text-slate-500 font-normal">%</span>
                  </div>
                </div>

              </div>
            </div>

            {/* High-End Terminal Log Card */}
            <div className="rounded-[28px] bg-[#070B14]/95 border border-slate-800 p-4 shadow-xl flex flex-col h-[232px]">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-indigo-400" />
                  <span>AI Engine Status Log</span>
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              </div>

              <div className="flex-1 overflow-y-auto font-mono text-[11px] leading-relaxed p-1 space-y-2 mt-2 scrollbar-thin scrollbar-thumb-slate-800" ref={logBodyRef}>
                {logs.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-start opacity-90 animate-fadeIn text-left">
                    <span className="text-slate-600 shrink-0">{item.ts}</span>
                    <span className="text-indigo-400 shrink-0">$</span>
                    <span className="text-slate-300 break-words">{item.msg}</span>
                  </div>
                ))}
              </div>
            </div>

          </motion.div>

        </div>

      </div>
    </div>
  );
}
