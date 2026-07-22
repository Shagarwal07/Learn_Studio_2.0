'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Loader2, ShieldAlert, Lock, Maximize2, Minimize2, Eye, Sun, Moon, Info } from 'lucide-react';

interface SecurePdfViewerProps {
  noteId: number;
  courseTitle: string;
  noteTitle: string;
}

export default function SecurePdfViewer({ noteId, courseTitle, noteTitle }: SecurePdfViewerProps) {
  const { user } = useAuth();
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timestamp, setTimestamp] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pdfDark, setPdfDark] = useState(true); // Default to a gorgeous dark mode PDF view
  
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTimestamp(new Date().toLocaleString());

    // 1. Fetch PDF as Blob
    async function loadPdf() {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get(`/student/notes/${noteId}/secure-view`, {
          responseType: 'blob',
        });
        
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setBlobUrl(url);
      } catch (err: any) {
        console.warn('Failed to load secure PDF:', err.message || err);
        setError('Unauthorized access or failed to load resource. Please verify your enrollment.');
      } finally {
        setLoading(false);
      }
    }

    loadPdf();

    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [noteId]);

  // 2. Prevent Keyboard Shortcuts (Ctrl+S, Ctrl+P, F12, Right-click)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        return;
      }
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
        e.preventDefault();
        return;
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  // Listen to fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.error('Error entering fullscreen:', err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  if (loading) {
    return (
      <div className="h-[75vh] flex flex-col items-center justify-center bg-bg-secondary border border-border-color rounded-3xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent-grape/5 via-primary-blue/5 to-white/0 pointer-events-none" />
        <div className="relative flex flex-col items-center gap-4 z-10">
          <div className="w-16 h-16 bg-accent-grape/10 text-accent-grape border border-accent-grape/20 rounded-2xl flex items-center justify-center shadow-lg shadow-accent-grape/20">
            <Lock className="w-6 h-6 animate-pulse" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-black text-white">Decrypting note stream.</p>
            <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Establishing secure handshakes.</p>
          </div>
          <Loader2 className="w-6 h-6 animate-spin text-accent-grape mt-2" />
        </div>
      </div>
    );
  }

  if (error || !blobUrl || !user) {
    return (
      <div className="h-[75vh] flex flex-col items-center justify-center bg-error/5 rounded-3xl border border-error/10 p-8 text-center space-y-4">
        <div className="w-16 h-16 bg-error/10 text-error rounded-2xl flex items-center justify-center border border-error/20 mx-auto">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-black text-white uppercase tracking-wider">Secure Access Denied</h4>
          <p className="text-xs text-text-secondary max-w-sm leading-relaxed">{error}</p>
        </div>
      </div>
    );
  }

  // Hide browser toolbars and download buttons
  const viewerUrl = `${blobUrl}#toolbar=0&navpanes=0&statusbar=0&messages=0`;

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-[75vh] bg-card border border-border-color rounded-3xl overflow-hidden select-none flex flex-col"
    >
      
      {/* 1. Secure Watermark Overlay (pointer-events-none, covers the entire viewport) */}
      <div className="absolute inset-0 z-30 pointer-events-none flex flex-col justify-around items-center overflow-hidden opacity-[0.04] select-none">
        {[...Array(6)].map((_, i) => (
          <div 
            key={i} 
            className="text-white font-extrabold text-xs sm:text-sm tracking-widest whitespace-nowrap transform -rotate-12 select-none"
          >
            {user.name} ({user.email}) | {timestamp} | LEARNSTUDIO SECURE STREAM | {courseTitle}
          </div>
        ))}
      </div>

      {/* 2. PDF Viewer Header Control Bar */}
      <div className="z-20 glass-card backdrop-blur-md px-4 py-3 border-b border-border-color flex items-center justify-between select-none">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-bold uppercase tracking-wider text-emerald-400">
            <Lock className="w-3 h-3" />
            Secure Stream
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 text-[9px] font-bold text-text-muted uppercase tracking-wider">
            <Info className="w-3 h-3" />
            Use scroll inside document to read
          </span>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-2">
          {/* Reader Theme (PDF Invert) Toggle */}
          <button
            onClick={() => setPdfDark(!pdfDark)}
            title={pdfDark ? "Switch to Light PDF Mode" : "Switch to Dark PDF Mode"}
            className={`p-2 rounded-xl border border-border-color text-text-secondary hover:text-white transition-all cursor-pointer bg-white/5 hover:bg-white/10`}
          >
            {pdfDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            className="p-2 rounded-xl border border-border-color text-text-secondary hover:text-white transition-all cursor-pointer bg-white/5 hover:bg-white/10"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 3. The PDF Iframe with optional color inversion filter for Dark Mode */}
      <div className="flex-1 w-full h-full relative bg-white overflow-hidden">
        <iframe
          src={viewerUrl}
          className={`w-full h-full border-0 z-10 relative transition-all duration-300 ${
pdfDark ? 'invert hue-rotate-180 brightness-95 contrast-105 bg-[#070B16]' : 'bg-white'
}`}
          title={noteTitle}
        />
      </div>
    </div>
  );
}
