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
  Smile,
  ShieldCheck,
  Star,
  Bot,
  HelpCircle,
  CheckSquare,
  PenTool,
  MessageSquare
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
        colorClass: 'border-slate-350/30 text-slate-350 bg-slate-350/10'
      },
      {
        name: 'Rinkesh Gehlot',
        score: '84.17%',
        rankText: '3rd Rank',
        image: '/STUDENT_PNG/Rinkesh.jpeg',
        englishMarks: '95/100',
        colorClass: 'border-amber-700/30 text-amber-600 bg-amber-600/10'
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
        colorClass: 'border-slate-350/30 text-slate-350 bg-slate-350/10'
      },
      {
        name: 'Varsha',
        score: '87.83%',
        rankText: '3rd Rank',
        image: '/STUDENT_PNG/Varsha.png',
        scienceMarks: '87/100',
        mathMarks: '93/100',
        colorClass: 'border-amber-700/30 text-amber-600 bg-amber-600/10'
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
        colorClass: 'border-slate-350/30 text-slate-350 bg-slate-350/10'
      },
      {
        name: 'Kusum Panwar',
        score: '91.67%',
        rankText: '3rd Rank',
        image: '/STUDENT_PNG/Kusum.png',
        scienceMarks: '90/100',
        mathMarks: '98/100',
        colorClass: 'border-amber-700/30 text-amber-600 bg-amber-600/10'
      },
    ]
  }
};

