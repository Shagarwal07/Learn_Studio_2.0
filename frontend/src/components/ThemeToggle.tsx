'use client';

import React from 'react';
import { Sun, Moon, Laptop, Lock } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

export default function ThemeToggle() {
  const { theme } = useTheme();

  return (
    <div 
      className="flex items-center gap-1 bg-slate-150 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/70 p-1 rounded-xl"
      title="Theme configuration is locked to System Default by administrator"
    >
      <button
        disabled
        title="Light Mode (Locked)"
        className="p-2 rounded-lg text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-40 transition-all"
      >
        <Sun className="w-4 h-4" />
      </button>
      <button
        disabled
        title="Dark Mode (Locked)"
        className="p-2 rounded-lg text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-40 transition-all"
      >
        <Moon className="w-4 h-4" />
      </button>
      <button
        disabled
        title="System Preference (Locked & Active)"
        className="p-2 rounded-lg bg-white dark:bg-slate-700 text-teal-500 shadow-sm cursor-not-allowed flex items-center gap-1 transition-all"
      >
        <Laptop className="w-4 h-4" />
        <Lock className="w-2.5 h-2.5 text-teal-600/70 dark:text-teal-400/70" />
      </button>
    </div>
  );
}
