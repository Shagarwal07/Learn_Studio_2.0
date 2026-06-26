'use client';

import React from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/85 p-1 rounded-xl">
      <button
        onClick={() => setTheme('light')}
        title="Light Mode"
        className={`p-2 rounded-lg transition-all ${
          theme === 'light'
            ? 'bg-white dark:bg-slate-700 text-amber-500 shadow-sm'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
        }`}
      >
        <Sun className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTheme('dark')}
        title="Dark Mode"
        className={`p-2 rounded-lg transition-all ${
          theme === 'dark'
            ? 'bg-white dark:bg-slate-750 text-indigo-500 shadow-sm'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
        }`}
      >
        <Moon className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTheme('system')}
        title="System Preference"
        className={`p-2 rounded-lg transition-all ${
          theme === 'system'
            ? 'bg-white dark:bg-slate-750 text-teal-500 shadow-sm'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
        }`}
      >
        <Laptop className="w-4 h-4" />
      </button>
    </div>
  );
}
