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
  ChevronDown,
  Bot,
  Sparkles
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
      className="space-y-8 text-foreground pb-20"
    >
      {/* Top Section: Upgraded Command Center Welcome Hero Card */}
      <div className="relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-slate-900/90 via-indigo-950/40 to-slate-900 p-5 sm:p-8 md:p-10 shadow-2xl backdrop-blur-xl">
        {/* Glow Orbs */}
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-60 h-60 md:w-96 md:h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 translate-y-12 w-48 h-48 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 lg:gap-8">
          {/* Left Column: Student Profile Header, Greeting, Status Pills, Actions */}
          <div className="space-y-4 max-w-xl w-full text-left">
            
            {/* Student Profile & Greeting Row (Always Inline) */}
            <div className="flex items-center gap-3.5 sm:gap-4">
              {/* Student Avatar */}
              <div className="relative w-14 h-14 sm:w-18 sm:h-18 shrink-0 group">
                <input type="file" id="avatarUpload" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                <label htmlFor="avatarUpload" className="relative w-full h-full rounded-2xl border-2 border-indigo-500/40 shadow-xl overflow-hidden bg-slate-900 cursor-pointer block">
                  {isUploadingAvatar && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/80">
                      <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                    <span className="text-[9px] font-bold text-white bg-indigo-600 px-2 py-0.5 rounded-full">Change</span>
                  </div>
                  {(user as any)?.avatarUrl ? (
                    <img src={(user as any).avatarUrl} alt={user?.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-indigo-950/50 text-indigo-300">
                      <User className="w-7 h-7 opacity-80" />
                    </div>
                  )}
                </label>
                <div className="absolute -bottom-0.5 -right-0.5 bg-emerald-500 w-3.5 h-3.5 rounded-full border-2 border-slate-900 shadow-md" title="Online" />
              </div>

              {/* Main Greeting & Name */}
              <div className="space-y-0.5">
                <p className="text-[11px] sm:text-xs font-bold text-indigo-300 uppercase tracking-wider">
                  {new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 18 ? 'Good Afternoon' : 'Good Evening'} ⚡
                </p>
                <h2 className="text-xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white leading-tight">
                  <span className="bg-gradient-to-r from-indigo-300 via-purple-200 to-pink-300 bg-clip-text text-transparent">
                    {user?.name || 'Student'}
                  </span> 👋
                </h2>
              </div>
            </div>

            {/* Status Pills Bar */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 uppercase tracking-wider">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                Active Student
              </span>

              {currentStreak > 0 && (
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 uppercase tracking-wider">
                  🔥 {currentStreak}-Day Streak
                </span>
              )}

              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-indigo-300 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20 uppercase tracking-wider">
                🎓 {studentBatchName}
              </span>
            </div>

            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-lg hidden sm:block">
              Track your classes, review test performance, and learn interactively with Charlie AI.
            </p>

            {/* Next Up Live Alert Pill if schedules exist */}
            {schedules && schedules.length > 0 && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 border border-slate-700/60 rounded-xl text-xs text-slate-200 w-full sm:w-auto">
                <span className="text-indigo-400 font-bold shrink-0">📌 Next:</span>
                <span className="font-semibold text-white truncate">{schedules[0].title}</span>
                <span className="text-slate-400 text-[11px] shrink-0">({schedules[0].eventDate || 'Today'})</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
              <Link 
                href={fallbackResume ? `/dashboard/course/${fallbackResume.courseId}/learn` : '/courses'} 
                className="w-full sm:w-auto px-5 py-2.5 sm:py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white text-xs font-bold rounded-2xl shadow-xl shadow-indigo-500/25 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-white" /> Continue Learning
              </Link>
              <Link 
                href="/dashboard/ai" 
                className="w-full sm:w-auto px-5 py-2.5 sm:py-3 bg-slate-800/90 border border-indigo-500/30 text-indigo-300 hover:text-white hover:bg-indigo-600/20 text-xs font-bold rounded-2xl transition-all flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4 text-purple-400" /> Ask Charlie AI
              </Link>
            </div>
          </div>

          {/* Right Column: Charlie Mascot & Speech Bubble Quote (Mobile-optimized Layout) */}
          <div className="relative flex flex-row md:flex-col items-center justify-center gap-3 shrink-0 pt-2 md:pt-0 w-full md:w-auto border-t md:border-t-0 border-slate-800/60">
            {/* Speech Bubble Quote */}
            <div className="relative px-3.5 py-2 bg-gradient-to-r from-indigo-900/90 to-purple-900/90 border border-indigo-500/30 rounded-2xl shadow-xl text-left md:text-center max-w-[200px] sm:max-w-[220px]">
              <p className="text-[10.5px] sm:text-[11.5px] font-bold text-indigo-200 leading-snug">
                "{
                  [
                    "Small daily progress leads to huge results! 🚀",
                    "Consistency is the key to mastering any subject! 💡",
                    "Don't just study hard, study smart with clear goals! 🧠",
                    "Every practice question brings you closer to an A+! 🎯",
                    "Stuck on a concept? Ask me anytime in AI Tutor! 🤖",
                    "Great achievements take time and daily dedication! ✨",
                    "Believe in yourself! You're making progress every day! 🔥"
                  ][new Date().getDate() % 7]
                }"
              </p>
            </div>

            {/* Charlie Mascot Image */}
            <div className="relative w-28 h-28 sm:w-44 sm:h-48 md:w-48 md:h-52 shrink-0 flex items-center justify-center">
              <img 
                src="/images/charlie-ai.png" 
                alt="Charlie" 
                className="w-full h-full object-contain filter drop-shadow-[0_10px_20px_rgba(99,102,241,0.25)] hover:scale-105 transition-transform duration-300"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Batch Name */}
        <div className="relative overflow-hidden bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 space-y-3 hover:border-indigo-500/30 transition-all shadow-lg backdrop-blur-md group">
          <div className="flex justify-between items-center">
            <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/20 text-indigo-400 group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-extrabold text-indigo-300 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
              BATCH
            </span>
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight truncate" title={studentBatchName}>
              {studentBatchName}
            </h3>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">Batch Name</p>
          </div>
        </div>

        {/* Attendance Rate */}
        <div className="relative overflow-hidden bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 space-y-3 hover:border-emerald-500/30 transition-all shadow-lg backdrop-blur-md group">
          <div className="flex justify-between items-center">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20 text-emerald-400 group-hover:scale-105 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            {attendanceRate > 0 && (
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                +8%
              </span>
            )}
          </div>
          <div>
            <h3 className="text-3xl font-extrabold text-white tracking-tight">
              {attendanceData ? <AnimatedCounter value={attendanceRate} /> : 'N/A'}%
            </h3>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">Attendance Rate</p>
            {attendanceData && (
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-3">
                <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${attendanceRate}%` }} />
              </div>
            )}
          </div>
        </div>

        {/* Overall Test Grade */}
        <div className="relative overflow-hidden bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 space-y-3 hover:border-purple-500/30 transition-all shadow-lg backdrop-blur-md group">
          <div className="flex justify-between items-center">
            <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center border border-purple-500/20 text-purple-400 group-hover:scale-105 transition-transform">
              <Award className="w-5 h-5" />
            </div>
            {grade !== 'N/A' && (
              <span className="text-[10px] font-bold text-purple-300 bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/20">
                Official
              </span>
            )}
          </div>
          <div>
            <h3 className="text-3xl font-extrabold text-white tracking-tight">
              {grade}
            </h3>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">Overall Grade</p>
            {avgScore > 0 && (
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-3">
                <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: `${avgScore}%` }} />
              </div>
            )}
          </div>
        </div>

        {/* Study Streak */}
        <div className="relative overflow-hidden bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 space-y-3 hover:border-amber-500/30 transition-all shadow-lg backdrop-blur-md group">
          <div className="flex justify-between items-center">
            <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center border border-amber-500/20 text-amber-400 group-hover:scale-105 transition-transform">
              <Zap className="w-5 h-5" />
            </div>
            {currentStreak > 0 && (
              <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                Record
              </span>
            )}
          </div>
          <div>
            <h3 className="text-3xl font-extrabold text-white tracking-tight">
              {currentStreak > 0 ? <AnimatedCounter value={currentStreak} /> : 'N/A'}{currentStreak > 0 ? 'd' : ''}
            </h3>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">Study Streak</p>
            {currentStreak > 0 && (
              <div className="flex gap-1.5 mt-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className={`w-3 h-3 rounded-full ${i < Math.min(currentStreak, 4) ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]' : 'bg-slate-800'}`} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>



      {/* Bottom Section: Test Results & Upcoming Agenda */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Resume Learning & Test Results */}
        <div className="space-y-6">
          
          {/* Resume Learning Card */}
          {fallbackResume && (
            <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-wider bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                  ⚡ Continue Course
                </span>
                <span className="text-xs font-bold text-indigo-300">
                  {fallbackResume.progress}% Completed
                </span>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-3.5 w-full sm:w-auto">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-950/80 border border-indigo-500/30 flex items-center justify-center shrink-0 text-indigo-400">
                    <Compass className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-bold text-white line-clamp-1">{fallbackResume.courseTitle}</h4>
                    <p className="text-[11px] text-slate-400">Enrolled: {new Date(fallbackResume.enrolledAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <Link 
                  href={`/dashboard/course/${fallbackResume.courseId}/learn`}
                  className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 shrink-0"
                >
                  <Play className="w-3.5 h-3.5 fill-white" /> Continue Lesson
                </Link>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-full rounded-full transition-all duration-500" style={{ width: `${fallbackResume.progress}%` }} />
              </div>
            </div>
          )}

          {/* My Test Results */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 shadow-xl space-y-5">
            <div className="flex justify-between items-center border-b border-slate-800/60 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-indigo-400" /> My Test Results
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Official scores and instructor feedback</p>
              </div>
              <Link href="/dashboard/tests" className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1">
                View All <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            
            {testResults.length > 0 ? (
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
                {testResults.map((res: any) => (
                  <div key={res.testId} className="bg-slate-950/60 border border-slate-800/60 hover:border-indigo-500/30 p-4 rounded-2xl transition-all space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-wider">{res.subjectName}</span>
                        <h4 className="text-sm font-bold text-white">{res.testTitle}</h4>
                      </div>
                      <div className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-center">
                        <span className="text-base font-extrabold text-indigo-300">{res.grade}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs border-t border-slate-800/40 pt-2.5 text-slate-300">
                      <span>Score: <strong className="text-white">{res.score} / {res.maxMarks}</strong></span>
                      <span className="text-slate-400 text-[11px]">{new Date(res.testDate).toLocaleDateString()}</span>
                    </div>

                    {res.feedback && (
                      <p className="text-xs text-slate-400 italic bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/40">
                        💬 "{res.feedback}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-10 border border-dashed border-slate-800 rounded-2xl">
                <Award className="w-10 h-10 text-slate-600 mb-2" />
                <p className="text-xs font-bold text-white">No Test Results Yet</p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-xs">Your offline assessment results will appear here once uploaded by your instructor.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Upcoming Schedule Agenda */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-5">
          <div className="flex justify-between items-center border-b border-slate-800/60 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-400" /> Upcoming Schedules
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Classes, tests, and events for this week</p>
            </div>
            {schedules.length > 0 && (
              <span className="text-[11px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2.5 py-0.5 rounded-full font-bold">
                {schedules.length} Event{schedules.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          
          {schedules.length > 0 ? (
            <div className="space-y-3.5 flex-1 overflow-y-auto max-h-[460px] pr-1 custom-scrollbar">
              {schedules.map((event: any) => (
                <div key={event.id} className="bg-slate-950/60 border border-slate-800/60 hover:border-indigo-500/30 p-4 rounded-2xl transition-all space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {event.eventType || 'CLASS'}
                    </span>
                    <span className="text-xs font-bold text-slate-400">
                      🗓 {new Date(event.eventDate).toLocaleDateString()}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white">{event.title}</h4>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800/40">
                    <span className="flex items-center gap-1 text-slate-300">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      {event.startTime?.substring(0, 5)} - {event.endTime?.substring(0, 5)}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {event.batchName ? `Batch: ${event.batchName}` : 'General'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3 py-16 border border-dashed border-slate-800 rounded-2xl">
              <Calendar className="w-10 h-10 text-slate-600" />
              <div>
                <p className="text-xs font-bold text-white">No Upcoming Schedules</p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-[220px]">You have no lectures or tests scheduled for this week.</p>
              </div>
            </div>
          )}
        </div>
      </div>
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
              href="/dashboard/instructor/auto-ta"
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

