'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { 
  Cpu, 
  Layers, 
  Award, 
  Clock, 
  Plus, 
  Eye, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  BarChart3, 
  ShieldCheck, 
  BookOpen
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

  // Calculate statistics
  const totalPapers = papers.length;
  const underReview = papers.filter(p => p.status === 'UNDER_REVIEW' || p.status === 'REVISION_NEEDED').length;
  const approved = papers.filter(p => p.status === 'APPROVED' || p.status === 'PUBLISHED').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-slate-100 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
            Advanced multi-agent pipeline
          </span>
          <h2 className="text-2xl font-black text-white mt-2.5 tracking-tight">
            Auto-TA Exam Generator
          </h2>
          <p className="text-xs text-slate-400 mt-1.5 leading-normal max-w-2xl">
            Orchestrate Theory, Mathematics, and Question Bank agents in parallel to compile, deduplicate, and format high-quality exam papers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            className="flex items-center justify-center w-10 h-10 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl transition-all cursor-pointer"
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
          <Link
            href="/dashboard/instructor/auto-ta/create"
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-extrabold transition-all shadow-lg shadow-indigo-600/10 cursor-pointer"
          >
            <Plus className="w-4.5 h-4.5" />
            Create Exam Paper
          </Link>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 p-5 rounded-2xl flex items-center gap-4 hover:border-slate-750 transition-all duration-300">
          <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl flex items-center justify-center shrink-0">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-slate-450 uppercase tracking-wider">Total Generated</p>
            <h3 className="text-xl font-black text-white mt-0.5">{totalPapers}</h3>
          </div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 p-5 rounded-2xl flex items-center gap-4 hover:border-slate-750 transition-all duration-300">
          <div className="w-12 h-12 bg-amber-500/10 text-amber-450 border border-amber-500/20 rounded-xl flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-slate-450 uppercase tracking-wider">Under Review</p>
            <h3 className="text-xl font-black text-white mt-0.5">{underReview}</h3>
          </div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 p-5 rounded-2xl flex items-center gap-4 hover:border-slate-750 transition-all duration-300">
          <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-slate-450 uppercase tracking-wider">Approved Papers</p>
            <h3 className="text-xl font-black text-white mt-0.5">{approved}</h3>
          </div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 p-5 rounded-2xl flex items-center gap-4 hover:border-slate-750 transition-all duration-300">
          <div className="w-12 h-12 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-xl flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-slate-450 uppercase tracking-wider">Active Agents</p>
            <h3 className="text-xl font-black text-white mt-0.5">5 Active</h3>
          </div>
        </div>

      </div>

      {/* Main Papers List */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Recent Generated Papers</h3>
            <p className="text-[11px] text-slate-450 mt-0.5">Manage agent compilations, review questions, and track version histories.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <Cpu className="w-8 h-8 animate-spin text-indigo-500 mb-3" />
            <p className="text-xs font-medium">Scanning multi-agent vaults...</p>
          </div>
        ) : papers.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-xl text-center">
            <BookOpen className="w-10 h-10 text-slate-600 mb-3" />
            <h4 className="text-sm font-bold text-slate-300">No exam papers generated yet</h4>
            <p className="text-xs text-slate-550 max-w-sm mt-1">Submit your syllabus details and parameters to trigger the parallel agent pipeline.</p>
            <Link
              href="/dashboard/instructor/auto-ta/create"
              className="mt-4 px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-indigo-400 rounded-xl text-xs font-bold transition-all"
            >
              Configure First Exam
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-450 font-bold">
                  <th className="py-3 px-4">Exam Details</th>
                  <th className="py-3 px-4">Total Marks</th>
                  <th className="py-3 px-4">Version</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Generated At</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {papers.map((paper) => (
                  <tr key={paper.id} className="hover:bg-slate-850/40 transition-colors">
                    <td className="py-4 px-4 font-bold text-white">
                      {paper.title}
                    </td>
                    <td className="py-4 px-4 text-slate-300 font-medium">
                      {paper.totalMarks} Marks
                    </td>
                    <td className="py-4 px-4 text-slate-400 font-semibold">
                      v{paper.version}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                        paper.status === 'APPROVED' || paper.status === 'PUBLISHED'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : paper.status === 'REVISION_NEEDED'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          : 'bg-amber-500/10 text-amber-450 border-amber-500/20'
                      }`}>
                        {paper.status === 'APPROVED' || paper.status === 'PUBLISHED' ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <AlertCircle className="w-3 h-3" />
                        )}
                        {paper.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-450 font-medium">
                      {new Date(paper.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Link
                        href={`/dashboard/instructor/auto-ta/preview/${paper.id}`}
                        className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-indigo-400 hover:text-indigo-300 rounded-lg text-xs font-extrabold transition-all cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Review Draft
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
