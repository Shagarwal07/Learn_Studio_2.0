'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  Edit, 
  RefreshCw, 
  History, 
  AlertTriangle,
  Save,
  X,
  Printer,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  BookOpen,
  Clock,
  Check,
  Settings,
  Info,
  Copy,
  GitFork,
  Merge
} from 'lucide-react';

interface QuestionDTO {
  id: number;
  questionText: string;
  options: string; // JSON string
  correctAnswer: string;
  solutionSteps: string;
  marks: number;
  difficulty: string;
  questionType: string;
  agentType: string;
  version: number;
  chapter?: string;
  topic?: string;
  learningOutcome?: string;
  section?: string;
  questionOrder?: number;
  bloomLevel?: string;
  markingScheme?: string;
  qualityStatus?: string;
  estimatedTimeMinutes?: number;
}

interface PaperDTO {
  id: number;
  examRequestId: number;
  title: string;
  totalMarks: number;
  status: string;
  version: number;
  questions: QuestionDTO[];
  createdAt: string;
  duration?: number;
  testType?: string;
  chapters?: string;
  topics?: string;
  course?: string;
  subject?: string;
  syllabus?: string;
}

interface VersionDTO {
  id: number;
  version: number;
  changeReason: string;
  changedByName: string;
  timestamp: string;
}

const ALLOWED_MARKS = [1, 2, 3, 4, 5, 6, 8, 10, 12, 15];

export function calculateSectionTotals(questions: QuestionDTO[]) {
  const map: Record<string, QuestionDTO[]> = {};
  questions.forEach(q => {
    const sec = q.section || 'SECTION_A';
    if (!map[sec]) map[sec] = [];
    map[sec].push(q);
  });

  const sortedKeys = Object.keys(map).sort();
  const dynamicSections = sortedKeys.map(key => {
    const qs = map[key];
    const totalMarks = qs.reduce((acc, q) => acc + Number(q.marks || 0), 0);
    const count = qs.length;
    const avgMarks = count > 0 ? qs[0].marks : 0;
    const allSameMarks = qs.every(q => q.marks === avgMarks);

    const displayLabel = key.replace('_', ' ').replace(/SECTION/i, 'Section');
    return { key, displayLabel, questions: qs, totalMarks, count, avgMarks, allSameMarks };
  });

  const sQs = map['SECTION_A'] || [];
  const lQs = map['SECTION_B'] || [];
  const eQs = map['SECTION_C'] || [];

  return {
    dynamicSections,
    finalShort: sQs,
    longQuestions: lQs,
    essayQuestions: eQs,
    shortTotal: sQs.reduce((acc, q) => acc + Number(q.marks || 0), 0),
    longTotal: lQs.reduce((acc, q) => acc + Number(q.marks || 0), 0),
    essayTotal: eQs.reduce((acc, q) => acc + Number(q.marks || 0), 0),
    shortCount: sQs.length,
    longCount: lQs.length,
    essayCount: eQs.length,
    shortAvgMarks: sQs.length > 0 ? sQs[0].marks : 2,
    longAvgMarks: lQs.length > 0 ? lQs[0].marks : 5,
    essayAvgMarks: eQs.length > 0 ? eQs[0].marks : 10
  };
}

