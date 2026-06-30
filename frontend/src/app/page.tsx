'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Sparkles, 
  Award, 
  ArrowRight, 
  Compass, 
  CheckCircle, 
  Zap, 
  Phone, 
  Mail, 
  MapPin, 
  Youtube, 
  Instagram, 
  Facebook, 
  Users, 
  BookOpenCheck, 
  Trophy, 
  GraduationCap,
  Calendar,
  Flame
} from 'lucide-react';

interface Topper {
  name: string;
  score: string;
  rankText: string;
  image?: string;
  scienceMarks?: string;
  mathMarks?: string;
  colorClass: string;
}

interface BatchData {
  year: string;
  title: string;
  studentCount: number;
  avgScore: string;
  toppers: Topper[];
}

const batchResultsData: Record<string, BatchData> = {
  '2024-25': {
    year: '2024-25',
    title: 'Class 10th Results',
    studentCount: 8,
    avgScore: '85.5%',
    toppers: [
      { 
        name: 'Gunjan Salecha', 
        score: '92.0%', 
        rankText: '1st Rank', 
        image: '/STUDENT_PNG/GunjanSalecha.jpg',
        scienceMarks: '86/100',
        mathMarks: '94/100',
        colorClass: 'border-amber-500/30 text-amber-400 bg-amber-500/10'
      },
      { 
        name: 'Yashvi Jain', 
        score: '90.0%', 
        rankText: '2nd Rank',
        image: '/STUDENT_PNG/YashviJain.jpg',
        scienceMarks: '97/100',
        mathMarks: '94/100',
        colorClass: 'border-slate-350/30 text-slate-350 bg-slate-350/10'
      },
      { 
        name: 'Vanshika Choudhary', 
        score: '84.0%', 
        rankText: '3rd Rank',
        image: '/STUDENT_PNG/Vanshikach.jpg',
        scienceMarks: '97/100',
        mathMarks: '82/100',
        colorClass: 'border-amber-700/30 text-amber-600 bg-amber-600/10'
      }
    ]
  },
  '2023-24': {
    year: '2023-24',
    title: 'Class 10th Results',
    studentCount: 7,
    avgScore: '88.0%',
    toppers: [
      { 
        name: 'Hardik Lunker', 
        score: '93.67%', 
        rankText: '1st Rank',
        scienceMarks: '90/100',
        mathMarks: '97/100',
        colorClass: 'border-amber-500/30 text-amber-400 bg-amber-500/10'
      },
      { 
        name: 'Harshil Sharma', 
        score: '89.5%', 
        rankText: '2nd Rank',
        scienceMarks: '86/100',
        mathMarks: '96/100',
        colorClass: 'border-slate-350/30 text-slate-350 bg-slate-350/10'
      },
      { 
        name: 'Varsha', 
        score: '87.83%', 
        rankText: '3rd Rank',
        scienceMarks: '87/100',
        mathMarks: '93/100',
        colorClass: 'border-amber-700/30 text-amber-600 bg-amber-600/10'
      }
    ]
  },
  '2022-23': {
    year: '2022-23',
    title: 'Class 10th Results',
    studentCount: 7,
    avgScore: '91.04%',
    toppers: [
      { 
        name: 'Jinal Gogar', 
        score: '93.83%', 
        rankText: '1st Rank',
        scienceMarks: '93/100',
        mathMarks: '95/100',
        colorClass: 'border-amber-500/30 text-amber-400 bg-amber-500/10'
      },
      { 
        name: 'Dushyant Jatol', 
        score: '92.5%', 
        rankText: '2nd Rank',
        scienceMarks: '94/100',
        mathMarks: '100/100',
        colorClass: 'border-slate-350/30 text-slate-350 bg-slate-350/10'
      },
      { 
        name: 'Kusum Panwar', 
        score: '91.67%', 
        rankText: '3rd Rank',
        scienceMarks: '90/100',
        mathMarks: '98/100',
        colorClass: 'border-amber-700/30 text-amber-600 bg-amber-600/10'
      }
    ]
  }
};

