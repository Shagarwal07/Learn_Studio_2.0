'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Award, AwardIcon, Calendar, Check, Download, Eye, Loader2, ShieldCheck, X } from 'lucide-react';

interface Certificate {
  id: number;
  courseId: number;
  courseTitle: string;
  studentName: string;
  certificateHash: string;
  issuedAt: string;
}

export default function CertificatesPage() {
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);

  const { data: certificates, isLoading, error } = useQuery<Certificate[]>({
    queryKey: ['my-certificates'],
    queryFn: async () => {
      const response = await api.get('/enrollments/my/certificates');
      return response.data.success ? response.data.data : [];
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-center text-red-700 text-sm max-w-xl mx-auto">
        Failed to load certificates. Ensure the backend server is running.
      </div>
    );
  }

  const list = certificates || [];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      <div className="border-b border-slate-200 pb-5">
        <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Achievements</p>
        <h2 className="text-2xl font-extrabold text-slate-900 mt-1">My Certificates</h2>
      </div>

      {list.length === 0 ? (
        <div className="bg-white py-16 px-6 rounded-2xl border border-slate-200 shadow-sm text-center max-w-lg mx-auto space-y-5">
          <div className="w-16 h-16 bg-slate-50 border border-slate-200 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
            <Award className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h4 className="text-lg font-bold text-slate-900">No certificates earned yet</h4>
            <p className="text-sm text-slate-500 max-w-xs mx-auto">
              Finish 100% of any course's lessons to unlock and generate your official completion certificate.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {list.map((cert) => (
            <div 
              key={cert.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div className="p-6 space-y-4">
                <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
                  <AwardIcon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900 line-clamp-2 leading-snug">{cert.courseTitle}</h4>
                  <p className="text-xs text-slate-400 mt-1">Issued to {cert.studentName}</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100/60">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span className="font-mono truncate">{cert.certificateHash}</span>
                </div>
              </div>
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
                <button
                  onClick={() => setSelectedCert(cert)}
                  className="w-full py-2.5 bg-white border border-slate-200 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 text-slate-700 rounded-xl transition-all text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Eye className="w-3.5 h-3.5" />
                  View Certificate
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Certificate viewer Modal */}
      {selectedCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md print:bg-white print:p-0">
          
          {/* Main frame container constrained to max-w-3xl to not cover entire screen */}
          <div className="relative w-full max-w-3xl bg-[#171717] rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] p-4 border border-neutral-800/80 print:border-none print:shadow-none print:rounded-none print:p-0">
            
            {/* Elegant outer picture frame: simulating a physical dark walnut frame with an inner gold highlight */}
            <div className="relative border-[16px] border-[#1f1f1f] rounded-2xl bg-[#fdfbf7] shadow-2xl p-6 md:p-10 text-slate-800 relative overflow-hidden print:border-none print:p-0 print:bg-white">
              
              {/* Gold trim inset line */}
              <div className="absolute inset-2 border-2 border-amber-500/30 rounded-lg pointer-events-none" />
              
              {/* Detailed gold corner brackets */}
              <div className="absolute top-4 left-4 w-10 h-10 border-t-2 border-l-2 border-amber-600/65 rounded-tl-sm pointer-events-none" />
              <div className="absolute top-4 right-4 w-10 h-10 border-t-2 border-r-2 border-amber-600/65 rounded-tr-sm pointer-events-none" />
              <div className="absolute bottom-4 left-4 w-10 h-10 border-b-2 border-l-2 border-amber-600/65 rounded-bl-sm pointer-events-none" />
              <div className="absolute bottom-4 right-4 w-10 h-10 border-b-2 border-r-2 border-amber-600/65 rounded-br-sm pointer-events-none" />

              {/* Close Button (Hidden on Print) */}
              <button
                onClick={() => setSelectedCert(null)}
                className="absolute top-5 right-5 z-25 p-1.5 bg-neutral-900/10 hover:bg-neutral-900/20 text-slate-500 hover:text-slate-800 rounded-lg transition-all cursor-pointer print:hidden"
                title="Close Viewer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center space-y-6 relative z-10">
                
                {/* Certificate Brand Header */}
                <div className="inline-flex items-center gap-1 text-xl font-black tracking-tight text-slate-900 mt-2">
                  <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
                    <Award className="w-5 h-5" />
                  </div>
                  <span>Learn<span className="text-indigo-600">Studio</span></span>
                </div>

                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold text-amber-700 dark:text-amber-800 uppercase tracking-widest">Certificate of Course Completion</p>
                  <div className="h-0.5 w-16 bg-amber-600/50 mx-auto rounded-full" />
                </div>

                <p className="text-xs text-slate-500 italic max-w-sm mx-auto">
                  This is proudly presented to certify that
                </p>

                <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 border-b border-slate-255/10 pb-2.5 max-w-lg mx-auto font-sans tracking-wide">
                  {selectedCert.studentName}
                </h3>

                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  has successfully completed all instructional requirements, practical homework exercises, and digital lessons for the professional course:
                </p>

                <h4 className="text-lg md:text-xl font-black text-indigo-950 px-4 py-2 bg-indigo-50/60 border border-indigo-100/80 rounded-xl inline-block max-w-xl">
                  {selectedCert.courseTitle}
                </h4>

                {/* Verification ID and Database Stored ID details */}
                <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto pt-6 border-t border-slate-255/10 text-left">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Date Issued</span>
                    <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-450 shrink-0" />
                      {new Date(selectedCert.issuedAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  
                  {/* Database Stored Certificate ID (requested!) */}
                  <div className="space-y-0.5 border-l border-slate-200/50 pl-4">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Certificate ID</span>
                    <span className="text-xs font-bold text-indigo-650 font-mono tracking-wide block">
                      LSC-{selectedCert.id.toString().padStart(6, '0')}
                    </span>
                  </div>
                  
                  <div className="space-y-0.5 border-l border-slate-200/50 pl-4">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Verification Code</span>
                    <span className="text-xs font-mono font-bold text-slate-750 break-all block">
                      {selectedCert.certificateHash}
                    </span>
                  </div>
                </div>

                {/* Cryptographic Footprint info */}
                <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200/40 mt-4 text-[9px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Cryptographically signed & stored in LearnStudio database</span>
                  </div>
                  
                  {/* Download Action (Hidden on Print) */}
                  <button
                    onClick={handlePrint}
                    className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-850 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-sm print:hidden"
                  >
                    <Download className="w-3 h-3" /> Save / Print PDF
                  </button>
                </div>

                {/* Realistic Golden Foil Ribbon Seal (Visual Wow!) */}
                <div className="absolute bottom-8 right-6 hidden sm:flex flex-col items-center justify-center pointer-events-none opacity-[0.85]">
                  <div className="w-14 h-14 bg-gradient-to-br from-yellow-300 via-amber-500 to-yellow-600 rounded-full flex items-center justify-center shadow-md border border-yellow-400/80 relative">
                    {/* Ribbon tails hanging out */}
                    <div className="absolute -bottom-3 -left-1 w-3 h-8 bg-red-700/85 rotate-12 transform origin-top clip-ribbon" />
                    <div className="absolute -bottom-3 -right-1 w-3 h-8 bg-red-700/85 -rotate-12 transform origin-top clip-ribbon" />
                    <Award className="w-6 h-6 text-white drop-shadow-sm" />
                  </div>
                  <span className="text-[7px] font-bold uppercase tracking-widest mt-4 text-amber-800">Official Seal</span>
                </div>

              </div>
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
}
