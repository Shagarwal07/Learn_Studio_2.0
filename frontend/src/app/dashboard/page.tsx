'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Clock, 
  Award, 
  ArrowRight, 
  Play, 
  Compass, 
  CheckCircle2,
  Loader2,
  Calendar,
  Users,
  User,
  PlusCircle,
  FileText,
  ClipboardList,
  Megaphone,
  ArrowUpRight,
  Zap,
  Folder,
  Bot,
  Sparkles,
  Flame,
  Layers,
  Target,
  Send,
  RefreshCw,
  TrendingUp
} from 'lucide-react';
import CourseCompletionDonut from '@/components/dashboard/CourseCompletionDonut';
import WeeklyActivityChart from '@/components/dashboard/WeeklyActivityChart';
import AttendanceGrid from '@/components/dashboard/AttendanceGrid';

interface EnrolledCourse {
  enrollmentId: number;
  courseId: number;
  courseTitle: string;
  enrolledAt: string;
  progress: number;
  completedLessons: number;
  totalLessons: number;
  nextLessonId: number | null;
}

// Lightweight component to count numbers on load
function AnimatedCounter({ value, duration = 800 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) return;
    
    const incrementTime = Math.max(Math.floor(duration / (end || 1)), 15);
    const timer = setInterval(() => {
      start += 1;
      setCount(start);
      if (start >= end) {
        clearInterval(timer);
      }
    }, incrementTime);
    
    return () => clearInterval(timer);
  }, [value, duration]);

  return <span>{count}</span>;
}

