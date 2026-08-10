'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { 
  Cpu, 
  Layers, 
  Clock, 
  Plus, 
  Eye, 
  ChevronRight, 
  CheckCircle2, 
  RefreshCw, 
  Trash2,
  Sparkles,
  FileText
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
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Fetch papers filtered by instructor
  const { data: papers = [], isLoading, refetch } = useQuery<GeneratedPaperDTO[]>({
    queryKey: ['autota-papers', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const url = user.role === 'ADMIN' ? `/autota/papers` : `/autota/papers?instructorId=${user.id}`;
      const response = await api.get(url);
      return response.data.success ? response.data.data : [];
    },
    enabled: !!user?.id
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

  const filteredPapers = selectedDate 
    ? papers.filter(p => p.createdAt.startsWith(selectedDate))
    : papers;

  // Group papers by date
  const groupedPapers = filteredPapers.reduce((acc, paper) => {
    const date = new Date(paper.createdAt);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let groupKey = 'Older';
    if (date.toDateString() === today.toDateString()) {
        groupKey = 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
        groupKey = 'Yesterday';
    } else {
        groupKey = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }

    if (!acc[groupKey]) acc[groupKey] = [];
    acc[groupKey].push(paper);
    return acc;
  }, {} as Record<string, GeneratedPaperDTO[]>);

  // Determine group order (Today, Yesterday, then others)
  const groupOrder = ['Today', 'Yesterday', ...Object.keys(groupedPapers).filter(k => k !== 'Today' && k !== 'Yesterday').sort((a, b) => new Date(b).getTime() - new Date(a).getTime())];

  const totalPapers = papers.length;
  const underReview = papers.filter(p => p.status === 'UNDER_REVIEW' || p.status === 'REVISION_NEEDED').length;
  const approved = papers.filter(p => p.status === 'APPROVED' || p.status === 'PUBLISHED').length;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex-1 max-w-[1600px] w-full mx-auto flex flex-col gap-8 relative z-10 animate-in fade-in duration-300"
    >
      <style dangerouslySetInnerHTML={{ __html: `
        .glass-pane {
            background: rgba(30, 41, 59, 0.7);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .glass-pane:hover {
            background: rgba(30, 41, 59, 0.8);
            border-color: rgba(255, 255, 255, 0.25);
        }
        .btn-primary-obsidian {
            background: linear-gradient(45deg, #494bd6, #8083ff);
            box-shadow: 0 4px 14px 0 rgba(73, 75, 214, 0.4);
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .btn-primary-obsidian:hover {
            transform: scale(1.02);
            box-shadow: 0 6px 20px rgba(73, 75, 214, 0.6);
        }
      `}} />

      {/* Hero Section */}
      <section className="flex flex-col gap-4 relative">
        <div className="absolute -top-10 -left-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20 mb-3">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Autonomous Vertex AI
            </span>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">Auto-TA Exam Generator</h1>
            <p className="text-base text-slate-400 max-w-3xl mt-3 font-medium">
                Empowering instructors with AI-driven assessment creation. Generate, review, and deploy comprehensive exams in seconds based on batch notes.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <input 
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-white/10 bg-[#0f172a80] text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50"
              title="Filter by Date"
            />
            {papers.length > 0 && (
              <button
                onClick={handleClearAllPapers}
                disabled={clearing || refreshing}
                className="flex items-center gap-2 px-4 py-3 bg-red-600/20 hover:bg-red-600/40 text-red-400 font-bold text-xs uppercase tracking-wider rounded-xl border border-red-500/30 transition-all disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                {clearing ? 'Clearing...' : 'Clear All'}
              </button>
            )}
            <button
              onClick={handleRefresh}
              className="flex items-center justify-center w-11 h-11 glass-pane hover:text-white rounded-xl transition-all"
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
            <Link
              href="/dashboard/auto-ta/create"
              className="btn-primary-obsidian flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold uppercase tracking-wider text-white"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              New Exam
            </Link>
          </div>
        </div>
      </section>

      {/* Metrics Row */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-pane rounded-xl p-6 flex flex-col gap-2 transition-all duration-300">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Generated</span>
            <Layers className="w-5 h-5 text-indigo-400/70" />
          </div>
          <div className="text-4xl font-black text-white mt-2">{totalPapers}</div>
        </div>
        
        <div className="glass-pane rounded-xl p-6 flex flex-col gap-2 transition-all duration-300 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl"></div>
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Under Review</span>
            <Clock className="w-5 h-5 text-amber-500/70" />
          </div>
          <div className="text-4xl font-black text-amber-500 mt-2">{underReview}</div>
        </div>
        
        <div className="glass-pane rounded-xl p-6 flex flex-col gap-2 transition-all duration-300 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl"></div>
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Approved</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-500/70" />
          </div>
          <div className="text-4xl font-black text-emerald-500 mt-2">{approved}</div>
        </div>
      </section>

      {/* Main Content Area: Draft Feed */}
      <section className="flex flex-col gap-6 mt-2">
        <div className="flex justify-between items-end mb-2">
          <h2 className="text-2xl font-bold text-white tracking-tight">Exam Drafts</h2>
          {selectedDate && (
             <button onClick={() => setSelectedDate('')} className="text-xs font-bold text-indigo-400 hover:text-indigo-300">
               Clear Filter
             </button>
          )}
        </div>

        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 glass-pane rounded-2xl">
            <Cpu className="w-8 h-8 animate-spin text-indigo-400 mb-3" />
            <p className="text-sm font-medium">Loading drafts...</p>
          </div>
        ) : filteredPapers.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 glass-pane rounded-2xl">
            <FileText className="w-12 h-12 text-slate-500 mb-4 opacity-50" />
            <p className="text-lg font-semibold text-white mb-2">No drafts found</p>
            <p className="text-sm">Try a different date or generate a new exam.</p>
          </div>
        ) : (
          groupOrder.map((group) => {
            const groupPapers = groupedPapers[group];
            if (!groupPapers || groupPapers.length === 0) return null;
            
            return (
              <div key={group} className="flex flex-col gap-4">
                <div className="sticky top-20 bg-[#020617]/90 backdrop-blur-md z-30 py-3 border-b border-white/5">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{group}</h3>
                </div>
                
                {groupPapers.map(paper => (
                  <div key={paper.id} className="glass-pane rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-800/50 border border-white/5 flex items-center justify-center shrink-0">
                        <FileText className="w-6 h-6 text-indigo-400" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">{paper.title}</h4>
                        <div className="flex items-center gap-3 mt-1 text-slate-400 text-xs font-medium uppercase tracking-wider">
                          <span className="flex items-center gap-1"><Layers className="w-3.5 h-3.5" /> v{paper.version}</span>
                          <span className="w-1 h-1 rounded-full bg-white/20"></span>
                          <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> {paper.totalMarks} pts</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 sm:ml-auto">
                      {/* Status Pill */}
                      {paper.status === 'APPROVED' || paper.status === 'PUBLISHED' ? (
                        <div className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Approved
                        </div>
                      ) : paper.status === 'UNDER_REVIEW' || paper.status === 'REVISION_NEEDED' ? (
                        <div className="px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                          Under Review
                        </div>
                      ) : (
                        <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-300 text-xs font-bold flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                          Draft
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                        <Link 
                          href={`/dashboard/auto-ta/preview/${paper.id}`}
                          className="btn-primary-obsidian px-5 py-2.5 rounded-lg text-xs text-white font-bold flex-1 sm:flex-none text-center"
                        >
                          View Exam
                        </Link>
                        <button 
                          onClick={() => handleDeletePaper(paper.id)}
                          disabled={deletingId === paper.id}
                          className="w-10 h-10 rounded-lg border border-white/10 text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-all flex items-center justify-center disabled:opacity-50"
                          title="Delete Draft"
                        >
                          {deletingId === paper.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })
        )}
      </section>
    </motion.div>
  );
}