export default function Home() {
  const { user } = useAuth();
  const [selectedBatch, setSelectedBatch] = useState<string>('2024-25');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const activeBatch = batchResultsData[selectedBatch];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between font-sans selection:bg-indigo-500 selection:text-white relative">
      
      {/* Glow Effects */}
      <div className="absolute top-0 left-1/4 -translate-y-24 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="absolute top-1/2 right-10 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="absolute bottom-0 left-10 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-3xl pointer-events-none z-0" />

      {/* Header/Navbar */}
      <header className={`fixed top-0 left-0 right-0 h-20 transition-all duration-300 z-50 ${
        scrolled ? 'bg-slate-950/80 backdrop-blur-md border-b border-slate-900/80 shadow-lg' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl h-full mx-auto px-6 lg:px-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-indigo-500/10 group-hover:scale-105 transition-transform border border-slate-900">
              <Image 
                src="/images/logo.png" 
                alt="R.K Coaching Classes Logo"
                fill
                sizes="40px"
                style={{ objectFit: 'cover' }}
              />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-lg tracking-tight leading-tight">R.K Coaching Classes</span>
              <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest leading-none">Balotra</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-300">
            <a href="#home" className="hover:text-white transition-colors">Home</a>
            <a href="#why-choose" className="hover:text-white transition-colors">Why RK</a>
            <a href="#results" className="hover:text-white transition-colors">Results</a>
            <a href="#resources" className="hover:text-white transition-colors">Resources</a>
            <a href="#instructors" className="hover:text-white transition-colors">Instructors</a>
            <a href="#contact" className="hover:text-white transition-colors">Contact</a>
          </nav>

          <div className="flex items-center gap-4">
            {user ? (
              <Link 
                href="/dashboard"
                className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition-all text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                Go to Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login" className="text-xs font-bold uppercase tracking-wider text-slate-350 hover:text-white transition-colors px-3 py-2">
                  Sign In
                </Link>
                <Link 
                  href="/register"
                  className="px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-950 font-bold rounded-xl transition-all text-xs uppercase tracking-wider cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                >
                  Join Now
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full relative z-10 pt-24">

        {/* HERO SECTION */}
        <section id="home" className="max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-24 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Hero Content */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-full text-[10px] font-black uppercase tracking-widest">
              <Flame className="w-3.5 h-3.5 text-amber-500 animate-pulse" /> Confused to Confident!
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05] text-white">
              Your child's success <br />
              starts with <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">Expert Guidance.</span>
            </h1>

            <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Welcome to <strong>R.K Coaching Classes</strong>. We empower students to learn, grow, and excel through concept-based teaching, regular evaluations, and personalized attention.
            </p>

            {/* Checkmark Features */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-left max-w-lg mx-auto lg:mx-0">
              {[
                'Concept-Based Learning from Early Years',
                'Regular Assessments & Feedback',
                'Visual learning (videos, flowcharts)',
                'Curated study materials',
                'Best-in-class doubt resolution',
                'Holistic student development'
              ].map((feature, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-6">
              <Link 
                href={user ? "/dashboard" : "/register"}
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-extrabold rounded-xl shadow-lg shadow-indigo-500/25 transition-all text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                Enroll Now <ArrowRight className="w-4.5 h-4.5" />
              </Link>
              <a
                href="#resources"
                className="w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl transition-all text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
              >
                <Compass className="w-4.5 h-4.5 text-slate-400" /> Explore Resources
              </a>
            </div>
          </div>

          {/* Right Hero / Interactive Feature Panel */}
          <div className="lg:col-span-5 relative w-full h-[380px] sm:h-[450px] bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border border-slate-900 rounded-3xl p-6 sm:p-8 flex flex-col justify-between overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-[2px] pointer-events-none" />
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="space-y-4 relative z-10">
              <div className="w-12 h-12 bg-white/5 border border-slate-800 rounded-2xl flex items-center justify-center text-indigo-400 shadow-inner">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-white">R.K Digital Classroom</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Connect and manage your student's learning progress. Track attendance, view schedules, upload tests, and sync offline study notes with our custom learning portal.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 space-y-3 relative z-10">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-bold uppercase tracking-wider">Quick Portal Status</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800/50">
                  <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full w-[88%]" />
                </div>
                <span className="text-xs font-black text-white shrink-0">88% Active</span>
              </div>
              <p className="text-[10px] text-slate-500">
                Providing high-performance coaching across Balotra for over a decade.
              </p>
            </div>
          </div>
        </section>

        {/* WHY CHOOSE SECTION */}
        <section id="why-choose" className="max-w-7xl mx-auto px-6 lg:px-8 py-20 border-t border-slate-900 space-y-12">
          <div className="text-center space-y-3 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase">Why Choose RK Coaching Classes?</h2>
            <p className="text-slate-400 text-xs sm:text-sm">Explore the unique features that set us apart, helping your child secure a competitive edge.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
            {[
              { title: 'Experienced Tutors', desc: 'Guidance by founders with 10+ years CBSE board teaching experience.', icon: Users },
              { title: 'Batch Wise Study', desc: 'Divided classes to ensure tailored learning speed and individual feedback.', icon: Calendar },
              { title: 'Quality Notes', desc: 'Chapter-wise structured notes summarizing key concepts and formulas.', icon: BookOpenCheck },
              { title: 'Special Test Series', desc: 'Regular board-pattern chapter tests and overall syllabus mock examinations.', icon: Award },
              { title: 'Math & Science Focus', desc: 'Specialized conceptual deep dives in core Science and Mathematics areas.', icon: Zap }
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="glass-card hover-lift p-6 rounded-3xl flex flex-col justify-between gap-4 border border-slate-900">
                  <div className="w-10 h-10 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="text-sm font-black text-white">{item.title}</h4>
                    <p className="text-slate-500 text-xs leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* RESULTS SECTION */}
        <section id="results" className="max-w-7xl mx-auto px-6 lg:px-8 py-20 border-t border-slate-900 space-y-12 relative overflow-hidden">
          
          {/* Background Decorative Circles matching user image */}
          <div className="absolute right-0 top-1/4 w-[350px] h-[350px] border border-purple-500/10 rounded-full pointer-events-none -mr-40 z-0" />
          <div className="absolute right-12 top-1/3 w-[250px] h-[250px] border border-indigo-500/5 rounded-full pointer-events-none z-0" />
          <div className="absolute left-1/3 bottom-10 w-[300px] h-[300px] border border-purple-500/5 rounded-full pointer-events-none z-0" />
          
          <div className="relative z-10 text-center space-y-3 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase">Our Top Results</h2>
            <p className="text-slate-400 text-xs sm:text-sm">Meet our star board performers who achieved academic excellence through dedication and guidance.</p>
          </div>

          {/* Batch Selector Tabs */}
          <div className="relative z-10 flex justify-center gap-3">
            {Object.keys(batchResultsData).map((year) => (
              <button
                key={year}
                onClick={() => setSelectedBatch(year)}
                className={`px-5 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  selectedBatch === year
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/15'
                    : 'bg-slate-900 hover:bg-slate-850 text-slate-400 border border-slate-800'
                }`}
              >
                Batch {year}
              </button>
            ))}
          </div>

          {/* Statistics Summary */}
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto text-center">
            <div className="glass-card p-6 rounded-3xl border border-slate-900 space-y-1 shadow-inner">
              <span className="text-[10px] font-extrabold text-slate-550 uppercase tracking-widest">Total Students</span>
              <h3 className="text-3xl font-black text-white">{activeBatch.studentCount}</h3>
            </div>
            <div className="glass-card p-6 rounded-3xl border border-slate-900 space-y-1 shadow-inner">
              <span className="text-[10px] font-extrabold text-slate-550 uppercase tracking-widest">Average Board Score</span>
              <h3 className="text-3xl font-black text-indigo-400">{activeBatch.avgScore}</h3>
            </div>
          </div>

          {/* Toppers Cards Grid - Matching Recipe Card Layout */}
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 pt-4 max-w-6xl mx-auto">
            <AnimatePresence mode="wait">
              {activeBatch.toppers.map((topper, idx) => (
                <motion.div
                  key={`${selectedBatch}-${topper.name}`}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25, delay: idx * 0.05 }}
                  className="group flex flex-col bg-white text-slate-900 rounded-3xl overflow-hidden shadow-xl border border-slate-200/50 h-[360px] w-full transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
                >
                  {/* Top Image Part */}
                  <div className="relative h-48 w-full overflow-hidden bg-slate-100 shrink-0">
                    {topper.image ? (
                      <Image 
                        src={topper.image} 
                        alt={topper.name}
                        fill
                        sizes="300px"
                        style={{ objectFit: 'cover' }}
                        className="group-hover:scale-105 transition-transform duration-500"
                        priority
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-2xl group-hover:scale-105 transition-transform duration-500">
                        {topper.name.split(' ').map(n => n[0]).join('')}
                      </div>
                    )}
                    
                    {/* Floating Duration-style Year Badge */}
                    <div className="absolute top-4 right-4 bg-black/75 backdrop-blur-sm text-[9px] text-white font-black px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md border border-white/10">
                      <Trophy className="w-3 h-3 text-amber-400" />
                      <span>{selectedBatch}</span>
                    </div>
                  </div>

                  {/* Bottom Text Part */}
                  <div className="p-6 flex-1 flex flex-col justify-between bg-white">
                    <div className="space-y-1 text-left">
                      <span className="text-[10px] font-black uppercase tracking-wider text-indigo-650 block">
                        {topper.rankText}
                      </span>
                      <h4 className="font-black text-slate-900 text-lg leading-tight transition-colors duration-300 group-hover:text-indigo-600">
                        {topper.name}
                      </h4>
                      <p className="text-xs text-slate-500 font-medium">
                        Board Score: <strong className="text-slate-800 font-black">{topper.score}</strong>
                      </p>
                    </div>

                    {/* Science & Math Marks Footer */}
                    <div className="border-t border-slate-100 pt-3 mt-2 flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      <div className="text-left">
                        <span className="block text-[8px] text-slate-400 font-bold">Science</span>
                        <span className="text-slate-800 font-black">{topper.scienceMarks || 'N/A'}</span>
                      </div>
                      <div className="text-right">
                        <span className="block text-[8px] text-slate-400 font-bold">Mathematics</span>
                        <span className="text-slate-800 font-black">{topper.mathMarks || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>

        {/* STUDY RESOURCES SECTION */}
        <section id="resources" className="max-w-7xl mx-auto px-6 lg:px-8 py-20 border-t border-slate-900 space-y-12">
          <div className="text-center space-y-3 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase">Study Resources</h2>
            <p className="text-slate-400 text-xs sm:text-sm">Access top-quality learning materials compiled by our educators to elevate school scores.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Reference Books Card */}
            <div className="glass-card hover-lift p-6 rounded-3xl border bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border-blue-500/15 text-blue-400 flex flex-col justify-between gap-6 shadow-sm">
              <div className="space-y-3">
                <h3 className="text-lg font-black text-white">Reference Books</h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  A carefully curated list of essential reference textbooks for standard board syllabi, matching school lessons.
                </p>
              </div>
              <button 
                disabled 
                className="self-start px-4 py-2 border border-slate-800/80 bg-slate-900/50 text-slate-500 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-not-allowed select-none"
              >
                Coming Soon
              </button>
            </div>

            {/* NCERT Solutions Card */}
            <div className="glass-card hover-lift p-6 rounded-3xl border bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-500/15 text-amber-400 flex flex-col justify-between gap-6 shadow-sm">
              <div className="space-y-3">
                <h3 className="text-lg font-black text-white">NCERT Solutions</h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Step-by-step solved solutions for all textbook exercise questions, compiled cleanly for revisions.
                </p>
              </div>
              <button className="self-start px-4 py-2 border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer">
                Explore File
              </button>
            </div>

            {/* Notes Card */}
            <div className="glass-card hover-lift p-6 rounded-3xl border bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border-emerald-500/15 text-emerald-400 flex flex-col justify-between gap-6 shadow-sm">
              <div className="space-y-3">
                <h3 className="text-lg font-black text-white">Class Notes</h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Highly detailed, organized chapter notes written by our tutors to aid in better concept retention.
                </p>
              </div>
              <button className="self-start px-4 py-2 border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer">
                Explore File
              </button>
            </div>
          </div>
        </section>

        {/* OUR INSTRUCTORS SECTION */}
        <section id="instructors" className="max-w-7xl mx-auto px-6 lg:px-8 py-20 border-t border-slate-900 space-y-12">
          <div className="text-center space-y-3 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase">Our Instructors</h2>
            <p className="text-slate-400 text-xs sm:text-sm">Meet the passionate, experienced mentors driving our concept-based learning classes.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[
              {
                name: 'Rakesh Agarwal',
                role: 'Founder & Head Educator',
                title: 'Ex-CBSE Teacher, IIT Jodhpur Alumnus',
                bio: 'A passionate Mathematics & Science Educator with over 10+ years of teaching experience. Rakesh has helped 500+ students achieve academic excellence in board exams. An alumnus of IIT Jodhpur, he brings industry knowledge and practical applications to theoretical concepts. His teaching methodology focuses on concept clarity, problem-solving techniques, and exam strategies that have consistently produced top-ranking students in the region.'
              },
              {
                name: 'Rekha Agarwal',
                role: 'Co-Founder & Science Faculty',
                title: 'Ex-CBSE Teacher',
                bio: 'A passionate Mathematics & Science Educator with over 10+ years of teaching experience. Rekha has helped 500+ students achieve academic excellence in board exams. She brings deep domain knowledge and practical applications to science concepts. Her teaching methodology focuses on concept clarity, biological diagrams, flowcharts, and structured notes that have consistently produced top-ranking board results.'
              },
              {
                name: 'Harsh Agarwal',
                role: 'Director of Technology & STEM',
                title: 'Ex-CBSE Teacher, IIT Jodhpur Alumnus',
                bio: 'A passionate Mathematics & Science Educator with over 10+ years of teaching experience. Harsh has helped 500+ students achieve academic excellence in board exams. An alumnus of IIT Jodhpur, he brings technology-driven systems and practical applications to math learning. His teaching methodology focuses on concept clarity, online test series, and visual tutorials that consistently guide students to score highest marks.'
              }
            ].map((inst, idx) => (
              <div 
                key={idx} 
                className="glass-card hover-lift p-6 rounded-3xl border border-slate-900 flex flex-col justify-between gap-6"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/10">
                      <GraduationCap className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-black text-white text-base leading-tight">{inst.name}</h4>
                      <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider mt-0.5">{inst.role}</p>
                    </div>
                  </div>
                  
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-900 px-3 py-1 rounded-xl inline-block border border-slate-800/80">
                    {inst.title}
                  </div>

                  <p className="text-slate-450 text-xs leading-relaxed">
                    {inst.bio}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SOCIAL STATS SECTION */}
        <section className="max-w-7xl mx-auto px-6 lg:px-8 py-20 border-t border-slate-900 space-y-12">
          <div className="text-center space-y-3 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase">Connect With Us</h2>
            <p className="text-slate-400 text-xs sm:text-sm">Join our growing learning community on online channels.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { 
                channel: 'Instagram', 
                value: '91+', 
                desc: 'Follow for class updates & toppers stories', 
                color: 'text-pink-400 hover:shadow-[0_0_15px_rgba(244,63,94,0.15)]', 
                icon: Instagram,
                url: 'https://www.instagram.com/rk.coachings20?igsh=ajl5am10cTlyaGw5'
              },
              { 
                channel: 'YouTube', 
                value: '186+', 
                desc: 'Subscribe for visual physics & math lectures', 
                color: 'text-rose-500 hover:shadow-[0_0_15px_rgba(225,29,72,0.15)]', 
                icon: Youtube,
                url: 'https://youtube.com/@rkcoachingclasses?si=KfYdwL2LGWjAbTTm'
              },
              { 
                channel: 'Facebook', 
                value: '100+', 
                desc: 'Connect for parenting tips & study resources', 
                color: 'text-blue-500 hover:shadow-[0_0_15px_rgba(59,130,246,0.15)]', 
                icon: Facebook,
                url: '#'
              }
            ].map((social, idx) => {
              const Icon = social.icon;
              return (
                <a 
                  key={idx}
                  href={social.url}
                  target={social.url !== '#' ? "_blank" : undefined}
                  rel={social.url !== '#' ? "noopener noreferrer" : undefined}
                  className={`glass-card hover-lift p-6 rounded-3xl border border-slate-900 text-center space-y-3 shadow-inner block transition-all duration-300 ${social.color}`}
                >
                  <div className={`w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mx-auto border border-white/5`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-3xl font-black text-white">{social.value}</h3>
                  <p className="text-xs font-bold text-slate-300">{social.channel}</p>
                  <p className="text-[10px] text-slate-500">{social.desc}</p>
                </a>
              );
            })}
          </div>
        </section>

        {/* ENDING SECTION */}
        <section className="max-w-4xl mx-auto px-6 text-center py-16 space-y-4">
          <h2 className="text-xl sm:text-2xl font-black text-white">Welcome to the RK Coaching Classes Family!</h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
            Join our tutoring batches to boost academic performance, strengthen core concepts, and see constant improvement.
          </p>
        </section>

      </main>

      {/* Footer / Contact */}
      <footer id="contact" className="border-t border-slate-900 bg-slate-950/40 relative z-10 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 grid grid-cols-1 md:grid-cols-12 gap-10 border-b border-slate-900/60 pb-12">
          
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-slate-900">
                <Image 
                  src="/images/logo.png" 
                  alt="R.K Coaching Classes Logo"
                  fill
                  sizes="32px"
                  style={{ objectFit: 'cover' }}
                />
              </div>
              <span className="font-black text-base text-white tracking-tight">R.K Coaching Classes</span>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed max-w-sm">
              Providing Balotra's students with premium, CBSE-focused conceptual tutoring in Mathematics and Science for more than ten years.
            </p>
          </div>

          <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs text-slate-400">
            {/* Contact details */}
            <div className="space-y-4">
              <h4 className="font-extrabold text-white uppercase tracking-wider text-[10px]">Get in Touch</h4>
              <div className="space-y-2.5">
                <a href="mailto:rk.coachings20@gmail.com" className="flex items-center gap-2.5 hover:text-white transition-colors">
                  <Mail className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>rk.coachings20@gmail.com</span>
                </a>
                <a href="tel:+919414668795" className="flex items-center gap-2.5 hover:text-white transition-colors">
                  <Phone className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>+91 9414668795</span>
                </a>
                <div className="flex items-start gap-2.5 leading-normal">
                  <MapPin className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <span>65 Agrawal colony, Near Vardhman School, Balotra, Rajasthan - 344022</span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-4">
              <h4 className="font-extrabold text-white uppercase tracking-wider text-[10px]">Follow Our Pages</h4>
              <div className="flex gap-4">
                <a 
                  href="https://www.instagram.com/rk.coachings20?igsh=ajl5am10cTlyaGw5" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-9 h-9 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white rounded-xl flex items-center justify-center transition-all"
                >
                  <Instagram className="w-4.5 h-4.5" />
                </a>
                <a 
                  href="https://youtube.com/@rkcoachingclasses?si=KfYdwL2LGWjAbTTm" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-9 h-9 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white rounded-xl flex items-center justify-center transition-all"
                >
                  <Youtube className="w-4.5 h-4.5" />
                </a>
                <a 
                  href="#" 
                  className="w-9 h-9 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-500 hover:text-slate-450 rounded-xl flex items-center justify-center transition-all cursor-not-allowed"
                >
                  <Facebook className="w-4.5 h-4.5" />
                </a>
              </div>
            </div>

          </div>

        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] text-slate-600 font-bold uppercase tracking-wider">
          <p>© 2026 R.K Coaching Classes. All rights reserved.</p>
          <div className="flex items-center gap-1">
            <span>Powered by</span>
            <span className="text-slate-500 font-black">LearnStudio 2.0</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
