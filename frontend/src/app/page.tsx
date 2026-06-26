'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { 
  BookOpen, 
  Sparkles, 
  Award, 
  ArrowRight, 
  Compass, 
  CheckCircle, 
  Shield, 
  Zap 
} from 'lucide-react';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="relative overflow-hidden min-h-screen bg-slate-950 text-white flex flex-col justify-between">
      
      {/* Background Decorative Circles */}
      <div className="absolute top-0 left-0 -translate-y-12 translate-x-12 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 translate-y-12 -translate-x-12 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      
      {/* Navbar */}
      <header className="h-20 max-w-7xl w-full mx-auto px-6 lg:px-8 flex items-center justify-between relative z-10">
        <Link href="/" className="flex items-center gap-2 font-black text-xl">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
            <BookOpen className="w-5 h-5" />
          </div>
          <span>Learn<span className="text-indigo-450">Studio</span> <span className="text-xs bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ml-1">2.0</span></span>
        </Link>
        <div>
          {user ? (
            <Link 
              href="/dashboard"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/25 transition-all text-sm flex items-center gap-1 cursor-pointer"
            >
              Enter Classroom <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-sm font-semibold text-slate-350 hover:text-white transition-colors">
                Sign In
              </Link>
              <Link 
                href="/register"
                className="px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-950 font-bold rounded-xl transition-all text-sm cursor-pointer"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl w-full mx-auto px-6 lg:px-8 py-16 lg:py-24 relative z-10 flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Hero */}
          <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 border border-indigo-550/20 text-indigo-300 rounded-full text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> AI-powered Learning platform
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-white">
              Upgrade Your Skills <br />
              With <span className="text-indigo-400">Contextual AI</span>
            </h1>

            <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Experience the next generation of online education. Learn professional engineering concepts with on-demand video classrooms, automated certificates, and a real-time Gemini tutor tailored to your course material.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <Link 
                href={user ? "/dashboard" : "/register"}
                className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-xl shadow-lg shadow-indigo-600/25 transition-all text-base flex items-center justify-center gap-2 cursor-pointer"
              >
                Start Learning Now <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/courses"
                className="w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl transition-all text-base font-bold flex items-center justify-center gap-2 cursor-pointer"
              >
                <Compass className="w-5 h-5 text-slate-400" /> Browse Catalog
              </Link>
            </div>
          </div>

          {/* Right Hero: Feature Grid Cards */}
          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl space-y-4 shadow-xl">
              <div className="w-10 h-10 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <h4 className="font-extrabold text-white text-base">Classroom Locks</h4>
              <p className="text-slate-500 text-xs leading-relaxed">
                Step-by-step sequential learning paths. Unlock new video lessons automatically as you complete milestones.
              </p>
            </div>

            <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl space-y-4 shadow-xl">
              <div className="w-10 h-10 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <h4 className="font-extrabold text-white text-base">Gemini Solver</h4>
              <p className="text-slate-500 text-xs leading-relaxed">
                Stuck on a line of code? Our AI doubt solver provides instant, contextual help directly in the classroom.
              </p>
            </div>

            <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl space-y-4 shadow-xl">
              <div className="w-10 h-10 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <h4 className="font-extrabold text-white text-base">Verified Badges</h4>
              <p className="text-slate-500 text-xs leading-relaxed">
                Complete all course milestones to generate cryptographically signed completion certificates instantly.
              </p>
            </div>

            <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl space-y-4 shadow-xl">
              <div className="w-10 h-10 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <h4 className="font-extrabold text-white text-base">Secure JWT 2.0</h4>
              <p className="text-slate-500 text-xs leading-relaxed">
                Industrial security standards. Support for sliding refresh token rotations and role-based route locks.
              </p>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="h-16 border-t border-slate-900 max-w-7xl w-full mx-auto px-6 lg:px-8 flex items-center justify-between text-xs text-slate-500 relative z-10">
        <p>© 2026 LearnStudio Inc. All rights reserved.</p>
        <p>Built with Next.js & Spring Boot</p>
      </footer>

    </div>
  );
}
