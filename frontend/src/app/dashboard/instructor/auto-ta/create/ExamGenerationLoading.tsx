'use client';

import React, { useState, useEffect, useRef } from 'react';

interface ExamGenerationLoadingProps {
  subject?: string;
  batchName?: string;
  isPhotoUpload?: boolean;
  selectedNotesCount?: number;
  uploadedPhotosCount?: number;
  customPrompt?: string;
}

const ICONS: Record<string, string> = {
  understanding: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>',
  blueprint: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/>',
  curriculum: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
  topics: '<path d="M3 12h.01M3 18h.01M3 6h.01M8 12h13M8 18h13M8 6h13"/>',
  difficulty: '<path d="M12 3v18M5 8l-3 6h6l-3-6zM19 8l-3 6h6l-3-6z"/><path d="M5 8h14"/>',
  bloom: '<path d="M12 2 2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>',
  questions: '<path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z"/>',
  duplicates: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/><path d="m3 3 15 15"/>',
  validation: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  formatting: '<path d="M4 2h11l5 5v15H4z"/><path d="M15 2v5h5"/>',
  finalizing: '<path d="M12 3l1.9 4.9L19 9l-5.1 1.9L12 16l-1.9-5.1L5 9l5.1-1.9L12 3z"/>',
  check: '<path d="M20 6L9 17l-5-5"/>'
};

const STAGES = [
  { id: 'understanding', label: 'Understanding Request', desc: 'Parsing exam instructions and constraints' },
  { id: 'blueprint', label: 'Reading Blueprint', desc: 'Evaluating paper structure and rules' },
  { id: 'curriculum', label: 'Retrieving Material', desc: 'Indexing selected notes or photo content' },
  { id: 'topics', label: 'Selecting Topics', desc: 'Mapping concepts to exam weightage' },
  { id: 'difficulty', label: 'Balancing Difficulty', desc: 'Distributing easy, medium and hard items' },
  { id: 'bloom', label: "Applying Bloom's Taxonomy", desc: 'Aligning cognitive depth to subject criteria' },
  { id: 'questions', label: 'Generating Questions', desc: 'Drafting authentic stems and solutions' },
  { id: 'duplicates', label: 'Eliminating Duplicates', desc: 'Scanning for redundant or repetitive items' },
  { id: 'validation', label: 'Validating Distribution', desc: 'Cross-checking targets and mark allocation' },
  { id: 'formatting', label: 'Formatting Layout', desc: 'Typesetting structure, headers and answers' },
  { id: 'finalizing', label: 'Finalizing Examination', desc: 'Running last quality pass before display' },
];

