'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Award, 
  AwardIcon, 
  Calendar, 
  Download, 
  Eye, 
  Loader2, 
  ShieldCheck, 
  X,
  Sparkles,
  Trophy
} from 'lucide-react';

interface Certificate {
  id: number;
  courseId: number;
  courseTitle: string;
  studentName: string;
  certificateHash: string;
  issuedAt: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 20 } }
};

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
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="relative">
          <Loader2 className="w-10 h-10 animate-spin text-accent-grape" />
          <div className="absolute inset-0 blur-md bg-accent-grape/20 rounded-full animate-pulse" />
        </div>
        <p className="text-text-secondary text-xs font-semibold uppercase tracking-wider animate-pulse">
          Retrieving your credentials...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto py-12 px-6">
        <div className="p-8 bg-error/5 border border-error/15 rounded-3xl text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 bg-error/10 text-error rounded-2xl flex items-center justify-center mx-auto shadow-[0_0_15px_rgba(239,68,68,0.15)]">
            <Award className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">Verification Failed</h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Unable to sync certificates. Ensure the Spring Boot backend server is active on port 8080.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const list = certificates || [];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto text-foreground">
      
      {/* Page Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-bg-secondary-dark via-card-dark to-surface-dark p-6 lg:p-10 rounded-3xl border border-border-color shadow-2xl">
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-80 h-80 bg-accent-grape/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-1/3 w-64 h-64 bg-primary-blue/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-2">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-accent-grape bg-accent-grape/10 px-3 py-1 rounded-full border border-accent-grape/20 uppercase tracking-wider">
            <Sparkles className="w-3 h-3" /> Credentials
          </span>
          <h2 className="text-2xl lg:text-3xl font-black tracking-tight text-white">
            My Certificates
          </h2>
          <p className="text-text-secondary text-xs sm:text-sm max-w-xl leading-relaxed">
            View, download, and verify your cryptographically signed course completion awards and academic credentials.
          </p>
        </div>
      </div>

      {list.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card py-16 px-6 rounded-3xl border border-border-color text-center max-w-lg mx-auto space-y-6 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-accent-grape/5 to-primary-blue/5 pointer-events-none" />
          <div className="w-16 h-16 bg-white/5 border border-border-color text-text-muted rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <Award className="w-8 h-8" />
          </div>
          <div className="space-y-2 relative z-10">
            <h4 className="text-lg font-black text-white">No certificates earned yet</h4>
            <p className="text-xs text-text-secondary max-w-xs mx-auto leading-relaxed">
              Complete 100% of any course syllabus to generate and unlock your official, cryptographically verified certificate.
            </p>
          </div>
        </motion.div>
      ) : (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {list.map((cert) => (
            <motion.div 
              key={cert.id}
              variants={itemVariants}
              className="glass-card hover-lift rounded-3xl overflow-hidden flex flex-col justify-between"
            >
              <div className="p-6 space-y-5">
                <div className="w-10 h-10 bg-accent-grape/10 border border-accent-grape/20 text-accent-grape rounded-2xl flex items-center justify-center shadow-[0_0_15px_rgba(150,52,132,0.15)]">
                  <AwardIcon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-black text-white line-clamp-2 min-h-[2.75rem] leading-snug">
                    {cert.courseTitle}
                  </h4>
                  <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider mt-1.5">
                    Issued to {cert.studentName}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-text-secondary bg-white/5 p-3 rounded-2xl border border-border-color">
                  <ShieldCheck className="w-4 h-4 text-success shrink-0" />
                  <span className="font-mono truncate">{cert.certificateHash}</span>
                </div>
              </div>
              
              <div className="p-5 bg-white/5 border-t border-border-color">
                <button
                  onClick={() => setSelectedCert(cert)}
                  className="w-full py-3 bg-gradient-to-r from-accent-grape to-primary-blue hover:from-accent-grape/90 hover:to-primary-blue/90 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                >
                  <Eye className="w-3.5 h-3.5" />
                  View Certificate
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Certificate Viewer Modal */}
      <AnimatePresence>
        {selectedCert && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/85 backdrop-blur-md print:bg-white print:p-0"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0, transition: { type: 'spring', damping: 25 } }}
              exit={{ scale: 0.95, y: 15 }}
              className="relative w-full max-w-3xl bg-[#12141C] rounded-3xl shadow-2xl p-4 border border-neutral-800/60 print:border-none print:shadow-none print:rounded-none print:p-0"
            >
              
              {/* Outer Walnut wood texture border sim */}
              <div className="relative border-[16px] border-[#1A1C23] rounded-2xl bg-[#FCFAF5] p-6 md:p-10 text-slate-800 overflow-hidden print:border-none print:p-0 print:bg-white">
                
                {/* Gold Trim Insets */}
                <div className="absolute inset-2 border-2 border-amber-500/25 rounded-lg pointer-events-none" />
                <div className="absolute top-4 left-4 w-10 h-10 border-t-2 border-l-2 border-amber-600/50 rounded-tl-sm pointer-events-none" />
                <div className="absolute top-4 right-4 w-10 h-10 border-t-2 border-r-2 border-amber-600/50 rounded-tr-sm pointer-events-none" />
                <div className="absolute bottom-4 left-4 w-10 h-10 border-b-2 border-l-2 border-amber-600/50 rounded-bl-sm pointer-events-none" />
                <div className="absolute bottom-4 right-4 w-10 h-10 border-b-2 border-r-2 border-amber-600/50 rounded-br-sm pointer-events-none" />

                {/* Close Trigger */}
                <button
                  onClick={() => setSelectedCert(null)}
                  className="absolute top-5 right-5 z-20 p-2 bg-slate-900/5 hover:bg-slate-900/10 text-slate-500 hover:text-slate-800 rounded-xl transition-colors cursor-pointer print:hidden"
                  title="Close Viewer"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="text-center space-y-6 relative z-10">
                  
                  {/* Certificate Logo */}
                  <div className="inline-flex items-center gap-2 text-lg font-black tracking-tight text-slate-950 mt-2">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
                      <Award className="w-5 h-5" />
                    </div>
                    <span>Learn<span className="text-indigo-600">Studio</span></span>
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-[9px] font-bold text-amber-700 uppercase tracking-widest">Certificate of Course Completion</p>
                    <div className="h-0.5 w-16 bg-amber-600/40 mx-auto rounded-full" />
                  </div>

                  <p className="text-[11px] text-slate-500 italic max-w-sm mx-auto">
                    This is proudly presented to certify that
                  </p>

                  <h3 className="text-2xl md:text-3xl font-extrabold text-slate-950 border-b border-slate-200 pb-2 max-w-lg mx-auto tracking-wide">
                    {selectedCert.studentName}
                  </h3>

                  <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                    has successfully completed all academic requirements, practical homework exercises, and digital curriculum modules for the professional course:
                  </p>

                  <h4 className="text-base md:text-lg font-black text-indigo-950 px-5 py-2.5 bg-indigo-50/40 border border-indigo-100/60 rounded-xl inline-block max-w-xl">
                    {selectedCert.courseTitle}
                  </h4>

                  {/* Cryptographic metadata */}
                  <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto pt-6 border-t border-slate-200 text-left">
                    <div className="space-y-0.5">
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Date Issued</span>
                      <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {new Date(selectedCert.issuedAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    
                    <div className="space-y-0.5 border-l border-slate-200/60 pl-4">
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Certificate ID</span>
                      <span className="text-xs font-bold text-indigo-600 font-mono tracking-wide block">
                        LSC-{selectedCert.id.toString().padStart(6, '0')}
                      </span>
                    </div>
                    
                    <div className="space-y-0.5 border-l border-slate-200/60 pl-4">
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Verification Hash</span>
                      <span className="text-[10px] font-mono font-bold text-slate-600 break-all block" title={selectedCert.certificateHash}>
                        {selectedCert.certificateHash.substring(0, 16)}...
                      </span>
                    </div>
                  </div>

                  {/* Bottom bar */}
                  <div className="pt-5 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200/60 mt-4 text-[9px] text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>Cryptographically signed & verified inside LearnStudio DB</span>
                    </div>
                    
                    <button
                      onClick={handlePrint}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm print:hidden"
                    >
                      <Download className="w-3 h-3" /> Save / Print PDF
                    </button>
                  </div>

                  {/* Gold Ribbon Foil Seal */}
                  <div className="absolute bottom-8 right-6 hidden sm:flex flex-col items-center justify-center pointer-events-none opacity-90">
                    <div className="w-14 h-14 bg-gradient-to-br from-yellow-300 via-amber-500 to-yellow-600 rounded-full flex items-center justify-center shadow-md border border-yellow-400/80 relative">
                      <div className="absolute -bottom-3 -left-1 w-3 h-8 bg-red-700/80 rotate-12 transform origin-top clip-ribbon" />
                      <div className="absolute -bottom-3 -right-1 w-3 h-8 bg-red-700/80 -rotate-12 transform origin-top clip-ribbon" />
                      <Trophy className="w-5 h-5 text-white drop-shadow-sm" />
                    </div>
                    <span className="text-[6px] font-bold uppercase tracking-widest mt-4 text-amber-800">Official Seal</span>
                  </div>

                </div>
              </div>
              
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
