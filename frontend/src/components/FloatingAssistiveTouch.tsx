'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Bot, X, LogIn, Loader2, ChevronRight, UserCheck, Flame } from 'lucide-react';

export function FloatingAssistiveTouch() {
  const { user, login } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [googleInitialized, setGoogleInitialized] = useState(false);

  const handleGoogleResponse = async (response: any) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/google', { credential: response.credential });
      const { success, data, message } = res.data;
      if (success && data) {
        const { token, refreshToken, userId, name, email: userEmail, role } = data;
        login({ id: userId, name, email: userEmail, role });
        setIsOpen(false);
      } else {
        setError(message || 'Google login failed.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Google login failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && !user && typeof window !== 'undefined' && (window as any).google) {
      try {
        if (!googleInitialized) {
          (window as any).google.accounts.id.initialize({
            client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '181483437b.apps.googleusercontent.com',
            callback: handleGoogleResponse,
            cancel_on_tap_outside: false
          });
          setGoogleInitialized(true);
        }

        const btnContainer = document.getElementById('google-assistive-btn-container');
        if (btnContainer) {
          btnContainer.innerHTML = '';
          (window as any).google.accounts.id.renderButton(btnContainer, {
            theme: 'filled_black',
            size: 'medium',
            text: 'continue_with',
            shape: 'pill',
            width: 220
          });
        }
      } catch (e) {
        console.warn('Google SDK initialization error:', e);
      }
    }
  }, [isOpen, user, googleInitialized]);

  const triggerOneTap = () => {
    if (typeof window !== 'undefined' && (window as any).google) {
      (window as any).google.accounts.id.prompt();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 pointer-events-auto select-none">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: -16 }}
            exit={{ opacity: 0, scale: 0.8, y: 16 }}
            transition={{ type: "spring", damping: 22, stiffness: 300 }}
            className="w-[280px] sm:w-[320px] bg-slate-900/95 backdrop-blur-2xl border border-indigo-500/40 rounded-3xl p-5 shadow-[0_10px_40px_rgba(79,70,229,0.35)] flex flex-col gap-4 text-white relative overflow-hidden"
          >
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/15 rounded-full blur-xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/15 rounded-full blur-xl pointer-events-none" />

            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 z-10">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-black tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 uppercase">
                  Assistive Touch
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="text-[11px] text-red-400 bg-red-500/10 p-2 rounded-xl border border-red-500/20 text-center">
                {error}
              </div>
            )}

            {user ? (
              <div className="flex flex-col gap-3 z-10">
                <div className="flex items-center gap-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                    {user.name ? user.name[0].toUpperCase() : 'U'}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs text-slate-400 font-medium">Logged in as</p>
                    <h4 className="text-sm font-extrabold text-white truncate">{user.name}</h4>
                  </div>
                </div>

                <Link
                  href="/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Launch My Dashboard</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-3 z-10">
                <div className="text-left">
                  <h4 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span>Instant Quick Sign-In</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                    One-tap Google access to save your progress and chat with Charlie AI!
                  </p>
                </div>

                {loading ? (
                  <div className="w-full py-4 flex items-center justify-center text-xs text-slate-300 gap-2 bg-slate-800/50 rounded-xl">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                    <span>Signing via Google...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 pt-1">
                    <div id="google-assistive-btn-container" className="w-full flex justify-center min-h-[40px]" />
                    <button
                      onClick={triggerOneTap}
                      className="w-full py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white border border-slate-700 rounded-full text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Trigger Google One-Tap</span>
                    </button>
                  </div>
                )}

                <div className="border-t border-slate-800/80 pt-2 flex items-center justify-between text-[11px] font-semibold text-slate-400">
                  <Link href="/login" onClick={() => setIsOpen(false)} className="hover:text-indigo-400 transition-colors flex items-center gap-1">
                    <LogIn className="w-3 h-3" />
                    <span>Email Sign In</span>
                  </Link>
                  <Link href="/register" onClick={() => setIsOpen(false)} className="text-amber-400 hover:text-amber-300 font-bold transition-colors">
                    New? Enroll Now
                  </Link>
                </div>
              </div>
            )}

            {/* Quick AI Mentor Link */}
            <a
              href="#charlie-ai-test"
              onClick={() => setIsOpen(false)}
              className="w-full mt-1 p-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/25 rounded-xl flex items-center gap-2.5 text-xs text-indigo-300 transition-colors cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Bot className="w-4 h-4" />
              </div>
              <div className="text-left font-semibold">
                <span className="text-white font-bold block">Ask Charlie AI Tutor</span>
                <span className="text-[10px] text-indigo-300/80">Test 24/7 instant solutions</span>
              </div>
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Assistive Touch Orb Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Google Sign-in Assistive Touch"
        className="w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 p-[2px] shadow-[0_4px_25px_rgba(124,58,235,0.5)] cursor-pointer relative group flex items-center justify-center"
      >
        <div className="w-full h-full rounded-full bg-slate-950/85 group-hover:bg-transparent transition-colors duration-300 flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-white animate-pulse" />
        </div>

        {/* Outer pulsing ping wave for first-time noticeability */}
        <span className="absolute -inset-1 rounded-full bg-indigo-500 opacity-20 animate-ping pointer-events-none" />

        {/* Small Google 'G' badge overlay */}
        {!user && (
          <div className="absolute -top-1 -left-1 w-6 h-6 rounded-full bg-white border-2 border-slate-950 flex items-center justify-center shadow-md">
            <span className="text-xs font-black bg-clip-text text-transparent bg-gradient-to-br from-red-500 via-yellow-500 to-blue-500">
              G
            </span>
          </div>
        )}
      </motion.button>
    </div>
  );
}
