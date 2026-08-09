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
  const [config, setConfig] = useState<any>(null);
  
  const consoleEndRef = useRef<HTMLDivElement>(null);

  // Fetch AI Config
  useEffect(() => {
    api.get('/autota/config')
      .then(res => {
        if (res.data.success) setConfig(res.data.data);
      })
      .catch(console.error);
  }, []);

  // Poll logs and status
  useEffect(() => {
    if (!requestId) return;

    const intervalRef = { current: null as NodeJS.Timeout | null };

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
            if (intervalRef.current) clearInterval(intervalRef.current);
            // Fetch the compiled paper details
            const paperRes = await api.get(`/autota/requests/${requestId}/paper`);
            if (paperRes.data.success && paperRes.data.data?.id) {
              setPaperId(paperRes.data.data.id);
            }
          } else if (managerFailed) {
            if (intervalRef.current) clearInterval(intervalRef.current);
          }
        }
      } catch (err) {
        console.error('Error polling agent status:', err);
      }
    };

    fetchStatus();
    intervalRef.current = setInterval(fetchStatus, 1000);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
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
                href={`/dashboard/auto-ta/preview/${paperId}`}
                className="btn-premium flex items-center gap-1.5 px-6 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white shadow-lg animate-bounce cursor-pointer"
              >
                Proceed to Review
                <ChevronRight className="w-4.5 h-4.5" />
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Orchestration Map Grid - Premium AI Core Animation */}
      <div className="glass-card rounded-3xl p-8 relative overflow-hidden bg-slate-900/40 backdrop-blur-xl border border-white/10 shadow-[0_0_50px_-12px_rgba(40,194,255,0.15)]">
        {/* Background glow effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent-blue/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="absolute top-5 left-6 flex flex-col gap-2.5 z-20">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-blue opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-accent-blue"></span>
            </span>
            <span className="text-[10px] font-black text-white/80 uppercase tracking-[0.2em] shadow-sm">AI Core Active</span>
          </div>
          <div className="group flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/30 px-2.5 py-1 rounded hover:bg-indigo-500/20 transition-all cursor-pointer shadow-[0_0_10px_rgba(99,102,241,0.15)] hover:shadow-[0_0_15px_rgba(99,102,241,0.3)]">
            <Cpu className="w-3 h-3 text-indigo-400" />
            <span className="text-[9px] font-black text-indigo-200 uppercase tracking-wider">
              {config?.priority?.includes('gemini') ? 'Model: Gemini / Fallback' : 'Model: ' + (config?.openrouterModel?.split('/')[1] || 'Loading...')}
            </span>
            <div className="absolute left-0 top-full mt-2 hidden group-hover:flex flex-col bg-slate-900 border border-indigo-500/30 p-2.5 rounded-lg shadow-2xl z-50 w-64">
              <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Current Active Model Routing</span>
              <span className="text-xs text-white break-all font-mono bg-black/50 p-1.5 rounded mb-2">
                Priority: {config?.priority || 'Loading...'}
              </span>
              <span className="text-xs text-white break-all font-mono bg-black/50 p-1.5 rounded">
                OpenRouter: {config?.openrouterModel || 'Loading...'}
              </span>
              <span className="text-[10px] text-text-muted mt-1.5 leading-relaxed">
                If Gemini API limit is reached or quota is exhausted, the router safely falls back to OpenRouter.
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-12 mt-12 mb-6 px-4">
          
          {/* 1. Manager Node */}
          <motion.div 
            className={`relative z-10 flex flex-col items-center gap-4 transition-all duration-500`}
            animate={getAgentStatus('MANAGER') === 'RUNNING' ? { scale: 1.05 } : { scale: 1 }}
          >
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center shadow-2xl backdrop-blur-md border-2 transition-all duration-500 ${
              getAgentStatus('MANAGER') === 'RUNNING' ? 'bg-primary-blue/20 border-accent-blue shadow-[0_0_30px_rgba(40,194,255,0.4)]' : 
              getAgentStatus('MANAGER') === 'SUCCESS' ? 'bg-success/20 border-success shadow-[0_0_30px_rgba(34,197,94,0.3)]' : 
              'bg-white/5 border-white/10'
            }`}>
              <Cpu className={`w-10 h-10 ${getAgentStatus('MANAGER') === 'RUNNING' ? 'text-accent-blue animate-pulse' : 'text-white/60'}`} />
            </div>
            <div className="text-center">
              <h4 className="text-sm font-black text-white tracking-wide">Manager</h4>
              <p className="text-[9px] font-extrabold uppercase tracking-widest mt-1 opacity-70 text-accent-blue">{getAgentStatus('MANAGER')}</p>
            </div>
          </motion.div>

          {/* Data Flow Connecting Lines */}
          <div className="hidden md:flex flex-1 items-center justify-center relative h-10 w-full">
            <div className="absolute w-full h-[2px] bg-white/10 overflow-hidden rounded-full">
              {getAgentStatus('MANAGER') !== 'PENDING' && (
                <motion.div 
                  className="h-full bg-gradient-to-r from-transparent via-accent-blue to-transparent w-1/3"
                  animate={{ x: ['-100%', '300%'] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                />
              )}
            </div>
          </div>

          {/* 2. Generation Engine (Core) */}
          <div className="relative z-10 flex flex-col items-center gap-6">
            <div className="relative">
              {/* Outer rotating dashed ring */}
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
                className={`absolute -inset-6 rounded-full border-2 border-dashed ${
                  getAgentStatus('QUESTION_GENERATOR') === 'RUNNING' ? 'border-accent-grape/50' : 'border-white/5'
                }`}
              />
              {/* Inner Core Orb */}
              <motion.div 
                className={`w-24 h-24 rounded-full flex flex-col items-center justify-center shadow-2xl backdrop-blur-xl border border-white/20 transition-all duration-500 overflow-hidden relative ${
                  getAgentStatus('QUESTION_GENERATOR') === 'RUNNING' ? 'bg-gradient-to-br from-indigo-900/80 to-purple-900/80 shadow-[0_0_50px_rgba(139,92,246,0.5)]' : 
                  getAgentStatus('QUESTION_GENERATOR') === 'SUCCESS' ? 'bg-gradient-to-br from-emerald-900/80 to-teal-900/80 shadow-[0_0_50px_rgba(16,185,129,0.4)]' : 
                  'bg-slate-800/50'
                }`}
                animate={getAgentStatus('QUESTION_GENERATOR') === 'RUNNING' ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <Layers className={`w-8 h-8 relative z-10 ${getAgentStatus('QUESTION_GENERATOR') === 'RUNNING' ? 'text-white' : 'text-white/40'}`} />
                <span className="text-[9px] font-bold text-white/80 mt-1 relative z-10 tracking-wider">AUTHOR</span>
                
                {/* Core pulse background */}
                {getAgentStatus('QUESTION_GENERATOR') === 'RUNNING' && (
                  <motion.div 
                    className="absolute inset-0 bg-accent-grape/30"
                    animate={{ opacity: [0, 0.5, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  />
                )}
              </motion.div>
            </div>
          </div>

          {/* Data Flow Connecting Lines (Solver) */}
          <div className="hidden md:flex flex-1 items-center justify-center relative h-10 w-full max-w-[60px]">
            <div className="absolute w-full h-[2px] bg-white/10 overflow-hidden rounded-full">
              {getAgentStatus('SOLVER') !== 'PENDING' && (
                <motion.div 
                  className="h-full bg-gradient-to-r from-transparent via-accent-grape to-transparent w-full"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                />
              )}
            </div>
          </div>

          {/* 3. Solver Node */}
          <motion.div 
            className="relative z-10 flex flex-col items-center gap-4 transition-all duration-500"
            animate={getAgentStatus('SOLVER') === 'RUNNING' ? { scale: 1.05 } : { scale: 1 }}
          >
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl backdrop-blur-md border-2 transition-all duration-500 ${
              getAgentStatus('SOLVER') === 'RUNNING' ? 'bg-fuchsia-500/20 border-fuchsia-500 shadow-[0_0_30px_rgba(217,70,239,0.4)]' : 
              getAgentStatus('SOLVER') === 'SUCCESS' ? 'bg-success/20 border-success shadow-[0_0_30px_rgba(34,197,94,0.3)]' : 
              'bg-white/5 border-white/10'
            }`}>
              <Terminal className={`w-7 h-7 ${getAgentStatus('SOLVER') === 'RUNNING' ? 'text-fuchsia-500 animate-bounce' : 'text-white/60'}`} />
            </div>
            <div className="text-center">
              <h4 className="text-xs font-black text-white tracking-wide">Solver</h4>
            </div>
          </motion.div>

          {/* Data Flow Connecting Lines (Verifier) */}
          <div className="hidden md:flex flex-1 items-center justify-center relative h-10 w-full max-w-[60px]">
            <div className="absolute w-full h-[2px] bg-white/10 overflow-hidden rounded-full">
              {getAgentStatus('VERIFICATION') !== 'PENDING' && (
                <motion.div 
                  className="h-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent w-full"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                />
              )}
            </div>
          </div>

          {/* 4. Verification Node */}
          <motion.div 
            className="relative z-10 flex flex-col items-center gap-4 transition-all duration-500"
            animate={getAgentStatus('VERIFICATION') === 'RUNNING' ? { scale: 1.05 } : { scale: 1 }}
          >
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl backdrop-blur-md border-2 transition-all duration-500 ${
              getAgentStatus('VERIFICATION') === 'RUNNING' ? 'bg-cyan-400/20 border-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.4)]' : 
              getAgentStatus('VERIFICATION') === 'SUCCESS' ? 'bg-success/20 border-success shadow-[0_0_30px_rgba(34,197,94,0.3)]' : 
              getAgentStatus('VERIFICATION') === 'FAILED' ? 'bg-error/20 border-error shadow-[0_0_40px_rgba(239,68,68,0.5)]' : 
              'bg-white/5 border-white/10'
            }`}>
              {getAgentStatus('VERIFICATION') === 'FAILED' ? (
                <RefreshCw className="w-7 h-7 text-error animate-spin" />
              ) : (
                <CheckCircle2 className={`w-7 h-7 ${getAgentStatus('VERIFICATION') === 'RUNNING' ? 'text-cyan-400 animate-pulse' : 'text-white/60'}`} />
              )}
            </div>
            <div className="text-center">
              <h4 className="text-xs font-black text-white tracking-wide">Verifier</h4>
            </div>
          </motion.div>

          {/* Validation Data Flow Connecting Lines */}
          <div className="hidden md:flex flex-1 items-center justify-center relative h-10 w-full max-w-[60px]">
            <div className="absolute w-full h-[2px] bg-white/10 overflow-hidden rounded-full">
              {getAgentStatus('ANALYSIS') === 'RUNNING' && (
                <motion.div 
                  className="h-full bg-gradient-to-r from-transparent via-warning to-transparent w-full"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                />
              )}
              {/* Failed Retry Pulse (Right to Left) */}
              {getAgentStatus('ANALYSIS') === 'FAILED' && (
                <motion.div 
                  className="h-full bg-gradient-to-r from-transparent via-error to-transparent w-full shadow-[0_0_10px_rgba(239,68,68,0.8)]"
                  animate={{ x: ['200%', '-100%'] }}
                  transition={{ repeat: Infinity, duration: 0.8, ease: "easeOut" }}
                />
              )}
            </div>
            {getAgentStatus('ANALYSIS') === 'FAILED' && (
              <span className="absolute -top-8 text-[8px] font-black text-error uppercase tracking-widest bg-error/10 px-1 py-0.5 rounded animate-pulse border border-error/20">Healing</span>
            )}
          </div>

          {/* 3. Analysis Validation Node */}
          <motion.div 
            className="relative z-10 flex flex-col items-center gap-4"
            animate={getAgentStatus('ANALYSIS') === 'FAILED' ? { x: [-5, 5, -5, 5, 0] } : {}}
            transition={{ duration: 0.4 }}
          >
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center shadow-2xl backdrop-blur-md border-2 transition-all duration-300 ${
              getAgentStatus('ANALYSIS') === 'RUNNING' ? 'bg-warning/20 border-warning shadow-[0_0_30px_rgba(245,158,11,0.3)]' : 
              getAgentStatus('ANALYSIS') === 'FAILED' ? 'bg-error/20 border-error shadow-[0_0_40px_rgba(239,68,68,0.5)]' : 
              getAgentStatus('ANALYSIS') === 'SUCCESS' ? 'bg-success/20 border-success shadow-[0_0_30px_rgba(34,197,94,0.3)]' : 
              'bg-white/5 border-white/10'
            }`}>
              {getAgentStatus('ANALYSIS') === 'FAILED' ? (
                <AlertCircle className="w-10 h-10 text-error animate-pulse" />
              ) : getAgentStatus('ANALYSIS') === 'SUCCESS' ? (
                <CheckCircle2 className="w-10 h-10 text-success" />
              ) : (
                <CheckCircle2 className={`w-10 h-10 ${getAgentStatus('ANALYSIS') === 'RUNNING' ? 'text-warning animate-pulse' : 'text-white/30'}`} />
              )}
            </div>
            <div className="text-center">
              <h4 className="text-sm font-black text-white tracking-wide">Analysis</h4>
              <p className={`text-[9px] font-extrabold uppercase tracking-widest mt-1 ${getAgentStatus('ANALYSIS') === 'FAILED' ? 'text-error animate-pulse' : 'text-white/50'}`}>
                {getAgentStatus('ANALYSIS')}
              </p>
            </div>
          </motion.div>

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
        <div className="p-6 h-80 overflow-y-auto font-mono text-[11px] sm:text-xs leading-relaxed space-y-2.5 select-text selection:bg-accent-blue/30 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {loading ? (
            <div className="flex items-center gap-2.5 text-accent-blue/80 font-semibold animate-pulse">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Establishing neural agent socket pipeline...
            </div>
          ) : logs.length === 0 ? (
            <div className="text-text-muted italic">
              [SYSTEM] Waiting for Manager Agent to initialize sequence...
            </div>
          ) : (
            logs.map((log, index) => {
              const isManager = log.agentType === 'MANAGER';
              const isSuccess = log.status === 'SUCCESS';
              const isFailed = log.status === 'FAILED';
              
              let logClass = 'text-white/60';
              let badgeClass = 'bg-white/10 text-white/80';
              
              if (isFailed) {
                logClass = 'text-error/90 font-medium';
                badgeClass = 'bg-error/20 text-error border border-error/20';
              } else if (isSuccess) {
                logClass = 'text-success/90 font-medium';
                badgeClass = 'bg-success/20 text-success border border-success/20';
              } else if (isManager) {
                logClass = 'text-accent-blue/90 font-medium';
                badgeClass = 'bg-accent-blue/20 text-accent-blue border border-accent-blue/20';
              }

              return (
                <motion.div 
                  key={log.id} 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ type: "spring", stiffness: 100 }}
                  className={`flex gap-3 items-start ${logClass}`}
                >
                  <span className="text-text-muted/50 shrink-0 select-none mt-0.5">[{log.timestamp.substring(11, 19)}]</span>
                  <div className="flex-1 space-y-1">
                    <div>
                      <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-sm mr-2 select-none ${badgeClass}`}>
                        {getAgentLabel(log.agentType)}
                      </span>
                      {log.logOutput}
                      {log.executionTimeMs > 0 && (
                        <span className="text-white/30 ml-2 font-sans font-medium text-[10px]">({log.executionTimeMs}ms)</span>
                      )}
                    </div>
                  </div>
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
