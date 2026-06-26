'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { 
  ArrowLeft, 
  Sparkles, 
  Cpu, 
  FileText, 
  HelpCircle, 
  Activity, 
  Settings, 
  BookOpen, 
  AlertCircle
} from 'lucide-react';

const SUBJECT_OPTIONS = ['Mathematics', 'Science', 'English', 'Social Science', 'Physics', 'Chemistry', 'Biology', 'Computer Science'];
const DIFFICULTY_OPTIONS = ['EASY', 'MEDIUM', 'HARD'];
const PATTERN_OPTIONS = [
  { value: 'MCQ', label: 'Multiple Choice Questions (MCQ)' },
  { value: 'SHORT', label: 'Short Answer Questions' },
  { value: 'LONG', label: 'Long Answer & Essay Questions' },
  { value: 'MIXED', label: 'Mixed Pattern (MCQ, Short, and Conceptual)' }
];

export default function CreateExamPage() {
  const router = useRouter();
  
  // Form state
  const [subject, setSubject] = useState(SUBJECT_OPTIONS[0]);
  const [course, setCourse] = useState('');
  const [syllabus, setSyllabus] = useState('');
  const [marks, setMarks] = useState(50);
  const [difficulty, setDifficulty] = useState('MEDIUM');
  const [questionPattern, setQuestionPattern] = useState('MIXED');
  const [totalQuestions, setTotalQuestions] = useState(10);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!course.trim() || !syllabus.trim()) {
      setError('Please fill in all mandatory fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        subject,
        course: course.trim(),
        syllabus: syllabus.trim(),
        marks: Number(marks),
        difficulty,
        questionPattern,
        totalQuestions: Number(totalQuestions)
      };

      const response = await api.post('/autota/requests', payload);
      const successData = response.data;
      
      if (successData.success && successData.data?.id) {
        const requestId = successData.data.id;
        // Redirect to the live progress tracking terminal page
        router.push(`/dashboard/instructor/auto-ta/progress/${requestId}`);
      } else {
        throw new Error(successData.message || 'Failed to start generation.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to trigger the multi-agent pipeline.');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto text-slate-100 animate-in fade-in duration-300">
      
      {/* Back to dashboard */}
      <Link
        href="/dashboard/instructor/auto-ta"
        className="flex items-center gap-1 text-xs font-extrabold text-indigo-400 hover:text-indigo-300 transition-all self-start cursor-pointer"
      >
        <ArrowLeft className="w-4.5 h-4.5" />
        Back to Auto-TA Dashboard
      </Link>

      {/* Title */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">Configure New Exam Generation</h2>
        <p className="text-xs text-slate-400 mt-1">Specify syllabus details, subject area, and question parameters for the multi-agent orchestrator.</p>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-450">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
          <div>
            <span className="font-bold">Configuration Error:</span> {error}
          </div>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md space-y-6">
        
        {/* Course and Subject Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Subject / Academic Area *</label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-all"
            >
              {SUBJECT_OPTIONS.map((sub) => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Course / Chapter Name *</label>
            <input
              type="text"
              placeholder="e.g. Physics 101: Kinematics, Algebra 2"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all"
              required
            />
          </div>
        </div>

        {/* Syllabus / Topics */}
        <div className="space-y-2">
          <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Syllabus details & Core Topics *</label>
          <textarea
            placeholder="Paste textbook chapters, core curriculum formulas, or outline key concepts here. Be as descriptive as possible so the agents have rich reference context..."
            rows={5}
            value={syllabus}
            onChange={(e) => setSyllabus(e.target.value)}
            className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all leading-relaxed"
            required
          />
        </div>

        {/* Parameters Section */}
        <div className="border-t border-slate-800/80 pt-5 space-y-4">
          <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
            <Settings className="w-4 h-4" />
            Generation Blueprint Constraints
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Total Marks *</label>
              <input
                type="number"
                min={5}
                max={200}
                value={marks}
                onChange={(e) => setMarks(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-all"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Total Questions *</label>
              <input
                type="number"
                min={2}
                max={50}
                value={totalQuestions}
                onChange={(e) => setTotalQuestions(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-all"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Difficulty Level *</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-all"
              >
                {DIFFICULTY_OPTIONS.map((diff) => (
                  <option key={diff} value={diff}>{diff}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Question Pattern Blueprint *</label>
            <select
              value={questionPattern}
              onChange={(e) => setQuestionPattern(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-all"
            >
              {PATTERN_OPTIONS.map((pat) => (
                <option key={pat.value} value={pat.value}>{pat.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-650/40 text-white rounded-xl text-sm font-extrabold transition-all shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-2 cursor-pointer"
          disabled={loading}
        >
          {loading ? (
            <>
              <Cpu className="w-5 h-5 animate-spin" />
              Initializing Multi-Agent Orchestration...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Trigger Auto-TA Generation
            </>
          )}
        </button>

      </form>
    </div>
  );
}
