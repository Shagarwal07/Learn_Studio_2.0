'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Sparkles, 
  Cpu, 
  Settings, 
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
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 max-w-3xl mx-auto text-foreground"
    >
      
      {/* Back to dashboard */}
      <Link
        href="/dashboard/instructor/auto-ta"
        className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-text-muted hover:text-white transition-colors self-start cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Auto-TA Dashboard
      </Link>

      {/* Title */}
      <div className="space-y-1">
        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">Configure New Exam Generation</h2>
        <p className="text-xs text-text-secondary leading-relaxed">Specify syllabus details, subject area, and question parameters for the multi-agent orchestrator.</p>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 bg-error/5 border border-error/15 rounded-2xl text-xs text-error">
          <AlertCircle className="w-5 h-5 shrink-0 text-error mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-extrabold uppercase tracking-wider text-[9px] block">Configuration Error</span> {error}
          </div>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="glass-card rounded-3xl p-6 md:p-8 space-y-6">
        
        {/* Course and Subject Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-text-secondary">Subject / Academic Area *</label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-3 bg-slate-950/50 border border-border-color rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-accent-grape transition-all"
            >
              {SUBJECT_OPTIONS.map((sub) => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-text-secondary">Course / Chapter Name *</label>
            <input
              type="text"
              placeholder="e.g. Physics 101: Kinematics."
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-border-color rounded-xl text-xs sm:text-sm text-white placeholder-text-muted focus:outline-none focus:border-accent-grape focus:ring-1 focus:ring-accent-grape transition-all"
              required
            />
          </div>
        </div>

        {/* Syllabus / Topics */}
        <div className="space-y-2">
          <label className="text-[10px] font-extrabold uppercase tracking-wider text-text-secondary">Syllabus details & Core Topics *</label>
          <textarea
            placeholder="Paste textbook chapters, core curriculum formulas, or outline key concepts here. Be as descriptive as possible so the agents have rich reference context..."
            rows={6}
            value={syllabus}
            onChange={(e) => setSyllabus(e.target.value)}
            className="w-full px-4 py-3.5 bg-white/5 border border-border-color rounded-xl text-xs sm:text-sm text-white placeholder-text-muted focus:outline-none focus:border-accent-grape focus:ring-1 focus:ring-accent-grape transition-all leading-relaxed"
            required
          />
        </div>

        {/* Parameters Section */}
        <div className="border-t border-border-color pt-6 space-y-5">
          <h3 className="text-xs font-extrabold text-accent-blue uppercase tracking-wider flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Generation Blueprint Constraints
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-text-secondary">Total Marks *</label>
              <input
                type="number"
                min={5}
                max={200}
                value={marks}
                onChange={(e) => setMarks(Number(e.target.value))}
                className="w-full px-4 py-3 bg-white/5 border border-border-color rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-accent-grape focus:ring-1 focus:ring-accent-grape transition-all"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-text-secondary">Total Questions *</label>
              <input
                type="number"
                min={2}
                max={50}
                value={totalQuestions}
                onChange={(e) => setTotalQuestions(Number(e.target.value))}
                className="w-full px-4 py-3 bg-white/5 border border-border-color rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-accent-grape focus:ring-1 focus:ring-accent-grape transition-all"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-text-secondary">Difficulty Level *</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950/50 border border-border-color rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-accent-grape transition-all"
              >
                {DIFFICULTY_OPTIONS.map((diff) => (
                  <option key={diff} value={diff}>{diff}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-text-secondary">Question Pattern Blueprint *</label>
            <select
              value={questionPattern}
              onChange={(e) => setQuestionPattern(e.target.value)}
              className="w-full px-4 py-3 bg-slate-950/50 border border-border-color rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-accent-grape transition-all"
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
          className="w-full py-4 bg-gradient-to-r from-accent-grape to-primary-blue hover:from-accent-grape/90 hover:to-primary-blue/90 disabled:from-slate-800 disabled:to-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-accent-grape/15 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] cursor-pointer disabled:opacity-50"
          disabled={loading}
        >
          {loading ? (
            <>
              <Cpu className="w-4.5 h-4.5 animate-spin" />
              Initializing Multi-Agent Orchestration...
            </>
          ) : (
            <>
              <Sparkles className="w-4.5 h-4.5" />
              Trigger Auto-TA Generation
            </>
          )}
        </button>

      </form>
    </motion.div>
  );
}
