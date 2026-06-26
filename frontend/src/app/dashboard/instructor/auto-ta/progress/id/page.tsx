'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { 
  Cpu, 
  Layers, 
  CheckCircle2, 
  AlertCircle, 
  Play, 
  Terminal, 
  ChevronRight, 
  RefreshCw, 
  BookOpen
} from 'lucide-react';

interface LogDTO {
  id: number;
  agentType: string;
  status: string;
  logOutput: string;
  executionTimeMs: number;
  timestamp: string;
}

export default function GenerationProgressPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = params?.id;

  const [logs, setLogs] = useState<LogDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [pipelineCompleted, setPipelineCompleted] = useState(false);
  const [paperId, setPaperId] = useState<number | null>(null);
  
  const consoleEndRef = useRef<HTMLDivElement>(null);

  // Poll logs and status
  useEffect(() => {
    if (!requestId) return;

    let pollInterval: NodeJS.Timeout;

    const fetchStatus = async () => {
      try {
        const response = await api.get(`/autota/requests/${requestId}/status`);
        if (response.data.success) {
          const logsData: LogDTO[] = response.data.data;
          setLogs(logsData);
          setLoading(false);

          // Check if MANAGER or EDITOR has completed successfully
          const managerSuccess = logsData.some(l => l.agentType === 'MANAGER' && l.status === 'SUCCESS');
          const managerFailed = logsData.some(l => l.agentType === 'MANAGER' && l.status === 'FAILED');
          
          if (managerSuccess) {
            setPipelineCompleted(true);
            clearInterval(pollInterval);
            // Fetch the compiled paper details
            const paperRes = await api.get(`/autota/requests/${requestId}/paper`);
            if (paperRes.data.success && paperRes.data.data?.id) {
              setPaperId(paperRes.data.data.id);
            }
          } else if (managerFailed) {
            clearInterval(pollInterval);
          }
        }
      } catch (err) {
        console.error('Error polling agent status:', err);
      }
    };

    // Run immediately then poll every 1s
    fetchStatus();
    pollInterval = setInterval(fetchStatus, 1000);

    return () => clearInterval(pollInterval);
  }, [requestId]);

  // Scroll terminal to bottom when new logs arrive
  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Helper to determine agent status
  const getAgentStatus = (agentType: string) => {
    const agentLogs = logs.filter(l => l.agentType === agentType);
    if (agentLogs.some(l => l.status === 'FAILED')) return 'FAILED';
    if (agentLogs.some(l => l.status === 'SUCCESS')) return 'SUCCESS';
    if (agentLogs.some(l => l.status === 'RUNNING')) return 'RUNNING';
    return 'PENDING';
  };

  const getAgentStatusClass = (status: string) => {
    switch (status) {
      case 'SUCCESS': return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
      case 'FAILED': return 'bg-rose-500/10 border-rose-500/30 text-rose-400';
      case 'RUNNING': return 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 animate-pulse';
      default: return 'bg-slate-900/40 border-slate-800 text-slate-500';
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto text-slate-100 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-500/20">
            Pipeline Execution Node #{requestId}
          </span>
          <h2 className="text-2xl font-black text-white mt-2.5 tracking-tight">
            Multi-Agent Orchestration
          </h2>
          <p className="text-xs text-slate-400 mt-1.5 leading-normal max-w-xl">
            Watch the Manager Agent plan and spawn parallel subagents to compile, deduplicate, and assemble your exam paper.
          </p>
        </div>

        {pipelineCompleted && paperId && (
          <Link
            href={`/dashboard/instructor/auto-ta/preview/${paperId}`}
            className="flex items-center gap-1.5 px-4.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-extrabold transition-all shadow-lg shadow-emerald-600/15 animate-bounce cursor-pointer"
          >
            Proceed to Review
            <ChevronRight className="w-4.5 h-4.5" />
          </Link>
        )}
      </div>

      {/* Orchestration Map Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center relative">
        
        {/* 1. Manager Node */}
        <div className={`border p-4 rounded-xl text-center flex flex-col items-center gap-2.5 ${getAgentStatusClass(getAgentStatus('MANAGER'))}`}>
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Manager Agent</h4>
            <p className="text-[9px] text-slate-450 uppercase font-extrabold mt-0.5">{getAgentStatus('MANAGER')}</p>
          </div>
        </div>

        <div className="hidden md:flex justify-center text-slate-600 text-lg">➔</div>

        {/* 2. Workers Column (Theory, Math, Bank in parallel) */}
        <div className="md:col-span-1 space-y-3">
          <div className={`border p-3 rounded-xl text-center flex items-center gap-3 ${getAgentStatusClass(getAgentStatus('THEORY'))}`}>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="text-left">
              <h4 className="text-[11px] font-bold text-white">Theory Agent</h4>
              <p className="text-[8px] text-slate-450 uppercase font-extrabold">{getAgentStatus('THEORY')}</p>
            </div>
          </div>

          <div className={`border p-3 rounded-xl text-center flex items-center gap-3 ${getAgentStatusClass(getAgentStatus('MATHEMATICS'))}`}>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
              <Layers className="w-4 h-4" />
            </div>
            <div className="text-left">
              <h4 className="text-[11px] font-bold text-white">Math Agent</h4>
              <p className="text-[8px] text-slate-450 uppercase font-extrabold">{getAgentStatus('MATHEMATICS')}</p>
            </div>
          </div>

          <div className={`border p-3 rounded-xl text-center flex items-center gap-3 ${getAgentStatusClass(getAgentStatus('QUESTION_BANK'))}`}>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
              <Layers className="w-4 h-4" />
            </div>
            <div className="text-left">
              <h4 className="text-[11px] font-bold text-white">Bank Agent</h4>
              <p className="text-[8px] text-slate-450 uppercase font-extrabold">{getAgentStatus('QUESTION_BANK')}</p>
            </div>
          </div>
        </div>

        <div className="hidden md:flex justify-center text-slate-600 text-lg">➔</div>

        {/* 3. Editor Node */}
        <div className={`border p-4 rounded-xl text-center flex flex-col items-center gap-2.5 ${getAgentStatusClass(getAgentStatus('EDITOR'))}`}>
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Editor Agent</h4>
            <p className="text-[9px] text-slate-450 uppercase font-extrabold mt-0.5">{getAgentStatus('EDITOR')}</p>
          </div>
        </div>

      </div>

      {/* Terminal logs console */}
      <div className="bg-slate-950 border border-slate-900 rounded-2xl overflow-hidden shadow-2xl">
        
        {/* Terminal Header */}
        <div className="bg-slate-900 px-4 py-2.5 border-b border-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-slate-300 font-mono">auto-ta-orchestration.log</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/40"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/40"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/40 animate-pulse"></span>
          </div>
        </div>

        {/* Terminal logs window */}
        <div className="p-5 h-80 overflow-y-auto font-mono text-[11px] sm:text-xs leading-relaxed space-y-2 select-text selection:bg-indigo-500/30 selection:text-indigo-200 scrollbar-thin scrollbar-thumb-slate-900 scrollbar-track-transparent">
          {loading ? (
            <div className="flex items-center gap-2 text-slate-500">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Establishing agent socket pipeline...
            </div>
          ) : logs.length === 0 ? (
            <div className="text-slate-500">
              [SYSTEM] Waiting for Manager Agent to start...
            </div>
          ) : (
            logs.map((log) => (
              <div 
                key={log.id} 
                className={`${
                  log.status === 'FAILED'
                    ? 'text-rose-400'
                    : log.status === 'SUCCESS'
                    ? 'text-emerald-400'
                    : log.agentType === 'MANAGER'
                    ? 'text-indigo-350 font-bold'
                    : 'text-slate-300'
                }`}
              >
                {log.logOutput}
                {log.executionTimeMs > 0 && (
                  <span className="text-slate-550 ml-2">({log.executionTimeMs}ms)</span>
                )}
              </div>
            ))
          )}
          
          {pipelineCompleted && (
            <div className="text-emerald-400 font-bold animate-pulse mt-4">
              [SYSTEM] Pipeline complete! Exam paper compiled as v1. Ready for review.
            </div>
          )}

          <div ref={consoleEndRef} />
        </div>

      </div>

    </div>
  );
}
