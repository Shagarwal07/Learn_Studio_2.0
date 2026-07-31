'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  Flame,
  Menu,
  X,
  Heart,
  Star,
  Bot,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

interface Topper {
  name: string;
  score: string;
  rankText: string;
  image?: string;
  scienceMarks?: string;
  mathMarks?: string;
  englishMarks?: string;
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
  '2025-26': {
    year: '2025-26',
    title: 'Class 10th Results',
    studentCount: 5,
    avgScore: '83.33%',
    toppers: [
      {
        name: 'Purva Gehlot',
        score: '88.83%',
        rankText: '1st Rank',
        image: '/STUDENT_PNG/Purva.jpeg',
        englishMarks: '100/100',
        colorClass: 'border-amber-500/30 text-amber-400 bg-amber-500/10'
      },
      {
        name: 'Bhumi Salecha',
        score: '87.33%',
        rankText: '2nd Rank',
        image: '/STUDENT_PNG/Bhumi.jpeg',
        englishMarks: '96/100',
        colorClass: 'border-slate-400/30 text-slate-300 bg-slate-500/10'
      },
      {
        name: 'Rinkesh Gehlot',
        score: '84.17%',
        rankText: '3rd Rank',
        image: '/STUDENT_PNG/Rinkesh.jpeg',
        englishMarks: '95/100',
        colorClass: 'border-amber-700/30 text-amber-500 bg-amber-600/10'
      },
    ]
  },
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
        colorClass: 'border-slate-400/30 text-slate-300 bg-slate-500/10'
      },
      {
        name: 'Vanshika Choudhary',
        score: '84.0%',
        rankText: '3rd Rank',
        image: '/STUDENT_PNG/Vanshikach.jpg',
        scienceMarks: '97/100',
        mathMarks: '82/100',
        colorClass: 'border-amber-700/30 text-amber-500 bg-amber-600/10'
      },
    ]
  },
  '2023-24': {
    year: '2023-24',
    title: 'Class 10th Results',
    studentCount: 7,
    avgScore: '88%',
    toppers: [
      {
        name: 'Hardik Lunker',
        score: '93.67%',
        rankText: '1st Rank',
        image: '/STUDENT_PNG/Hardik.png',
        scienceMarks: '90/100',
        mathMarks: '97/100',
        colorClass: 'border-amber-500/30 text-amber-400 bg-amber-500/10'
      },
      {
        name: 'Harshil Sharma',
        score: '89.5%',
        rankText: '2nd Rank',
        image: '/STUDENT_PNG/Harshil.png',
        scienceMarks: '86/100',
        mathMarks: '96/100',
        colorClass: 'border-slate-400/30 text-slate-300 bg-slate-500/10'
      },
      {
        name: 'Varsha',
        score: '87.83%',
        rankText: '3rd Rank',
        image: '/STUDENT_PNG/Varsha.png',
        scienceMarks: '87/100',
        mathMarks: '93/100',
        colorClass: 'border-amber-700/30 text-amber-500 bg-amber-600/10'
      },
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
        image: '/STUDENT_PNG/Jinal.png',
        scienceMarks: '93/100',
        mathMarks: '95/100',
        colorClass: 'border-amber-500/30 text-amber-400 bg-amber-500/10'
      },
      {
        name: 'Dushyant Jatol',
        score: '92.5%',
        rankText: '2nd Rank',
        image: '/STUDENT_PNG/Dushyant.png',
        scienceMarks: '94/100',
        mathMarks: '100/100',
        colorClass: 'border-slate-400/30 text-slate-300 bg-slate-500/10'
      },
      {
        name: 'Kusum Panwar',
        score: '91.67%',
        rankText: '3rd Rank',
        image: '/STUDENT_PNG/Kusum.png',
        scienceMarks: '90/100',
        mathMarks: '98/100',
        colorClass: 'border-amber-700/30 text-amber-500 bg-amber-600/10'
      },
    ]
  }
};

const fadeUp = {
  hidden: { opacity: 0, y: 25 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.02 }
  }
};

