'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Download, X, Smartphone, Sparkles, CheckCircle } from 'lucide-react';

export function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Register Service Worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(
          (reg) => console.log('PWA Service Worker registered successfully with scope:', reg.scope),
          (err) => console.warn('PWA Service Worker registration failed:', err)
        );
      });
    }

    // 2. Check if currently running in Standalone app mode
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    setIsStandalone(standalone);
    if (standalone) return;

    // 3. Check if user already dismissed banner recently
    const dismissed = sessionStorage.getItem('pwa_banner_dismissed') || localStorage.getItem('pwa_installed_flag');
    if (dismissed === 'true') return;

    // 4. Detect iOS devices (iPhone/iPad/iPod) for custom instruction tip
    const iosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iosDevice);

    if (iosDevice) {
      // Show iOS instruction tip after a 2-second delay
      const timer = setTimeout(() => setShowBanner(true), 2500);
      return () => clearTimeout(timer);
    }

    // 5. Intercept standard Chromium beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Reveal prompt after short delay for optimal user UX
      setTimeout(() => {
        setShowBanner(true);
      }, 2000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    window.addEventListener('appinstalled', () => {
      setInstalledSuccess(true);
      localStorage.setItem('pwa_installed_flag', 'true');
      setTimeout(() => setShowBanner(false), 3000);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    setShowBanner(false);
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      localStorage.setItem('pwa_installed_flag', 'true');
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem('pwa_banner_dismissed', 'true');
  };

  if (isStandalone || (!showBanner && !installedSuccess)) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-[360px] z-[9999] animate-in slide-in-from-bottom-5 duration-300 pointer-events-auto">
      <div className="bg-slate-900/95 border border-indigo-500/30 backdrop-blur-xl rounded-2xl p-4 shadow-2xl shadow-indigo-500/20 text-white relative flex flex-col gap-3.5 overflow-hidden">
        {/* Subtle top indicator bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

        <div className="flex items-start justify-between gap-3 pt-1">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-indigo-600/20 border border-indigo-500/40 p-1 flex items-center justify-center shrink-0 shadow-inner">
              <Image src="/images/logo.png" alt="LearnStudio App" width={32} height={32} className="object-contain drop-shadow-sm" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 className="font-bold text-xs tracking-wide uppercase text-indigo-400">R.K. Coaching App</h4>
                <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 px-1.5 py-0.2 text-[9px] font-extrabold rounded-full">FREE</span>
              </div>
              <p className="font-extrabold text-sm text-white truncate">Install Studio App</p>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition-colors cursor-pointer shrink-0"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {installedSuccess ? (
          <div className="flex items-center gap-2 p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs font-bold">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>App installed to home screen successfully!</span>
          </div>
        ) : (
          <>
            <p className="text-xs text-slate-300 leading-relaxed font-normal">
              Get instant 1-click home screen access, offline schedule viewing, and lag-free academic tools.
            </p>

            {isIOS ? (
              <div className="bg-slate-800/80 border border-slate-700 p-2.5 rounded-xl text-xs space-y-1.5 text-slate-300">
                <div className="flex items-center gap-1.5 font-bold text-indigo-400 text-[11px]">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Install Instructions for iPhone & iPad:</span>
                </div>
                <p className="text-[11px] leading-snug">
                  Tap the <span className="text-white font-extrabold underline decoration-indigo-400">Share</span> button (square with arrow) below in Safari, then select <span className="text-white font-extrabold">'Add to Home Screen'</span>.
                </p>
              </div>
            ) : (
              <button
                onClick={handleInstallClick}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-indigo-650/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Download className="w-4 h-4 shrink-0" />
                <span>Install Free Standalone App</span>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