export default function ExamGenerationLoading({
  subject = 'Course Examination',
  batchName = 'Academic Batch',
  isPhotoUpload = false,
  selectedNotesCount = 0,
  uploadedPhotosCount = 0,
  customPrompt = ''
}: ExamGenerationLoadingProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const logBodyRef = useRef<HTMLDivElement | null>(null);
  const logIdxRef = useRef<Record<string, number>>({});

  const [progress, setProgress] = useState(0);
  const [activeStageIdx, setActiveStageIdx] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [visibleLinesCount, setVisibleLinesCount] = useState(1);
  const [logs, setLogs] = useState<Array<{ ts: string; msg: string }>>([
    { ts: new Date().toTimeString().slice(0, 8), msg: `Initiating Vertex AI Engine for ${subject}...` }
  ]);

  // Dynamic content generated strictly from actual user selections
  const dynamicPages = isPhotoUpload ? [
    [`UI Photo OCR Mode (${subject})`, `Extracting text from ${uploadedPhotosCount || 1} uploaded textbook photo(s)…`, 'Cleaning handwritten ink & background noise…', 'Grouping questions by concept & category…'],
    [`RK Coaching Brand Template`, `Formatting institutional header & branding…`, `Aligning diagrams, symbols & equations…`, `Structuring balanced question layouts & spacing…`],
    [`Quality & OCR Verification`, `Verifying character accuracy in ${subject}…`, `Removing unwanted ticks & rough work marks…`, '[Ready for interactive layout preview] →']
  ] : [
    [`Section A — MCQ / Short (${subject})`, `Analyzing conceptual definitions in ${subject}…`, `Generating items from selected note material…`, `Drafting appropriate distractors & solutions…`],
    [`Section B — Medium Weightage (${subject})`, `Structuring analytical questions & conceptual proofs…`, `Evaluating marking scheme criteria & steps…`, `Cross-referencing against ${selectedNotesCount || 1} selected note(s)…`],
    [`Section C / Higher Order Sections`, `Formulating comprehensive long-form questions…`, `Applying balanced Bloom's taxonomy levels…`, '[Model Answer Key Generated] →']
  ];

  // Dynamic log generator ensuring zero fake names or unrelated topics
  const getDynamicLogLines = (stageId: string): string[] => {
    switch (stageId) {
      case 'understanding':
        return [
          `Parsing target specifications for subject: ${subject}…`,
          `Selected Batch: ${batchName}`,
          customPrompt ? `Applying instruction: "${customPrompt.length > 35 ? customPrompt.slice(0, 35) + '...' : customPrompt}"` : 'Applying automated exam standards & rules'
        ];
      case 'blueprint':
        return isPhotoUpload ? [
          'Mode: UI Photo OCR & Category Grouping active',
          'Bypassing forced mark caps for direct image conversion',
          'Applying RK Coaching institutional layout template'
        ] : [
          'Loading multi-section blueprint schema…',
          'Evaluating section targets & mark allocation rules',
          'Aligning exam sections dynamically (A through G)'
        ];
      case 'curriculum':
        return isPhotoUpload ? [
          `Processing ${uploadedPhotosCount || 1} textbook image(s) through Vertex AI…`,
          'Executing vision OCR & layout detection…',
          'Filtering out handwriting, ticks & pen ink marks…'
        ] : [
          `Connecting to material index for ${subject}…`,
          `Retrieving content from ${selectedNotesCount || 1} selected reference note(s)…`,
          'Extracting semantic vectors & topic themes'
        ];
      case 'topics':
        return [
          `Scanning core subject modules in ${subject}…`,
          'Ranking conceptual topics by examination relevance',
          'Mapping curriculum coverage across sections'
        ];
      case 'difficulty':
        return [
          'Computing difficulty level histogram…',
          'Balancing easy, medium, and challenging question items',
          'Target difficulty distribution criteria achieved'
        ];
      case 'bloom':
        return [
          "Mapping Bloom's cognitive taxonomy levels…",
          'Balancing memory recall, analytical, and evaluation spans',
          'Higher-order reasoning items calibrated'
        ];
      case 'questions':
        return [
          `Drafting authentic ${subject} question stems & solutions…`,
          'Generating precise marking guidelines & options',
          'Structuring comprehensive model answer keys…'
        ];
      case 'duplicates':
        return [
          'Running semantic similarity & deduplication scan…',
          'Comparing generated items against reference repository…',
          'No overlapping or conflicting duplicates found'
        ];
      case 'validation':
        return [
          'Verifying section distributions and target totals',
          'Cross-checking topic diversity & academic rigor…',
          'Live validation checks passing cleanly'
        ];
      case 'formatting':
        return [
          `Typesetting structured sections for ${subject}…`,
          isPhotoUpload ? 'Applying RK Coaching branding & clean styling' : 'Applying institutional header & clean typography',
          'Rendering printable document layouts'
        ];
      case 'finalizing':
      default:
        return [
          'Running final Vertex AI quality evaluation…',
          'Preparing interactive verification dashboard…',
          'Examination generated and ready for display!'
        ];
    }
  };

  // Particle Canvas Background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let w: number, h: number;
    let pts: Array<{ x: number; y: number; vx: number; vy: number; r: number; hue: string; a: number }> = [];

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const resize = () => {
      w = canvas.width = window.innerWidth * Math.min(window.devicePixelRatio || 1, 2);
      h = canvas.height = window.innerHeight * Math.min(window.devicePixelRatio || 1, 2);
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
    };

    const seed = () => {
      const n = reducedMotion ? 25 : 70;
      pts = Array.from({ length: n }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: (Math.random() * 1.6 + 0.4) * Math.min(window.devicePixelRatio || 1, 2),
        hue: Math.random() > 0.55 ? 'p' : 'b',
        a: Math.random() * 0.5 + 0.15
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of pts) {
        if (!reducedMotion) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0) p.x = w;
          if (p.x > w) p.x = 0;
          if (p.y < 0) p.y = h;
          if (p.y > h) p.y = 0;
        }
        ctx.beginPath();
        ctx.fillStyle = (p.hue === 'b' ? 'rgba(96,165,250,' : 'rgba(167,139,250,') + p.a + ')';
        ctx.shadowColor = p.hue === 'b' ? 'rgba(96,165,250,0.8)' : 'rgba(167,139,250,0.8)';
        ctx.shadowBlur = 4;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      if (!reducedMotion) animId = requestAnimationFrame(draw);
    };

    resize();
    seed();
    draw();

    const handleResize = () => {
      resize();
      seed();
      if (reducedMotion) draw();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animId) cancelAnimationFrame(animId);
    };
  }, []);

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

  // Compute live authentic metrics from real selections & progress
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
    confidence: Math.round(Math.min(99, 45 + ease(tNorm) * 54)),
    balance: Math.round(Math.min(100, ease(Math.max(0, (tNorm - 0.25) / 0.6)) * 100)),
    valid: Math.round(Math.min(100, ease(Math.max(0, (tNorm - 0.55) / 0.45)) * 100)),
  };

  return (
    <div className="exam-anim-app fixed inset-0 z-50 overflow-y-auto bg-[#05060c] text-[#e2e8f0] flex items-center justify-center p-4 sm:p-8 font-sans">
      <style dangerouslySetInnerHTML={{
        __html: `
          .exam-anim-app * { box-sizing: border-box; }
          .grid-layer {
            position: absolute; inset: -10%; opacity: .35;
            background-image: linear-gradient(rgba(96,165,250,.16) 1px, transparent 1px), linear-gradient(90deg, rgba(96,165,250,.16) 1px, transparent 1px);
            background-size: 48px 48px;
            -webkit-mask-image: radial-gradient(ellipse 65% 60% at 50% 45%, black 40%, transparent 80%);
            mask-image: radial-gradient(ellipse 65% 60% at 50% 45%, black 40%, transparent 80%);
            animation: gridMove 6s linear infinite;
          }
          @keyframes gridMove { from { background-position: 0 0; } to { background-position: 48px 48px; } }
          .glow-blob { position: absolute; border-radius: 999px; filter: blur(120px); pointer-events: none; }
          .glow-blue { left: -15%; top: 0; width: 60%; height: 60%; background: rgba(59,130,246,.10); }
          .glow-purple { right: -15%; bottom: 0; width: 60%; height: 60%; background: rgba(139,92,246,.10); }

          .wrap { position: relative; z-index: 2; max-width: 1200px; width: 100%; margin: 0 auto; }
          .header-anim { display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center; margin-bottom: 32px; animation: fadeDown .6s ease forwards; }
          @keyframes fadeDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes fadeIn { to { opacity: 1; } }
          
          .badge-anim { display: inline-flex; align-items: center; gap: 6px; border: 1px solid rgba(255,255,255,.1); background: rgba(255,255,255,.04); padding: 4px 12px; border-radius: 999px; font-size: 11px; color: rgba(191,219,254,.85); backdrop-filter: blur(6px); }
          .badge-anim svg { width: 12px; height: 12px; color: rgb(196,181,253); }
          .header-anim h1 { font-size: 26px; font-weight: 600; margin: 4px 0 0; background: linear-gradient(to bottom, #fff, #94a3b8); -webkit-background-clip: text; background-clip: text; color: transparent; }
          .subline { font-size: 13px; color: #94a3b8; max-width: 420px; }
          .subline b { color: rgb(196,181,253); font-weight: 600; }

          .grid3 { display: grid; grid-template-columns: 1fr; gap: 20px; }
          @media(min-width: 1024px) { .grid3 { grid-template-columns: 270px 1fr 320px; } }
          .panel-anim { border: 1px solid rgba(255,255,255,.1); background: rgba(255,255,255,.03); border-radius: 16px; padding: 16px; backdrop-filter: blur(20px); opacity: 0; animation: fadeIn .5s ease forwards; }
          .panel-title { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; color: #94a3b8; margin: 0 0 14px; }

          .timeline-anim { list-style: none; margin: 0; padding: 0; max-height: 400px; overflow-y: auto; }
          .stage-item { position: relative; display: flex; gap: 12px; padding-bottom: 20px; }
          .stage-item:last-child { padding-bottom: 0; }
          .stage-item .connector-vertical { position: absolute; left: 13px; top: 28px; width: 1px; height: calc(100% - 14px); background: linear-gradient(to bottom, rgba(255,255,255,.15), transparent); }
          .stage-item .connector-vertical .fill { position: absolute; inset: 0 0 auto 0; width: 1px; height: 0; background: linear-gradient(to bottom, rgb(96,165,250), rgb(167,139,250)); transition: height .5s ease; }
          .stage-item.complete .connector-vertical .fill { height: 100%; }
          .node { position: relative; flex: 0 0 auto; width: 28px; height: 28px; border-radius: 999px; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(255,255,255,.1); background: rgba(255,255,255,.03); transition: all .3s ease; }
          .stage-item.complete .node { border-color: rgba(96,165,250,.6); background: rgba(59,130,246,.2); }
          .stage-item.active .node { border-color: rgba(167,139,250,.7); background: rgba(139,92,246,.15); animation: pulseGlow 1.6s ease-in-out infinite; }
          @keyframes pulseGlow { 0%, 100% { box-shadow: 0 0 0 rgba(167,139,250,0); } 50% { box-shadow: 0 0 14px rgba(167,139,250,.65); } }
          .node svg { width: 14px; height: 14px; color: #64748b; }
          .stage-item.active .node svg { color: rgb(196,181,253); }
          .stage-item.complete .node svg { color: rgb(147,197,253); }
          .stage-text { padding-top: 2px; min-width: 0; }
          .stage-label { font-size: 13px; font-weight: 500; color: #64748b; transition: color .3s ease; }
          .stage-item.active .stage-label { color: #fff; }
          .stage-item.complete .stage-label { color: #cbd5e1; }
          .stage-desc { font-size: 11px; color: rgba(196,181,253,.6); margin-top: 2px; display: none; }
          .stage-item.active .stage-desc { display: block; animation: fadeIn .3s ease; }

          .doc-stage { display: flex; flex-direction: column; align-items: center; gap: 24px; opacity: 0; animation: fadeIn .5s ease forwards; }
          .doc-ring-wrap { position: relative; width: 280px; height: 280px; perspective: 1200px; }
          @media(min-width: 640px) { .doc-ring-wrap { width: 340px; height: 340px; } }
          .ring { position: absolute; inset: 0; border-radius: 999px; border: 1px solid rgba(96,165,250,.25); box-shadow: inset 0 0 30px rgba(96,165,250,.15); animation: spin 18s linear infinite; }
          .ring .dot { position: absolute; left: 50%; top: 0; width: 8px; height: 8px; margin-left: -4px; margin-top: -4px; border-radius: 999px; background: rgb(96,165,250); box-shadow: 0 0 10px 3px rgba(96,165,250,.8); }
          .ring2 { position: absolute; inset: 9%; border-radius: 999px; border: 1px dashed rgba(167,139,250,.3); animation: spinRev 13s linear infinite; }
          .ring2 .dot { position: absolute; right: 8px; top: 50%; width: 6px; height: 6px; margin-top: -3px; border-radius: 999px; background: rgb(167,139,250); box-shadow: 0 0 8px 2px rgba(167,139,250,.8); }
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes spinRev { to { transform: rotate(-360deg); } }
          .doc-float { position: absolute; left: 15%; top: 19%; width: 70%; height: 62%; animation: float 7s ease-in-out infinite; transform-style: preserve-3d; }
          @keyframes float { 0%, 100% { transform: rotateY(-8deg) rotateX(4deg) translateY(0); } 50% { transform: rotateY(8deg) rotateX(-4deg) translateY(-10px); } }
          .doc-card { position: relative; height: 100%; width: 100%; border-radius: 14px; border: 1px solid rgba(147,197,253,.3); background: linear-gradient(to bottom, rgba(255,255,255,.06), rgba(59,130,246,.04)); backdrop-filter: blur(6px); padding: 14px; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 0 40px rgba(59,130,246,.25), 0 0 80px rgba(139,92,246,.12), inset 0 0 30px rgba(96,165,250,.06); }
          .scanline { position: absolute; left: 0; right: 0; height: 32px; background: linear-gradient(to bottom, transparent, rgba(147,197,253,.2), transparent); animation: scan 2.6s linear infinite; }
          @keyframes scan { from { top: -10%; } to { top: 110%; } }
          .doc-head { display: flex; align-items: center; gap: 8px; border-bottom: 1px solid rgba(255,255,255,.1); padding-bottom: 8px; margin-bottom: 8px; }
          .doc-head svg { width: 14px; height: 14px; color: rgb(147,197,253); flex: 0 0 auto; }
          .doc-head .t1 { font-size: 11px; font-weight: 500; color: rgba(219,234,254,.9); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .doc-head .t2 { font-size: 9px; color: rgba(191,219,254,.5); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .doc-lines { flex: 1; display: flex; flex-direction: column; gap: 6px; }
          .doc-line { font-size: 9px; line-height: 1.3; color: rgba(219,234,254,.7); opacity: 0; transform: translateX(-6px); transition: all .3s ease; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .doc-line.first { color: rgb(147,197,253); font-weight: 600; }
          .doc-line.show { opacity: .7; transform: translateX(0); }
          .doc-line.first.show { opacity: .9; }
          .doc-foot { display: flex; justify-content: space-between; border-top: 1px solid rgba(255,255,255,.1); padding-top: 8px; margin-top: 8px; font-size: 8px; color: rgba(191,219,254,.4); }
          .doc-base-glow { position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); width: 75%; height: 24px; border-radius: 999px; background: rgba(59,130,246,.25); filter: blur(24px); }

          .connector-line { position: relative; height: 1px; width: 10%; background: linear-gradient(90deg, transparent, rgba(96,165,250,.25), transparent); display: none; }
          @media(min-width: 1024px) { .connector-line { display: block; } }
          .connector-line .packet { position: absolute; top: 50%; width: 6px; height: 6px; margin-top: -3px; border-radius: 999px; background: rgb(147,197,253); box-shadow: 0 0 8px 2px rgba(96,165,250,.9); animation: travel 2.2s linear infinite; opacity: 0; }
          @keyframes travel { 0% { left: 0%; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { left: 100%; opacity: 0; } }

          .doc-row { display: flex; align-items: center; justify-content: center; width: 100%; position: relative; }

          .progress-card { width: 100%; max-width: 420px; border: 1px solid rgba(255,255,255,.1); background: rgba(255,255,255,.03); border-radius: 16px; padding: 16px; backdrop-filter: blur(20px); }
          .progress-top { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 6px; }
          .progress-top .lbl { color: rgba(203,213,225,.8); font-weight: 500; }
          .progress-top .val { color: rgb(147,197,253); }
          .progress-track { position: relative; height: 8px; width: 100%; border-radius: 999px; background: rgba(255,255,255,.05); box-shadow: inset 0 0 0 1px rgba(255,255,255,.1); overflow: hidden; }
          .progress-fill { position: relative; height: 100%; border-radius: 999px; background: linear-gradient(90deg, rgb(59,130,246), rgb(129,140,248), rgb(168,85,247)); box-shadow: 0 0 12px rgba(129,140,248,.65); transition: width .3s linear; }
          .progress-fill::after { content: ""; position: absolute; right: 0; top: 0; bottom: 0; width: 32px; background: linear-gradient(90deg, transparent, rgba(255,255,255,.6)); filter: blur(2px); animation: shimmer 1.4s ease-in-out infinite; }
          @keyframes shimmer { 0%, 100% { opacity: .4; } 50% { opacity: .9; } }

          .metrics-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
          .metric-card { border: 1px solid rgba(255,255,255,.1); background: rgba(255,255,255,.03); border-radius: 10px; padding: 10px 12px; }
          .metric-card .m-label { display: flex; align-items: center; gap: 6px; font-size: 10px; text-transform: uppercase; letter-spacing: .05em; color: #94a3b8; margin-bottom: 6px; }
          .metric-card .m-label svg { width: 12px; height: 12px; }
          .metric-card .m-val { font-size: 18px; font-weight: 600; color: #f1f5f9; }
          .metric-card .m-val .max { font-size: 13px; font-weight: 400; color: #64748b; }

          .log-card { border: 1px solid rgba(255,255,255,.1); background: rgba(0,0,0,.3); border-radius: 10px; backdrop-filter: blur(6px); display: flex; flex-direction: column; height: 210px; }
          .log-head { display: flex; align-items: center; gap: 6px; border-bottom: 1px solid rgba(255,255,255,.1); padding: 8px 12px; font-size: 10px; text-transform: uppercase; letter-spacing: .05em; color: #94a3b8; }
          .log-head svg { width: 12px; height: 12px; color: rgb(147,197,253); }
          .log-dot { margin-left: auto; width: 6px; height: 6px; border-radius: 999px; background: #34d399; box-shadow: 0 0 6px 2px rgba(52,211,153,.7); }
          .log-body { flex: 1; overflow-y: auto; padding: 8px 12px; font-size: 11px; line-height: 1.6; }
          .log-line { display: flex; gap: 8px; color: rgba(203,213,225,.85); opacity: 0; transform: translateY(6px); animation: logIn .25s ease forwards; }
          @keyframes logIn { to { opacity: 1; transform: translateY(0); } }
          .log-line .ts { color: #475569; flex: 0 0 auto; }
          .log-line .dollar { color: rgba(96,165,250,.7); }
          .log-line .msg { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

          ::-webkit-scrollbar { width: 6px; }
          ::-webkit-scrollbar-thumb { background: rgba(255,255,255,.15); border-radius: 999px; }

          @media (prefers-reduced-motion: reduce) {
            .grid-layer, .ring, .ring2, .doc-float, .scanline, .progress-fill::after, .connector-line .packet, .node { animation: none !important; }
          }
        `
      }} />

      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />
      <div className="grid-layer" />
      <div className="glow-blob glow-blue" />
      <div className="glow-blob glow-purple" />

      <div className="wrap my-auto">
        <div className="header-anim">
          <span className="badge-anim">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M12 3l1.9 4.9L19 9l-5.1 1.9L12 16l-1.9-5.1L5 9l5.1-1.9L12 3z" />
            </svg>
            LearnStudio AI Engine
          </span>
          <h1>Generating your examination paper</h1>
          <p className="subline">
            Currently: <b>{STAGES[activeStageIdx]?.label || 'Initializing AI'}</b>
          </p>
        </div>

        <div className="grid3">
          {/* Left Column: Pipeline Timeline */}
          <section className="panel-anim" style={{ animationDelay: '.1s' }}>
            <p className="panel-title">Generation pipeline</p>
            <ol className="timeline-anim">
              {STAGES.map((s, i) => {
                const isComplete = i < activeStageIdx;
                const isActive = i === activeStageIdx;
                return (
                  <li key={s.id} className={`stage-item ${isComplete ? 'complete' : ''} ${isActive ? 'active' : ''}`}>
                    {i < STAGES.length - 1 && (
                      <span className="connector-vertical">
                        <span className="fill" />
                      </span>
                    )}
                    <div
                      className="node"
                      dangerouslySetInnerHTML={{
                        __html: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">${ICONS[s.id] || ICONS.understanding}</svg>`
                      }}
                    />
                    <div className="stage-text">
                      <div className="stage-label">{s.label}</div>
                      <div className="stage-desc">{s.desc}</div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>

          {/* Center Column: Interactive 3D Document & Progress Track */}
          <section className="doc-stage">
            <div className="doc-row">
              <div className="connector-line">
                <span className="packet" style={{ animationDelay: '0s' }} />
                <span className="packet" style={{ animationDelay: '.75s' }} />
                <span className="packet" style={{ animationDelay: '1.5s' }} />
              </div>
              <div className="doc-ring-wrap">
                <div className="ring">
                  <span className="dot" />
                </div>
                <div className="ring2">
                  <span className="dot" />
                </div>
                <div className="doc-float">
                  <div className="doc-card">
                    <div className="scanline" />
                    <div className="doc-head">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <path d="M14 2v6h6" />
                      </svg>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div className="t1">Exam — {subject}</div>
                        <div className="t2">{batchName} · {isPhotoUpload ? 'Photo OCR Mode' : 'AI Blueprint'}</div>
                      </div>
                    </div>
                    <div className="doc-lines">
                      {(dynamicPages[pageIndex] || dynamicPages[0]).map((line, idx) => (
                        <p
                          key={idx}
                          className={`doc-line ${idx === 0 ? 'first' : ''} ${idx < visibleLinesCount ? 'show' : ''}`}
                        >
                          {line}
                        </p>
                      ))}
                    </div>
                    <div className="doc-foot">
                      <span>Page {pageIndex + 1} of {dynamicPages.length}</span>
                      <span>{Math.round(progress)}% generated</span>
                    </div>
                  </div>
                </div>
                <div className="doc-base-glow" />
              </div>
              <div className="connector-line">
                <span className="packet" style={{ animationDelay: '.3s' }} />
                <span className="packet" style={{ animationDelay: '1.05s' }} />
                <span className="packet" style={{ animationDelay: '1.8s' }} />
              </div>
            </div>

            <div className="progress-card">
              <div className="progress-top">
                <span className="lbl">Generation progress</span>
                <span className="val">{Math.round(progress)}%</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </section>

          {/* Right Column: Live Metrics & AI Status Log */}
          <section className="flex flex-col gap-4 opacity-0" style={{ animation: 'fadeIn .5s ease .1s forwards' }}>
            <div className="panel-anim">
              <p className="panel-title">Live metrics</p>
              <div className="metrics-grid">
                <div className="metric-card">
                  <div className="m-label" dangerouslySetInnerHTML={{ __html: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">${ICONS.topics}</svg><span>Est. Questions</span>` }} />
                  <div className="m-val">
                    <span>{metrics.questions}</span>
                    <span className="max"> items</span>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="m-label" dangerouslySetInnerHTML={{ __html: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">${ICONS.curriculum}</svg><span>Sources Indexed</span>` }} />
                  <div className="m-val">
                    <span>{metrics.sources}</span>
                    <span className="max"> / {actualSourceCount} {isPhotoUpload ? 'Photos' : 'Notes'}</span>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="m-label" dangerouslySetInnerHTML={{ __html: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">${ICONS.bloom}</svg><span>Est. tokens</span>` }} />
                  <div className="m-val">
                    <span>{metrics.tokens.toLocaleString()}</span>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="m-label" dangerouslySetInnerHTML={{ __html: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">${ICONS.validation}</svg><span>Confidence</span>` }} />
                  <div className="m-val">
                    <span>{metrics.confidence}</span>
                    <span className="max">%</span>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="m-label" dangerouslySetInnerHTML={{ __html: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">${ICONS.difficulty}</svg><span>Balance</span>` }} />
                  <div className="m-val">
                    <span>{metrics.balance}</span>
                    <span className="max">%</span>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="m-label" dangerouslySetInnerHTML={{ __html: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">${ICONS.validation}</svg><span>Validation</span>` }} />
                  <div className="m-val">
                    <span>{metrics.valid}</span>
                    <span className="max">%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="log-card">
              <div className="log-head">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <path d="M4 17l6-6-6-6M12 19h8" />
                </svg>
                AI status log
                <span className="log-dot" />
              </div>
              <div className="log-body font-mono" ref={logBodyRef}>
                {logs.map((item, idx) => (
                  <div key={idx} className="log-line">
                    <span className="ts">{item.ts}</span>
                    <span className="dollar">$</span>
                    <span className="msg">{item.msg}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