function TopperCard({ topper, year }: { topper: Topper; year: string }) {
  const [imgError, setImgError] = useState(false);

  const availableMarks: { label: string; value: string }[] = [];
  if (topper.englishMarks && topper.englishMarks !== 'N/A') availableMarks.push({ label: 'English', value: topper.englishMarks });
  if (topper.scienceMarks && topper.scienceMarks !== 'N/A') availableMarks.push({ label: 'Science', value: topper.scienceMarks });
  if (topper.mathMarks && topper.mathMarks !== 'N/A') availableMarks.push({ label: 'Math', value: topper.mathMarks });

  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      className="group bg-slate-900/70 backdrop-blur-md text-white rounded-3xl overflow-hidden border border-slate-800 hover:border-slate-700 shadow-xl flex flex-col justify-between transition-colors w-full max-w-[340px] sm:max-w-none mx-auto"
    >
      <div className="relative w-full h-[260px] sm:h-[300px] bg-slate-950 overflow-hidden shrink-0">
        {topper.image && !imgError ? (
          <Image
            src={topper.image}
            alt={topper.name}
            fill
            sizes="(max-width: 640px) 100vw, 340px"
            style={{ objectFit: 'cover', objectPosition: 'top center' }}
            className="group-hover:scale-105 transition-transform duration-500"
            onError={() => setImgError(true)}
            priority
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex flex-col items-center justify-center text-white relative p-4">
            <div className="w-16 h-16 rounded-full bg-slate-700/50 border border-slate-600/50 flex items-center justify-center text-xl font-black">
              {topper.name.split(' ').map(n => n[0]).join('')}
            </div>
          </div>
        )}

        <div className="absolute top-4 right-4 bg-slate-950/80 backdrop-blur-md text-[10px] font-bold px-3 py-1 rounded-full border border-slate-700/80 text-slate-200 flex items-center gap-1.5 shadow-md">
          <Trophy className="w-3 h-3 text-amber-400" />
          <span>{year}</span>
        </div>

        <div className="absolute bottom-3 left-3 bg-indigo-600 text-[10px] font-extrabold text-white px-3 py-1 rounded-full shadow-lg uppercase tracking-wider">
          {topper.rankText}
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col justify-between gap-5 text-left">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Class 10th Board Achiever
          </span>
          <h4 className="font-bold text-white text-lg group-hover:text-indigo-400 transition-colors">
            {topper.name}
          </h4>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Board Score: <strong className="text-emerald-400 font-extrabold text-sm">{topper.score}</strong>
          </p>
        </div>

        {availableMarks.length > 0 && (
          <div className="border-t border-slate-800/80 pt-3 flex items-center justify-between text-xs">
            {availableMarks.map((m) => (
              <div key={m.label} className="text-center bg-slate-950/60 px-2.5 py-1 rounded-lg border border-slate-850">
                <span className="text-[9px] text-slate-400 block uppercase font-bold">{m.label}</span>
                <span className="text-slate-200 font-bold text-xs">{m.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function MemoryCard({ defaultText, angle, imageSrc }: { defaultText: string; angle: string; imageSrc: string }) {
  const [imgError, setImgError] = useState(false);

  return (
    <motion.div
      whileHover={{ y: -12, scale: 1.05, zIndex: 30, rotate: "0deg" }}
      className="bg-slate-900/90 text-slate-100 p-3 pb-6 rounded-2xl border border-slate-800 shadow-2xl flex flex-col gap-3 w-44 sm:w-52 shrink-0 select-none cursor-pointer transition-transform duration-200"
      style={{ transform: `rotate(${angle})` }}
    >
      <div className="relative aspect-[4/3] w-full bg-slate-950 rounded-xl overflow-hidden border border-slate-800">
        {!imgError ? (
          <Image src={imageSrc} alt={defaultText} fill sizes="200px" style={{ objectFit: 'cover' }} onError={() => setImgError(true)} />
        ) : (
          <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-500 text-xs font-medium">
            Memory Photo
          </div>
        )}
      </div>
      <span className="font-mono text-xs text-center text-slate-400 truncate block">
        {defaultText}
      </span>
    </motion.div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const [selectedBatch, setSelectedBatch] = useState<string>('2025-26');
  const [scrolled, setScrolled] = useState(false);
  const [navHovered, setNavHovered] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const activeBatch = batchResultsData[selectedBatch];
  const showExpandedNav = !scrolled || navHovered;

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 25);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white relative overflow-x-hidden">
      
      {/* Subtle Dark Grid Pattern */}
      <div className="fixed inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none z-0" />

      {/* Ambient Radial Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute top-1/3 right-10 w-[450px] h-[450px] bg-purple-600/10 rounded-full blur-[130px] pointer-events-none z-0" />

      {/* STITCH AI DYNAMIC ISLAND NAVBAR (Academic Lumina + Tactile Depth) */}
      <motion.div 
        layout
        className="fixed left-0 right-0 z-50 flex justify-center px-3 sm:px-4 pointer-events-none"
        animate={{
          top: scrolled ? "12px" : "20px",
        }}
        transition={{ type: "spring", stiffness: 260, damping: 26 }}
      >
        <motion.header 
          layout
          onMouseEnter={() => setNavHovered(true)}
          onMouseLeave={() => setNavHovered(false)}
          transition={{ type: "spring", stiffness: 260, damping: 26, mass: 0.9 }}
          className={`pointer-events-auto rounded-full flex items-center justify-between transition-all duration-500 overflow-hidden ${
            showExpandedNav
              ? 'w-full max-w-5xl h-14 sm:h-[64px] px-5 sm:px-8 bg-[#0F172A]/80 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(37,99,235,0.18)] ring-1 ring-indigo-500/25'
              : 'w-auto max-w-fit h-11 sm:h-[50px] px-4 sm:px-6 bg-[#0F172A]/95 backdrop-blur-2xl border border-indigo-500/50 shadow-[0_10px_35px_rgba(124,58,235,0.25)] ring-2 ring-indigo-500/30 hover:border-indigo-400 cursor-pointer'
          }`}
        >
          {/* Brand Logo & Title (Always visible, morphs smoothly into 'R.K Coaching Classes'!) */}
          <Link href="/" onClick={() => setNavHovered(true)} className="flex items-center gap-2 sm:gap-2.5 group shrink-0 select-none">
            <motion.div 
              layout
              className="relative rounded-full overflow-hidden border border-slate-700/80 shrink-0 group-hover:scale-105 transition-transform shadow-inner"
              animate={{
                width: showExpandedNav ? 34 : 28,
                height: showExpandedNav ? 34 : 28,
              }}
              transition={{ type: "spring", stiffness: 260, damping: 26 }}
            >
              <Image src="/images/logo.png" alt="R.K Coaching Logo" fill sizes="36px" style={{ objectFit: 'cover' }} />
            </motion.div>
            
            <motion.div layout className="flex items-center gap-1.5 text-left">
              <span className={`font-extrabold tracking-tight text-white group-hover:text-indigo-300 transition-colors whitespace-nowrap ${
                showExpandedNav ? 'text-sm sm:text-base leading-tight' : 'text-xs sm:text-sm font-black text-indigo-100'
              }`}>
                {showExpandedNav ? "R.K Coaching" : "R.K Coaching Classes"}
              </span>

              {/* Subtitle when expanded, glowing pulse dot & hint when collapsed! */}
              <AnimatePresence mode="wait">
                {showExpandedNav ? (
                  <motion.span 
                    key="balotra-badge"
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest leading-none hidden sm:inline ml-1 whitespace-nowrap"
                  >
                    Balotra
                  </motion.span>
                ) : (
                  <motion.div
                    key="collapsed-pulse"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    className="flex items-center gap-1.5 ml-1 pl-2 border-l border-indigo-500/30 text-indigo-400 font-bold text-[10px] uppercase tracking-wider select-none"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="hidden sm:inline text-[10px] text-slate-400 font-medium">Hover to menu</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </Link>

          {/* Desktop Stitch Tactile Capsule Navigation (Only visible when Expanded!) */}
          <AnimatePresence>
            {showExpandedNav && (
              <motion.nav 
                initial={{ opacity: 0, width: 0, scale: 0.95, filter: "blur(4px)" }}
                animate={{ opacity: 1, width: "auto", scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, width: 0, scale: 0.95, filter: "blur(4px)" }}
                transition={{ duration: 0.22, ease: "easeInOut" }}
                className="hidden md:flex items-center gap-1 text-xs font-semibold text-slate-300 overflow-hidden shrink-0 ml-4 lg:ml-6"
              >
                {[
                  { label: 'Home', href: '#home' },
                  { label: 'Why RK', href: '#why-choose' },
                  { label: 'Results', href: '#results' },
                  { label: 'Resources', href: '#resources' },
                  { label: 'Mentors', href: '#instructors' },
                  { label: 'Reviews', href: '#reviews' },
                  { label: 'Contact', href: '#contact' },
                ].map((link, idx) => (
                  <a
                    key={idx}
                    href={link.href}
                    className="px-3.5 py-1.5 rounded-full border border-transparent hover:border-indigo-500/40 hover:bg-indigo-500/15 hover:text-white hover:shadow-sm hover:shadow-indigo-500/15 transition-all duration-200 whitespace-nowrap"
                  >
                    {link.label}
                  </a>
                ))}
              </motion.nav>
            )}
          </AnimatePresence>

          {/* Stitch AI Glowing Gradient Action Buttons (Only visible when Expanded!) */}
          <AnimatePresence>
            {showExpandedNav && (
              <motion.div 
                initial={{ opacity: 0, width: 0, scale: 0.9, filter: "blur(4px)" }}
                animate={{ opacity: 1, width: "auto", scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, width: 0, scale: 0.9, filter: "blur(4px)" }}
                transition={{ duration: 0.22, ease: "easeInOut" }}
                className="hidden md:flex items-center gap-2 shrink-0 overflow-hidden ml-2 lg:ml-3"
              >
                {user ? (
                  <Link
                    href="/dashboard"
                    className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_auto] hover:bg-right text-white font-bold rounded-full shadow-lg shadow-indigo-500/30 border border-white/20 transition-all duration-500 text-xs flex items-center gap-1.5 hover:scale-[1.04] active:scale-95 whitespace-nowrap"
                  >
                    <span>Dashboard</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                ) : (
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <Link 
                      href="/login" 
                      className="font-semibold text-slate-300 hover:text-white text-xs px-3 py-1.5 rounded-full hover:bg-white/5 transition-all"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/register"
                      className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 bg-[length:200%_auto] hover:bg-right text-white font-extrabold text-xs rounded-full shadow-lg shadow-purple-500/35 border border-white/20 transition-all duration-500 hover:scale-105 active:scale-95 flex items-center gap-1"
                    >
                      <span>Enroll Now</span>
                      <Sparkles className="w-3.5 h-3.5 fill-white" />
                    </Link>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mobile Hamburger (always accessible) */}
          <button
            onClick={() => {
              if (!showExpandedNav) setNavHovered(true);
              setMobileMenuOpen(!mobileMenuOpen);
            }}
            className="block md:hidden p-2 ml-2 text-slate-300 hover:text-white focus:outline-none rounded-full hover:bg-white/10 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </motion.header>
      </motion.div>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-4 right-4 bg-slate-900/95 backdrop-blur-2xl border border-slate-800 rounded-3xl shadow-2xl p-6 md:hidden z-40 flex flex-col gap-4 text-sm font-semibold"
          >
            <a href="#home" onClick={() => setMobileMenuOpen(false)} className="text-slate-300 hover:text-white py-1">Home</a>
            <a href="#why-choose" onClick={() => setMobileMenuOpen(false)} className="text-slate-300 hover:text-white py-1">Why RK</a>
            <a href="#results" onClick={() => setMobileMenuOpen(false)} className="text-slate-300 hover:text-white py-1">Results</a>
            <a href="#resources" onClick={() => setMobileMenuOpen(false)} className="text-slate-300 hover:text-white py-1">Resources</a>
            <a href="#instructors" onClick={() => setMobileMenuOpen(false)} className="text-slate-300 hover:text-white py-1">Mentors</a>
            <a href="#reviews" onClick={() => setMobileMenuOpen(false)} className="text-slate-300 hover:text-white py-1">Reviews</a>
            <a href="#contact" onClick={() => setMobileMenuOpen(false)} className="text-slate-300 hover:text-white py-1">Contact</a>
            
            <div className="border-t border-slate-800 pt-4 flex flex-col gap-2.5">
              {user ? (
                <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-center rounded-xl font-bold text-xs">
                  Launch Dashboard
                </Link>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="w-full py-2.5 bg-slate-800 text-slate-200 text-center rounded-xl text-xs font-semibold">
                    Sign In
                  </Link>
                  <Link href="/register" onClick={() => setMobileMenuOpen(false)} className="w-full py-2.5 bg-white text-slate-950 text-center rounded-xl text-xs font-bold">
                    Enroll Now
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="relative z-10">
        
        {/* UNIFIED STITCH HERO BANNER (Single Div containing both Content & Mascot without separation) */}
        <section id="home" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 lg:pt-32 pb-12 sm:pb-16">
          
          {/* Single Unified Container Div (No separate left and right outer columns) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full rounded-[28px] sm:rounded-[36px] bg-gradient-to-br from-slate-900/95 via-indigo-950/40 to-slate-900/90 border border-slate-800/80 px-5 py-8 sm:p-10 lg:p-14 shadow-2xl overflow-hidden backdrop-blur-xl group hover:border-slate-700/80 transition-all duration-300"
          >
            {/* Ambient Background Glows inside the unified banner */}
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/15 rounded-full blur-[100px] pointer-events-none overflow-hidden" />
            <div className="absolute bottom-0 right-1/4 w-[350px] h-[350px] bg-purple-500/15 rounded-full blur-[100px] pointer-events-none overflow-hidden" />
            <div className="absolute inset-0 bg-[radial-gradient(#475569_1px,transparent_1px)] [background-size:20px_20px] opacity-15 pointer-events-none rounded-[28px] sm:rounded-[36px] overflow-hidden" />

            {/* Internal Flex/Grid Layout INSIDE the Single Div */}
            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-6">
              
              {/* Left Content Area (inside the same container) */}
              <motion.div 
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="flex-1 w-full space-y-5 text-center lg:text-left max-w-2xl"
              >
                <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 rounded-full text-xs font-bold tracking-wide shadow-inner">
                  <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span>Confused to Confident in CBSE Mastery</span>
                </motion.div>

                <motion.h1 variants={fadeUp} className="text-3xl sm:text-5xl lg:text-5xl xl:text-6xl font-black tracking-tight leading-[1.12] sm:leading-[1.08] text-white">
                  Your child's success <br className="hidden sm:inline" />
                  starts with <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">Expert Guidance.</span>
                </motion.h1>

                <motion.p variants={fadeUp} className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
                  Welcome to <strong className="text-white font-bold">R.K Coaching Classes Balotra</strong>. We empower students to learn, grow, and excel through conceptual teaching, regular evaluations, and personalized attention.
                </motion.p>

                <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-lg mx-auto lg:mx-0 text-left pt-1">
                  {[
                    'Concept-Based Learning from Early Years',
                    'Regular Assessments & Feedback',
                    'Visual learning (videos, flowcharts)',
                    'Curated study materials & notes',
                    '24/7 AI Tutor & Doubt Resolution',
                    'Holistic academic development'
                  ].map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs font-semibold text-slate-300">
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </motion.div>

                <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-4">
                  <Link
                    href={user ? "/dashboard" : "/register"}
                    className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/25 transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:scale-[1.03] active:scale-95"
                  >
                    <span>Enroll Now</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <a
                    href="#resources"
                    className="w-full sm:w-auto px-8 py-3.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 text-slate-200 rounded-xl transition-all text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2"
                  >
                    <Compass className="w-4 h-4 text-slate-400" />
                    <span>Explore Resources</span>
                  </a>
                </motion.div>
              </motion.div>

              {/* Right Visual Area (Hidden on Mobile & Small Screens, visible only on widescreen lg+ desktops!) */}
              <div className="hidden lg:flex relative w-full max-w-[420px] h-[400px] items-end justify-center shrink-0 select-none">
                
                {/* Floating Badge 1: Charlie AI */}
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut" }}
                  className="absolute -left-4 top-4 bg-slate-900/95 backdrop-blur-md border border-indigo-500/40 rounded-2xl p-3 shadow-2xl flex items-center gap-2.5 z-30 pointer-events-auto hover:scale-105 transition-transform"
                >
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shrink-0">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <h4 className="text-xs font-bold text-white">Charlie AI Mentor</h4>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium">Active 24/7 for Doubts</p>
                  </div>
                </motion.div>

                {/* Floating Badge 2: Math Mastery */}
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 5.5, ease: "easeInOut", delay: 0.8 }}
                  className="absolute -right-4 top-[45%] -translate-y-1/2 bg-slate-900/95 backdrop-blur-md border border-purple-500/40 rounded-2xl p-3 shadow-2xl flex items-center gap-2.5 z-30 pointer-events-auto hover:scale-105 transition-transform"
                >
                  <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-md shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-xs font-bold text-white">10th Board Toppers</h4>
                    <p className="text-[10px] text-emerald-400 font-mono">92%+ Highest Score</p>
                  </div>
                </motion.div>

                {/* Charlie Mascot Image */}
                <div className="relative w-full h-full z-20 filter drop-shadow-[0_20px_30px_rgba(0,0,0,0.6)] flex items-end justify-center">
                  <Image
                    src="/images/charlie-ai.png"
                    alt="Charlie AI Study Mentor"
                    fill
                    sizes="380px"
                    style={{ objectFit: 'contain', objectPosition: 'bottom center' }}
                    priority
                  />
                </div>

                {/* Subtle ground pedestal shadow inside the hero container */}
                <div className="absolute bottom-0 w-3/4 h-5 bg-black/60 blur-md rounded-full pointer-events-none z-10" />
              </div>

            </div>

            {/* Bottom accent glow bar of the unified banner */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-60 group-hover:opacity-100 transition-opacity rounded-b-[28px] sm:rounded-b-[36px] overflow-hidden" />
          </motion.div>
        </section>

        {/* TOPPERS SHOWCASE SECTION */}
        <section className="max-w-7xl mx-auto px-6 sm:px-8 py-12 sm:py-16 border-t border-slate-900/80 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={staggerContainer}
            className="lg:col-span-6 space-y-4 text-center lg:text-left"
          >
            <motion.span variants={fadeUp} className="text-[10px] font-extrabold uppercase tracking-widest text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
              Proven Track Record
            </motion.span>
            <motion.h2 variants={fadeUp} className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
              Igniting Minds & <br />
              Building Strong Fundamentals
            </motion.h2>
            <motion.p variants={fadeUp} className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-xl mx-auto lg:mx-0">
              For more than ten years, RK Coaching Classes has stood as a hallmark of student success in Balotra. We nurture mathematical curiosity and analytical skills from playgroup up to Grade X. We teach concepts, not just formulas.
            </motion.p>
            <motion.div variants={fadeUp} className="pt-2 flex flex-wrap justify-center lg:justify-start gap-3">
              <Link href="/register" className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-colors shadow-sm">
                Join Batch Today
              </Link>
              <a href="#instructors" className="px-6 py-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors">
                Meet Mentors
              </a>
            </motion.div>
          </motion.div>

          <div className="lg:col-span-6 flex flex-col sm:flex-row items-center justify-center gap-4 relative">
            <motion.div whileHover={{ y: -6 }} className="w-full max-w-xs sm:max-w-none sm:w-52 bg-slate-900/80 border border-slate-800 rounded-2xl p-3 shadow-xl space-y-2 text-left">
              <div className="relative h-36 w-full rounded-xl overflow-hidden bg-slate-950">
                <Image src="/STUDENT_PNG/GunjanSalecha.jpg" alt="Gunjan Salecha" fill sizes="180px" style={{ objectFit: 'cover' }} />
                <div className="absolute top-2 left-2 bg-amber-500 text-[9px] font-black text-slate-950 px-2 py-0.5 rounded-full uppercase">
                  92.0%
                </div>
              </div>
              <h4 className="text-sm font-bold text-white px-1">Gunjan Salecha</h4>
              <p className="text-[10px] text-indigo-400 font-bold px-1 uppercase">1st Rank • 10th Board</p>
            </motion.div>

            <motion.div whileHover={{ y: -6 }} className="w-full max-w-xs sm:max-w-none sm:w-56 bg-slate-900 border border-indigo-500/40 rounded-2xl p-3.5 shadow-2xl shadow-indigo-500/10 space-y-2 text-left sm:-mt-4">
              <div className="relative h-40 w-full rounded-xl overflow-hidden bg-slate-950">
                <Image src="/STUDENT_PNG/YashviJain.jpg" alt="Yashvi Jain" fill sizes="200px" style={{ objectFit: 'cover' }} />
                <div className="absolute top-2 left-2 bg-indigo-600 text-[9px] font-black text-white px-2 py-0.5 rounded-full uppercase">
                  90.0%
                </div>
              </div>
              <div className="flex items-center justify-between px-1">
                <h4 className="text-sm font-extrabold text-white">Yashvi Jain</h4>
                <Trophy className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <p className="text-[10px] text-emerald-400 font-bold px-1 uppercase">2nd Rank • 10th Board</p>
            </motion.div>
          </div>
        </section>

        {/* WHY CHOOSE SECTION */}
        <section id="why-choose" className="max-w-7xl mx-auto px-6 sm:px-8 py-14 sm:py-16 border-t border-slate-900/80 space-y-10">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Why Choose RK Coaching?</h2>
            <p className="text-slate-400 text-xs sm:text-sm">Discover the structured advantages that give your child a competitive edge in exams and beyond.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { title: 'Experienced Tutors', desc: 'Guidance by educators with 10+ years CBSE board teaching experience.', icon: Users },
              { title: 'Batch Wise Study', desc: 'Structured classes ensuring individualized feedback and optimal pace.', icon: Calendar },
              { title: 'Quality Notes', desc: 'Chapter-wise structured PDF notes summarizing core theories & formulas.', icon: BookOpenCheck },
              { title: 'Special Test Series', desc: 'Regular board-pattern chapter evaluations and full mock examinations.', icon: Award },
              { title: 'Math & Science Focus', desc: 'Specialized deep-dives in problem-solving for Science & Mathematics.', icon: Zap }
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={idx}
                  whileHover={{ y: -5 }}
                  className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700/80 p-5 rounded-2xl flex flex-col justify-between gap-3.5 transition-all shadow-sm"
                >
                  <div className="w-9 h-9 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl flex items-center justify-center shrink-0">
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <div className="space-y-1 text-left">
                    <h4 className="text-sm font-bold text-white">{item.title}</h4>
                    <p className="text-slate-400 text-xs leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* CORE PILLARS SECTION */}
        <section className="max-w-7xl mx-auto px-6 sm:px-8 py-14 sm:py-16 border-t border-slate-900/80 space-y-10">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">Core Methodology</span>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">Pillars of Academic Excellence</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {[
              { title: "Smart Learning", tag: "Interactive", desc: "Digital study tools, interactive visual diagrams, and conceptual mind-maps simplify complex science and math theorems.", color: "text-blue-400 bg-blue-500/10 border-blue-500/20", icon: Sparkles },
              { title: "Personal Attention", tag: "Individualized", desc: "One-on-one doubt resolution sessions ensure that no student falls behind in daily comprehension or practice.", color: "text-purple-400 bg-purple-500/10 border-purple-500/20", icon: Heart },
              { title: "Small Batch Size", tag: "Focused Cohort", desc: "Strictly limited classroom cohorts enable highly interactive lectures, prompt homework grading, and clear discussion.", color: "text-amber-400 bg-amber-500/10 border-amber-500/20", icon: Users },
              { title: "Weekly Tests", tag: "Evaluated", desc: "Weekly board-aligned quizzes build reliable exam temperament, eliminate anxiety, and track progress effectively.", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", icon: BookOpenCheck }
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.div key={idx} whileHover={{ y: -6 }} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between gap-5 hover:border-slate-700 transition-all shadow-sm">
                  <div className="space-y-3.5">
                    <div className={`w-11 h-11 rounded-xl border flex items-center justify-center ${item.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-white">{item.title}</h3>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${item.color}`}>{item.tag}</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* RESULTS TAB SECTION */}
        <section id="results" className="max-w-7xl mx-auto px-6 sm:px-8 py-14 sm:py-16 border-t border-slate-900/80 space-y-10">
          <div className="text-center space-y-2.5 max-w-xl mx-auto">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">Results Showcase</span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">Our Top Achievers</h2>
            <p className="text-slate-400 text-xs sm:text-sm">Meet our board examination performers who excelled through dedicated guidance and practice.</p>
          </div>

          {/* Batch Selector */}
          <div className="flex justify-center gap-2 overflow-x-auto pb-1 px-2">
            {Object.keys(batchResultsData).map((year) => (
              <button
                key={year}
                onClick={() => setSelectedBatch(year)}
                className={`relative px-4.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                  selectedBatch === year ? 'text-white bg-indigo-600 shadow-md shadow-indigo-600/20' : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-850 border border-slate-800'
                }`}
              >
                Batch {year}
              </button>
            ))}
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto text-center">
            <div className="bg-slate-900/60 p-4.5 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Top Students</span>
              <h3 className="text-2xl font-black text-white">{activeBatch.studentCount}</h3>
            </div>
            <div className="bg-slate-900/60 p-4.5 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Batch Average Score</span>
              <h3 className="text-2xl font-black text-indigo-400">{activeBatch.avgScore}</h3>
            </div>
          </div>

          {/* Toppers Grid */}
          <motion.div 
            key={selectedBatch}
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto pt-2"
          >
            {activeBatch.toppers.map((topper) => (
              <TopperCard key={`${selectedBatch}-${topper.name}`} topper={topper} year={selectedBatch} />
            ))}
          </motion.div>
        </section>

        {/* STUDY RESOURCES */}
        <section id="resources" className="max-w-7xl mx-auto px-6 sm:px-8 py-14 sm:py-16 border-t border-slate-900/80 space-y-10">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black text-white">Study Resources</h2>
            <p className="text-slate-400 text-xs sm:text-sm">Access structured notes, NCERT solutions, and reference lists prepared by our teachers.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-slate-900/50 hover:bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between gap-5 transition-all">
              <div className="space-y-2 text-left">
                <h3 className="text-base font-bold text-white">Reference Books</h3>
                <p className="text-slate-400 text-xs leading-relaxed">A carefully curated checklist of essential textbooks matching CBSE syllabi and competitive exams.</p>
              </div>
              <button disabled className="self-start px-4 py-2 bg-slate-800 text-slate-500 rounded-xl text-xs font-semibold cursor-not-allowed">
                Coming Soon
              </button>
            </div>

            <div className="bg-slate-900/50 hover:bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between gap-5 transition-all">
              <div className="space-y-2 text-left">
                <h3 className="text-base font-bold text-white">NCERT Solutions</h3>
                <p className="text-slate-400 text-xs leading-relaxed">Step-by-step solved solutions for all textbook exercises, explained clearly for quick revisions.</p>
              </div>
              <Link href="/login" className="self-start px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-colors">
                Explore Solutions
              </Link>
            </div>

            <div className="bg-slate-900/50 hover:bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between gap-5 transition-all">
              <div className="space-y-2 text-left">
                <h3 className="text-base font-bold text-white">Class PDF Notes</h3>
                <p className="text-slate-400 text-xs leading-relaxed">Highly organized chapter notes and formula sheets authored directly by R.K coaching faculty.</p>
              </div>
              <Link href="/login" className="self-start px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-colors">
                Download Notes
              </Link>
            </div>
          </div>
        </section>

        {/* INSTRUCTORS SECTION */}
        <section id="instructors" className="max-w-7xl mx-auto px-6 sm:px-8 py-14 sm:py-16 border-t border-slate-900/80 space-y-10">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">Mentorship</span>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">Our Core Faculty</h2>
            <p className="text-slate-400 text-xs sm:text-sm">Learn from dedicated pedagogical experts who build fundamental mastery with patience and care.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              {
                name: 'Rakesh Agarwal',
                role: 'Foundation Mathematics Expert',
                cohort: 'Playgroup – Class V',
                experience: '17+ Years Exp.',
                qualifications: ['Foundational Math Expert', 'Pedagogy Lead'],
                bio: 'With over 17 years of teaching experience, he specializes in building solid mathematical foundations for young learners through concept-focused guidance.'
              },
              {
                name: 'Rekha Agarwal',
                role: 'Early Childhood & Primary Specialist',
                cohort: 'Playgroup – Class V',
                experience: '25+ Years Exp.',
                qualifications: ['M.Com', 'B.Ed'],
                bio: 'With more than 25 years of educational experience, she nurtures students with patience and structured guidance while instilling lifelong discipline.'
              },
              {
                name: 'Harsh Agarwal',
                role: 'Mathematics & Science Specialist',
                cohort: 'Classes VI – X',
                experience: '6+ Years Exp.',
                qualifications: ['B.Sc', 'B.Ed', 'CTET & REET Qualified'],
                bio: 'A passionate educator specializing in middle and secondary classes. His conceptual approach, structured notes, and exam tactics drive top board results.'
              }
            ].map((inst, idx) => (
              <motion.div key={idx} whileHover={{ y: -5 }} className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 flex flex-col justify-between gap-5 transition-all shadow-sm">
                <div className="space-y-4 text-left">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0">
                      <GraduationCap className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-base">{inst.name}</h4>
                      <p className="text-[11px] text-slate-400 font-medium mt-0.5">{inst.role}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-[9px] font-bold text-indigo-300 bg-indigo-950/60 px-2.5 py-0.5 rounded-md border border-indigo-800/60">{inst.experience}</span>
                    <span className="text-[9px] font-bold text-purple-300 bg-purple-950/60 px-2.5 py-0.5 rounded-md border border-purple-800/60">{inst.cohort}</span>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {inst.qualifications.map((q, qidx) => (
                      <span key={qidx} className="text-[9px] font-semibold text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">{q}</span>
                    ))}
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed pt-1">{inst.bio}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* MEMORIES CAROUSEL SECTION */}
        <section className="max-w-7xl mx-auto px-6 sm:px-8 py-14 sm:py-16 border-t border-slate-900/80 space-y-10 overflow-hidden">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">Life at RK</span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">Classroom Memories & Smiles</h2>
          </div>

          <div className="w-full overflow-x-auto py-4 px-2 flex justify-start lg:justify-center items-center gap-5 no-scrollbar">
            <MemoryCard defaultText="Creative Play & Learning" angle="-5deg" imageSrc="/images/memory1.jpg" />
            <MemoryCard defaultText="Hands-On Mathematics" angle="3deg" imageSrc="/images/memory2.jpg" />
            <MemoryCard defaultText="RK Classroom Smiles" angle="-2deg" imageSrc="/images/memory3.jpg" />
            <MemoryCard defaultText="Science Experiments" angle="4deg" imageSrc="/images/memory4.jpg" />
            <MemoryCard defaultText="Creative Expression" angle="-3deg" imageSrc="/images/memory5.jpg" />
          </div>
        </section>

        {/* TRUST & REVIEWS WITH GOOGLE OPTION RESTORED */}
        <section id="reviews" className="max-w-7xl mx-auto px-6 sm:px-8 py-14 sm:py-16 border-t border-slate-900/80 space-y-10">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">Testimonials</span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">Trusted by Parents & Students</h2>
            <p className="text-slate-400 text-xs sm:text-sm">Hear firsthand testimonials from families who experienced conceptual teaching and consistent score improvements.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
            {[
              { stars: 5, text: "Concept clarity is amazing here. The way Rakesh Sir explains complex mathematics from playgroup to Class V is wonderful. My child cleared all core basics easily!", role: "Parent of Class X Student" },
              { stars: 5, text: "The small batch size and personal attention from Rekha Ma'am helped my daughter secure 87.33% in Class 10th. Highly structured weekly tests and feedback build real exam temperament.", role: "Parent" },
              { stars: 5, text: "Friendly teachers who explain each scientific concept with diagrams and real-life examples. I never felt hesitant to ask doubts here. My board exam fear was completely removed.", role: "Class IX Student" },
              { stars: 5, text: "Excellent parent communication. We receive attendance logs and weekly test reports regularly. The tutors are highly supportive, and their concept-driven approach is outstanding.", role: "Guardian" }
            ].map((rev, idx) => (
              <motion.div key={idx} whileHover={{ y: -5 }} className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between gap-4 text-left transition-colors shadow-sm">
                <div className="space-y-2.5">
                  <div className="flex items-center gap-0.5 text-amber-400">
                    {Array.from({ length: rev.stars }).map((_, sidx) => (
                      <Star key={sidx} className="w-3.5 h-3.5 fill-amber-400 shrink-0" />
                    ))}
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed font-medium">"{rev.text}"</p>
                </div>
                <div className="border-t border-slate-800 pt-2.5">
                  <span className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-wider">{rev.role}</span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* RESTORED GOOGLE REVIEWS BUTTON */}
          <div className="flex justify-center pt-2">
            <a
              href="https://share.google/5jqTmP4v5U1thBhQT"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2.5 px-7 py-3.5 bg-slate-900 hover:bg-slate-850 border border-slate-700/80 hover:border-indigo-500/40 text-slate-100 hover:text-white rounded-2xl text-xs font-extrabold uppercase tracking-wider shadow-lg shadow-indigo-500/5 transition-all duration-200 hover:scale-[1.02] active:scale-98 cursor-pointer"
            >
              <Star className="w-4 h-4 text-amber-400 fill-amber-400 group-hover:rotate-12 transition-transform" />
              <span>View Verified Google Reviews</span>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 group-hover:text-indigo-400 transition-all" />
            </a>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer id="contact" className="border-t border-slate-900 bg-slate-950 pt-16 pb-12 relative z-10">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 grid grid-cols-1 md:grid-cols-12 gap-12 border-b border-slate-900 pb-12">
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-slate-800">
                <Image src="/images/logo.png" alt="R.K Coaching" fill sizes="32px" style={{ objectFit: 'cover' }} />
              </div>
              <span className="font-bold text-base text-white tracking-tight">R.K Coaching Classes</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-sm font-medium">
              Providing Balotra's students with premium, CBSE-focused conceptual tutoring in Mathematics and Science for more than ten years.
            </p>
          </div>

          <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs text-slate-400">
            <div className="space-y-3">
              <h4 className="font-bold text-white uppercase tracking-wider text-xs">Contact Information</h4>
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

            <div className="space-y-3">
              <h4 className="font-bold text-white uppercase tracking-wider text-xs">Social Channels</h4>
              <div className="flex gap-3">
                <a href="https://www.instagram.com/rk.coachings20?igsh=ajl5am10cTlyaGw5" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-xl flex items-center justify-center transition-colors">
                  <Instagram className="w-4.5 h-4.5" />
                </a>
                <a href="https://youtube.com/@rkcoachingclasses?si=KfYdwL2LGWjAbTTm" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-xl flex items-center justify-center transition-colors">
                  <Youtube className="w-4.5 h-4.5" />
                </a>
                <a href="#" className="w-10 h-10 bg-slate-900 border border-slate-800 text-slate-600 rounded-xl flex items-center justify-center cursor-not-allowed">
                  <Facebook className="w-4.5 h-4.5" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 sm:px-8 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] text-slate-500 font-medium uppercase tracking-wider">
          <p>© 2026 R.K Coaching Classes. All rights reserved.</p>
          <div className="flex items-center gap-1">
            <span>Powered by</span>
            <strong className="text-slate-400 font-bold">LearnStudio 2.0</strong>
          </div>
        </div>
      </footer>

    </div>
  );
}
