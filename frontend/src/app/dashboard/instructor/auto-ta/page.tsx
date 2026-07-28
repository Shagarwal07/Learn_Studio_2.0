'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { motion } from 'framer-motion';
import { 
  Cpu, 
  Layers, 
  Clock, 
  Plus, 
  Eye, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ShieldCheck, 
  BookOpen,
  Trash2,
  Sparkles
} from 'lucide-react';

interface GeneratedPaperDTO {
  id: number;
  examRequestId: number;
  title: string;
  totalMarks: number;
  status: string;
  version: number;
  createdAt: string;
}

export default function AutoTaDashboard() {
  const [refreshing, setRefreshing] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Fetch all generated papers
  const { data: papers = [], isLoading, refetch } = useQuery<GeneratedPaperDTO[]>({
    queryKey: ['autota-papers'],
    queryFn: async () => {
      const response = await api.get('/autota/papers');
      return response.data.success ? response.data.data : [];
    }
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleClearAllPapers = async () => {
    if (!confirm('Are you sure you want to permanently delete all generated exam papers and clean up old records?')) {
      return;
    }
    setClearing(true);
    try {
      const res = await api.delete('/autota/papers');
      if (res.data?.success || res.status === 200) {
        await refetch();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to clean up papers');
    } finally {
      setClearing(false);
    }
  };

  const handleDeletePaper = async (paperId: number) => {
    if (!confirm('Delete this exam paper?')) return;
    setDeletingId(paperId);
    try {
      await api.delete(`/autota/papers/${paperId}`);
      await refetch();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to remove paper');
    } finally {
      setDeletingId(null);
    }
  };

  // Calculate statistics
  const totalPapers = papers.length;
  const underReview = papers.filter(p => p.status === 'UNDER_REVIEW' || p.status === 'REVISION_NEEDED').length;
  const approved = papers.filter(p => p.status === 'APPROVED' || p.status === 'PUBLISHED').length;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 text-xs sm:text-sm animate-in fade-in duration-300 text-foreground relative z-10"
    >
      {/* Ambient background glow for premium feel */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-accent-grape/20 blur-[120px] rounded-full -z-10 pointer-events-none opacity-50 dark:opacity-30"></div>
      
      {/* Header */}
      <div className="hero-header-card">
        <div>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-white bg-white/20 px-3 py-1 rounded-full border border-white/30">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Autonomous Vertex AI & Vision-RAG Engine
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-white mt-4 tracking-tight drop-shadow-sm">
            Auto-TA Exam Generator
          </h2>
          <p className="text-xs sm:text-sm text-indigo-100 mt-2 leading-relaxed max-w-2xl font-medium">
            Generate high-quality exam papers autonomously using GCP Vertex AI multimodal analysis of your batch notes and handwritten test sheets.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {papers.length > 0 && (
            <button
              onClick={handleClearAllPapers}
              disabled={clearing || refreshing}
              className="flex items-center gap-2 px-4 py-3 bg-red-600/90 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg border border-red-400/30 transition-all disabled:opacity-50 cursor-pointer"
              title="Remove all old exam papers"
            >
              <Trash2 className={`w-4 h-4 ${clearing ? 'animate-bounce' : ''}`} />
              {clearing ? 'Clearing...' : 'Clear Old Papers'}
            </button>
          )}
          <button
            onClick={handleRefresh}
            className="flex items-center justify-center w-10 h-10 bg-card border border-border-color hover:border-accent-grape text-text-secondary hover:text-foreground rounded-xl transition-all cursor-pointer shadow-sm"
            disabled={refreshing}
            title="Refresh Papers"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-accent-grape' : ''}`} />
          </button>
          <Link
            href="/dashboard/instructor/auto-ta/create"
            className="btn-premium flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-white cursor-pointer shadow-md"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            New Exam Paper
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="interactive-card flex items-center gap-4">
          <div className="w-12 h-12 bg-accent-grape/10 text-accent-grape border border-accent-grape/20 rounded-xl flex items-center justify-center shrink-0">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">Total Generated</p>
            <h3 className="text-xl font-black text-foreground mt-0.5">{totalPapers}</h3>
          </div>
        </div>

        <div className="interactive-card flex items-center gap-4">
          <div className="w-12 h-12 bg-warning/10 text-warning border border-warning/20 rounded-xl flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">Under Review</p>
            <h3 className="text-xl font-black text-foreground mt-0.5">{underReview}</h3>
          </div>
        </div>

        <div className="interactive-card flex items-center gap-4">
          <div className="w-12 h-12 bg-success/10 text-success border border-success/20 rounded-xl flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">Approved Papers</p>
            <h3 className="text-xl font-black text-foreground mt-0.5">{approved}</h3>
          </div>
        </div>

        <div className="interactive-card flex items-center gap-4">
          <div className="w-12 h-12 bg-accent-blue/10 text-accent-blue border border-accent-blue/20 rounded-xl flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">AI Engine Status</p>
            <h3 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-accent-blue to-accent-grape mt-0.5 font-sans">Ready & Active</h3>
          </div>
        </div>

      </div>

      {/* Main Papers List */}
      <div className="glass-card rounded-2xl p-6 border border-border-color shadow-lg bg-card">
        <div className="flex items-center justify-between gap-4 mb-5">
          <div>
            <h3 className="text-xs font-extrabold text-foreground uppercase tracking-wider">Recent Generated Papers</h3>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Manage compiled papers, review question breakdowns, and export to DOCX/PDF.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-muted-foreground">
            <Cpu className="w-8 h-8 animate-spin text-accent-grape mb-3" />
            <p className="text-xs font-medium">Loading generated papers...</p>
          </div>
        ) : papers.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center border border-dashed border-border-color rounded-2xl text-center">
            <BookOpen className="w-10 h-10 text-muted-foreground mb-4 opacity-70" />
            <h4 className="text-sm font-bold text-foreground">No exam papers generated yet.</h4>
            <p className="text-xs text-muted-foreground max-w-sm mt-1.5 leading-relaxed">
              Configure your syllabus topics and target marks to trigger the Autonomous Vertex AI exam generator.
            </p>
            <Link
              href="/dashboard/instructor/auto-ta/create"
              className="btn-premium mt-6 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-white"
            >
              Configure First Exam
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto select-none">
            <table className="w-full border-collapse text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-border-color text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Exam Details</th>
                  <th className="py-3.5 px-4">Total Marks</th>
                  <th className="py-3.5 px-4">Version</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Generated At</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-color/60">
                {papers.map((paper) => (
                  <tr key={paper.id} className="hover:bg-muted/30 transition-colors group rounded-xl">
                    <td className="py-4.5 px-4 font-black text-foreground leading-snug">
                      {paper.title}
                    </td>
                    <td className="py-4.5 px-4 text-muted-foreground font-semibold">
                      {paper.totalMarks} Marks
                    </td>
                    <td className="py-4.5 px-4 text-muted-foreground font-bold">
                      v{paper.version}
                    </td>
                    <td className="py-4.5 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider border ${
                        paper.status === 'APPROVED' || paper.status === 'PUBLISHED'
                          ? 'bg-success/10 text-success border-success/20'
                          : paper.status === 'REVISION_NEEDED'
                          ? 'bg-error/10 text-error border-error/20'
                          : 'bg-warning/10 text-warning border-warning/20'
                      }`}>
                        {paper.status === 'APPROVED' || paper.status === 'PUBLISHED' ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <AlertCircle className="w-3 h-3" />
                        )}
                        {paper.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4.5 px-4 text-muted-foreground font-medium">
                      {new Date(paper.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4.5 px-4 text-right space-x-2">
                      <Link
                        href={`/dashboard/instructor/auto-ta/preview/${paper.id}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-accent-grape/10 to-primary-blue/10 border border-border-color hover:border-accent-grape text-foreground rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm hover:scale-[1.02]"
                      >
                        <Eye className="w-3.5 h-3.5 text-accent-grape" />
                        Review Draft
                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                      <button
                        onClick={() => handleDeletePaper(paper.id)}
                        disabled={deletingId === paper.id}
                        className="inline-flex items-center justify-center p-2 rounded-xl bg-error/10 hover:bg-error/20 text-error border border-error/20 transition-all cursor-pointer"
                        title="Delete paper"
                      >
                        <Trash2 className={`w-3.5 h-3.5 ${deletingId === paper.id ? 'animate-pulse' : ''}`} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </motion.div>
  );
}