export default function PaperPreviewPage() {
  const params = useParams();
  const router = useRouter();
  const paperId = params?.id;

  const [paper, setPaper] = useState<PaperDTO | null>(null);
  const [versions, setVersions] = useState<VersionDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'print'>('edit');
  const [validation, setValidation] = useState<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    sectionATarget: number;
    sectionBTarget: number;
    sectionCTarget: number;
    sectionAActual: number;
    sectionBActual: number;
    sectionCActual: number;
    sections?: Array<{ sectionName: string; actual: number; target: number }>;
  } | null>(null);
  
  // Review comments / revision modal
  const [comments, setComments] = useState('');
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [selectedRejectedIds, setSelectedRejectedIds] = useState<number[]>([]);
  
  // Editing state for single questions
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [editMarks, setEditMarks] = useState(0);
  const [editOptions, setEditOptions] = useState('');
  const [editCorrectAnswer, setEditCorrectAnswer] = useState('');
  const [editSolutionSteps, setEditSolutionSteps] = useState('');
  const [editQuestionType, setEditQuestionType] = useState('SHORT');
  const [editChapter, setEditChapter] = useState('');
  const [editTopic, setEditTopic] = useState('');
  const [editLearningOutcome, setEditLearningOutcome] = useState('');
  const [editSection, setEditSection] = useState('SECTION_A');

  // Metadata edit state
  const [isEditingMetadata, setIsEditingMetadata] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editClass, setEditClass] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [editSyllabus, setEditSyllabus] = useState('');
  const [editChapters, setEditChapters] = useState('');
  const [editTopics, setEditTopics] = useState('');
  const [editDuration, setEditDuration] = useState(100);
  const [editTotalMarks, setEditTotalMarks] = useState(50);
  const [editTestType, setEditTestType] = useState('Parakh Test Series');

  const runBackendValidation = async () => {
    if (!paperId) return;
    try {
      const res = await api.get(`/autota/papers/${paperId}/validate`);
      if (res.data.success) {
        setValidation(res.data.data);
      }
    } catch (err) {
      console.error('Error running backend validation:', err);
    }
  };

  const fetchPaperDetails = async () => {
    if (!paperId) return;
    try {
      const paperRes = await api.get(`/autota/papers/${paperId}`);
      if (paperRes.data.success) {
        const p = paperRes.data.data as PaperDTO;
        setPaper(p);
        setEditTitle(p.title || '');
        setEditClass(p.course || '');
        setEditSubject(p.subject || '');
        setEditSyllabus(p.syllabus || '');
        let cleanChaps = p.chapters || '';
        if (cleanChaps.includes('INSTRUCTOR EXPLICIT OVERRIDE') || cleanChaps.includes('CRITICAL REQUIREMENT') || cleanChaps.includes('SUBJECT:') || cleanChaps.length > 80) {
          cleanChaps = p.subject && p.course ? `${p.subject} - ${p.course}` : (p.subject || 'Syllabus Core');
        }
        setEditChapters(cleanChaps);
        setEditTopics(p.topics || '');
        setEditDuration(p.duration || 100);
        setEditTotalMarks(p.totalMarks || 50);
        setEditTestType(p.testType || 'Parakh Test Series');
      }
      
      const versionsRes = await api.get(`/autota/papers/${paperId}/versions`);
      if (versionsRes.data.success) {
        setVersions(versionsRes.data.data);
      }
      
      await runBackendValidation();
      setLoading(false);
    } catch (err) {
      console.error('Error fetching paper details:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaperDetails();
  }, [paperId]);

  // Real-time marks calculation
  const calculatedTotalMarks = useMemo(() => {
    return paper?.questions?.reduce((acc, q) => acc + Number(q.marks || 0), 0) || 0;
  }, [paper?.questions]);

  // Section calculations using pure section fields only
  const { dynamicSections, finalShort, longQuestions, essayQuestions, shortTotal, longTotal, essayTotal, shortCount, longCount, essayCount, shortAvgMarks, longAvgMarks, essayAvgMarks } = useMemo(() => {
    return calculateSectionTotals(paper?.questions || []);
  }, [paper?.questions]);

  // Target Section blueprints: 20% Section A, 30% Section B, 50% Section C
  const targetSectionATotal = Math.round(Number(editTotalMarks) * 0.20);
  const targetSectionBTotal = Math.round(Number(editTotalMarks) * 0.30);
  const targetSectionCTotal = Number(editTotalMarks) - targetSectionATotal - targetSectionBTotal;

  const remainingMarks = Number(editTotalMarks) - calculatedTotalMarks;

  const recalculateSectionOrders = (questionsList: QuestionDTO[]) => {
    if (!paper) return;
    // Dynamically preserve and order all sections (A through G, etc.)
    const uniqueSections = Array.from(new Set(questionsList.map(q => q.section || 'SECTION_A'))).sort();
    const orderedQuestions: QuestionDTO[] = [];
    uniqueSections.forEach(sec => {
      const secList = questionsList.filter(q => (q.section || 'SECTION_A') === sec);
      secList.forEach((q, idx) => q.questionOrder = idx + 1);
      orderedQuestions.push(...secList);
    });

    setPaper({
      ...paper,
      questions: orderedQuestions
    });
  };

  // Save Draft
  const handleSaveDraft = async (overrideStatus?: string) => {
    if (!paper || !paperId) return;
    setActionLoading(true);
    try {
      const targetStatus = overrideStatus || paper.status;
      const payload = {
        title: editTitle,
        totalMarks: Number(editTotalMarks),
        duration: Number(editDuration),
        testType: editTestType,
        chapters: editChapters,
        topics: editTopics,
        course: editClass,
        subject: editSubject,
        syllabus: editSyllabus,
        status: targetStatus,
        questions: paper.questions.map(q => ({
          id: q.id < 0 ? null : q.id, // clear temp negative IDs
          questionText: q.questionText,
          options: q.options,
          correctAnswer: q.correctAnswer,
          solutionSteps: q.solutionSteps,
          marks: Number(q.marks),
          difficulty: q.difficulty || 'MEDIUM',
          questionType: q.questionType,
          agentType: q.agentType,
          chapter: q.chapter || 'Syllabus Core',
          topic: q.topic || '',
          learningOutcome: q.learningOutcome || '',
          section: q.section,
          questionOrder: q.questionOrder,
          bloomLevel: q.bloomLevel || 'Application',
          markingScheme: q.markingScheme,
          qualityStatus: q.qualityStatus,
          estimatedTimeMinutes: q.estimatedTimeMinutes
        }))
      };

      const response = await api.put(`/autota/papers/${paperId}`, payload);
      if (response.data.success) {
        alert(overrideStatus === 'APPROVED' ? 'Exam paper approved successfully!' : 'Draft exam paper saved successfully!');
        setPaper(response.data.data);
        setIsEditingMetadata(false);
        fetchPaperDetails();
      }
    } catch (err: any) {
      console.error('Error saving draft:', err);
      alert('Failed to save paper: ' + (err.response?.data?.message || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  // Re-calculate & Adjust Marks to match Target
  const handleRecalculateMarks = () => {
    if (!paper) return;
    const questions = [...paper.questions];
    if (questions.length === 0) return;

    const targetTotal = Number(editTotalMarks);
    const sum = questions.reduce((acc, q) => acc + Number(q.marks || 0), 0);
    
    if (sum === targetTotal) {
      alert('Marks are already perfectly balanced!');
      return;
    }

    const difference = targetTotal - sum;
    if (difference > 0) {
      const last = questions[questions.length - 1];
      last.marks += difference;
    } else {
      let toSubtract = -difference;
      for (let i = 0; i < questions.length; i++) {
        if (toSubtract <= 0) break;
        const current = questions[i].marks;
        if (current > 1) {
          const subtract = Math.min(toSubtract, current - 1);
          questions[i].marks -= subtract;
          toSubtract -= subtract;
        }
      }
      if (toSubtract > 0) {
        questions[questions.length - 1].marks = 1;
      }
    }

    setPaper({
      ...paper,
      questions
    });
    alert(`Adjusted marks to match target! New calculated marks sum = ${targetTotal}`);
  };

  // Approve paper draft
  const handleApprove = async () => {
    if (calculatedTotalMarks !== Number(editTotalMarks)) {
      alert('Marks mismatch: You must reconcile calculated marks to match paper target marks before approval.');
      return;
    }
    await handleSaveDraft('APPROVED');
  };

  // Revision triggers
  const handleRejectAndRegenerate = async () => {
    if (!paperId) return;
    if (selectedRejectedIds.length === 0) {
      alert('Please select at least one question to revise.');
      return;
    }
    
    setActionLoading(true);
    try {
      const response = await api.post(`/autota/papers/${paperId}/review`, {
        action: 'REQUEST_REGENERATION',
        comments: comments.trim() || 'Regeneration of weak questions.',
        rejectedQuestionIds: selectedRejectedIds
      });
      if (response.data.success) {
        alert('Selected questions sent to the feedback loop. Affected agents are regenerating...');
        setShowRevisionModal(false);
        setSelectedRejectedIds([]);
        setComments('');
        fetchPaperDetails();
      }
    } catch (err) {
      console.error('Error requesting revisions:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSingleRegen = async (questionId: number) => {
    if (!paperId) return;
    setActionLoading(true);
    try {
      const response = await api.post(`/autota/papers/${paperId}/questions/${questionId}/regenerate`);
      if (response.data.success) {
        alert('Question successfully regenerated by the agent!');
        fetchPaperDetails();
      }
    } catch (err) {
      console.error('Error regenerating single question:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Question editing handlers
  const startEditing = (q: QuestionDTO) => {
    setEditingQuestionId(q.id);
    setEditText(q.questionText);
    setEditMarks(q.marks);
    setEditOptions(q.options || '');
    setEditCorrectAnswer(q.correctAnswer || '');
    setEditSolutionSteps(q.solutionSteps || '');
    setEditQuestionType(q.questionType || 'SHORT');
    setEditChapter(q.chapter || '');
    setEditTopic(q.topic || '');
    setEditLearningOutcome(q.learningOutcome || '');
    setEditSection(q.section || 'SECTION_A');
  };

  const handleSaveQuestionEdit = (qId: number) => {
    if (!paper) return;
    const updatedQuestions = paper.questions.map(q => {
      if (q.id === qId) {
        return {
          ...q,
          questionText: editText,
          marks: Number(editMarks),
          options: editOptions,
          correctAnswer: editCorrectAnswer,
          solutionSteps: editSolutionSteps,
          questionType: editQuestionType,
          chapter: editChapter,
          topic: editTopic,
          learningOutcome: editLearningOutcome,
          section: editSection
        };
      }
      return q;
    });
    
    recalculateSectionOrders(updatedQuestions);
    setEditingQuestionId(null);
  };

  const handleAddQuestion = () => {
    if (!paper) return;
    const tempId = -Date.now();
    const newQ: QuestionDTO = {
      id: tempId,
      questionText: 'Double-click to edit and customize this question...',
      options: '',
      correctAnswer: '',
      solutionSteps: '',
      marks: 2,
      difficulty: 'MEDIUM',
      questionType: 'SHORT',
      agentType: 'THEORY',
      chapter: 'Basics',
      topic: 'General',
      learningOutcome: 'Conceptual understanding',
      section: 'SECTION_A',
      questionOrder: 999,
      version: 1,
      bloomLevel: 'Application'
    };
    
    const updated = [...paper.questions, newQ];
    recalculateSectionOrders(updated);
    startEditing(newQ);
  };

  const handleDeleteQuestion = (qId: number) => {
    if (!paper) return;
    const updated = paper.questions.filter(q => q.id !== qId);
    recalculateSectionOrders(updated);
    if (editingQuestionId === qId) {
      setEditingQuestionId(null);
    }
  };

  const handleDuplicateQuestion = (q: QuestionDTO) => {
    if (!paper) return;
    const tempId = -Date.now();
    const newQ: QuestionDTO = {
      ...q,
      id: tempId,
      questionText: q.questionText + ' (Copy)',
      bloomLevel: q.bloomLevel || 'Application'
    };
    
    const idx = paper.questions.findIndex(item => item.id === q.id);
    const updated = [...paper.questions];
    updated.splice(idx + 1, 0, newQ);
    
    recalculateSectionOrders(updated);
  };

  const handleSplitQuestion = (q: QuestionDTO) => {
    if (!paper) return;
    if (q.marks < 2) {
      alert("Cannot split a question worth less than 2 marks.");
      return;
    }
    const half1 = Math.floor(q.marks / 2);
    const half2 = q.marks - half1;
    
    const idx = paper.questions.findIndex(item => item.id === q.id);
    if (idx === -1) return;

    const q1: QuestionDTO = {
      ...q,
      id: -Date.now(),
      questionText: q.questionText + " (Part A)",
      marks: half1,
      bloomLevel: q.bloomLevel || 'Application'
    };
    const q2: QuestionDTO = {
      ...q,
      id: -Date.now() - 1,
      questionText: q.questionText + " (Part B)",
      marks: half2,
      bloomLevel: q.bloomLevel || 'Application'
    };

    const updated = [...paper.questions];
    updated.splice(idx, 1, q1, q2);

    recalculateSectionOrders(updated);
  };

  const handleMergeQuestions = (index: number) => {
    if (!paper) return;
    if (index >= paper.questions.length - 1) {
      alert("Cannot merge: No subsequent question exists.");
      return;
    }
    const q1 = paper.questions[index];
    const q2 = paper.questions[index + 1];
    
    if (q1.section !== q2.section) {
      alert("Cannot merge questions belonging to different sections.");
      return;
    }

    const merged: QuestionDTO = {
      ...q1,
      id: -Date.now(),
      questionText: q1.questionText + " [AND] " + q2.questionText,
      marks: q1.marks + q2.marks,
      solutionSteps: (q1.solutionSteps || "") + "\n" + (q2.solutionSteps || ""),
      bloomLevel: q1.bloomLevel || 'Application'
    };

    const updated = [...paper.questions];
    updated.splice(index, 2, merged);

    recalculateSectionOrders(updated);
  };

  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    if (!paper) return;
    const list = [...paper.questions];
    
    if (direction === 'up' && index > 0) {
      const q1 = list[index];
      const q2 = list[index - 1];
      if (q1.section !== q2.section) {
        alert("Cannot move question across section boundaries.");
        return;
      }
      list[index] = q2;
      list[index - 1] = q1;
    } else if (direction === 'down' && index < list.length - 1) {
      const q1 = list[index];
      const q2 = list[index + 1];
      if (q1.section !== q2.section) {
        alert("Cannot move question across section boundaries.");
        return;
      }
      list[index] = q2;
      list[index + 1] = q1;
    }
    
    recalculateSectionOrders(list);
  };

  // MCQ parsing helper
  const parseOptionsObj = (optStr: string) => {
    try {
      const cleaned = optStr.trim();
      if (!cleaned) return { A: '', B: '', C: '', D: '' };
      return JSON.parse(cleaned);
    } catch (e) {
      return { A: '', B: '', C: '', D: '' };
    }
  };

  // Safe Print Trigger
  const handlePrintTrigger = async () => {
    if (validation && !validation.isValid) {
      alert('Print Blocked: Paper validation failed:\n' + validation.errors.join('\n'));
      return;
    }
    if (paper?.status !== 'APPROVED' && paper?.status !== 'EXPORTED' && paper?.status !== 'PUBLISHED') {
      alert('Print Blocked: You must Approve the paper first to authorize PDF generation/printing.');
      return;
    }

    try {
      await api.put(`/autota/papers/${paperId}`, {
        ...paper,
        status: 'EXPORTED'
      });
      if (paper) {
        setPaper({ ...paper, status: 'EXPORTED' });
      }
    } catch (e) {
      console.warn('Could not transition status to EXPORTED:', e);
    }

    window.print();
  };

  // Safe POI Word (.docx) Document Download Trigger
  const handleDownloadDocx = async () => {
    if (validation && !validation.isValid) {
      alert('DOCX Export Blocked: Paper validation failed:\n' + validation.errors.join('\n'));
      return;
    }
    if (paper?.status !== 'APPROVED' && paper?.status !== 'EXPORTED' && paper?.status !== 'PUBLISHED' && paper?.status !== 'REVIEWED') {
      alert('DOCX Export Blocked: You must Approve the paper first to authorize Word export.');
      return;
    }

    try {
      setActionLoading(true);
      const response = await api.get(`/autota/papers/${paperId}/export/docx`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `exam-paper-${paperId}.docx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Failed to export DOCX:', err);
      alert('Failed to download Word document: ' + (err.response?.data?.message || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  const toggleQuestionRejection = (id: number) => {
    if (selectedRejectedIds.includes(id)) {
      setSelectedRejectedIds(selectedRejectedIds.filter(item => item !== id));
    } else {
      setSelectedRejectedIds([...selectedRejectedIds, id]);
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-500 mb-3" />
        <p className="text-xs font-medium">Loading exam paper layout...</p>
      </div>
    );
  }

  if (!paper) {
    return (
      <div className="py-16 text-center text-slate-400">
        Paper not found or generation request failed.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto text-slate-100 animate-in fade-in duration-300">
      
      {/* Left 2 Columns: Workspace */}
      <div className="lg:col-span-2 space-y-5">
        
        {/* Navigation Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/80 pb-4 no-print">
          <div>
            <Link
              href="/dashboard/instructor/auto-ta"
              className="flex items-center gap-1 text-xs font-extrabold text-indigo-400 hover:text-indigo-300 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Auto-TA Dashboard
            </Link>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-2.5">{paper.title}</h2>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-300 font-semibold">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-indigo-300 font-bold">
                <BookOpen className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                {paper.subject || 'Examination'} {paper.course ? `(${paper.course})` : ''}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-amber-300 font-bold">
                <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                {paper.duration || 100} Mins
              </span>
              <span className="px-2 py-1 bg-slate-900/60 border border-slate-800 rounded-lg text-slate-400">
                Version {paper.version} • Total Marks: {paper.totalMarks}
              </span>
            </div>
          </div>

          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold border self-start ${
            paper.status === 'APPROVED' || paper.status === 'EXPORTED' || paper.status === 'PUBLISHED'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-amber-500/10 text-amber-450 border-amber-500/20'
          }`}>
            {paper.status.replace('_', ' ')}
          </span>
        </div>

        {/* Workspace Mode Tabs */}
        <div className="flex border-b border-slate-800/60 no-print">
          <button
            onClick={() => setActiveTab('edit')}
            className={`px-5 py-2.5 text-xs font-extrabold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === 'edit'
                ? 'border-indigo-500 text-white bg-indigo-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Draft Editor
          </button>
          <button
            onClick={() => {
              if (validation && !validation.isValid) {
                alert(`Print Preview Blocked:\n` + validation.errors.join('\n'));
                return;
              }
              if (paper.status !== 'APPROVED' && paper.status !== 'REVIEWED' && paper.status !== 'EXPORTED' && paper.status !== 'PUBLISHED') {
                alert('Print Blocked: You must Approve the paper first to authorize print preview.');
                return;
              }
              setActiveTab('print');
            }}
            className={`px-5 py-2.5 text-xs font-extrabold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === 'print'
                ? 'border-indigo-500 text-white bg-indigo-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Print Preview (A4)
          </button>
        </div>

        {activeTab === 'edit' ? (
          /* Editor workspace */
          <div className="space-y-6">
            
            {/* Master validation warning */}
            {validation && !validation.isValid && validation.errors && validation.errors.length > 0 && (
              <div className="flex items-start gap-3 p-4 bg-rose-500/10 border border-rose-500/25 rounded-2xl text-xs text-rose-455 no-print">
                <AlertTriangle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
                <div className="leading-relaxed space-y-1">
                  <span className="font-extrabold uppercase tracking-wider text-[10px] block text-rose-400">Exam Paper Critical Errors (Backend Check):</span>
                  <ul className="list-disc pl-4 space-y-1">
                    {validation.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                  <p className="text-[10px] text-rose-450 italic mt-2">PDF Export and Approval are blocked until all errors are resolved.</p>
                </div>
              </div>
            )}

            {validation && validation.warnings && validation.warnings.length > 0 && (
              <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/25 rounded-2xl text-xs text-amber-400 no-print">
                <AlertTriangle className="w-5 h-5 shrink-0 text-amber-500 mt-0.5" />
                <div className="leading-relaxed space-y-1 w-full">
                  <span className="font-extrabold uppercase tracking-wider text-[10px] block text-amber-500">Exam Paper Warnings (Pedagogical Check):</span>
                  <ul className="list-disc pl-4 space-y-1">
                    {validation.warnings.map((warn, i) => (
                      <li key={i}>{warn}</li>
                    ))}
                  </ul>
                  <p className="text-[10px] text-amber-500/80 italic mt-2">Warnings do not block approval or printing. They are just suggestions for improvement.</p>
                </div>
              </div>
            )}

            {/* Config panel */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-md space-y-4 no-print">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Settings className="w-4 h-4 text-indigo-400" />
                  Paper Metadata Settings
                </h3>
                <button
                  onClick={() => setIsEditingMetadata(!isEditingMetadata)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-indigo-400 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer"
                >
                  {isEditingMetadata ? 'Close Settings' : 'Edit Settings'}
                </button>
              </div>

              {isEditingMetadata ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Institute Name</label>
                    <input
                      type="text"
                      value={editTestType}
                      onChange={(e) => setEditTestType(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Test Series Title</label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Class / Grade Level</label>
                    <input
                      type="text"
                      value={editClass}
                      onChange={(e) => setEditClass(e.target.value)}
                      placeholder="e.g. Class 9th"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Subject</label>
                    <input
                      type="text"
                      value={editSubject}
                      onChange={(e) => setEditSubject(e.target.value)}
                      placeholder="e.g. Mathematics"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Chapters / Syllabus Description</label>
                    <input
                      type="text"
                      value={editChapters}
                      onChange={(e) => setEditChapters(e.target.value)}
                      placeholder="e.g. Ch – 5, 6 (HCF/LCM)"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Target Syllabus Details</label>
                    <input
                      type="text"
                      value={editSyllabus}
                      onChange={(e) => setEditSyllabus(e.target.value)}
                      placeholder="Core concepts details"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Duration (Minutes)</label>
                    <input
                      type="number"
                      value={editDuration}
                      onChange={(e) => setEditDuration(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Target Total Marks</label>
                    <input
                      type="number"
                      value={editTotalMarks}
                      onChange={(e) => setEditTotalMarks(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-1">
                  <div>
                    <span className="block text-[8px] text-slate-455 uppercase font-extrabold">Institute</span>
                    <span className="text-white font-bold">{editTestType}</span>
                  </div>
                  <div>
                    <span className="block text-[8px] text-slate-455 uppercase font-extrabold">Syllabus</span>
                    <span className="text-white font-bold">{editChapters || 'Not specified'}</span>
                  </div>
                  <div>
                    <span className="block text-[8px] text-slate-455 uppercase font-extrabold">Duration</span>
                    <span className="text-white font-bold">{editDuration} Min</span>
                  </div>
                  <div>
                    <span className="block text-[8px] text-slate-455 uppercase font-extrabold">Target Marks</span>
                    <span className="text-white font-bold">{editTotalMarks} Marks</span>
                  </div>
                </div>
              )}
            </div>

            {/* Questions list container */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md space-y-6 shadow-xl leading-relaxed select-text">
              <div className="text-center border-b border-slate-800 pb-5 flex items-center justify-between">
                <div className="text-left space-y-1">
                  <h3 className="text-md font-black tracking-wider uppercase text-white">LEARNSTUDIO ACADEMIC TESTING SERVICE</h3>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Draft Editor Workspace</p>
                </div>
                <button
                  onClick={handleAddQuestion}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer no-print transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Question
                </button>
              </div>

              <div className="space-y-6 divide-y divide-slate-800/50">
                {paper.questions.map((q, index) => (
                  <div key={q.id} className={`pt-5 first:pt-0 group relative space-y-3 ${selectedRejectedIds.includes(q.id) ? 'bg-rose-500/5 -mx-4 px-4 py-3 rounded-xl border border-rose-500/20' : ''}`}>
                    
                    {/* Header Row */}
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-indigo-400">
                          {(q.section || 'SECTION_A').replace('SECTION_', 'Sec ')} - Q{q.questionOrder || index + 1}
                        </span>
                        <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-455 bg-slate-800 px-2 py-0.5 rounded border border-slate-750">{q.questionType}</span>
                        <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-900">{q.agentType}</span>
                        {q.chapter && (
                          <span className="text-[9px] font-bold text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800/60 max-w-[120px] truncate" title={q.chapter}>
                            {q.chapter}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {/* Position Shifting controls */}
                        <div className="flex items-center gap-1 no-print">
                          <button
                            onClick={() => handleMoveQuestion(index, 'up')}
                            disabled={index === 0}
                            className="p-1 hover:bg-slate-850 rounded text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleMoveQuestion(index, 'down')}
                            disabled={index === paper.questions.length - 1}
                            className="p-1 hover:bg-slate-850 rounded text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <span className="text-xs font-semibold text-slate-355">{q.marks} Marks</span>
                      </div>
                    </div>

                    {/* Question Editing Area */}
                    {editingQuestionId === q.id ? (
                      <div className="space-y-4 pt-1 no-print">
                        <div className="space-y-1">
                          <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-455">Question Text</label>
                          <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-all leading-relaxed"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                          <div className="space-y-1">
                            <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-455">Section</label>
                            <select
                              value={editSection}
                              onChange={(e) => setEditSection(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
                            >
                              <option value="SECTION_A">Section A</option>
                              <option value="SECTION_B">Section B</option>
                              <option value="SECTION_C">Section C</option>
                              <option value="SECTION_D">Section D</option>
                              <option value="SECTION_E">Section E</option>
                              <option value="SECTION_F">Section F</option>
                              <option value="SECTION_G">Section G</option>
                            </select>
                          </div>
                          
                          <div className="space-y-1">
                            <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-455">Question Pattern</label>
                            <select
                              value={editQuestionType}
                              onChange={(e) => setEditQuestionType(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
                            >
                              <option value="SHORT">Short Answer Question</option>
                              <option value="MCQ">Multiple Choice (MCQ)</option>
                              <option value="LONG">Long Answer Question</option>
                              <option value="NUMERICAL">Numerical / Mathematical Formula</option>
                            </select>
                          </div>
                          
                          <div className="space-y-1">
                            <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-455">Marks Weight</label>
                            <select
                              value={editMarks}
                              onChange={(e) => setEditMarks(Number(e.target.value))}
                              className="w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
                            >
                              {ALLOWED_MARKS.map(m => (
                                <option key={m} value={m}>{m} Marks</option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-455">Chapter</label>
                            <input
                              type="text"
                              value={editChapter}
                              onChange={(e) => setEditChapter(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-455">Topic</label>
                            <input
                              type="text"
                              value={editTopic}
                              onChange={(e) => setEditTopic(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-455">Learning Outcome</label>
                            <input
                              type="text"
                              value={editLearningOutcome}
                              onChange={(e) => setEditLearningOutcome(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
                            />
                          </div>
                        </div>

                        {/* MCQ Options Editor */}
                        {editQuestionType === 'MCQ' && (
                          <div className="space-y-2">
                            <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-455">MCQ Options Builder</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-955 p-4 rounded-xl border border-slate-850">
                              {['A', 'B', 'C', 'D'].map((key) => {
                                const opts = parseOptionsObj(editOptions);
                                return (
                                  <div key={key} className="flex items-center gap-2">
                                    <span className="text-xs font-black text-indigo-400 w-4">{key}.</span>
                                    <input
                                      type="text"
                                      value={opts[key] || ''}
                                      onChange={(e) => {
                                        const newOpts = { ...opts, [key]: e.target.value };
                                        setEditOptions(JSON.stringify(newOpts));
                                      }}
                                      placeholder={`Enter option ${key}`}
                                      className="flex-1 px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        <div className="space-y-2">
                          <div className="space-y-1">
                            <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-455">Correct Answer</label>
                            <input
                              type="text"
                              value={editCorrectAnswer}
                              onChange={(e) => setEditCorrectAnswer(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-455">Solution Steps / Scoring Rubric</label>
                            <textarea
                              value={editSolutionSteps}
                              onChange={(e) => setEditSolutionSteps(e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => setEditingQuestionId(null)}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" /> Cancel
                          </button>
                          <button
                            onClick={() => handleSaveQuestionEdit(q.id)}
                            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" /> Apply Edits
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="text-xs sm:text-sm text-slate-100 font-medium leading-relaxed prose prose-invert max-w-none">
                          <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                            {q.questionText}
                          </ReactMarkdown>
                        </div>
                        
                        {/* MCQ Options representation */}
                        {q.options && (() => {
                          try {
                            const parsedOpts = JSON.parse(q.options);
                            return (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-4 pt-1">
                                {Object.entries(parsedOpts).map(([key, val]) => (
                                  <div key={key} className="text-xs text-slate-400 font-semibold flex items-baseline gap-1.5">
                                    <span className="text-indigo-400 font-bold shrink-0">{key}.</span>
                                    <div className="inline-block flex-1 prose prose-invert prose-sm max-w-none">
                                      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                                        {val as string}
                                      </ReactMarkdown>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            );
                          } catch (e) {
                            return null;
                          }
                        })()}

                        {/* Answer and explanations */}
                        {(q.correctAnswer || q.solutionSteps || q.learningOutcome || q.topic) && (
                          <div className="bg-slate-955/45 border border-slate-900/65 rounded-xl p-3.5 mt-2 space-y-1.5 text-[11px] leading-relaxed">
                            {q.correctAnswer && (
                              <p className="text-emerald-450 font-medium">
                                <span className="font-extrabold text-slate-450 uppercase tracking-wider text-[9px] mr-1">Correct Answer:</span> {q.correctAnswer}
                              </p>
                            )}
                            {q.solutionSteps && (
                              <div className="text-slate-400">
                                <span className="font-extrabold text-slate-450 uppercase tracking-wider text-[9px] mr-1 block mb-2">Solution Guidelines:</span> 
                                <div className="prose prose-invert prose-sm max-w-none text-slate-300">
                                  <ReactMarkdown 
                                    remarkPlugins={[remarkGfm, remarkMath]}
                                    rehypePlugins={[rehypeKatex]}
                                  >
                                    {q.solutionSteps}
                                  </ReactMarkdown>
                                </div>
                              </div>
                            )}
                            {(q.topic || q.learningOutcome) && (
                              <div className="flex flex-wrap gap-x-4 pt-1 border-t border-slate-800/30 text-slate-500 font-semibold">
                                {q.topic && <span>Topic: {q.topic}</span>}
                                {q.learningOutcome && <span>LO: {q.learningOutcome}</span>}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Inline Actions */}
                    {editingQuestionId !== q.id && paper.status !== 'APPROVED' && (
                      <div className="flex items-center gap-2 pt-2.5 border-t border-slate-800/20 opacity-0 group-hover:opacity-100 transition-opacity">
                        
                        <button
                          onClick={() => startEditing(q)}
                          className="px-2.5 py-1.5 bg-slate-955 border border-slate-800 hover:border-slate-750 text-indigo-400 hover:text-indigo-300 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                        >
                          <Edit className="w-3.5 h-3.5" /> Edit
                        </button>

                        <button
                          onClick={() => handleDuplicateQuestion(q)}
                          className="px-2.5 py-1.5 bg-slate-955 border border-slate-800 hover:border-slate-750 text-indigo-350 hover:text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                        >
                          <Copy className="w-3.5 h-3.5" /> Duplicate
                        </button>

                        {q.marks >= 2 && (
                          <button
                            onClick={() => handleSplitQuestion(q)}
                            className="px-2.5 py-1.5 bg-slate-955 border border-slate-800 hover:border-slate-750 text-amber-400 hover:text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                          >
                            <GitFork className="w-3.5 h-3.5" /> Split
                          </button>
                        )}

                        {index < paper.questions.length - 1 && paper.questions[index].section === paper.questions[index+1].section && (
                          <button
                            onClick={() => handleMergeQuestions(index)}
                            className="px-2.5 py-1.5 bg-slate-955 border border-slate-800 hover:border-slate-750 text-emerald-455 hover:text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                          >
                            <Merge className="w-3.5 h-3.5" /> Merge Next
                          </button>
                        )}
                        
                        <button
                          onClick={() => toggleQuestionRejection(q.id)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                            selectedRejectedIds.includes(q.id)
                              ? 'bg-rose-600 border-rose-600 text-white'
                              : 'bg-slate-955 border-slate-800 hover:border-slate-750 text-rose-455 hover:text-rose-450'
                          }`}
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          {selectedRejectedIds.includes(q.id) ? 'Revising' : 'Mark Revise'}
                        </button>

                        <button
                          onClick={() => handleSingleRegen(q.id)}
                          className="px-2.5 py-1.5 bg-slate-955 border border-slate-800 hover:border-slate-750 text-indigo-355 hover:text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> AI Regen
                        </button>

                        <button
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="px-2.5 py-1.5 bg-slate-955 border border-slate-800 hover:border-rose-900/40 text-rose-455 hover:text-rose-350 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer ml-auto transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>

                      </div>
                    )}

                  </div>
                ))}
              </div>
            </div>

          </div>
        ) : (
          /* A4 Print Layout Sheet */
          <div className="space-y-5 animate-in fade-in duration-200">
            
            {/* Toolbar */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 backdrop-blur-md no-print">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Print / Export Exam Paper</h4>
                <p className="text-[10px] text-slate-455 mt-1.5 leading-normal">Confirm formatting matches school requirements. The RK watermark logo is embedded cleanly.</p>
              </div>
              <div className="flex gap-2.5">
                <button
                  onClick={handlePrintTrigger}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer shrink-0"
                >
                  <Printer className="w-4 h-4" />
                  Download PDF
                </button>
                <button
                  onClick={handleDownloadDocx}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer shrink-0"
                >
                  <Save className="w-4 h-4" />
                  Download MS Word (.docx)
                </button>
              </div>
            </div>

            {/* A4 Container */}
            <div className="overflow-auto bg-slate-955/60 border border-slate-900 rounded-2xl p-4 sm:p-8 flex justify-center shadow-inner print-container">
              <div id="printable-exam-paper" className="bg-white text-black font-serif p-12 sm:p-16 rounded-none border-[6px] border-double border-black shadow-2xl mx-auto w-[210mm] min-h-[297mm] flex flex-col space-y-6 text-left relative select-text">
                
                {/* Print Stylesheet injection for clean multi-page pagination */}
                <style dangerouslySetInnerHTML={{ __html: `
                  @page {
                    size: A4 portrait;
                    margin: 18mm 15mm 18mm 15mm;
                    border: 4px double #000000;
                    padding: 6mm;
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
                      border: none !important; /* Border around every page handled directly by @page rule */
                      display: block !important;
                      overflow: visible !important;
                    }
                    .print-section-header {
                      page-break-after: avoid !important;
                      break-after: avoid !important;
                    }
                    .print-question-item {
                      page-break-inside: avoid !important;
                      break-inside: avoid !important;
                      margin-bottom: 14px !important;
                    }
                    .print-mcq-options {
                      page-break-inside: avoid !important;
                      break-inside: avoid !important;
                    }
                  }
                ` }} />

                {/* Circular Watermark Logo */}
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

                {/* Header */}
                <div className="pb-2 relative z-10 w-full text-center">
                  <h1 className="text-3xl sm:text-[32px] font-black tracking-wider uppercase text-black font-serif my-2 leading-none whitespace-nowrap">
                    R. K. COACHING CLASSES
                  </h1>
                  <div className="border-b-[4px] border-black w-full my-1"></div>
                  
                  <div className="text-center font-bold text-md my-2 flex items-center justify-center gap-2">
                    <span className="bg-yellow-200 border border-black text-black px-3 py-0.5 font-extrabold uppercase text-[10px] tracking-wider">{editTestType}</span>
                    <span className="text-black font-extrabold text-sm font-serif">Class – {editClass || '9th'} ({editSubject || 'Mathematics'})</span>
                  </div>
                  
                  <div className="grid grid-cols-3 items-center text-xs font-bold font-serif py-1.5 border-t-2 border-b-4 border-double border-black mt-2">
                    <div className="justify-self-start border-2 border-black px-2.5 py-0.5 text-black">
                      Time – {editDuration} min
                    </div>
                    <div className="justify-self-center text-black font-black tracking-wide uppercase text-center max-w-[320px] line-clamp-2 text-ellipsis overflow-hidden">
                      {editChapters || 'Syllabus Core'}
                    </div>
                    <div className="justify-self-end border-2 border-black px-2.5 py-0.5 text-black">
                      M.Marks – {editTotalMarks}
                    </div>
                  </div>
                </div>

                {/* Question Sections dynamically mapped across all pages */}
                <div className="space-y-7 pt-2 flex-1 text-black relative z-10">
                  {dynamicSections.map((sec) => (
                    <div key={sec.key} className="space-y-4 print-section-container">
                      <div className="text-center font-bold font-serif text-[13px] tracking-wide pt-2 print-section-header">
                        <span className="underline uppercase font-extrabold">{sec.displayLabel}</span>
                        <span className="font-extrabold ml-1">
                          {sec.allSameMarks
                            ? `(${sec.count} × ${sec.avgMarks} = ${sec.totalMarks} Marks)`
                            : `(${sec.count} Questions, Total: ${sec.totalMarks} Marks)`
                          }
                        </span>
                      </div>
                      
                      <div className="space-y-4 pt-1">
                        {sec.questions.map((q, qIdx) => (
                          <div key={q.id} className="text-sm space-y-2 relative leading-relaxed text-black print-question-item">
                            <div className="flex gap-2.5 items-start">
                              <span className="font-bold shrink-0 min-w-[24px] text-right">{q.questionOrder || qIdx + 1})</span>
                              <div className="flex-1 font-medium text-black text-justify prose prose-sm max-w-none print-math-container">
                                <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                                  {q.questionText}
                                </ReactMarkdown>
                              </div>
                              <span className="font-bold text-xs shrink-0 pl-2">[{q.marks}]</span>
                            </div>

                            {q.options && (() => {
                              try {
                                const parsed = JSON.parse(q.options);
                                return (
                                  <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 pl-8 pt-1 text-black print-mcq-options">
                                    {Object.entries(parsed).map(([key, val]) => (
                                      <div key={key} className="text-xs text-black flex items-baseline gap-1.5">
                                        <span className="font-bold mr-1 text-black shrink-0">({key.toLowerCase()})</span>
                                        <div className="inline-block flex-1 prose prose-sm max-w-none text-black">
                                          <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                                            {val as string}
                                          </ReactMarkdown>
                                        </div>
                                      </div>
                                    ))}
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
                  ))}
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
        )}

      </div>

      {/* Right Column: controls & Snapshot history */}
      <div className="space-y-6 no-print">
        
        {/* Live Validation Dashboard */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-md space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Live Validation Dashboard</h3>
          
          <div className="bg-slate-955 p-4 rounded-xl border border-slate-855 space-y-3 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-455 font-bold">Paper Total:</span>
              <span className="text-white font-extrabold">{calculatedTotalMarks} / {editTotalMarks} Marks</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-slate-455 font-bold">Validation Status:</span>
              <span className={`font-extrabold ${validation?.isValid ? 'text-emerald-450' : 'text-rose-455'}`}>
                {validation?.isValid ? 'CLEAN & VALID' : 'HAS ERRORS'}
              </span>
            </div>

            {/* Dynamic Section Metrics */}
            {validation?.sections && validation.sections.length > 0 ? (
              validation.sections.map((sec) => (
                <div key={sec.sectionName} className="border-t border-slate-855 pt-2 space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-455 font-semibold">{sec.sectionName.replace('SECTION_', 'Section ')} (Target: {sec.target}):</span>
                    <span className={`font-bold ${sec.actual === sec.target ? 'text-emerald-450' : 'text-amber-455'}`}>
                      {sec.actual} Marks
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <>
                <div className="border-t border-slate-855 pt-2 space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-455 font-semibold">Section A (Target: {validation?.sectionATarget || 0}):</span>
                    <span className={`font-bold ${validation?.sectionAActual === validation?.sectionATarget ? 'text-emerald-450' : 'text-amber-455'}`}>
                      {validation?.sectionAActual || 0} Marks
                    </span>
                  </div>
                </div>
                <div className="border-t border-slate-855 pt-2 space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-455 font-semibold">Section B (Target: {validation?.sectionBTarget || 0}):</span>
                    <span className={`font-bold ${validation?.sectionBActual === validation?.sectionBTarget ? 'text-emerald-450' : 'text-amber-455'}`}>
                      {validation?.sectionBActual || 0} Marks
                    </span>
                  </div>
                </div>
                <div className="border-t border-slate-855 pt-2 space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-455 font-semibold">Section C (Target: {validation?.sectionCTarget || 0}):</span>
                    <span className={`font-bold ${validation?.sectionCActual === validation?.sectionCTarget ? 'text-emerald-450' : 'text-amber-455'}`}>
                      {validation?.sectionCActual || 0} Marks
                    </span>
                  </div>
                </div>
              </>
            )}
            
            <div className="flex justify-between border-t border-slate-855 pt-2">
              <span className="text-slate-455 font-bold">Paper Status:</span>
              <span className="text-indigo-400 font-extrabold">{paper.status}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-1">
            <button
              onClick={() => handleSaveDraft()}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-750 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all"
              disabled={actionLoading}
            >
              <Save className="w-4 h-4 text-indigo-400" /> Save Draft
            </button>

            <button
              onClick={handleRecalculateMarks}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-755 text-indigo-300 hover:text-white border border-indigo-500/20 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all"
              disabled={actionLoading || calculatedTotalMarks === Number(editTotalMarks)}
            >
              <RefreshCw className="w-4 h-4 text-indigo-455 animate-pulse" /> Recalculate Marks
            </button>

            {paper.status !== 'APPROVED' && paper.status !== 'EXPORTED' && paper.status !== 'PUBLISHED' ? (
              <button
                onClick={handleApprove}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-extrabold transition-all shadow-lg shadow-emerald-600/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                disabled={actionLoading || !validation?.isValid}
              >
                <CheckCircle className="w-4.5 h-4.5" /> Approve & Authorize Print
              </button>
            ) : (
              <div className="p-3 bg-emerald-500/5 border border-emerald-500/15 rounded-xl text-center text-xs text-emerald-450 font-bold">
                Paper Approved & Ready for Export
              </div>
            )}

            {paper.status !== 'APPROVED' && paper.status !== 'EXPORTED' && paper.status !== 'PUBLISHED' && (
              <button
                onClick={() => setShowRevisionModal(true)}
                className="w-full py-2.5 bg-rose-600/15 border border-rose-600/20 hover:bg-rose-600/25 text-rose-455 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
                disabled={actionLoading}
              >
                <XCircle className="w-4.5 h-4.5" /> Reject & Request Revision
              </button>
            )}

            {/* Developer Audit Details Panel */}
            <details className="group bg-slate-950 border border-slate-855 rounded-xl p-3 text-[11px] font-mono mt-4 no-print">
              <summary className="cursor-pointer text-indigo-400 font-extrabold uppercase select-none list-none flex items-center gap-1.5 hover:text-indigo-300">
                <Info className="w-4 h-4" />
                Dev Audit Log (Question matrix)
              </summary>
              <div className="pt-3 overflow-x-auto">
                <table className="w-full text-left border-collapse text-[10px]">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 uppercase text-[8px]">
                      <th className="py-1 pr-2">questionId</th>
                      <th className="py-1 pr-2">section</th>
                      <th className="py-1 pr-2">marks</th>
                      <th className="py-1 pr-2">questionType</th>
                      <th className="py-1">text preview</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paper.questions.map((q) => (
                      <tr key={q.id} className="border-b border-slate-900/60 hover:bg-slate-900/40">
                        <td className="py-1 pr-2">{q.id}</td>
                        <td className={`py-1 pr-2 font-bold ${q.section === 'SECTION_A' ? 'text-indigo-400' : q.section === 'SECTION_B' ? 'text-amber-400' : 'text-emerald-450'}`}>{q.section}</td>
                        <td className="py-1 pr-2">{q.marks}</td>
                        <td className="py-1 pr-2">{q.questionType}</td>
                        <td className="py-1 truncate max-w-[120px] text-slate-350">{q.questionText}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </div>
        </div>

        {/* Version History snapshot list */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <History className="w-4.5 h-4.5 text-indigo-400" />
            Paper Version History
          </h3>
          <p className="text-[11px] text-slate-455 leading-normal">Track changes made by agents or direct edits.</p>

          <div className="space-y-4 pt-2">
            {versions.length === 0 ? (
              <div className="text-[11px] text-slate-500 italic">No version snapshots recorded.</div>
            ) : (
              versions.map((ver) => (
                <div key={ver.id} className="flex gap-3 relative before:absolute before:left-[17px] before:top-9 before:bottom-0 before:w-px before:bg-slate-800 last:before:hidden">
                  <div className="w-9 h-9 bg-slate-900 border border-slate-800 text-indigo-400 rounded-lg flex items-center justify-center shrink-0 font-extrabold text-xs">
                    v{ver.version}
                  </div>
                  <div className="min-w-0 space-y-1 text-left">
                    <h4 className="text-[11px] font-bold text-white leading-normal truncate">{ver.changeReason}</h4>
                    <p className="text-[9px] text-slate-500">By {ver.changedByName} • {new Date(ver.timestamp).toLocaleDateString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Revision Modal */}
      {showRevisionModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 max-w-md w-full rounded-2xl p-5 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200 text-left">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
                Configure Revision Pipeline
              </h3>
              <button
                onClick={() => setShowRevisionModal(false)}
                className="text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-455">Selected Questions for Revision:</label>
              <div className="bg-slate-955 border border-slate-850 rounded-xl p-3 max-h-24 overflow-y-auto text-xs text-slate-350 leading-relaxed scrollbar-thin">
                {selectedRejectedIds.length === 0 ? (
                  <span className="text-slate-500 italic">No questions selected. Highlight questions in draft workspace first.</span>
                ) : (
                  <span>Regenerating question numbers: {
                    selectedRejectedIds.map(id => {
                      const idx = paper.questions.findIndex(q => q.id === id);
                      return idx !== -1 ? idx + 1 : '';
                    }).filter(Boolean).join(', ')
                  }</span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-455">Professor Feedback Instructions:</label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Explain what needs to be changed (e.g. 'Question 3 is too complex, generate a simpler one on HCF. Question 5 has a formula typo, recreate it.')"
                rows={4}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-650 focus:outline-none focus:border-indigo-500 transition-all leading-relaxed"
                required
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowRevisionModal(false)}
                className="flex-1 py-2.5 bg-slate-955 border border-slate-800 hover:border-slate-750 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectAndRegenerate}
                className="flex-1 py-2.5 bg-rose-650 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold transition-all shadow-lg shadow-rose-600/10 cursor-pointer"
                disabled={actionLoading || selectedRejectedIds.length === 0 || !comments.trim()}
              >
                Trigger Revision Loop
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