// Consistent project status color legend
function StatusColorsLegend() {
  const statuses = [
    { name: 'Success', dot: 'bg-success', glow: 'shadow-[0_0_8px_rgba(34,197,94,0.4)]' },
    { name: 'Warning', dot: 'bg-warning', glow: 'shadow-[0_0_8px_rgba(234,179,8,0.4)]' },
    { name: 'Error', dot: 'bg-error', glow: 'shadow-[0_0_8px_rgba(239,68,68,0.4)]' },
    { name: 'Info', dot: 'bg-accent-blue', glow: 'shadow-[0_0_8px_rgba(40,194,255,0.4)]' },
    { name: 'In Progress', dot: 'bg-accent-grape', glow: 'shadow-[0_0_8px_rgba(150,52,132,0.4)]' },
    { name: 'Completed', dot: 'bg-teal-500', glow: 'shadow-[0_0_8px_rgba(20,184,166,0.4)]' },
    { name: 'Upcoming', dot: 'bg-indigo-500', glow: 'shadow-[0_0_8px_rgba(99,102,241,0.4)]' },
    { name: 'Disabled', dot: 'bg-text-muted/40', glow: '' }
  ];

  return (
    <div className="glass-card p-4 rounded-3xl border border-border-color">
      <p className="text-[9px] font-extrabold text-text-muted uppercase tracking-wider text-center mb-3">
        Status Colors (Consistent Across the Project)
      </p>
      <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
        {statuses.map((s, idx) => (
          <div key={idx} className="flex items-center gap-2 text-[10px] font-bold text-text-secondary hover:text-white transition-colors">
            <div className={`w-2.5 h-2.5 rounded-full ${s.dot} ${s.glow}`} />
            <span>{s.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [activeTab, setActiveTab] = useState<'ALL' | 'ACADEMICS' | 'AI_TOOLS' | 'SCHEDULE'>('ALL');
  const [quoteIndex, setQuoteIndex] = useState(new Date().getDate() % 7);

  const quotes = [
    "Small daily progress leads to exponential results! 🚀",
    "Consistency is the key to mastering high-impact subjects! 💡",
    "Don't just study hard—study smart with clear daily goals! 🧠",
    "Every problem solved brings you closer to top academic mastery! 🎯",
    "Stuck on a tricky theorem? Ask Charlie AI Tutor anytime! 🤖",
    "Great achievements are forged through focused daily dedication! ✨",
    "Believe in yourself! You're building your academic legacy today! 🔥"
  ];

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/users/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (response.data.success) {
        window.location.reload();
      } else {
        alert(response.data.message || 'Failed to upload avatar');
      }
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'An error occurred during upload.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // 1. Fetch enrolled courses (currently expected to be empty)
  const { data: enrollments, isLoading, error } = useQuery<EnrolledCourse[]>({
    queryKey: ['my-enrollments'],
    enabled: user?.role === 'STUDENT',
    queryFn: async () => {
      const response = await api.get('/enrollments/my');
      return response.data.success ? response.data.data : [];
    },
  });

  // 2. Fetch attendance summary
  const { data: attendanceData } = useQuery<any>({
    queryKey: ['student-attendance-summary'],
    enabled: user?.role === 'STUDENT',
    queryFn: async () => {
      const response = await api.get('/student/attendance/summary');
      return response.data.success ? response.data.data : null;
    },
  });

  // 3. Fetch attendance streak
  const { data: streakData } = useQuery<any>({
    queryKey: ['student-attendance-streak'],
    enabled: user?.role === 'STUDENT',
    queryFn: async () => {
      const response = await api.get('/student/attendance/streak');
      return response.data.success ? response.data.data : null;
    }
  });

  // 5. Fetch quiz attempts
  const { data: quizAttempts = [] } = useQuery<any[]>({
    queryKey: ['my-quiz-attempts'],
    enabled: user?.role === 'STUDENT',
    queryFn: async () => {
      const response = await api.get('/ai/quiz/attempts');
      return response.data.success ? response.data.data : [];
    }
  });

  // 6. Fetch weekly schedules
  const { data: schedules = [] } = useQuery<any[]>({
    queryKey: ['my-schedules'],
    enabled: user?.role === 'STUDENT',
    queryFn: async () => {
      const response = await api.get('/schedules/week');
      return response.data.success ? response.data.data : [];
    }
  });

  // 7. Fetch test results
  const { data: testResults = [] } = useQuery<any[]>({
    queryKey: ['my-test-results'],
    enabled: user?.role === 'STUDENT',
    queryFn: async () => {
      const response = await api.get('/tests/my-results');
      return response.data;
    }
  });

  // 8. Fetch student assigned batch
  const { data: myBatch } = useQuery<any>({
    queryKey: ['my-assigned-batch'],
    enabled: user?.role === 'STUDENT',
    queryFn: async () => {
      const response = await api.get('/student/batch/my');
      return response.data.success ? response.data.data : null;
    }
  });

  // Redirect if logged-in user is an Instructor or Admin
  if (user?.role === 'INSTRUCTOR' || user?.role === 'ADMIN') {
    return <InstructorDashboardView />;
  }

  if (isLoading) {
    return (
      <div className="space-y-8 max-w-6xl mx-auto flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-accent-grape" />
      </div>
    );
  }

  // Calculate metrics based on APIs
  const hasOfflineTests = Array.isArray(testResults) && testResults.length > 0;
  const offlineAvgPct = hasOfflineTests
    ? Math.round(testResults.reduce((sum, t) => sum + ((t.score / (t.maxMarks || 100)) * 100), 0) / testResults.length)
    : 0;

  const totalQuizzes = quizAttempts.length;
  const onlineAvgPct = totalQuizzes 
    ? Math.round(quizAttempts.reduce((sum, a) => sum + ((a.score / (a.totalQuestions || 1)) * 100), 0) / totalQuizzes) 
    : 0;

  const avgScore = hasOfflineTests ? offlineAvgPct : onlineAvgPct;

  // Grade derived from official test results first, then online quiz score
  let grade = 'N/A';
  if (hasOfflineTests && testResults[0]?.grade) {
    grade = testResults[0].grade;
  } else {
    const effectivePct = avgScore;
    grade = effectivePct >= 90 ? 'A+' : effectivePct >= 80 ? 'A' : effectivePct >= 70 ? 'B' : effectivePct >= 60 ? 'C' : effectivePct > 0 ? 'D' : 'N/A';
  }

  const currentStreak = streakData 
    ? Math.max(streakData.currentOfflineStreak || 0, streakData.currentOnlineStreak || 0) 
    : 0;

  const attendanceRate = attendanceData ? Math.round(attendanceData.overallRate) : 0;

  const courses = enrollments || [];
  const totalUnlockedLessons = courses.reduce((sum, c) => sum + (c.completedLessons || 0), 0);
  const focusScore = attendanceRate > 0 && avgScore > 0 ? Math.round((attendanceRate + avgScore) / 2) : 0;
  
  const fallbackResume = courses.length > 0 ? courses[0] : null;

  const studentBatchName = 
    myBatch?.name || 
    (user as any)?.batchName || 
    (user as any)?.batch?.name || 
    'Unassigned';

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8 text-foreground pb-24 max-w-7xl mx-auto px-1 sm:px-2"
    >
      {/* Interactive Responsive Category Switcher Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-4 pb-2 border-b border-border-color/60">
        <div className="flex items-center gap-2 overflow-x-auto py-1 custom-scrollbar w-full sm:w-auto">
          {[
            { id: 'ALL', label: 'Overview Hub', icon: Layers, color: 'text-indigo-400' },
            { id: 'ACADEMICS', label: 'Academics & Courses', icon: Compass, color: 'text-blue-400' },
            { id: 'AI_TOOLS', label: 'AI Study Center', icon: Sparkles, color: 'text-purple-400' },
            { id: 'SCHEDULE', label: 'Schedule & Deadlines', icon: Calendar, color: 'text-emerald-400' },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all duration-300 shrink-0 cursor-pointer ${
                  isActive 
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25 scale-[1.02]' 
                    : 'bg-card border border-border-color text-text-secondary hover:text-white hover:bg-muted'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : tab.color}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
        <div className="hidden md:flex items-center gap-2 text-xs font-bold text-text-muted bg-card px-3.5 py-2 rounded-xl border border-border-color">
          <span className="w-2 h-2 rounded-full bg-emerald-400 neon-pulse-dot" />
          <span>Stitch Onyx Design System Active</span>
        </div>
      </div>

      {/* Top Section: Upgraded Command Center Welcome Hero Bento Card */}
      <div className="bento-card-glow p-6 sm:p-8 md:p-10 relative overflow-hidden rounded-3xl">
        {/* Glow Orbs & Architectural Accents */}
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-72 h-72 md:w-96 md:h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 translate-y-12 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-80" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 lg:gap-8">
          {/* Left Column: Student Profile Header, Greeting, Status Pills, Actions */}
          <div className="space-y-4 max-w-xl w-full text-left">
            
            {/* Student Profile & Greeting Row */}
            <div className="flex items-center gap-4">
              {/* Student Avatar */}
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 group">
                <input type="file" id="avatarUpload" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                <label htmlFor="avatarUpload" className="relative w-full h-full rounded-2xl border-2 border-indigo-400/50 shadow-xl overflow-hidden bg-slate-900 cursor-pointer block hover:border-cyan-400 transition-colors">
                  {isUploadingAvatar && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/80">
                      <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                    <span className="text-[10px] font-bold text-white bg-indigo-600 px-2 py-1 rounded-lg">Update</span>
                  </div>
                  {(user as any)?.avatarUrl ? (
                    <img src={(user as any).avatarUrl} alt={user?.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-indigo-950/60 text-indigo-300">
                      <User className="w-8 h-8 opacity-90" />
                    </div>
                  )}
                </label>
                <div className="absolute -bottom-1 -right-1 bg-emerald-400 w-4 h-4 rounded-full border-2 border-slate-900 shadow-[0_0_10px_rgba(52,211,153,0.8)] neon-pulse-dot" title="Online & Synced" />
              </div>

              {/* Main Greeting & Name */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black text-indigo-300 uppercase tracking-widest bg-indigo-500/20 px-2.5 py-0.5 rounded-full border border-indigo-400/30">
                    {new Date().getHours() < 12 ? 'Morning Session' : new Date().getHours() < 18 ? 'Afternoon Focus' : 'Night Owl Study'} ⚡
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white leading-tight">
                  <span className="bg-gradient-to-r from-white via-indigo-200 to-cyan-300 bg-clip-text text-transparent">
                    {user?.name || 'Student'}
                  </span>
                </h2>
              </div>
            </div>

            {/* Status Pills Bar */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-emerald-300 bg-emerald-950/70 px-3 py-1 rounded-xl border border-emerald-500/30 shadow-sm uppercase tracking-wider">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                Verified Student
              </span>

              {currentStreak > 0 && (
                <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-amber-300 bg-amber-950/70 px-3 py-1 rounded-xl border border-amber-500/40 shadow-sm uppercase tracking-wider">
                  <Flame className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                  {currentStreak}-Day Streak T-1
                </span>
              )}

              <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-cyan-300 bg-cyan-950/70 px-3 py-1 rounded-xl border border-cyan-500/30 shadow-sm uppercase tracking-wider">
                🎓 {studentBatchName}
              </span>
            </div>

            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-lg hidden sm:block font-medium">
              Welcome to your automated study cockpit. Track lectures, review official assessment grades, and accelerate retention with <span className="text-purple-300 font-bold">Charlie AI Tutor</span>.
            </p>

            {/* Next Up Live Alert Pill if schedules exist */}
            {schedules && schedules.length > 0 && (
              <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-slate-900/90 border border-indigo-500/30 rounded-2xl text-xs text-slate-200 shadow-inner w-full sm:w-auto">
                <div className="flex items-center gap-2 truncate">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                  </span>
                  <span className="text-indigo-300 font-extrabold uppercase tracking-wider text-[10px]">Next Up:</span>
                  <span className="font-bold text-white truncate">{schedules[0].title}</span>
                </div>
                <span className="text-cyan-400 font-mono text-[11px] font-bold shrink-0 bg-cyan-950/80 px-2 py-0.5 rounded-lg border border-cyan-500/20">
                  {schedules[0].startTime?.substring(0, 5) || 'Today'}
                </span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <Link 
                href={fallbackResume ? `/dashboard/course/${fallbackResume.courseId}/learn` : '/courses'} 
                className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 hover:from-indigo-400 hover:to-pink-400 text-white text-xs font-extrabold rounded-2xl shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5"
              >
                <Play className="w-4 h-4 fill-white" /> Continue Course Mastery
              </Link>
              <Link 
                href="/dashboard/ai" 
                className="w-full sm:w-auto px-6 py-3.5 tactile-pill text-purple-200 hover:text-white text-xs font-extrabold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                <Sparkles className="w-4 h-4 text-purple-400 animate-spin" style={{ animationDuration: '6s' }} /> Launch AI Study Studio
              </Link>
            </div>
          </div>

          {/* Right Column: Charlie Mascot & Speech Bubble Quote */}
          <div className="relative flex flex-row md:flex-col items-center justify-center gap-4 shrink-0 pt-3 md:pt-0 w-full md:w-auto border-t md:border-t-0 border-slate-800/60">
            {/* Speech Bubble Quote */}
            <div className="relative p-4 bg-gradient-to-br from-indigo-950/90 via-purple-950/90 to-slate-900 border border-purple-500/40 rounded-2xl shadow-2xl text-left md:text-center max-w-[240px] sm:max-w-[260px]">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[9px] font-black uppercase text-purple-400 tracking-widest flex items-center gap-1">
                  <Bot className="w-3 h-3" /> Charlie AI Advice
                </span>
                <button 
                  onClick={() => setQuoteIndex((quoteIndex + 1) % quotes.length)} 
                  title="New advice"
                  className="text-slate-400 hover:text-white transition-colors p-1 rounded-md hover:bg-slate-800 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              </div>
              <p className="text-xs font-bold text-indigo-100 leading-relaxed italic">
                "{quotes[quoteIndex]}"
              </p>
            </div>

            {/* Charlie Mascot Image */}
            <div className="relative w-32 h-32 sm:w-44 sm:h-48 md:w-52 md:h-56 shrink-0 flex items-center justify-center group">
              <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-2xl group-hover:bg-cyan-500/30 transition-all duration-500" />
              <img 
                src="/images/charlie-ai.png" 
                alt="Charlie AI Mascot" 
                className="w-full h-full object-contain filter drop-shadow-[0_15px_25px_rgba(99,102,241,0.35)] group-hover:scale-105 group-hover:rotate-1 transition-all duration-500 relative z-10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bento Grid Stats Row (Always visible for top-level academic metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Batch Tile */}
        <div className="bento-card p-6 space-y-4 group">
          <div className="flex justify-between items-center">
            <div className="w-12 h-12 bg-indigo-500/15 rounded-2xl flex items-center justify-center border border-indigo-500/30 text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-500/25 transition-all shadow-md">
              <BookOpen className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-black text-indigo-300 bg-indigo-500/15 px-3 py-1 rounded-full border border-indigo-500/30 uppercase tracking-widest">
              Cohort
            </span>
          </div>
          <div>
            <h3 className="text-2xl font-black text-white tracking-tight truncate group-hover:text-indigo-200 transition-colors" title={studentBatchName}>
              {studentBatchName}
            </h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-indigo-400" /> Assigned Academic Batch
            </p>
          </div>
        </div>

        {/* Attendance Rate */}
        <div className="bento-card p-6 space-y-4 group">
          <div className="flex justify-between items-center">
            <div className="w-12 h-12 bg-emerald-500/15 rounded-2xl flex items-center justify-center border border-emerald-500/30 text-emerald-400 group-hover:scale-110 group-hover:bg-emerald-500/25 transition-all shadow-md">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            {attendanceRate > 0 && (
              <span className="text-[10px] font-black text-emerald-300 bg-emerald-500/15 px-3 py-1 rounded-full border border-emerald-500/30 uppercase tracking-widest flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Healthy
              </span>
            )}
          </div>
          <div>
            <h3 className="text-3xl font-black text-white tracking-tight font-mono">
              {attendanceData ? <AnimatedCounter value={attendanceRate} /> : 'N/A'}%
            </h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Attendance Rate</p>
            {attendanceData && (
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden mt-3 p-0.5 border border-slate-800">
                <div className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-full rounded-full transition-all duration-700 shadow-[0_0_10px_rgba(52,211,153,0.5)]" style={{ width: `${attendanceRate}%` }} />
              </div>
            )}
          </div>
        </div>

        {/* Overall Test Grade */}
        <div className="bento-card p-6 space-y-4 group">
          <div className="flex justify-between items-center">
            <div className="w-12 h-12 bg-purple-500/15 rounded-2xl flex items-center justify-center border border-purple-500/30 text-purple-400 group-hover:scale-110 group-hover:bg-purple-500/25 transition-all shadow-md">
              <Award className="w-6 h-6" />
            </div>
            {grade !== 'N/A' && (
              <span className="text-[10px] font-black text-purple-300 bg-purple-500/15 px-3 py-1 rounded-full border border-purple-500/30 uppercase tracking-widest">
                Official Score
              </span>
            )}
          </div>
          <div>
            <h3 className="text-3xl font-black text-white tracking-tight font-mono text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-pink-200 to-indigo-200">
              {grade}
            </h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Overall Assessment Grade</p>
            {avgScore > 0 && (
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden mt-3 p-0.5 border border-slate-800">
                <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-500 h-full rounded-full transition-all duration-700 shadow-[0_0_10px_rgba(168,85,247,0.5)]" style={{ width: `${avgScore}%` }} />
              </div>
            )}
          </div>
        </div>

        {/* Study Streak */}
        <div className="bento-card p-6 space-y-4 group">
          <div className="flex justify-between items-center">
            <div className="w-12 h-12 bg-amber-500/15 rounded-2xl flex items-center justify-center border border-amber-500/30 text-amber-400 group-hover:scale-110 group-hover:bg-amber-500/25 transition-all shadow-md">
              <Flame className="w-6 h-6" />
            </div>
            {currentStreak > 0 && (
              <span className="text-[10px] font-black text-amber-300 bg-amber-500/15 px-3 py-1 rounded-full border border-amber-500/30 uppercase tracking-widest">
                On Fire!
              </span>
            )}
          </div>
          <div>
            <h3 className="text-3xl font-black text-white tracking-tight font-mono">
              {currentStreak > 0 ? <AnimatedCounter value={currentStreak} /> : 'N/A'}{currentStreak > 0 ? 'd' : ''}
            </h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Daily Study Streak</p>
            {currentStreak > 0 && (
              <div className="flex gap-2 mt-3.5">
                {[...Array(5)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-2 flex-1 rounded-full transition-all duration-500 ${
                      i < Math.min(currentStreak, 5) 
                        ? 'bg-gradient-to-r from-amber-500 to-orange-400 shadow-[0_0_8px_rgba(251,191,36,0.6)] scale-105' 
                        : 'bg-slate-800'
                    }`} 
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Middle Section: Enrolled Courses & NEW Interactive AI Study Hub (Shown on ALL, ACADEMICS, AI_TOOLS) */}
      {(activeTab === 'ALL' || activeTab === 'ACADEMICS' || activeTab === 'AI_TOOLS') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Active Course Module (7 columns on large desktop) */}
          {(activeTab === 'ALL' || activeTab === 'ACADEMICS') && fallbackResume ? (
            <div className={`${activeTab === 'ACADEMICS' ? 'lg:col-span-12' : 'lg:col-span-7'} bento-card p-6 sm:p-8 flex flex-col justify-between space-y-6 relative overflow-hidden`}>
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-color/60 pb-4">
                <div>
                  <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest bg-blue-500/15 px-3 py-1 rounded-full border border-blue-500/30">
                    ⚡ Active Course Progress
                  </span>
                  <h3 className="text-lg sm:text-xl font-black text-white mt-2 flex items-center gap-2">
                    <Compass className="w-5 h-5 text-blue-400" /> Current Course Workspace
                  </h3>
                </div>
                <span className="text-sm font-mono font-black text-blue-300 bg-blue-950/60 px-3.5 py-1.5 rounded-xl border border-blue-500/20 self-start sm:self-center">
                  {fallbackResume.progress}% Mastery
                </span>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between py-2">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-900 to-slate-900 border-2 border-indigo-500/40 flex items-center justify-center shrink-0 text-cyan-300 shadow-xl">
                    <BookOpen className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-base sm:text-lg font-black text-white tracking-tight">{fallbackResume.courseTitle}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Enrolled on: {new Date(fallbackResume.enrolledAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <Link 
                  href={`/dashboard/course/${fallbackResume.courseId}/learn`}
                  className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black rounded-2xl transition-all shadow-xl shadow-blue-600/25 hover:scale-105 flex items-center justify-center gap-2 shrink-0"
                >
                  <Play className="w-4 h-4 fill-white" /> Resume Lesson
                </Link>
              </div>

              {/* Progress bar with neon glow */}
              <div className="space-y-2">
                <div className="flex justify-between text-[11px] font-bold text-slate-400">
                  <span>Course Completion Status</span>
                  <span className="text-blue-300 font-mono">{fallbackResume.completedLessons || 0} / {fallbackResume.totalLessons || 12} Modules</span>
                </div>
                <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden p-0.5 border border-slate-800">
                  <div className="bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 h-full rounded-full transition-all duration-700 shadow-[0_0_15px_rgba(59,130,246,0.6)]" style={{ width: `${fallbackResume.progress}%` }} />
                </div>
              </div>
            </div>
          ) : (activeTab === 'ALL' || activeTab === 'ACADEMICS') && (
            <div className="lg:col-span-7 bento-card p-8 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 rounded-3xl flex items-center justify-center text-blue-400">
                <Compass className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-lg font-black text-white">No Active Enrolled Courses</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">Explore our educational course catalog to begin your personalized learning path with interactive video lessons.</p>
              </div>
              <Link href="/courses" className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-black rounded-2xl shadow-lg hover:scale-105 transition-all">
                Explore Course Catalog
              </Link>
            </div>
          )}

          {/* NEW: AI Study Tutor Quick Prompts Module (5 columns on large desktop) */}
          {(activeTab === 'ALL' || activeTab === 'AI_TOOLS') && (
            <div className={`${activeTab === 'AI_TOOLS' ? 'lg:col-span-12' : 'lg:col-span-5'} bento-card p-6 sm:p-8 flex flex-col justify-between space-y-5 relative overflow-hidden border-purple-500/30 shadow-[0_10px_30px_rgba(150,52,132,0.15)]`}>
              <div className="absolute top-0 right-0 -translate-y-6 translate-x-6 w-40 h-40 bg-pink-500/15 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-center justify-between border-b border-border-color/60 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center text-white shadow-md">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white flex items-center gap-1.5">
                      Charlie AI Studio
                    </h3>
                    <p className="text-[11px] text-purple-300 font-semibold">Your 24/7 Personal Academic Tutor</p>
                  </div>
                </div>
                <span className="text-[9px] font-black uppercase text-pink-300 bg-pink-500/20 px-2.5 py-1 rounded-lg border border-pink-500/30 animate-pulse">
                  Ready
                </span>
              </div>

              <div className="space-y-2.5">
                <p className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">Instant AI Prompts</p>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { prompt: "✨ Summarize my recent lecture notes into key bullet points", badge: "Summarize" },
                    { prompt: "🧠 Generate a 5-question practice quiz on today's subject", badge: "Quiz Me" },
                    { prompt: "🎯 Explain difficult concepts from my last offline test", badge: "Explain" },
                  ].map((item, idx) => (
                    <Link
                      key={idx}
                      href={`/dashboard/ai?prompt=${encodeURIComponent(item.prompt)}`}
                      className="group p-3 tactile-pill rounded-2xl text-xs font-bold text-slate-200 hover:text-white flex items-center justify-between gap-3 transition-all hover:border-purple-500/40"
                    >
                      <span className="truncate group-hover:translate-x-0.5 transition-transform">{item.prompt}</span>
                      <span className="text-[10px] font-black text-purple-300 bg-purple-950/80 px-2.5 py-1 rounded-lg border border-purple-500/30 shrink-0 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                        {item.badge}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>

              <Link
                href="/dashboard/ai"
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 border border-purple-500/30 hover:border-purple-500/60 rounded-2xl text-xs font-extrabold text-purple-200 hover:text-white transition-all flex items-center justify-center gap-2 shadow-lg group"
              >
                <span>Open Full Interactive Tutor Studio</span>
                <ArrowRight className="w-4 h-4 text-purple-400 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Bottom Section: Assessments & Schedules Agenda (Shown on ALL, ACADEMICS, SCHEDULE) */}
      {(activeTab === 'ALL' || activeTab === 'ACADEMICS' || activeTab === 'SCHEDULE') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Left Column: My Test Results (Shown on ALL, ACADEMICS) */}
          {(activeTab === 'ALL' || activeTab === 'ACADEMICS') && (
            <div className={`${activeTab === 'ACADEMICS' ? 'lg:col-span-2' : ''} bento-card p-6 sm:p-8 flex flex-col justify-between space-y-5`}>
              <div className="flex justify-between items-center border-b border-border-color/60 pb-4">
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2.5">
                    <Award className="w-6 h-6 text-purple-400" /> Official Test Results & Grades
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Verified offline test performance and instructor appraisals</p>
                </div>
                <Link href="/dashboard/tests" className="text-xs font-extrabold text-indigo-400 hover:text-cyan-300 transition-colors flex items-center gap-1 bg-indigo-500/10 px-3 py-1.5 rounded-xl border border-indigo-500/20">
                  View History <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
              
              {testResults.length > 0 ? (
                <div className="space-y-3.5 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                  {testResults.map((res: any) => (
                    <div key={res.testId} className="bg-slate-950/80 border border-slate-800/80 hover:border-purple-500/40 p-4 sm:p-5 rounded-2xl transition-all space-y-3 shadow-md hover:shadow-lg">
                      <div className="flex items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest bg-purple-950/60 px-2.5 py-0.5 rounded-md border border-purple-500/20">{res.subjectName}</span>
                          <h4 className="text-base font-black text-white">{res.testTitle}</h4>
                        </div>
                        <div className="px-4 py-1.5 bg-gradient-to-r from-purple-900/80 to-indigo-900/80 border border-purple-400/40 rounded-2xl text-center shadow-md">
                          <span className="text-lg font-black text-purple-200 font-mono">{res.grade}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs border-t border-slate-800/60 pt-3 text-slate-300 font-semibold">
                        <span>Score Obtained: <strong className="text-cyan-400 font-mono text-sm">{res.score} / {res.maxMarks}</strong></span>
                        <span className="text-slate-400 font-mono text-[11px]">{new Date(res.testDate).toLocaleDateString()}</span>
                      </div>

                      {res.feedback && (
                        <p className="text-xs text-slate-300 italic bg-purple-950/30 p-3 rounded-xl border border-purple-500/20 flex items-start gap-2">
                          <span className="text-purple-400 font-bold not-italic shrink-0">Instructor Feedback:</span> "{res.feedback}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-12 border border-dashed border-slate-800 rounded-3xl space-y-3">
                  <div className="w-16 h-16 bg-purple-500/10 border border-purple-500/20 rounded-2xl flex items-center justify-center text-purple-400">
                    <Award className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-white">No Assessment Records Found</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">Your offline evaluation results and grade transcripts will display here automatically once published by your instructor.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Right Column: Upcoming Schedule Agenda (Shown on ALL, SCHEDULE) */}
          {(activeTab === 'ALL' || activeTab === 'SCHEDULE') && (
            <div className={`${activeTab === 'SCHEDULE' ? 'lg:col-span-2' : ''} bento-card p-6 sm:p-8 flex flex-col justify-between space-y-5`}>
              <div className="flex justify-between items-center border-b border-border-color/60 pb-4">
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2.5">
                    <Calendar className="w-6 h-6 text-emerald-400" /> Live Schedule & Deadlines
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Weekly lecture timetables, exams, and event countdowns</p>
                </div>
                {schedules.length > 0 && (
                  <span className="text-xs bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full font-black">
                    {schedules.length} Event{schedules.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              
              {schedules.length > 0 ? (
                <div className="space-y-3.5 flex-1 overflow-y-auto max-h-[460px] pr-1 custom-scrollbar">
                  {schedules.map((event: any) => (
                    <div key={event.id} className="bg-slate-950/80 border border-slate-800/80 hover:border-emerald-500/40 p-4 sm:p-5 rounded-2xl transition-all space-y-2.5 shadow-md hover:shadow-lg group">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[10px] font-black text-emerald-300 bg-emerald-950/80 border border-emerald-500/30 px-3 py-0.5 rounded-full uppercase tracking-widest">
                          {event.eventType || 'LECTURE'}
                        </span>
                        <span className="text-xs font-bold font-mono text-slate-400 group-hover:text-emerald-300 transition-colors">
                          🗓 {new Date(event.eventDate).toLocaleDateString()}
                        </span>
                      </div>

                      <h4 className="text-base font-black text-white group-hover:text-cyan-200 transition-colors">{event.title}</h4>

                      <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60 font-semibold">
                        <span className="flex items-center gap-1.5 text-slate-200 font-mono">
                          <Clock className="w-4 h-4 text-emerald-400" />
                          {event.startTime?.substring(0, 5)} - {event.endTime?.substring(0, 5)}
                        </span>
                        <span className="text-xs text-slate-400 bg-slate-900 px-2.5 py-0.5 rounded-lg border border-slate-800">
                          {event.batchName ? `Cohort: ${event.batchName}` : 'General Session'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3 py-16 border border-dashed border-slate-800 rounded-3xl">
                  <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400">
                    <Calendar className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-white">Clear Schedule Ahead</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-[250px] mx-auto">You have no pending academic lectures or examination deadlines scheduled for the current week.</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}


function InstructorDashboardView() {
  const { user } = useAuth();
  const [syncingDrive, setSyncingDrive] = useState(false);

  const handleSyncGoogleDrive = async () => {
    setSyncingDrive(true);
    try {
      const response = await api.post('/admin/sync/drive');
      if (response.data.success) {
        alert('Google Drive synchronization completed successfully!');
        window.location.reload();
      } else {
        alert(response.data.message || 'Sync failed.');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to sync with Google Drive. Check backend configuration.');
    } finally {
      setSyncingDrive(false);
    }
  };

  // 1. Fetch batches
  const { data: batches = [], isLoading: isBatchesLoading } = useQuery<any[]>({
    queryKey: ['instructor-batches-dashboard'],
    enabled: user?.role === 'INSTRUCTOR' || user?.role === 'ADMIN',
    queryFn: async () => {
      const response = await api.get('/instructor/batches');
      return response.data.success ? response.data.data : [];
    }
  });

  // Fetch all students to count total students in the database
  const { data: allStudentsList = [], isLoading: isAllStudentsLoading } = useQuery<any[]>({
    queryKey: ['all-students-count-dashboard'],
    enabled: user?.role === 'INSTRUCTOR' || user?.role === 'ADMIN',
    queryFn: async () => {
      const response = await api.get('/instructor/attendance/students');
      return response.data.success ? response.data.data : [];
    }
  });

  // 2. Fetch schedules
  const { data: schedules = [], isLoading: isSchedulesLoading } = useQuery<any[]>({
    queryKey: ['instructor-schedules-dashboard'],
    enabled: user?.role === 'INSTRUCTOR' || user?.role === 'ADMIN',
    queryFn: async () => {
      const url = user?.role === 'ADMIN' ? '/admin/schedules' : '/instructor/schedules';
      const response = await api.get(url);
      return response.data.success ? response.data.data : [];
    }
  });

  const todayStr = new Date().toISOString().split('T')[0];
  const todaySchedules = schedules.filter(s => s.eventDate === todayStr);
  const totalStudents = allStudentsList.length;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 max-w-6xl mx-auto text-foreground"
    >
      
      {/* Welcome banner */}
      <div className="hero-header-card">
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-80 h-80 bg-accent-grape/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-1/3 w-64 h-64 bg-primary-blue/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-3">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-white bg-white/20 px-3 py-1 rounded-full border border-white/30 uppercase tracking-wider">
            Academic Operations Panel
          </span>
          <h2 className="text-2xl lg:text-3xl font-black tracking-tight text-white">
            Welcome back, {user?.name}. 👋
          </h2>
          <p className="text-indigo-100 text-xs sm:text-sm max-w-xl leading-relaxed">
            Coordinate your offline batches, track attendance records, upload secure PDF study notes, and manage homework tasks from your unified control panel.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="panel-sidebar flex items-center gap-5">
          <div className="w-12 h-12 bg-accent-grape/10 text-accent-grape border border-accent-grape/20 rounded-2xl flex items-center justify-center shadow-[0_0_15px_rgba(150,52,132,0.15)]">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">Active Batches</p>
            <h3 className="text-2xl font-black text-foreground mt-1">
              {isBatchesLoading ? '...' : <AnimatedCounter value={batches.length} />}
            </h3>
          </div>
        </div>

        <div className="panel-sidebar flex items-center gap-5">
          <div className="w-12 h-12 bg-primary-blue/10 text-secondary-blue border border-primary-blue/20 rounded-2xl flex items-center justify-center shadow-[0_0_15px_rgba(48,102,190,0.15)]">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">Total Students</p>
            <h3 className="text-2xl font-black text-foreground mt-1">
              {isBatchesLoading ? '...' : <AnimatedCounter value={totalStudents} />}
            </h3>
          </div>
        </div>

        <div className="panel-sidebar flex items-center gap-5">
          <div className="w-12 h-12 bg-success/10 text-success border border-success/20 rounded-2xl flex items-center justify-center shadow-[0_0_15px_rgba(34,197,94,0.15)]">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">Lectures Today</p>
            <h3 className="text-2xl font-black text-foreground mt-1">
              {isSchedulesLoading ? '...' : <AnimatedCounter value={todaySchedules.length} />}
            </h3>
          </div>
        </div>
      </div>

      {/* Quick Action Panel & Today's Classes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Quick Actions (4 cols) */}
        <div className="lg:col-span-4 panel-sidebar">
          <h3 className="text-xs font-extrabold text-foreground uppercase tracking-wider">
            Quick Actions
          </h3>
          <div className="flex flex-col gap-3">
            <Link 
              href="/dashboard/auto-ta"
              className="flex items-center justify-between p-3.5 bg-gradient-to-r from-accent-grape/15 via-primary-blue/15 to-accent-blue/10 hover:from-accent-grape/25 hover:to-accent-blue/20 border border-accent-grape/30 hover:border-accent-grape rounded-xl text-xs font-bold transition-all text-foreground hover:scale-[1.01] group cursor-pointer shadow-sm"
            >
              <span className="flex items-center gap-2.5 font-extrabold text-accent-grape dark:text-accent-blue">
                <Sparkles className="w-4.5 h-4.5 text-accent-grape animate-pulse" />
                Generate AI Exam (Auto-TA)
              </span>
              <ArrowRight className="w-4 h-4 text-accent-grape group-hover:translate-x-0.5 transition-all" />
            </Link>

            <Link 
              href="/dashboard/instructor/batches?tab=attendance"
              className="flex items-center justify-between p-3 bg-muted/50 hover:bg-muted border border-border-color rounded-xl text-xs font-semibold transition-all text-muted-foreground hover:text-foreground group cursor-pointer"
            >
              <span className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4.5 h-4.5 text-accent-grape" />
                Mark Attendance
              </span>
              <ArrowRight className="w-4 h-4 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
            </Link>

            <Link 
              href="/dashboard/instructor/batches?tab=notes"
              className="flex items-center justify-between p-3 bg-muted/50 hover:bg-muted border border-border-color rounded-xl text-xs font-semibold transition-all text-muted-foreground hover:text-foreground group cursor-pointer"
            >
              <span className="flex items-center gap-2.5">
                <FileText className="w-4.5 h-4.5 text-accent-grape" />
                Upload PDF Notes
              </span>
              <ArrowRight className="w-4 h-4 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
            </Link>

            <Link 
              href="/dashboard/instructor/batches?tab=homework"
              className="flex items-center justify-between p-3 bg-muted/50 hover:bg-muted border border-border-color rounded-xl text-xs font-semibold transition-all text-muted-foreground hover:text-foreground group cursor-pointer"
            >
              <span className="flex items-center gap-2.5">
                <ClipboardList className="w-4.5 h-4.5 text-accent-grape" />
                Post Homework Task
              </span>
              <ArrowRight className="w-4 h-4 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
            </Link>

            <Link 
              href="/dashboard/instructor/announcements"
              className="flex items-center justify-between p-3 bg-muted/50 hover:bg-muted border border-border-color rounded-xl text-xs font-semibold transition-all text-muted-foreground hover:text-foreground group cursor-pointer"
            >
              <span className="flex items-center gap-2.5">
                <Megaphone className="w-4.5 h-4.5 text-accent-grape" />
                Post Announcement
              </span>
              <ArrowRight className="w-4 h-4 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
            </Link>

            {user?.role === 'ADMIN' && (
              <button
                onClick={handleSyncGoogleDrive}
                disabled={syncingDrive}
                className="w-full flex items-center justify-between p-3 bg-indigo-500/10 hover:bg-indigo-500/20 disabled:opacity-50 border border-indigo-500/20 rounded-xl text-xs font-semibold transition-all text-indigo-600 dark:text-indigo-300 hover:text-indigo-700 dark:hover:text-indigo-200 cursor-pointer group"
              >
                <span className="flex items-center gap-2.5">
                  {syncingDrive ? (
                    <Loader2 className="w-4.5 h-4.5 animate-spin text-indigo-400" />
                  ) : (
                    <Folder className="w-4.5 h-4.5 text-indigo-400" />
                  )}
                  {syncingDrive ? 'Syncing Drive...' : 'Sync Google Drive'}
                </span>
                <ArrowRight className="w-4 h-4 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </button>
            )}
          </div>
        </div>

        {/* Right: Today's Classes (8 cols) */}
        <div className="lg:col-span-8 panel-sidebar">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-extrabold text-foreground uppercase tracking-wider">
              Today&rsquo;s Lectures ({todaySchedules.length})
            </h3>
            <Link 
              href="/dashboard/instructor/batches?tab=schedule"
              className="text-[11px] font-bold uppercase tracking-wider text-accent-grape hover:text-accent-blue transition-colors flex items-center gap-1"
            >
              Timetable View <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {isSchedulesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-accent-grape" />
            </div>
          ) : todaySchedules.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-border-color rounded-2xl p-6 space-y-3">
              <Calendar className="w-7 h-7 mx-auto text-text-muted mb-1" />
              <p className="text-xs font-semibold text-text-secondary">No lectures scheduled for today.</p>
              <p className="text-[10px] text-text-muted max-w-xs mx-auto">Create a schedule event to coordinate classes.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {todaySchedules.map(event => (
                <div key={event.id} className="p-4 bg-card border border-border-color rounded-2xl flex items-center justify-between gap-4 shadow-sm hover:border-accent-grape/35 hover:bg-card transition-all duration-300">
                  <div className="min-w-0">
                    <h4 className="font-black text-sm text-white truncate">
                      {event.title}
                    </h4>
                    <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider mt-1 block">
                      Batch: {event.batchName || 'General'} {event.subjectName ? `• Subject: ${event.subjectName}` : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider bg-background border border-border-color px-3 py-1.5 rounded-xl text-text-secondary shrink-0">
                    <Clock className="w-3.5 h-3.5 text-accent-grape" />
                    {event.startTime.substring(0, 5)} - {event.endTime.substring(0, 5)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Status colors legend in instructor mode */}
      <StatusColorsLegend />

    </motion.div>
  );
}

