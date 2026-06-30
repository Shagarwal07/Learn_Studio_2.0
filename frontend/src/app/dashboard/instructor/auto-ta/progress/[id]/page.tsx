'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cpu, 
  Layers, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  Terminal, 
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

          // Check if MANAGER has completed successfully
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
      case 'SUCCESS': 
        return 'bg-success/5 border-success text-success shadow-[0_0_15px_rgba(34,197,94,0.15)]';
      case 'FAILED': 
        return 'bg-error/5 border-error text-error shadow-[0_0_15px_rgba(239,68,68,0.15)]';
      case 'RUNNING': 
        return 'bg-primary-blue/5 border-accent-blue text-accent-blue animate-pulse shadow-[0_0_20px_rgba(40,194,255,0.2)]';
      default: 
        return 'bg-white/5 border-border-color text-text-muted';
    }
  };

  const getAgentLabel = (agentType: string) => {
    switch (agentType) {
      case 'MANAGER': return 'Manager Node';
      case 'THEORY': return 'Theory Compile';
      case 'MATHEMATICS': return 'Math Engine';
      case 'QUESTION_BANK': return 'Deduplicator';
      case 'EDITOR': return 'Markdown Editor';
      default: return agentType;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8 max-w-5xl mx-auto text-foreground select-none"
    >
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-color pb-5">
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider text-accent-grape bg-accent-grape/10 px-2.5 py-1 rounded-md border border-accent-grape/20">
            Pipeline Node #{requestId}
          </span>
          <h2 className="text-2xl font-black text-white mt-2.5 tracking-tight">
            Multi-Agent Orchestration
          </h2>
          <p className="text-xs text-text-secondary leading-relaxed max-w-xl">
            Watch the Manager Agent plan and spawn parallel worker agents to compile, deduplicate, and assemble your exam paper.
          </p>
        </div>

        <AnimatePresence>
          {pipelineCompleted && paperId && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="shrink-0"
            >
              <Link
                href={`/dashboard/instructor/auto-ta/preview/${paperId}`}
                className="flex items-center gap-1.5 px-6 py-3.5 bg-gradient-to-r from-success to-emerald-600 hover:from-success/90 hover:to-emerald-600/90 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-success/20 animate-bounce cursor-pointer"
              >
                Proceed to Review
                <ChevronRight className="w-4.5 h-4.5" />
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Orchestration Map Grid */}
      <div className="glass-card rounded-3xl p-6 relative">
        <div className="absolute top-4 left-4 flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-accent-blue animate-ping" />
          <span className="text-[9px] font-extrabold text-text-muted uppercase tracking-wider">Live Pipeline Flow</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center pt-8 relative">
          
          {/* 1. Manager Node */}
          <div className={`border p-5 rounded-2xl text-center flex flex-col items-center gap-3 transition-all duration-300 ${getAgentStatusClass(getAgentStatus('MANAGER'))}`}>
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-border-color flex items-center justify-center text-white">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black text-white">Manager Agent</h4>
              <p className="text-[8px] font-extrabold uppercase tracking-wider mt-1 opacity-70">{getAgentStatus('MANAGER')}</p>
            </div>
          </div>

          <div className="hidden md:flex justify-center text-text-muted text-lg font-bold">➔</div>

          {/* 2. Workers Column (Theory, Math, Bank in parallel) */}
          <div className="md:col-span-1 space-y-4">
            <div className={`border p-4 rounded-2xl flex items-center gap-4.5 transition-all duration-300 ${getAgentStatusClass(getAgentStatus('THEORY'))}`}>
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-border-color flex items-center justify-center text-white shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="text-[11px] font-bold text-white truncate">Theory Agent</h4>
                <p className="text-[8px] font-extrabold uppercase tracking-wider mt-0.5 opacity-70">{getAgentStatus('THEORY')}</p>
              </div>
            </div>

            <div className={`border p-4 rounded-2xl flex items-center gap-4.5 transition-all duration-300 ${getAgentStatusClass(getAgentStatus('MATHEMATICS'))}`}>
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-border-color flex items-center justify-center text-white shrink-0">
                <Layers className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="text-[11px] font-bold text-white truncate">Math Engine</h4>
                <p className="text-[8px] font-extrabold uppercase tracking-wider mt-0.5 opacity-70">{getAgentStatus('MATHEMATICS')}</p>
              </div>
            </div>

            <div className={`border p-4 rounded-2xl flex items-center gap-4.5 transition-all duration-300 ${getAgentStatusClass(getAgentStatus('QUESTION_BANK'))}`}>
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-border-color flex items-center justify-center text-white shrink-0">
                <Layers className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="text-[11px] font-bold text-white truncate">Bank Agent</h4>
                <p className="text-[8px] font-extrabold uppercase tracking-wider mt-0.5 opacity-70">{getAgentStatus('QUESTION_BANK')}</p>
              </div>
            </div>
          </div>

          <div className="hidden md:flex justify-center text-text-muted text-lg font-bold">➔</div>

          {/* 3. Editor Node */}
          <div className={`border p-5 rounded-2xl text-center flex flex-col items-center gap-3 transition-all duration-300 ${getAgentStatusClass(getAgentStatus('EDITOR'))}`}>
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-border-color flex items-center justify-center text-white">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black text-white">Editor Agent</h4>
              <p className="text-[8px] font-extrabold uppercase tracking-wider mt-1 opacity-70">{getAgentStatus('EDITOR')}</p>
            </div>
          </div>

        </div>
      </div>

      {/* Terminal logs console */}
      <div className="bg-slate-950 border border-border-color rounded-3xl overflow-hidden shadow-2xl">
        
        {/* Terminal Header */}
        <div className="bg-slate-900 px-5 py-3.5 border-b border-border-color flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Terminal className="w-4.5 h-4.5 text-success" />
            <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">auto-ta-orchestration.log</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-error/30"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-warning/30"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-success/80 animate-pulse"></span>
          </div>
        </div>

        {/* Terminal logs window */}
        <div className="p-6 h-80 overflow-y-auto font-mono text-xs leading-relaxed space-y-2 select-text selection:bg-accent-grape/30 scrollbar-thin">
          {loading ? (
            <div className="flex items-center gap-2.5 text-text-muted">
              <RefreshCw className="w-4 h-4 animate-spin text-accent-grape" />
              Establishing agent socket pipeline...
            </div>
          ) : logs.length === 0 ? (
            <div className="text-text-muted">
              [SYSTEM] Waiting for Manager Agent to start...
            </div>
          ) : (
            logs.map((log, index) => {
              const isManager = log.agentType === 'MANAGER';
              const isSuccess = log.status === 'SUCCESS';
              const isFailed = log.status === 'FAILED';
              
              let colorClass = 'text-text-secondary';
              if (isFailed) colorClass = 'text-error font-semibold';
              else if (isSuccess) colorClass = 'text-success font-semibold';
              else if (isManager) colorClass = 'text-accent-blue font-bold';

              return (
                <motion.div 
                  key={log.id} 
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(index * 0.02, 0.4) }}
                  className={colorClass}
                >
                  <span className="text-text-muted mr-2">[{log.timestamp.substring(11, 19)}]</span>
                  <span className="text-white/65 mr-2">[{getAgentLabel(log.agentType)}]</span>
                  {log.logOutput}
                  {log.executionTimeMs > 0 && (
                    <span className="text-text-muted ml-2.5 font-sans font-bold">({log.executionTimeMs}ms)</span>
                  )}
                </motion.div>
              );
            })
          )}
          
          {pipelineCompleted && (
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-success font-black animate-pulse mt-4 pt-4 border-t border-border-color/30"
            >
              [SYSTEM] Pipeline complete. Exam paper compiled successfully as v1. Ready for review.
            </motion.div>
          )}

          <div ref={consoleEndRef} />
        </div>

      </div>

    </motion.div>
  );
}