// ────────────────────────────────────────────────────────────────────────
// modular TopperCard helper component with error fallback (Zero transition clashes)
// ────────────────────────────────────────────────────────────────────────
function TopperCard({ topper, year }: { topper: Topper; year: string }) {
  const [imgError, setImgError] = useState(false);

  const gradientClass = useMemo(() => {
    const gradients = [
      'from-indigo-650 to-purple-650',
      'from-purple-650 to-pink-650',
      'from-blue-650 to-cyan-650',
      'from-emerald-650 to-teal-650',
      'from-amber-650 to-orange-650'
    ];
    const idx = topper.name.charCodeAt(0) % gradients.length;
    return gradients[idx];
  }, [topper.name]);

  const availableMarks: { label: string; value: string }[] = [];
  if (topper.englishMarks && topper.englishMarks !== 'N/A') {
    availableMarks.push({ label: 'English', value: topper.englishMarks });
  }
  if (topper.scienceMarks && topper.scienceMarks !== 'N/A') {
    availableMarks.push({ label: 'Science', value: topper.scienceMarks });
  }
  if (topper.mathMarks && topper.mathMarks !== 'N/A') {
    availableMarks.push({ label: 'Mathematics', value: topper.mathMarks });
  }

  return (
    <motion.div
      initial={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6, scale: 1.01 }}
      className="group flex flex-col bg-slate-900 text-white rounded-3xl overflow-hidden shadow-xl border border-slate-800 w-full max-w-[340px] sm:max-w-none mx-auto relative cursor-pointer h-auto"
    >
      {/* Top Image Part with Responsive fixed heights */}
      <div className="relative w-full h-[260px] sm:h-[300px] lg:h-[340px] overflow-hidden bg-slate-100 shrink-0">
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
          <div className={`w-full h-full bg-gradient-to-br ${gradientClass} flex flex-col items-center justify-center text-white relative p-4 overflow-hidden`}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.15)_0%,transparent_60%)]" />
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-white/10 rounded-full blur-lg" />

            <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-2xl font-black shadow-inner z-10">
              {topper.name.split(' ').map(n => n[0]).join('')}
            </div>

            {topper.englishMarks && (
              <span className="mt-2 text-[9px] font-black uppercase tracking-wider bg-white/20 border border-white/30 px-2 py-0.5 rounded-full backdrop-blur-sm z-10">
                English Achiever
              </span>
            )}
          </div>
        )}

        {/* Floating Duration-style Year Badge */}
        <div className="absolute top-4 right-4 bg-black/75 backdrop-blur-sm text-[9px] text-white font-black px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md border border-white/10 z-20">
          <Trophy className="w-3 h-3 text-amber-400" />
          <span>{year}</span>
        </div>

        {/* Board achiever rank badge */}
        <div className="absolute bottom-3 left-3 bg-gradient-to-r from-indigo-650 to-purple-650 text-[9px] font-black text-white px-2.5 py-1 rounded-full shadow-md z-20 uppercase tracking-widest border border-white/10">
          {topper.rankText}
        </div>
      </div>

      {/* Bottom Text Part */}
      <div className="p-5 flex-1 flex flex-col justify-between bg-slate-900 relative gap-4">
        <div className="space-y-1 text-left">
          <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">
            Class 10th Board
          </span>
          <h4 className="font-black text-white text-lg leading-tight transition-colors duration-300 group-hover:text-indigo-400 truncate">
            {topper.name}
          </h4>
          <p className="text-xs text-slate-500 font-medium">
            Board Score: <strong className="text-indigo-650 font-black text-sm">{topper.score}</strong>
          </p>
        </div>

        {/* Marks Footer */}
        {availableMarks.length > 0 && (
          <div className="border-t border-slate-100 pt-3 mt-1 flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            {availableMarks.map((m, idx) => (
              <div
                key={m.label}
                className={
                  availableMarks.length === 1
                    ? "text-left"
                    : idx === 0
                      ? "text-left"
                      : idx === availableMarks.length - 1
                        ? "text-right"
                        : "text-center"
                }
              >
                <span className="block text-[8px] text-slate-400 font-bold">{m.label}</span>
                <span className="text-white font-black">{m.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// MemoryCard polaroid style component
// ────────────────────────────────────────────────────────────────────────
function MemoryCard({ index, defaultText, angle, imageSrc }: { index: number; defaultText: string; angle: string; imageSrc: string }) {
  const [imgError, setImgError] = useState(false);

  const gradients = [
    'from-pink-400 to-indigo-400',
    'from-indigo-400 to-cyan-400',
    'from-emerald-400 to-teal-400',
    'from-purple-400 to-pink-400',
    'from-amber-400 to-orange-400'
  ];

  return (
    <motion.div
      whileHover={{ y: -15, scale: 1.08, zIndex: 40 }}
      className="bg-white text-slate-800 p-3.5 pb-6 sm:p-4 sm:pb-8 rounded-2xl shadow-2xl border border-slate-200 flex flex-col gap-3.5 w-44 sm:w-52 md:w-56 shrink-0 transition-shadow duration-300 relative select-none cursor-pointer"
      style={{
        transform: `rotate(${angle})`,
        boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.4)'
      }}
    >
      {/* Polaroid Image Box */}
      <div className="relative aspect-[4/3] w-full bg-slate-100 rounded-xl overflow-hidden shadow-inner border border-slate-100">
        {!imgError ? (
          <Image
            src={imageSrc}
            alt={defaultText}
            fill
            sizes="220px"
            style={{ objectFit: 'cover' }}
            onError={() => setImgError(true)}
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${gradients[index % gradients.length]} flex flex-col items-center justify-center text-white/95 p-4`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 opacity-80 animate-pulse">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
            </svg>
            <span className="text-[10px] font-black tracking-widest uppercase mt-2 opacity-90 text-center">Classroom Memory</span>
          </div>
        )}
      </div>

      {/* Polaroid Title Footer */}
      <div className="text-center">
        <span className="font-serif italic text-slate-500 text-xs sm:text-sm tracking-wide block">
          {defaultText}
        </span>
      </div>
    </motion.div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const [selectedBatch, setSelectedBatch] = useState<string>('2025-26');
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Compute active batch toppers
  const activeBatch = batchResultsData[selectedBatch];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between font-sans selection:bg-indigo-500 selection:text-white relative overflow-x-hidden">

      {/* Custom Styles for Floating Fluid Glows, Morphs & Scrollbar */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes morph-blob-1 {
          0%, 100% {
            border-radius: 42% 58% 70% 30% / 45% 45% 55% 55%;
            transform: translate(0px, 0px) rotate(0deg);
          }
          33% {
            border-radius: 70% 30% 52% 48% / 60% 40% 60% 40%;
            transform: translate(60px, 50px) rotate(120deg) scale(1.1);
          }
          66% {
            border-radius: 28% 72% 35% 65% / 40% 60% 35% 65%;
            transform: translate(-50px, -30px) rotate(240deg) scale(0.9);
          }
        }
        @keyframes morph-blob-2 {
          0%, 100% {
            border-radius: 70% 30% 52% 48% / 60% 40% 60% 40%;
            transform: translate(0px, 0px) rotate(360deg);
          }
          50% {
            border-radius: 42% 58% 70% 30% / 45% 45% 55% 55%;
            transform: translate(-80px, -60px) rotate(180deg) scale(0.92);
          }
        }
        @keyframes wave-flow-1 {
          0% {
            stroke-dasharray: 1000;
            stroke-dashoffset: 2000;
            transform: translate(0px, -20px) scaleY(1);
          }
          50% {
            transform: translate(30px, 20px) scaleY(1.04);
          }
          100% {
            stroke-dasharray: 1000;
            stroke-dashoffset: 0;
            transform: translate(0px, -20px) scaleY(1);
          }
        }
        @keyframes wave-flow-2 {
          0% {
            stroke-dasharray: 1200;
            stroke-dashoffset: 2400;
            transform: translate(0px, 20px) scaleY(1.04);
          }
          50% {
            transform: translate(-30px, -20px) scaleY(0.96);
          }
          100% {
            stroke-dasharray: 1200;
            stroke-dashoffset: 0;
            transform: translate(0px, 20px) scaleY(1.04);
          }
        }
        .animate-morph-1 {
          animation: morph-blob-1 20s infinite ease-in-out;
        }
        .animate-morph-2 {
          animation: morph-blob-2 25s infinite ease-in-out;
        }
        .animate-wave-flow-1 {
          animation: wave-flow-1 25s infinite linear;
        }
        .animate-wave-flow-2 {
          animation: wave-flow-2 30s infinite linear;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />

      {/* Global Dotted Grid Background Layer */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none z-0" />

      {/* Premium Fluid Mesh Gradient & Glowing Wavy Cyber Ribbons (Verizon Dribbble Reference) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">

        {/* SVG Curved Cyber Waves with dasharray animations */}
        <svg className="absolute w-full h-[200%] opacity-[0.35]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="gradient-wave-1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.45" />
              <stop offset="50%" stopColor="#a855f7" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.35" />
            </linearGradient>
            <linearGradient id="gradient-wave-2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ec4899" stopOpacity="0.35" />
              <stop offset="50%" stopColor="#6366f1" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.45" />
            </linearGradient>
          </defs>

          <path
            d="M-200,300 C300,100 400,600 900,200 C1300,-100 1200,800 1800,500"
            fill="none"
            stroke="url(#gradient-wave-1)"
            strokeWidth="3.5"
            className="animate-wave-flow-1"
          />
          <path
            d="M-100,500 C400,800 600,200 1100,600 C1500,900 1400,100 1900,400"
            fill="none"
            stroke="url(#gradient-wave-2)"
            strokeWidth="2"
            className="animate-wave-flow-2"
          />
        </svg>

        {/* Morphing Gooey Fluid Blobs */}
        {/* Stream 1 - Glowing Indigo Ribbon */}
        <div className="absolute top-[2%] left-[-15%] w-[350px] sm:w-[600px] h-[350px] sm:h-[500px] bg-gradient-to-tr from-indigo-500/15 via-purple-500/10 to-transparent filter blur-[80px] sm:blur-[120px] animate-morph-1" />
        {/* Stream 2 - Liquid Magenta Blob */}
        <div className="absolute top-[20%] right-[-10%] w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-gradient-to-bl from-pink-500/10 via-purple-600/12 to-transparent filter blur-[70px] sm:blur-[110px] animate-morph-2" />
        {/* Stream 3 - Wavy Cyan Flow */}
        <div className="absolute top-[42%] left-[-15%] w-[400px] sm:w-[700px] h-[300px] sm:h-[450px] bg-gradient-to-br from-cyan-500/12 via-indigo-650/10 to-transparent filter blur-[90px] sm:blur-[130px] animate-morph-1" />
        {/* Stream 4 - Soft Rose Stream */}
        <div className="absolute bottom-[22%] right-[-5%] w-[350px] sm:w-[550px] h-[350px] sm:h-[550px] bg-gradient-to-tr from-rose-500/8 via-purple-500/12 to-transparent filter blur-[80px] sm:blur-[115px] animate-morph-2" />
        {/* Stream 5 - Deep Blue/Indigo Wave */}
        <div className="absolute bottom-[-10%] left-[5%] w-[450px] sm:w-[800px] h-[350px] sm:h-[500px] bg-gradient-to-r from-blue-600/10 via-indigo-500/15 to-transparent filter blur-[90px] sm:blur-[140px] animate-morph-1" />
      </div>

      {/* Header/Navbar */}
      <header className={`fixed top-0 left-0 right-0 h-20 transition-all duration-300 z-50 ${scrolled ? 'bg-slate-950/90 backdrop-blur-md border-b border-slate-900/80 shadow-lg shadow-black/20' : 'bg-transparent'
        }`}>
        <div className="max-w-7xl h-full mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group relative z-50">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-indigo-500/15 group-hover:scale-105 transition-transform border border-slate-800">
              <Image
                src="/images/logo.png"
                alt="R.K Coaching Classes Logo"
                fill
                sizes="40px"
                style={{ objectFit: 'cover' }}
              />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-black text-sm sm:text-base lg:text-lg tracking-tight leading-tight">R.K Coaching Classes</span>
              <span className="text-[9px] text-indigo-400 font-extrabold uppercase tracking-widest leading-none">Balotra</span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-xs lg:text-sm font-semibold text-slate-350">
            <a href="#home" className="hover:text-white transition-colors py-2 relative after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 hover:after:w-full after:bg-indigo-500 after:transition-all">Home</a>
            <a href="#why-choose" className="hover:text-white transition-colors py-2 relative after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 hover:after:w-full after:bg-indigo-500 after:transition-all">Why RK</a>
            <a href="#results" className="hover:text-white transition-colors py-2 relative after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 hover:after:w-full after:bg-indigo-500 after:transition-all">Results</a>
            <a href="#resources" className="hover:text-white transition-colors py-2 relative after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 hover:after:w-full after:bg-indigo-500 after:transition-all">Resources</a>
            <a href="#instructors" className="hover:text-white transition-colors py-2 relative after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 hover:after:w-full after:bg-indigo-500 after:transition-all">Instructors</a>
            <a href="#reviews" className="hover:text-white transition-colors py-2 relative after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 hover:after:w-full after:bg-indigo-500 after:transition-all">Reviews</a>
            <a href="#contact" className="hover:text-white transition-colors py-2 relative after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 hover:after:w-full after:bg-indigo-500 after:transition-all">Contact</a>
          </nav>

          {/* Desktop Auth Section */}
          <div className="hidden md:flex items-center gap-3 lg:gap-4 relative z-50">
            {user ? (
              <Link
                href="/dashboard"
                className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-extrabold rounded-xl shadow-md shadow-indigo-500/20 transition-all text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                Go to Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <div className="flex items-center gap-2 lg:gap-3">
                <Link href="/login" className="text-xs font-bold uppercase tracking-wider text-slate-350 hover:text-white transition-colors px-3 py-2">
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-4 lg:px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-950 font-bold rounded-xl transition-all text-xs uppercase tracking-wider cursor-pointer hover:scale-[1.02] active:scale-[0.98] shadow-sm shadow-white/10"
                >
                  Join Now
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="block md:hidden p-2 text-slate-400 hover:text-white focus:outline-none relative z-50 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-6 h-6 animate-in spin-in-90 duration-200" /> : <Menu className="w-6 h-6 animate-in fade-in" />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25 }}
              className="absolute top-20 left-0 right-0 bg-slate-950 border-b border-slate-900 shadow-2xl p-6 flex flex-col gap-6 md:hidden z-45"
            >
              <div className="flex flex-col gap-4 text-sm font-semibold text-slate-300">
                <a href="#home" onClick={() => setMobileMenuOpen(false)} className="hover:text-white transition-colors py-1.5 border-b border-slate-900/60 text-left">Home</a>
                <a href="#why-choose" onClick={() => setMobileMenuOpen(false)} className="hover:text-white transition-colors py-1.5 border-b border-slate-900/60 text-left">Why RK</a>
                <a href="#results" onClick={() => setMobileMenuOpen(false)} className="hover:text-white transition-colors py-1.5 border-b border-slate-900/60 text-left">Results</a>
                <a href="#resources" onClick={() => setMobileMenuOpen(false)} className="hover:text-white transition-colors py-1.5 border-b border-slate-900/60 text-left">Resources</a>
                <a href="#instructors" onClick={() => setMobileMenuOpen(false)} className="hover:text-white transition-colors py-1.5 border-b border-slate-900/60 text-left">Instructors</a>
                <a href="#reviews" onClick={() => setMobileMenuOpen(false)} className="hover:text-white transition-colors py-1.5 border-b border-slate-900/60 text-left">Reviews</a>
                <a href="#contact" onClick={() => setMobileMenuOpen(false)} className="hover:text-white transition-colors py-1.5 text-left">Contact</a>
              </div>

              <div className="border-t border-slate-900 pt-4 flex flex-col gap-3">
                {user ? (
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-extrabold rounded-xl shadow-md text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    Go to Dashboard <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Link
                      href="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full py-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 font-bold rounded-xl text-xs uppercase tracking-wider text-center transition-all"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full py-3 bg-white hover:bg-slate-100 text-slate-955 font-bold rounded-xl text-xs uppercase tracking-wider text-center transition-all shadow-sm"
                    >
                      Join Now
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Container */}
      <main className="w-full relative z-10 flex-1">

        {/* HERO SECTION */}
        <section id="home" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-4 lg:pt-24 lg:pb-8 grid grid-cols-1 lg:grid-cols-[54%_46%] gap-8 lg:gap-12 items-center relative z-10">
          {/* Left Hero Content */}
          <div className="w-full space-y-6 text-center lg:text-left flex flex-col justify-center order-1">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
                <Flame className="w-3.5 h-3.5 text-amber-500 animate-pulse" /> Confused to Confident!
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-white">
                Your child's success <br className="hidden sm:inline" />
                starts with <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">Expert Guidance.</span>
              </h1>
            </div>

            <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
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
                <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-350 font-medium">
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

          {/* Right Hero / Charlie Mascot Image */}
          <div className="relative w-full h-[260px] sm:h-[320px] md:h-[400px] lg:h-[550px] xl:h-[620px] flex items-end justify-center pointer-events-none select-none z-10 mt-6 lg:mt-0 order-2">
            {/* Soft purple/blue radial glow behind Charlie (less intense/opacity on mobile) */}
            <div className="absolute w-[280px] sm:w-[450px] lg:w-[600px] h-[280px] sm:h-[450px] lg:h-[600px] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.22)_0%,rgba(168,85,247,0.12)_50%,transparent_70%)] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-50 sm:opacity-90 blur-2xl pointer-events-none z-0" />

            {/* Realistic Floor Shadow Beneath Charlie */}
            <div className="absolute w-[100px] sm:w-[160px] h-[5px] sm:h-[8px] bg-black/90 rounded-full blur-[2px] bottom-[10%] left-1/2 -translate-x-1/2 z-0" />
            <div className="absolute w-[160px] sm:w-[260px] h-[10px] sm:h-[14px] bg-black/55 rounded-full blur-[6px] bottom-[9.5%] left-1/2 -translate-x-1/2 z-0 animate-pulse duration-[5000ms]" />

            {/* Floating Bubble 1: Charlie (Only visible on desktop) */}
            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 0.5 }}
              className="hidden lg:flex absolute left-[2%] xl:left-[4%] top-[22%] xl:top-[26%] bg-slate-900/85 backdrop-blur-md border border-indigo-500/20 rounded-2xl p-2.5 shadow-2xl items-center gap-3 z-20 pointer-events-auto cursor-pointer hover:scale-105 hover:border-indigo-400/40 transition-all"
            >
              <div className="w-8.5 h-8.5 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shrink-0">
                <Bot className="w-4.5 h-4.5 text-white" />
              </div>
              <div className="text-left">
                <h4 className="text-[11px] font-black text-white leading-tight">Charlie</h4>
                <p className="text-[9px] text-slate-400 font-semibold leading-none mt-0.5">AI Study Mentor</p>
              </div>
            </motion.div>

            {/* Floating Bubble 2: AI Guru Ji (Only visible on desktop) */}
            <motion.div
              animate={{ y: [0, -15, 0] }}
              transition={{ repeat: Infinity, duration: 5.5, ease: "easeInOut", delay: 1.2 }}
              className="hidden lg:flex absolute right-[2%] xl:right-[4%] bottom-[28%] xl:bottom-[32%] bg-slate-900/85 backdrop-blur-md border border-purple-500/20 rounded-2xl p-2.5 shadow-2xl items-center gap-3 z-20 pointer-events-auto cursor-pointer hover:scale-105 hover:border-purple-400/40 transition-all"
            >
              <div className="w-8.5 h-8.5 rounded-xl bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-md shrink-0">
                <Sparkles className="w-4.5 h-4.5 text-white" />
              </div>
              <div className="text-left">
                <h4 className="text-[11px] font-black text-white leading-tight">AI Guru Ji</h4>
                <p className="text-[9px] text-slate-400 font-semibold leading-none mt-0.5">24/7 Doubt Assistant</p>
              </div>
            </motion.div>

            {/* Gentle floating mascot container (raised off absolute bottom to align with shadows) */}
            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
              className="relative h-[80%] aspect-[3/4] flex items-end justify-center z-10 bottom-[10%] filter drop-shadow-[0_15px_30px_rgba(0,0,0,0.5)] drop-shadow-[0_30px_60px_rgba(99,102,241,0.22)]"
            >
              <Image
                src="/images/charlie-ai.png"
                alt="Charlie AI Study Mentor"
                fill
                sizes="(max-width: 640px) 280px, (max-width: 1024px) 500px, 700px"
                style={{ objectFit: 'contain', objectPosition: 'bottom center' }}
                priority
              />
            </motion.div>
          </div>
        </section>

        {/* INTRO SHOWCASE SECTION (NEW SECTION AFTER HERO) */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12 border-t border-slate-900 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center relative overflow-hidden">
          {/* Background visuals */}
          <div className="absolute top-1/4 left-1/3 w-72 h-72 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 right-0 w-64 h-64 bg-purple-600/5 rounded-full blur-3xl pointer-events-none" />

          {/* Left Text & CTA Content */}
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left relative z-10">
            <div className="inline-flex items-center gap-1 px-3 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-300 rounded-full text-[10px] font-bold uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Shaping Academic Journeys
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight text-white uppercase">
              Igniting Minds, <br className="hidden sm:inline" />
              Building Strong Fundamentals
            </h2>

            <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-xl mx-auto lg:mx-0 font-medium">
              For more than ten years, RK Coaching Classes has stood as a hallmark of student success in Balotra. We nurture mathematical curiosity and analytical skills from playgroup up to Grade X. We teach concepts, not just formulas, to ensure your child builds lifelong academic competence.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <Link
                href={user ? "/dashboard" : "/login"}
                className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] shadow-md shadow-indigo-600/10"
              >
                Get Started Today <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#instructors"
                className="w-full sm:w-auto px-6 py-3 bg-white/5 hover:bg-white/10 border border-slate-800 text-slate-350 rounded-xl text-xs font-bold uppercase tracking-wider text-center transition-colors"
              >
                Meet Tutors
              </a>
            </div>
          </div>

          {/* Right Overlapping Rounded Student Image Cards Deck (Showing 3 Cards like the original screenshot) */}
          <div className="lg:col-span-6 flex items-center justify-center relative min-h-[380px] sm:min-h-[420px] z-10">
            {/* Main Decorative Grid Background */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.06)_0%,transparent_70%)] pointer-events-none" />

            {/* Right Student Image Cards Deck - Responsive Stack on Mobile, Overlap on Desktop */}
            <div className="relative w-full max-w-sm sm:max-w-[420px] h-auto sm:h-[380px] mx-auto flex flex-col sm:block gap-4 sm:gap-0 mt-8 sm:mt-0">

              {/* Card 1: Gunjan Salecha */}
              <motion.div
                whileHover={{ y: -6, scale: 1.02 }}
                className="relative sm:absolute sm:left-4 sm:bottom-4 w-full sm:w-[190px] bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl p-3 flex flex-row sm:flex-col items-center sm:items-stretch gap-4 sm:gap-3 z-10"
              >
                <div className="relative h-20 w-20 sm:h-36 sm:w-full bg-slate-950 rounded-xl overflow-hidden shrink-0">
                  <Image
                    src="/STUDENT_PNG/GunjanSalecha.jpg"
                    alt="Gunjan Salecha"
                    fill
                    sizes="(max-width: 640px) 80px, 190px"
                    style={{ objectFit: 'cover' }}
                  />
                  <div className="absolute top-1 sm:top-2 left-1 sm:left-2 bg-amber-500 text-[8px] font-black text-slate-950 px-1.5 py-0.5 rounded uppercase tracking-wider">
                    92.0%
                  </div>
                </div>
                <div className="text-left space-y-0.5 flex-1">
                  <h4 className="text-sm sm:text-[11px] font-black text-white truncate">Gunjan Salecha</h4>
                  <p className="text-[10px] sm:text-[9px] text-indigo-400 font-bold uppercase tracking-widest">1st Rank 10th</p>
                </div>
              </motion.div>

              {/* Card 2: Yashvi Jain (Featured) */}
              <motion.div
                whileHover={{ y: -6, scale: 1.02 }}
                className="relative sm:absolute sm:right-4 sm:top-4 w-full sm:w-[210px] bg-slate-900 border border-indigo-500/30 rounded-3xl overflow-hidden shadow-2xl p-4 flex flex-row-reverse sm:flex-col items-center sm:items-stretch gap-4 sm:gap-3 z-25"
                style={{ boxShadow: '0 20px 40px -15px rgba(99, 102, 241, 0.25)' }}
              >
                <div className="relative h-24 w-24 sm:h-40 sm:w-full bg-slate-950 rounded-2xl overflow-hidden shrink-0">
                  <Image
                    src="/STUDENT_PNG/YashviJain.jpg"
                    alt="Yashvi Jain"
                    fill
                    sizes="(max-width: 640px) 96px, 210px"
                    style={{ objectFit: 'cover' }}
                  />
                  <div className="absolute top-1.5 sm:top-2.5 left-1.5 sm:left-2.5 bg-indigo-500 text-[9px] font-black text-white px-2 py-0.5 rounded-full uppercase tracking-wider shadow-md">
                    90.0%
                  </div>
                </div>
                <div className="text-left sm:text-left space-y-0.5 flex-1">
                  <div className="flex items-center justify-between sm:justify-between gap-2">
                    <h4 className="text-[15px] sm:text-xs font-black text-white truncate">Yashvi Jain</h4>
                    <Trophy className="hidden sm:block w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  </div>
                  <p className="text-[11px] sm:text-[10px] text-indigo-400 font-extrabold uppercase tracking-wider">2nd Rank 10th</p>
                </div>
              </motion.div>

              {/* Card 3: Vanshika Choudhary */}
              <motion.div
                whileHover={{ y: -6, scale: 1.02 }}
                className="hidden sm:flex absolute left-[38%] top-12 w-[170px] bg-slate-900/60 backdrop-blur-sm border border-slate-850/60 rounded-2xl overflow-hidden shadow-xl p-3 flex-col gap-2.5 z-0 opacity-70"
              >
                <div className="relative h-30 w-full bg-slate-950 rounded-xl overflow-hidden">
                  <Image
                    src="/STUDENT_PNG/Vanshikach.jpg"
                    alt="Vanshika Choudhary"
                    fill
                    sizes="170px"
                    style={{ objectFit: 'cover' }}
                  />
                  <div className="absolute top-2 left-2 bg-slate-600 text-[8px] font-black text-white px-1.5 py-0.5 rounded uppercase">
                    84.0%
                  </div>
                </div>
                <div className="text-left">
                  <h4 className="text-[10px] font-bold text-slate-300 truncate">Vanshika Ch.</h4>
                  <p className="text-[8px] text-slate-500 font-bold uppercase">3rd Rank 10th</p>
                </div>
              </motion.div>

            </div>
          </div>
        </section>

        {/* WHY CHOOSE SECTION */}
        <section id="why-choose" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 border-t border-slate-900 space-y-12">
          <div className="text-center space-y-3 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase">Why Choose RK Coaching Classes?</h2>
            <p className="text-slate-400 text-xs sm:text-sm">Explore the unique features that set us apart, helping your child secure a competitive edge.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {[
              { title: 'Experienced Tutors', desc: 'Guidance by founders with 10+ years CBSE board teaching experience.', icon: Users },
              { title: 'Batch Wise Study', desc: 'Divided classes to ensure tailored learning speed and individual feedback.', icon: Calendar },
              { title: 'Quality Notes', desc: 'Chapter-wise structured notes summarizing key concepts and formulas.', icon: BookOpenCheck },
              { title: 'Special Test Series', desc: 'Regular board-pattern chapter tests and overall syllabus mock examinations.', icon: Award },
              { title: 'Math & Science Focus', desc: 'Specialized conceptual deep dives in core Science and Mathematics areas.', icon: Zap }
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="glass-card hover-lift p-6 rounded-3xl flex flex-col justify-between gap-4 border border-slate-900/60 shadow-lg">
                  <div className="w-10 h-10 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl flex items-center justify-center shrink-0 shadow-inner">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="space-y-1.5 text-left">
                    <h4 className="text-sm font-black text-white">{item.title}</h4>
                    <p className="text-slate-550 text-xs leading-relaxed font-medium">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* PILLARS OF ACADEMIC EXCELLENCE (FEATURE SECTION) */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 border-t border-slate-900 space-y-16 lg:space-y-24 relative overflow-hidden">
          <div className="absolute top-10 right-10 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />

          <div className="text-center space-y-3 max-w-xl mx-auto">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/25">Core Pillars</span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase mt-3">Our Pillars of Academic Excellence</h2>
            <p className="text-slate-400 text-xs sm:text-sm text-center">A balanced approach to teaching that empowers students to grasp concepts, build skill, and excel.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 max-w-6xl mx-auto">

            {/* Card 1: Smart Learning */}
            <motion.div
              whileHover={{ y: -8 }}
              className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 flex flex-col justify-between gap-6 shadow-xl relative overflow-hidden hover:border-blue-500/40"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl pointer-events-none" />
              <div className="space-y-4 text-left">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center shadow-md">
                  <Sparkles className="w-5.5 h-5.5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-white">Smart Learning</h3>
                  <span className="text-[9px] font-extrabold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">Interactive</span>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed font-medium">
                  Tech-integrated digital tools, interactive visual diagrams, and conceptual mind-maps make complex science and math topics extremely simple to grasp.
                </p>
              </div>
              <div className="border-t border-slate-850 pt-4 flex items-center gap-1.5 text-[9px] font-bold text-blue-400 uppercase tracking-widest">
                <span>Modern Syllabus</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </motion.div>

            {/* Card 2: Personal Attention */}
            <motion.div
              whileHover={{ y: -8 }}
              className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 flex flex-col justify-between gap-6 shadow-xl relative overflow-hidden hover:border-purple-500/40"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-xl pointer-events-none" />
              <div className="space-y-4 text-left">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center shadow-md">
                  <Heart className="w-5.5 h-5.5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-white">Personal Attention</h3>
                  <span className="text-[9px] font-extrabold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">Individualized</span>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed font-medium">
                  One-on-one doubt resolution sessions and tailored mentorship schedules ensure that no child feels left behind in their daily academic progress.
                </p>
              </div>
              <div className="border-t border-slate-850 pt-4 flex items-center gap-1.5 text-[9px] font-bold text-purple-400 uppercase tracking-widest">
                <span>Tailored Support</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </motion.div>

            {/* Card 3: Small Batch Size */}
            <motion.div
              whileHover={{ y: -8 }}
              className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 flex flex-col justify-between gap-6 shadow-xl relative overflow-hidden hover:border-amber-500/40"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
              <div className="space-y-4 text-left">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center shadow-md">
                  <Users className="w-5.5 h-5.5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-white">Small Batch Size</h3>
                  <span className="text-[9px] font-extrabold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">Focused Cohort</span>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed font-medium">
                  Strictly limited student intake per classroom cohort enables highly interactive classrooms, prompt homework reviews, and healthy competitive discussions.
                </p>
              </div>
              <div className="border-t border-slate-850 pt-4 flex items-center gap-1.5 text-[9px] font-bold text-amber-400 uppercase tracking-widest">
                <span>Focused Mentorship</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </motion.div>

            {/* Card 4: Weekly Tests */}
            <motion.div
              whileHover={{ y: -8 }}
              className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 flex flex-col justify-between gap-6 shadow-xl relative overflow-hidden hover:border-emerald-500/40"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
              <div className="space-y-4 text-left">
                <div className="w-12 h-12 rounded-2xl bg-emerald-505/10 text-emerald-400 border border-emerald-505/20 flex items-center justify-center shadow-md">
                  <BookOpenCheck className="w-5.5 h-5.5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-white">Weekly Tests</h3>
                  <span className="text-[9px] font-extrabold text-emerald-400 bg-emerald-50/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">Evaluated</span>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed font-medium">
                  Weekly board-aligned tests, progress metrics, and conceptual oral quizzes build solid exam temperaments and eliminate general test anxiety.
                </p>
              </div>
              <div className="border-t border-slate-850 pt-4 flex items-center gap-1.5 text-[9px] font-bold text-emerald-400 uppercase tracking-widest">
                <span>Proven Performance</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </motion.div>

          </div>
        </section>

        {/* RESULTS SECTION (RESTORED TO ORIGINAL BATCH SYSTEM LAYOUT WITH MODULAR CARDS) */}
        <section id="results" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 border-t border-slate-900 space-y-12 relative overflow-hidden">

          <div className="absolute right-0 top-1/4 w-[350px] h-[350px] border border-purple-500/10 rounded-full pointer-events-none -mr-40 z-0" />
          <div className="absolute right-12 top-1/3 w-[250px] h-[250px] border border-indigo-500/5 rounded-full pointer-events-none z-0" />
          <div className="absolute left-1/3 bottom-10 w-[300px] h-[300px] border border-purple-500/5 rounded-full pointer-events-none z-0" />

          <div className="relative z-10 text-center space-y-3 max-w-xl mx-auto">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/25">Results</span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase mt-3">Our Top Results</h2>
            <p className="text-slate-400 text-xs sm:text-sm text-center">Meet our star performers who achieved academic excellence through dedication and guidance.</p>
          </div>

          {/* Batch Selector Tabs */}
          <div className="relative z-10 flex overflow-x-auto no-scrollbar justify-start md:justify-center gap-3 max-w-full pb-2 px-4 scroll-smooth">
            {Object.keys(batchResultsData).map((year) => (
              <button
                key={year}
                onClick={() => setSelectedBatch(year)}
                className={`px-5 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${selectedBatch === year
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
            <div className="glass-card p-6 rounded-3xl border border-slate-900/60 space-y-1 shadow-inner">
              <span className="text-[10px] font-extrabold text-slate-550 uppercase tracking-widest">Total Students</span>
              <h3 className="text-3xl font-black text-white">{activeBatch.studentCount}</h3>
            </div>
            <div className="glass-card p-6 rounded-3xl border border-slate-900/60 space-y-1 shadow-inner">
              <span className="text-[10px] font-extrabold text-slate-550 uppercase tracking-widest">Average Board Score</span>
              <h3 className="text-3xl font-black text-indigo-400">{activeBatch.avgScore}</h3>
            </div>
          </div>

          {/* Toppers Cards Grid */}
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 pt-4 max-w-6xl mx-auto">
            {activeBatch.toppers.slice(0, 3).map((topper, idx) => (
              <TopperCard
                key={`${selectedBatch}-${topper.name}`}
                topper={topper}
                year={selectedBatch}
              />
            ))}
          </div>
        </section>

        {/* STUDY RESOURCES SECTION */}
        <section id="resources" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 border-t border-slate-900 space-y-12">
          <div className="text-center space-y-3 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase">Study Resources</h2>
            <p className="text-slate-400 text-xs sm:text-sm">Access top-quality learning materials compiled by our educators to elevate school scores.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Reference Books Card */}
            <div className="glass-card hover-lift p-6 rounded-3xl border bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border-blue-500/15 text-blue-400 flex flex-col justify-between gap-6 shadow-md">
              <div className="space-y-3 text-left">
                <h3 className="text-lg font-black text-white">Reference Books</h3>
                <p className="text-slate-400 text-xs leading-relaxed font-medium">
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
            <div className="glass-card hover-lift p-6 rounded-3xl border bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-500/15 text-amber-400 flex flex-col justify-between gap-6 shadow-md">
              <div className="space-y-3 text-left">
                <h3 className="text-lg font-black text-white">NCERT Solutions</h3>
                <p className="text-slate-400 text-xs leading-relaxed font-medium">
                  Step-by-step solved solutions for all textbook exercise questions, compiled cleanly for revisions.
                </p>
              </div>
              <button className="self-start px-4 py-2 border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer">
                Explore File
              </button>
            </div>

            {/* Notes Card */}
            <div className="glass-card hover-lift p-6 rounded-3xl border bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border-emerald-500/15 text-emerald-400 flex flex-col justify-between gap-6 shadow-md">
              <div className="space-y-3 text-left">
                <h3 className="text-lg font-black text-white">Class Notes</h3>
                <p className="text-slate-400 text-xs leading-relaxed font-medium">
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
        <section id="instructors" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 border-t border-slate-900 space-y-12">
          <div className="text-center space-y-3 max-w-xl mx-auto">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/25">Mentors</span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase mt-3">Our Core Faculty</h2>
            <p className="text-slate-400 text-xs sm:text-sm text-center">Learn from dedicated teaching professionals who build core fundamentals with care and focus.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                name: 'Rakesh Agarwal',
                role: 'Foundation Mathematics Expert',
                cohort: 'Playgroup – Class V',
                experience: '17+ Years Experience',
                qualifications: ['Foundational Math Expert', 'Pedagogy Lead'],
                bio: 'With over 17 years of teaching experience, he specializes in building strong mathematical foundations for young learners through highly personalized teaching, individual attention, and concept-focused learning that removes fear and builds confidence.'
              },
              {
                name: 'Rekha Agarwal',
                role: 'Early Childhood & Primary Specialist',
                cohort: 'Playgroup – Class V',
                experience: '25+ Years Experience',
                qualifications: ['M.Com', 'B.Ed'],
                bio: 'With more than 25 years of teaching experience and a strong academic background, she nurtures young learners with patience, care, and structured guidance while strengthening their academic foundations and lifelong learning habits.'
              },
              {
                name: 'Harsh Agarwal',
                role: 'Mathematics & Science Specialist',
                cohort: 'Classes VI – X',
                experience: '6+ Years Experience',
                qualifications: ['B.Sc', 'B.Ed', 'CTET Qualified', 'REET Qualified'],
                bio: 'A passionate educator specializing in Mathematics and Science for middle and secondary classes. His concept-based teaching approach, structured notes, mind maps, and exam-focused preparation help students achieve excellent academic performance.'
              }
            ].map((inst, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -8 }}
                className="group flex flex-col justify-between bg-slate-900/50 hover:bg-slate-900 border border-slate-900 hover:border-indigo-500/25 rounded-3xl p-6 shadow-xl transition-colors duration-300 h-full"
              >
                <div className="space-y-5 text-left">
                  {/* Avatar Layout with circular gradient frame */}
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 text-indigo-400 border border-slate-800 flex items-center justify-center shrink-0 shadow-lg relative group-hover:border-indigo-500/35 transition-colors">
                      <GraduationCap className="w-7 h-7" />
                      <div className="absolute inset-0 bg-indigo-500/5 rounded-2xl filter blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div>
                      <h4 className="font-black text-white text-base leading-tight group-hover:text-indigo-400 transition-colors">{inst.name}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{inst.role}</p>
                    </div>
                  </div>

                  {/* Badges / Experience Wrapper */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-[9px] font-black text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {inst.experience}
                    </span>
                    <span className="text-[9px] font-black text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {inst.cohort}
                    </span>
                  </div>

                  {/* Qualifications chips */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {inst.qualifications.map((q, qidx) => (
                      <span
                        key={qidx}
                        className="text-[9px] font-bold text-slate-400 bg-slate-900 px-2.5 py-0.5 rounded-lg border border-slate-800"
                      >
                        {q}
                      </span>
                    ))}
                  </div>

                  <p className="text-slate-400 text-xs leading-relaxed font-medium pt-1">
                    {inst.bio}
                  </p>
                </div>

                {/* Footer Icon Grid to balance card space */}
                <div className="border-t border-slate-900 pt-4 mt-6 flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  <span className="text-[9px] text-slate-500 uppercase font-black">RK Coaching Classes</span>
                  <div className="flex items-center gap-2 text-slate-500">
                    <CheckCircle className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Active Educator</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* SOCIAL STATS SECTION */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 border-t border-slate-900 space-y-12">
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
                color: 'text-pink-400 hover:shadow-[0_0_15px_rgba(244,63,94,0.15)] border-slate-900 hover:border-pink-500/25',
                icon: Instagram,
                url: 'https://www.instagram.com/rk.coachings20?igsh=ajl5am10cTlyaGw5'
              },
              {
                channel: 'YouTube',
                value: '186+',
                desc: 'Subscribe for visual physics & math lectures',
                color: 'text-rose-500 hover:shadow-[0_0_15px_rgba(225,29,72,0.15)] border-slate-900 hover:border-rose-500/25',
                icon: Youtube,
                url: 'https://youtube.com/@rkcoachingclasses?si=KfYdwL2LGWjAbTTm'
              },
              {
                channel: 'Facebook',
                value: '100+',
                desc: 'Connect for parenting tips & study resources',
                color: 'text-blue-500 hover:shadow-[0_0_15px_rgba(59,130,246,0.15)] border-slate-900 hover:border-blue-500/25',
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
                  className={`glass-card hover-lift p-6 rounded-3xl text-center space-y-3 shadow-inner block transition-colors duration-300 ${social.color}`}
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

        {/* WELCOME TO RK COACHING ALTERNATING SHOWCASE */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 border-t border-slate-900 space-y-10 sm:space-y-14 lg:space-y-16 relative overflow-hidden">
          <div className="absolute top-1/3 left-10 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl pointer-events-none" />

          <div className="text-center space-y-3 max-w-xl mx-auto">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/25">Welcome</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white uppercase mt-3">Welcome to RK Coaching Classes</h2>
            <p className="text-slate-400 text-xs sm:text-sm text-center">We provide an academic environment focused on consistent child growth, discipline, and conceptual excellence.</p>
          </div>

          {/* Overlapping Memory Polaroid Cards (Reference 3rd Image) */}
          <div className="relative z-10 w-full overflow-x-auto no-scrollbar py-12 px-8 flex justify-start lg:justify-center items-center max-w-6xl mx-auto">
            <div className="flex items-center min-w-max lg:min-w-0">
              <div className="relative z-0">
                <MemoryCard
                  index={0}
                  defaultText="Creative Play & Learning"
                  angle="-8deg"
                  imageSrc="/images/memory1.jpg"
                />
              </div>
              <div className="relative z-10 -ml-10 sm:-ml-12 lg:-ml-16">
                <MemoryCard
                  index={1}
                  defaultText="Hands-On Mathematics"
                  angle="-4deg"
                  imageSrc="/images/memory2.jpg"
                />
              </div>
              <div className="relative z-20 -ml-10 sm:-ml-12 lg:-ml-16 scale-105">
                <MemoryCard
                  index={2}
                  defaultText="RK Classroom Smiles"
                  angle="1deg"
                  imageSrc="/images/memory3.jpg"
                />
              </div>
              <div className="relative z-10 -ml-10 sm:-ml-12 lg:-ml-16">
                <MemoryCard
                  index={3}
                  defaultText="Science Lab Experiments"
                  angle="-3deg"
                  imageSrc="/images/memory4.jpg"
                />
              </div>
              <div className="relative z-0 -ml-10 sm:-ml-12 lg:-ml-16">
                <MemoryCard
                  index={4}
                  defaultText="Art & Creative Expression"
                  angle="7deg"
                  imageSrc="/images/memory5.jpg"
                />
              </div>
            </div>
          </div>

          {/* Mobile swipe guide indicator */}
          <div className="text-center md:hidden mt-2 text-[9px] font-extrabold tracking-widest text-indigo-400 uppercase flex items-center justify-center gap-1.5 opacity-80 animate-pulse">
            <span>Swipe to explore memories</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </section>

        {/* TRUST & REVIEWS SECTION */}
        <section id="reviews" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 border-t border-slate-900 space-y-16 lg:space-y-24 relative overflow-hidden">

          <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[350px] h-[350px] bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="text-center space-y-3 max-w-2xl mx-auto relative z-10">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/25">Reviews</span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white uppercase mt-3">Trusted by Hundreds of Parents & Students</h2>
            <p className="text-slate-400 text-xs sm:text-sm text-center">Our core focus is child growth. Hear firsthand testimonials from families who experienced conceptual teaching and score improvements.</p>
          </div>

          {/* Testimonial Cards Grid */}
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto pt-4">
            {[
              {
                stars: 5,
                text: "Concept clarity is amazing here. The way Rakesh Sir explains complex mathematics from playgroup to Class V is wonderful. My child cleared all core basics easily!",
                role: "Parent of Class X Student"
              },
              {
                stars: 5,
                text: "The small batch size and personal attention from Rekha Ma'am helped my daughter secure 87.33% in Class 10th. Highly structured weekly tests and feedback build real exam temperament.",
                role: "Parent"
              },
              {
                stars: 5,
                text: "Friendly teachers who explain each scientific concept with diagrams and real-life examples. I never felt hesitant to ask doubts here. My board exam fear was completely removed.",
                role: "Class IX Student"
              },
              {
                stars: 5,
                text: "Excellent parent communication. We receive attendance logs and weekly test reports regularly. The tutors are highly supportive, and their concept-driven approach is outstanding.",
                role: "Guardian"
              }
            ].map((rev, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -6 }}
                className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 p-6 rounded-3xl flex flex-col justify-between gap-5 text-left shadow-lg hover:border-indigo-500/20 transition-colors duration-300"
              >
                <div className="space-y-3">
                  {/* Star Rating Icons */}
                  <div className="flex items-center gap-0.5 text-amber-400">
                    {Array.from({ length: rev.stars }).map((_, sidx) => (
                      <Star key={sidx} className="w-4 h-4 fill-amber-400 shrink-0" />
                    ))}
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed font-medium">
                    "{rev.text}"
                  </p>
                </div>
                <div className="border-t border-slate-800 pt-3 mt-1">
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{rev.role}</span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Google Reviews CTA Button */}
          <div className="relative z-10 flex justify-center pt-2">
            <a
              href="https://share.google/5jqTmP4v5U1thBhQT"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 rounded-xl text-xs font-extrabold uppercase tracking-wider shadow-lg hover:shadow-indigo-500/5 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              View Google Reviews <ArrowRight className="w-4 h-4 text-slate-400" />
            </a>
          </div>



        </section>

      </main>

      {/* Footer / Contact */}
      <footer id="contact" className="border-t border-slate-900 bg-slate-950/40 relative z-10 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-12 gap-10 border-b border-slate-900/60 pb-12">

          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-3 justify-center md:justify-start">
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
            <p className="text-slate-555 text-xs leading-relaxed max-w-sm mx-auto md:mx-0 text-center md:text-left font-medium">
              Providing Balotra's students with premium, CBSE-focused conceptual tutoring in Mathematics and Science for more than ten years.
            </p>
          </div>

          <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs text-slate-400">
            {/* Contact details */}
            <div className="space-y-4 text-center sm:text-left">
              <h4 className="font-extrabold text-white uppercase tracking-wider text-[10px]">Get in Touch</h4>
              <div className="space-y-2.5">
                <a href="mailto:rk.coachings20@gmail.com" className="flex items-center justify-center sm:justify-start gap-2.5 hover:text-white transition-colors">
                  <Mail className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>rk.coachings20@gmail.com</span>
                </a>
                <a href="tel:+919414668795" className="flex items-center justify-center sm:justify-start gap-2.5 hover:text-white transition-colors">
                  <Phone className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>+91 9414668795</span>
                </a>
                <div className="flex items-start justify-center sm:justify-start gap-2.5 leading-normal">
                  <MapPin className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <span className="text-center sm:text-left">65 Agrawal colony, Near Vardhman School, Balotra, Rajasthan - 344022</span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-4 text-center sm:text-left">
              <h4 className="font-extrabold text-white uppercase tracking-wider text-[10px]">Follow Our Pages</h4>
              <div className="flex gap-4 justify-center sm:justify-start">
                <a
                  href="https://www.instagram.com/rk.coachings20?igsh=ajl5am10cTlyaGw5"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-white rounded-xl flex items-center justify-center transition-all"
                >
                  <Instagram className="w-4.5 h-4.5" />
                </a>
                <a
                  href="https://youtube.com/@rkcoachingclasses?si=KfYdwL2LGWjAbTTm"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-white rounded-xl flex items-center justify-center transition-all"
                >
                  <Youtube className="w-4.5 h-4.5" />
                </a>
                <a
                  href="#"
                  className="w-9 h-9 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-500 hover:text-slate-400 rounded-xl flex items-center justify-center transition-all cursor-not-allowed"
                >
                  <Facebook className="w-4.5 h-4.5" />
                </a>
              </div>
            </div>

          </div>

        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] text-slate-650 font-bold uppercase tracking-wider text-center">
          <p>© 2026 R.K Coaching Classes. All rights reserved.</p>
          <div className="flex items-center justify-center gap-1">
            <span>Powered by</span>
            <span className="text-slate-500 font-black">LearnStudio 2.0</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
