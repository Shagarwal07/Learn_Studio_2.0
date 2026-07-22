'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { User, Settings, LogOut, ChevronDown } from 'lucide-react';

export default function ProfileDropdown() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1.5 hover:bg-muted rounded-xl transition-all select-none cursor-pointer"
      >
        <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-lg flex items-center justify-center font-bold uppercase shadow-md shadow-indigo-500/10">
          {user.name.charAt(0)}
        </div>
        <div className="hidden md:flex flex-col text-left">
          <span className="text-sm font-semibold text-foreground dark:text-foreground leading-tight">{user.name}</span>
          <span className="text-[10px] text-muted-foreground dark:text-muted-foreground font-medium capitalize">{user.role.toLowerCase()}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-card border border-border-color dark:border-border-color rounded-2xl shadow-xl shadow-slate-900/10 dark:shadow-slate-950/20 py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
          {/* User Info header */}
          <div className="px-4 py-2.5 border-b border-slate-150 dark:border-border-color">
            <p className="text-xs text-muted-foreground dark:text-muted-foreground font-medium">Logged in as</p>
            <p className="text-sm font-semibold text-foreground dark:text-foreground truncate mt-0.5">{user.name}</p>
            <p className="text-xs text-muted-foreground dark:text-muted-foreground truncate">{user.email}</p>
          </div>

          {/* Links */}
          <div className="p-1.5 space-y-0.5">
            <Link
              href="/dashboard/settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground dark:text-foreground hover:bg-muted hover:text-foreground dark:hover:text-foreground transition-all"
            >
              <Settings className="w-4 h-4 text-muted-foreground dark:text-muted-foreground" />
              Settings & Theme
            </Link>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-150 dark:border-border-color my-1" />

          {/* Logout */}
          <div className="px-1.5">
            <button
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
