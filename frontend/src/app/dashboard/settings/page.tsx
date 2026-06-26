'use client';

import React from 'react';
import ThemeToggle from '@/components/ThemeToggle';
import { useTheme } from '@/context/ThemeContext';
import { Settings, Shield, User, Bell, Palette } from 'lucide-react';

export default function SettingsPage() {
  const { theme } = useTheme();

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-in fade-in duration-200">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-100">Settings</h2>
        <p className="text-xs text-slate-400 mt-1">
          Customize your dashboard preferences, theme configurations, and account security.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Left Side: Category Menu */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 h-fit space-y-1">
          <button className="w-full flex items-center gap-2.5 px-3 py-2 bg-violet-600 text-slate-100 rounded-lg text-xs font-medium text-left">
            <Palette className="w-4 h-4" />
            Appearance & Theme
          </button>
          <button className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-400 hover:text-slate-200 hover:bg-slate-850/50 rounded-lg text-xs font-medium text-left transition-all">
            <User className="w-4 h-4" />
            Account Details
          </button>
          <button className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-400 hover:text-slate-200 hover:bg-slate-850/50 rounded-lg text-xs font-medium text-left transition-all">
            <Shield className="w-4 h-4" />
            Security & Privacy
          </button>
          <button className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-400 hover:text-slate-200 hover:bg-slate-850/50 rounded-lg text-xs font-medium text-left transition-all">
            <Bell className="w-4 h-4" />
            Notifications
          </button>
        </div>

        {/* Right Side: Settings Cards */}
        <div className="md:col-span-2 space-y-5">
          
          {/* Theme Option Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <Palette className="w-4 h-4 text-violet-400" />
                  Global Appearance Theme
                </h3>
                <p className="text-xs text-slate-400 max-w-md leading-normal">
                  Toggle between Light, Dark, or let LearnStudio automatically sync with your operating system.
                </p>
              </div>
              <div className="shrink-0">
                <ThemeToggle />
              </div>
            </div>
            
            <div className="border-t border-slate-800 my-4" />
            
            <div className="text-xs text-slate-400">
              Active configuration: <span className="font-semibold text-violet-400 capitalize">{theme} theme</span>. All layouts will automatically align with this aesthetic token.
            </div>
          </div>

          {/* Dummy Extensible Card for Account Details */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 opacity-50 select-none">
            <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400" />
              Account Details (Coming Soon)
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-normal">
              Update your profile information, manage email settings, and profile banner.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
