'use client';

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { PaperDTO } from './types';

interface RevisionModalProps {
  show: boolean;
  onClose: () => void;
  selectedRejectedIds: number[];
  paper: PaperDTO;
  comments: string;
  setComments: (val: string) => void;
  handleRejectAndRegenerate: () => void;
  actionLoading: boolean;
}

export function RevisionModal({
  show,
  onClose,
  selectedRejectedIds,
  paper,
  comments,
  setComments,
  handleRejectAndRegenerate,
  actionLoading,
}: RevisionModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 max-w-md w-full rounded-2xl p-5 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200 text-left">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-500" />
            Configure Revision Pipeline
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-455">Selected Questions for Revision:</label>
          <div className="bg-slate-955 border border-slate-850 rounded-xl p-3 max-h-24 overflow-y-auto text-xs text-slate-350 leading-relaxed scrollbar-thin">
            {selectedRejectedIds.length === 0 ? (
              <span className="text-slate-500 italic">No questions selected. Highlight questions in draft workspace first.</span>
            ) : (
              <span>Regenerating question numbers: {
                selectedRejectedIds.map(id => {
                  const idx = paper.questions.findIndex(q => q.id === id);
                  return idx !== -1 ? idx + 1 : '';
                }).filter(Boolean).join(', ')
              }</span>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-455">Professor Feedback Instructions:</label>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Explain what needs to be changed (e.g. 'Question 3 is too complex, generate a simpler one on HCF. Question 5 has a formula typo, recreate it.')"
            rows={4}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-650 focus:outline-none focus:border-indigo-500 transition-all leading-relaxed"
            required
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-955 border border-slate-800 hover:border-slate-750 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleRejectAndRegenerate}
            className="flex-1 py-2.5 bg-rose-650 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold transition-all shadow-lg shadow-rose-600/10 cursor-pointer"
            disabled={actionLoading || selectedRejectedIds.length === 0 || !comments.trim()}
          >
            Trigger Revision Loop
          </button>
        </div>
      </div>
    </div>
  );
}
