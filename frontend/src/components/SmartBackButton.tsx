'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function SmartBackButton() {
  const router = useRouter();

  const handleBack = () => {
    // Check if there is history to go back to in this session
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <button
      onClick={handleBack}
      className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold transition-all shadow-sm cursor-pointer"
    >
      <ArrowLeft className="w-4 h-4" />
      Back
    </button>
  );
}
