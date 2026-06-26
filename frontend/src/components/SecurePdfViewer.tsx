'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Loader2, ShieldAlert, Lock } from 'lucide-react';

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

  useEffect(() => {
    setTimestamp(new Date().toLocaleString());

    // 1. Fetch PDF as Blob using authenticated API client
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

    // Cleanup Blob URL on unmount
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [noteId]);

  // 2. Prevent Keyboard Shortcuts (Ctrl+S, Ctrl+P, F12, Ctrl+Shift+I)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        return;
      }
      // Ctrl+P
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        return;
      }
      // Ctrl+Shift+I / F12
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

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center bg-slate-900/40 rounded-3xl border border-slate-800/80">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
        <p className="mt-3 text-sm text-slate-400 font-medium">Decrypting note stream...</p>
      </div>
    );
  }

  if (error || !blobUrl || !user) {
    return (
      <div className="h-[55vh] flex flex-col items-center justify-center bg-red-500/5 rounded-3xl border border-red-500/10 p-6 text-center">
        <ShieldAlert className="w-12 h-12 text-red-400 mb-3" />
        <h4 className="text-sm font-bold text-white">Access Denied</h4>
        <p className="mt-1.5 text-xs text-slate-400 max-w-sm leading-relaxed">{error}</p>
      </div>
    );
  }

  // Hide browser toolbars and download buttons
  const viewerUrl = `${blobUrl}#toolbar=0&navpanes=0&statusbar=0&messages=0`;

  return (
    <div className="relative w-full h-[75vh] bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden select-none">
      
      {/* 3. Secure Watermark Overlay (pointer-events-none covers the entire screen) */}
      <div className="absolute inset-0 z-30 pointer-events-none flex flex-col justify-around items-center overflow-hidden opacity-[0.06] select-none">
        {[...Array(6)].map((_, i) => (
          <div 
            key={i} 
            className="text-slate-300 font-extrabold text-sm sm:text-lg tracking-widest whitespace-nowrap transform -rotate-12 select-none"
          >
            {user.name} ({user.email}) | {timestamp} | LEARNSTUDIO SECURE STREAM | {courseTitle}
          </div>
        ))}
      </div>

      {/* 4. PDF Viewer Header status */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800/60 text-[10px] font-bold uppercase tracking-wider text-emerald-400 select-none">
        <Lock className="w-3.5 h-3.5" />
        Secure Stream (Watermarked)
      </div>

      {/* 5. The PDF Iframe */}
      <iframe
        src={viewerUrl}
        className="w-full h-full border-0 z-10 relative"
        title={noteTitle}
      />
    </div>
  );
}
