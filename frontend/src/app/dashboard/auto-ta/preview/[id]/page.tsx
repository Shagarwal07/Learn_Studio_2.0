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
  XCircle, 
  Edit, 
  RefreshCw, 
  AlertTriangle,
  X,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  BookOpen,
  Clock,
  Check,
  Settings,
  Copy,
  GitFork,
  Merge
} from 'lucide-react';
import { QuestionDTO, PaperDTO, VersionDTO } from './components/types';
import { PrintLayoutView } from './components/PrintLayoutView';
import { SidebarControls } from './components/SidebarControls';
import { RevisionModal } from './components/RevisionModal';

const ALLOWED_MARKS = [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 15];

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

    let displayLabel = key.replaceAll('_', ' ').replace(/SECTION\b/i, 'Section');
    if (!displayLabel.includes('-') && !displayLabel.includes('–') && !displayLabel.includes('—') && qs.length > 0) {
      const typeCounts: Record<string, number> = {};
      qs.forEach(q => {
        const qt = (q.questionType || '').toUpperCase();
        if (qt) {
          typeCounts[qt] = (typeCounts[qt] || 0) + 1;
        }
      });
      const topType = Object.keys(typeCounts).sort((a, b) => typeCounts[b] - typeCounts[a])[0] || '';
      
      const typeHeadings: Record<string, string> = {
        'MCQ': 'Multiple Choice Questions',
        'FILL_IN_THE_BLANK': 'Fill in the Blanks',
        'ASSERTION_REASON': 'Assertion & Reason Questions',
        'VERY_SHORT_ANSWER': 'Very Short Answer Type Questions',
        'SHORT_ANSWER': 'Short Answer Type Questions',
        'SHORT': 'Short Answer Type Questions',
        'LONG_ANSWER': 'Long Answer Type Questions',
        'LONG': 'Long Answer Type Questions',
        'CASE_STUDY': 'Case Study & Competency Questions',
        'NUMERICAL': 'Numerical & Problem Solving',
        'TRUE_FALSE': 'True / False Questions'
      };

      if (typeHeadings[topType]) {
        displayLabel = `${displayLabel} — ${typeHeadings[topType]}`;
      } else if (key === 'SECTION_B' && qs.some(q => q.questionText?.includes('___'))) {
        displayLabel = `${displayLabel} — Fill in the Blanks`;
      }
    }
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
  const [printLayoutMode, setPrintLayoutMode] = useState<'formal' | 'worksheet' | 'answerKey'>('formal');
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

        const isWs = p.totalMarks === 0 || p.testType === 'Categorized Practice' || p.title?.toLowerCase().includes('worksheet') || p.testType?.toLowerCase().includes('worksheet');
        if (isWs) {
          setPrintLayoutMode('worksheet');
        }
      }
      
      try {
        const versionsRes = await api.get(`/autota/papers/${paperId}/versions`);
        if (versionsRes.data.success) {
          setVersions(versionsRes.data.data);
        }
      } catch (versionErr) {
        console.warn('Versions endpoint not yet implemented', versionErr);
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

  // Handle headless browser URL parameters for Answer Sheet PDF generation
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('printLayoutMode') === 'answerKey') {
        setPrintLayoutMode('answerKey');
        setActiveTab('print');
      }
    }
  }, []);

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
    let qt = (q.questionType || 'SHORT').trim().toUpperCase();
    
    // Normalize Vertex AI synonyms to our standard types
    const typeMapping: Record<string, string> = {
      'SHORT_ANSWER': 'SHORT',
      'LONG_ANSWER': 'LONG',
      'MULTIPLE_CHOICE': 'MCQ',
      'MULTIPLE_CHOICE_QUESTION': 'MCQ',
      'FILL_IN_THE_BLANKS': 'FILL_BLANK',
      'FILL_IN_BLANKS': 'FILL_BLANK',
      'FILL_IN_THE_BLANK': 'FILL_BLANK',
      'NUMERICAL_ANSWER': 'NUMERICAL',
      'T/F': 'TRUE_FALSE'
    };
    
    if (typeMapping[qt]) {
      qt = typeMapping[qt];
    }
    
    setEditQuestionType(qt);
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
    const defaultOpts = { A: '', B: '', C: '', D: '' };
    try {
      const cleaned = optStr.trim();
      if (!cleaned) return defaultOpts;
      const parsed = JSON.parse(cleaned);
      if (typeof parsed !== 'object' || parsed === null) return defaultOpts;
      
      // Map the object values sequentially to ensure A,B,C,D keys exist
      // regardless of what keys (e.g. 'a', 'b' or '1', '2') Vertex AI originally used
      const values = Object.values(parsed);
      return {
        A: (values[0] as string) || '',
        B: (values[1] as string) || '',
        C: (values[2] as string) || '',
        D: (values[3] as string) || ''
      };
    } catch (e) {
      return defaultOpts;
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

  // Safe Java OpenPDF Studio-Grade Document Download Trigger
  const handleDownloadStudioPdf = async () => {
    if (validation && !validation.isValid) {
      alert('Studio PDF Export Blocked: Paper validation failed:\n' + validation.errors.join('\n'));
      return;
    }
    if (paper?.status !== 'APPROVED' && paper?.status !== 'EXPORTED' && paper?.status !== 'PUBLISHED' && paper?.status !== 'REVIEWED') {
      alert('Studio PDF Export Blocked: You must Approve the paper first to authorize PDF export.');
      return;
    }

    try {
      setActionLoading(true);
      const dynamicFontSize = printLayoutMode === 'formal' ? 14 : 16;
      const response = await api.get(`/autota/papers/${paperId}/export/pdf?fontSize=${dynamicFontSize}`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `studio-exam-paper-${paperId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Failed to export Studio PDF:', err);
      alert('Failed to download Studio PDF: ' + (err.response?.data?.message || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  // Safe Java OpenPDF Studio-Grade Answer Sheet Download Trigger
  const handleDownloadAnswerSheet = async () => {
    if (validation && !validation.isValid) {
      alert('Answer Sheet Export Blocked: Paper validation failed:\n' + validation.errors.join('\n'));
      return;
    }
    if (paper?.status !== 'APPROVED' && paper?.status !== 'EXPORTED' && paper?.status !== 'PUBLISHED' && paper?.status !== 'REVIEWED') {
      alert('Answer Sheet Export Blocked: You must Approve the paper first to authorize PDF export.');
      return;
    }

    try {
      setActionLoading(true);
      const dynamicFontSize = printLayoutMode === 'formal' ? 14 : 16;
      // Pass layoutMode=answerKey to tell backend/headless browser to render the answer sheet
      const response = await api.get(`/autota/papers/${paperId}/export/pdf?fontSize=${dynamicFontSize}&layoutMode=answerKey`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `studio-answer-sheet-${paperId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Failed to export Answer Sheet PDF:', err);
      alert('Failed to download Answer Sheet: ' + (err.response?.data?.message || err.message));
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
    <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6 max-w-7xl mx-auto text-slate-100 animate-in fade-in duration-300">
      
      {/* Left 2 Columns: Workspace */}
      <div className="lg:col-span-2 space-y-5 order-2 lg:order-1">
        
        {/* Navigation Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/80 pb-4 no-print">
          <div>
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1 text-xs font-extrabold text-indigo-400 hover:text-indigo-300 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </button>
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
                              {!['SECTION_A', 'SECTION_B', 'SECTION_C', 'SECTION_D', 'SECTION_E', 'SECTION_F', 'SECTION_G'].includes(editSection) && (
                                <option value={editSection}>{editSection}</option>
                              )}
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
                              {!['SHORT', 'MCQ', 'LONG', 'NUMERICAL', 'FILL_BLANK', 'TRUE_FALSE'].includes(editQuestionType) && (
                                <option value={editQuestionType}>{editQuestionType.replace(/_/g, ' ')}</option>
                              )}
                              <option value="SHORT">Short Answer Question</option>
                              <option value="MCQ">Multiple Choice (MCQ)</option>
                              <option value="LONG">Long Answer Question</option>
                              <option value="NUMERICAL">Numerical / Mathematical Formula</option>
                              <option value="FILL_BLANK">Fill in the Blanks</option>
                              <option value="TRUE_FALSE">True / False</option>
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
                              {(['A', 'B', 'C', 'D'] as const).map((key) => {
                                const opts = parseOptionsObj(editOptions) as Record<'A'|'B'|'C'|'D', string>;
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
                        <div 
                          className="text-xs sm:text-sm text-slate-100 font-medium leading-relaxed prose prose-invert max-w-none max-sm:pointer-events-none sm:cursor-pointer sm:hover:bg-slate-800/40 p-2 -mx-2 rounded-lg transition-colors"
                          onClick={(e) => {
                            e.preventDefault();
                            if (paper.status !== 'APPROVED') startEditing(q);
                          }}
                          title="Click to edit (Desktop only)"
                        >
                          <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                            {q.questionText}
                          </ReactMarkdown>
                        </div>
                        
                        {/* MCQ Options representation */}
                        {q.options && (() => {
                          try {
                            const parsedOpts = JSON.parse(q.options);
                            return (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 pl-4 pt-1.5 w-full">
                                {Object.entries(parsedOpts).map(([key, val], optIdx) => {
                                  const stdLabel = ['a', 'b', 'c', 'd', 'e', 'f'][optIdx] || key.toLowerCase();
                                  return (
                                    <div key={key} className="text-xs sm:text-[13px] text-slate-300 font-semibold flex items-baseline gap-2">
                                      <span className="text-indigo-400 font-extrabold shrink-0 select-none">({stdLabel})</span>
                                      <div className="inline-block flex-1 prose prose-invert prose-sm max-w-none">
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

                        {/* Answer and explanations */}
                        {(q.correctAnswer || q.solutionSteps || q.learningOutcome || q.topic) && (
                          <div 
                            className="bg-slate-955/45 border border-slate-900/65 rounded-xl p-3.5 mt-2 space-y-1.5 text-[11px] leading-relaxed max-sm:pointer-events-none sm:cursor-pointer sm:hover:border-indigo-500/50 sm:hover:bg-slate-900/60 transition-all"
                            onClick={(e) => {
                              e.preventDefault();
                              if (paper.status !== 'APPROVED') startEditing(q);
                            }}
                            title="Click to edit answer (Desktop only)"
                          >
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
                              <div className="flex flex-wrap gap-x-4 pt-1 border-t border-slate-800/30 text-slate-500 font-semibold mt-2">
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
                      <div className="flex flex-wrap items-center gap-2 pt-2.5 border-t border-slate-800/20 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        
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
          <PrintLayoutView
            paper={paper}
            dynamicSections={dynamicSections}
            printLayoutMode={printLayoutMode}
            setPrintLayoutMode={setPrintLayoutMode}
            handlePrintTrigger={handlePrintTrigger}
            handleDownloadDocx={handleDownloadDocx}
            handleDownloadStudioPdf={handleDownloadStudioPdf}
            editTestType={editTestType}
            editClass={editClass}
            editSubject={editSubject}
            editDuration={editDuration}
            editChapters={editChapters}
            editTotalMarks={editTotalMarks}
          />
        )}

      </div>

      {/* Right Column: controls & Snapshot history */}
      <div className="order-1 lg:order-2">
        <SidebarControls
          paper={paper}
          calculatedTotalMarks={calculatedTotalMarks}
          editTotalMarks={Number(editTotalMarks)}
          validation={validation}
          versions={versions}
          actionLoading={actionLoading}
          handleSaveDraft={() => handleSaveDraft()}
          handleRecalculateMarks={handleRecalculateMarks}
          handleApprove={handleApprove}
          onOpenRevisionModal={() => setShowRevisionModal(true)}
          handleDownloadAnswerSheet={handleDownloadAnswerSheet}
          handleToggleUnlock={() => {
            if (paper) setPaper({ ...paper, status: 'DRAFT' });
          }}
        />
      </div>

      {/* Revision Modal */}
      <RevisionModal
        show={showRevisionModal}
        onClose={() => setShowRevisionModal(false)}
        selectedRejectedIds={selectedRejectedIds}
        paper={paper}
        comments={comments}
        setComments={setComments}
        handleRejectAndRegenerate={handleRejectAndRegenerate}
        actionLoading={actionLoading}
      />

    </div>
  );
}
