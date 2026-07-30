'use client';

import React from 'react';
import { Save, RefreshCw, CheckCircle, XCircle, Info, History } from 'lucide-react';
import { PaperDTO, VersionDTO, ValidationData } from './types';

interface SidebarControlsProps {
  paper: PaperDTO;
  calculatedTotalMarks: number;
  editTotalMarks: number;
  validation: ValidationData | null;
  versions: VersionDTO[];
  actionLoading: boolean;
  handleSaveDraft: () => void;
  handleRecalculateMarks: () => void;
  handleApprove: () => void;
  onOpenRevisionModal: () => void;
}

export function SidebarControls({
  paper,
  calculatedTotalMarks,
  editTotalMarks,
  validation,
  versions,
  actionLoading,
  handleSaveDraft,
  handleRecalculateMarks,
  handleApprove,
  onOpenRevisionModal,
}: SidebarControlsProps) {
  return (
    <div className="space-y-6 no-print">
      {/* Live Validation Dashboard */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-md space-y-4">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">Live Validation Dashboard</h3>
        
        <div className="bg-slate-955 p-4 rounded-xl border border-slate-855 space-y-3 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-455 font-bold">Paper Total:</span>
            <span className="text-white font-extrabold">{calculatedTotalMarks} / {editTotalMarks} Marks</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-slate-455 font-bold">Validation Status:</span>
            <span className={`font-extrabold ${validation?.isValid ? 'text-emerald-450' : 'text-rose-455'}`}>
              {validation?.isValid ? 'CLEAN & VALID' : 'HAS ERRORS'}
            </span>
          </div>

          {/* Dynamic Section Metrics */}
          {validation?.sections && validation.sections.length > 0 ? (
            validation.sections.map((sec) => (
              <div key={sec.sectionName} className="border-t border-slate-855 pt-2 space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-455 font-semibold">{sec.sectionName.replace('SECTION_', 'Section ')} (Target: {sec.target}):</span>
                  <span className={`font-bold ${sec.actual === sec.target ? 'text-emerald-450' : 'text-amber-455'}`}>
                    {sec.actual} Marks
                  </span>
                </div>
              </div>
            ))
          ) : (
            <>
              <div className="border-t border-slate-855 pt-2 space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-455 font-semibold">Section A (Target: {validation?.sectionATarget || 0}):</span>
                  <span className={`font-bold ${validation?.sectionAActual === validation?.sectionATarget ? 'text-emerald-450' : 'text-amber-455'}`}>
                    {validation?.sectionAActual || 0} Marks
                  </span>
                </div>
              </div>
              <div className="border-t border-slate-855 pt-2 space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-455 font-semibold">Section B (Target: {validation?.sectionBTarget || 0}):</span>
                  <span className={`font-bold ${validation?.sectionBActual === validation?.sectionBTarget ? 'text-emerald-450' : 'text-amber-455'}`}>
                    {validation?.sectionBActual || 0} Marks
                  </span>
                </div>
              </div>
              <div className="border-t border-slate-855 pt-2 space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-455 font-semibold">Section C (Target: {validation?.sectionCTarget || 0}):</span>
                  <span className={`font-bold ${validation?.sectionCActual === validation?.sectionCTarget ? 'text-emerald-450' : 'text-amber-455'}`}>
                    {validation?.sectionCActual || 0} Marks
                  </span>
                </div>
              </div>
            </>
          )}
          
          <div className="flex justify-between border-t border-slate-855 pt-2">
            <span className="text-slate-455 font-bold">Paper Status:</span>
            <span className="text-indigo-400 font-extrabold">{paper.status.replace('_', ' ')}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-1">
          <button
            onClick={handleSaveDraft}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-750 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all"
            disabled={actionLoading}
          >
            <Save className="w-4 h-4 text-indigo-400" /> Save Draft
          </button>

          <button
            onClick={handleRecalculateMarks}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-755 text-indigo-300 hover:text-white border border-indigo-500/20 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all"
            disabled={actionLoading || calculatedTotalMarks === Number(editTotalMarks)}
          >
            <RefreshCw className="w-4 h-4 text-indigo-455 animate-pulse" /> Recalculate Marks
          </button>

          {paper.status !== 'APPROVED' && paper.status !== 'EXPORTED' && paper.status !== 'PUBLISHED' ? (
            <button
              onClick={handleApprove}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-extrabold transition-all shadow-lg shadow-emerald-600/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              disabled={actionLoading || !validation?.isValid}
            >
              <CheckCircle className="w-4.5 h-4.5" /> Approve & Authorize Print
            </button>
          ) : (
            <div className="p-3 bg-emerald-500/5 border border-emerald-500/15 rounded-xl text-center text-xs text-emerald-450 font-bold">
              Paper Approved & Ready for Export
            </div>
          )}

          {paper.status !== 'APPROVED' && paper.status !== 'EXPORTED' && paper.status !== 'PUBLISHED' && (
            <button
              onClick={onOpenRevisionModal}
              className="w-full py-2.5 bg-rose-600/15 border border-rose-600/20 hover:bg-rose-600/25 text-rose-455 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
              disabled={actionLoading}
            >
              <XCircle className="w-4.5 h-4.5" /> Reject & Request Revision
            </button>
          )}

          {/* Developer Audit Details Panel */}
          <details className="group bg-slate-950 border border-slate-855 rounded-xl p-3 text-[11px] font-mono mt-4 no-print">
            <summary className="cursor-pointer text-indigo-400 font-extrabold uppercase select-none list-none flex items-center gap-1.5 hover:text-indigo-300">
              <Info className="w-4 h-4" />
              Dev Audit Log (Question matrix)
            </summary>
            <div className="pt-3 overflow-x-auto">
              <table className="w-full text-left border-collapse text-[10px]">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 uppercase text-[8px]">
                    <th className="py-1 pr-2">questionId</th>
                    <th className="py-1 pr-2">section</th>
                    <th className="py-1 pr-2">marks</th>
                    <th className="py-1 pr-2">questionType</th>
                    <th className="py-1">text preview</th>
                  </tr>
                </thead>
                <tbody>
                  {paper.questions.map((q) => (
                    <tr key={q.id} className="border-b border-slate-900/60 hover:bg-slate-900/40">
                      <td className="py-1 pr-2">{q.id}</td>
                      <td className={`py-1 pr-2 font-bold ${q.section === 'SECTION_A' ? 'text-indigo-400' : q.section === 'SECTION_B' ? 'text-amber-400' : 'text-emerald-450'}`}>{q.section}</td>
                      <td className="py-1 pr-2">{q.marks}</td>
                      <td className="py-1 pr-2">{q.questionType}</td>
                      <td className="py-1 truncate max-w-[120px] text-slate-350">{q.questionText}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </div>
      </div>

      {/* Version History snapshot list */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm space-y-4">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
          <History className="w-4.5 h-4.5 text-indigo-400" />
          Paper Version History
        </h3>
        <p className="text-[11px] text-slate-455 leading-normal">Track changes made by agents or direct edits.</p>

        <div className="space-y-4 pt-2">
          {versions.length === 0 ? (
            <div className="text-[11px] text-slate-500 italic">No version snapshots recorded.</div>
          ) : (
            versions.map((ver) => (
              <div key={ver.id} className="flex gap-3 relative before:absolute before:left-[17px] before:top-9 before:bottom-0 before:w-px before:bg-slate-800 last:before:hidden">
                <div className="w-9 h-9 bg-slate-900 border border-slate-800 text-indigo-400 rounded-lg flex items-center justify-center shrink-0 font-extrabold text-xs">
                  v{ver.version}
                </div>
                <div className="min-w-0 space-y-1 text-left">
                  <h4 className="text-[11px] font-bold text-white leading-normal truncate">{ver.changeReason}</h4>
                  <p className="text-[9px] text-slate-500">By {ver.changedByName} • {new Date(ver.timestamp).toLocaleDateString()}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
