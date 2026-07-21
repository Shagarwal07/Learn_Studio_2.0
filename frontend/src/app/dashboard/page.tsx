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
  PlusCircle,
  FileText,
  ClipboardList,
  Megaphone,
  ArrowUpRight,
  Zap,
  Folder,
  ChevronDown
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
  const totalQuizzes = quizAttempts.length;
  const avgScore = totalQuizzes 
    ? Math.round(quizAttempts.reduce((sum, a) => sum + ((a.score / a.totalQuestions) * 100), 0) / totalQuizzes) 
    : 0;

  // Grade derived from quiz avg for now
  const grade = avgScore >= 90 ? 'A+' : avgScore >= 80 ? 'A' : avgScore >= 70 ? 'B' : avgScore >= 60 ? 'C' : avgScore > 0 ? 'D' : 'N/A';

  const currentStreak = streakData 
    ? Math.max(streakData.currentOfflineStreak || 0, streakData.currentOnlineStreak || 0) 
    : 0;

  const attendanceRate = attendanceData ? Math.round(attendanceData.overallRate) : 0;

  const courses = enrollments || [];
  const totalUnlockedLessons = courses.reduce((sum, c) => sum + (c.completedLessons || 0), 0);
  const focusScore = attendanceRate > 0 && avgScore > 0 ? Math.round((attendanceRate + avgScore) / 2) : 0;
  
  const fallbackResume = courses.length > 0 ? courses[0] : null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8 max-w-6xl mx-auto text-foreground pb-20"
    >
      {/* Top Section: Welcome & Orb */}
      <div className="relative overflow-hidden glass-card p-5 sm:p-6 lg:p-10 rounded-2xl md:rounded-3xl border border-border-color shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-64 h-64 md:w-96 md:h-96 bg-accent-grape/15 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-3 max-w-xl text-center md:text-left">
          <span className="inline-flex items-center justify-center md:justify-start gap-1.5 text-[10px] font-bold text-success bg-success/10 px-3 py-1 rounded-full border border-success/20 uppercase tracking-wider mx-auto md:mx-0">
            <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" /> Learning Portal Active
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-5xl font-black tracking-tight text-foreground leading-tight">
            Welcome back,<br className="hidden md:block" /> {user?.name || 'Student'} 👋
          </h2>
          <p className="text-text-secondary text-xs sm:text-sm leading-relaxed mt-2">
            Continue your learning journey, track your progress and unlock certificates.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-3 sm:gap-4 pt-4">
            <Link href={fallbackResume ? `/dashboard/course/${fallbackResume.courseId}/learn` : '/courses'} className="w-full sm:w-auto justify-center px-6 py-3 bg-gradient-to-r from-accent-blue to-accent-grape text-white text-xs font-bold rounded-full shadow-lg hover:scale-105 transition-transform flex items-center gap-2">
              <Play className="w-4 h-4" /> Continue Learning
            </Link>
            <Link href="/dashboard/ai" className="w-full sm:w-auto justify-center px-6 py-3 bg-black/5 dark:bg-white/5 border border-border-color text-foreground text-xs font-bold rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors flex items-center gap-2">
              <Zap className="w-4 h-4" /> Ask AI Tutor
            </Link>
          </div>
        </div>

        {/* Profile Avatar Widget */}
        <div className="relative z-10 w-40 h-40 md:w-48 md:h-48 shrink-0 mx-auto md:mx-0 flex items-center justify-center mt-6 md:mt-0">
          <input type="file" id="avatarUpload" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          <div className="absolute inset-0 bg-gradient-to-br from-accent-grape to-primary-blue rounded-full blur-xl opacity-20 mix-blend-screen" />
          <label htmlFor="avatarUpload" className="relative w-full h-full rounded-full border-[6px] border-[#121623] shadow-2xl overflow-hidden bg-[#1E2335] cursor-pointer group block">
            {isUploadingAvatar && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#121623]/80 backdrop-blur-sm">
                <Loader2 className="w-8 h-8 text-accent-grape animate-spin mb-2" />
                <span className="text-[10px] font-bold text-white uppercase tracking-widest">Uploading...</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
              <span className="text-xs font-bold text-white bg-black/50 px-3 py-1 rounded-full">Change Picture</span>
            </div>
            {(user as any)?.avatarUrl ? (
              <img src={(user as any).avatarUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-text-muted">
                <Users className="w-12 h-12 mb-2 opacity-50 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">No Avatar</span>
              </div>
            )}
          </label>
          {/* Floating badge */}
          <div className="absolute bottom-2 -left-2 bg-[#1E2335] border border-border-color rounded-full p-2.5 shadow-xl z-20">
            <CheckCircle2 className="w-5 h-5 text-success" />
          </div>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {/* Grade */}
        <div className="glass-card p-4 sm:p-6 rounded-2xl md:rounded-3xl space-y-3 sm:space-y-4 border border-border-color relative overflow-hidden">
          <div className="w-10 h-10 bg-accent-grape/20 rounded-xl flex items-center justify-center border border-accent-grape/30">
            <BookOpen className="w-5 h-5 text-accent-grape" />
          </div>
          <div>
            {grade !== 'N/A' ? (
              <h3 className="text-4xl font-black text-foreground">{grade}</h3>
            ) : (
              <h3 className="text-lg font-bold text-text-muted">N/A</h3>
            )}
            <p className="text-[10px] font-extrabold text-text-muted uppercase tracking-wider mt-2">GRADE</p>
          </div>
        </div>

        {/* Attendance */}
        <div className="glass-card p-4 sm:p-6 rounded-2xl md:rounded-3xl space-y-3 sm:space-y-4 border border-border-color relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 bg-secondary-blue/20 rounded-xl flex items-center justify-center border border-secondary-blue/30">
              <CheckCircle2 className="w-5 h-5 text-secondary-blue" />
            </div>
            {attendanceRate > 0 && <span className="bg-success/20 text-success text-[10px] font-bold px-2 py-0.5 rounded-full border border-success/30">+8%</span>}
          </div>
          <div>
            {attendanceData ? (
              <h3 className="text-4xl font-black text-foreground"><AnimatedCounter value={attendanceRate} />%</h3>
            ) : (
              <h3 className="text-lg font-bold text-text-muted">N/A</h3>
            )}
            <p className="text-[10px] font-extrabold text-text-muted uppercase tracking-wider mt-2">Attendance</p>
            {attendanceData && (
              <div className="w-full bg-bg-secondary-dark h-1.5 rounded-full overflow-hidden mt-3">
                <div className="bg-secondary-blue h-full rounded-full" style={{ width: `${attendanceRate}%` }} />
              </div>
            )}
          </div>
        </div>

        {/* Average Quiz Score */}
        <div className="glass-card p-4 sm:p-6 rounded-2xl md:rounded-3xl space-y-3 sm:space-y-4 border border-border-color relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 bg-accent-grape/20 rounded-xl flex items-center justify-center border border-accent-grape/30">
              <Award className="w-5 h-5 text-accent-grape" />
            </div>
            {avgScore > 0 && <span className="bg-success/20 text-success text-[10px] font-bold px-2 py-0.5 rounded-full border border-success/30">top 6%</span>}
          </div>
          <div>
            {totalQuizzes > 0 ? (
              <h3 className="text-4xl font-black text-foreground"><AnimatedCounter value={avgScore} /></h3>
            ) : (
              <h3 className="text-lg font-bold text-text-muted">N/A</h3>
            )}
            <p className="text-[10px] font-extrabold text-text-muted uppercase tracking-wider mt-2">Average Quiz Score</p>
            {totalQuizzes > 0 && (
              <div className="w-full bg-bg-secondary-dark h-1.5 rounded-full overflow-hidden mt-3">
                <div className="bg-gradient-to-r from-accent-grape to-accent-blue h-full rounded-full" style={{ width: `${avgScore}%` }} />
              </div>
            )}
          </div>
        </div>

        {/* Study Streak */}
        <div className="glass-card p-4 sm:p-6 rounded-2xl md:rounded-3xl space-y-3 sm:space-y-4 border border-border-color relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 bg-warning/20 rounded-xl flex items-center justify-center border border-warning/30">
              <Zap className="w-5 h-5 text-warning" />
            </div>
            {currentStreak > 0 && <span className="bg-warning/20 text-warning text-[10px] font-bold px-2 py-0.5 rounded-full border border-warning/30">record</span>}
          </div>
          <div>
            {currentStreak > 0 ? (
              <h3 className="text-4xl font-black text-foreground"><AnimatedCounter value={currentStreak} />d</h3>
            ) : (
              <h3 className="text-lg font-bold text-text-muted">N/A</h3>
            )}
            <p className="text-[10px] font-extrabold text-text-muted uppercase tracking-wider mt-2">Study Streak</p>
            {currentStreak > 0 && (
              <div className="flex gap-1.5 mt-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className={`w-3 h-3 rounded-full ${i < Math.min(currentStreak, 4) ? 'bg-warning shadow-[0_0_8px_rgba(234,179,8,0.5)]' : 'bg-white/5'}`} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-center pt-2 pb-4">
        <button 
          onClick={() => setIsExpanded(!isExpanded)} 
          className="flex items-center gap-2 px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-border-color rounded-full text-xs font-bold text-text-secondary hover:text-white transition-all shadow-sm"
        >
          {isExpanded ? 'Hide Full Analytics' : 'View Full Analytics'}
          <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
        </button>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="overflow-hidden space-y-8"
          >
            {/* D3 Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 h-64">
          <CourseCompletionDonut />
        </div>
        <div className="lg:col-span-2 h-64">
          <WeeklyActivityChart quizAttempts={quizAttempts} />
        </div>
        <div className="lg:col-span-1 h-64">
          <AttendanceGrid attendanceData={attendanceData} />
        </div>
      </div>

      {/* Bottom Section: Resume Learning & Upcoming & AI */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Resume Learning + AI Assistant */}
        <div className="space-y-6">
          {/* Locked Course / Resume Learning */}
          {fallbackResume ? (
            <div className="glass-card p-6 rounded-3xl flex flex-col sm:flex-row gap-6 border border-border-color items-center">
              <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-[#2E1A47] to-[#121623] flex flex-col items-center justify-center border border-accent-grape/20 shrink-0 relative overflow-hidden">
                <div className="absolute top-4 left-4 w-12 h-12 bg-white/10 rounded-full blur-xl" />
                <Compass className="w-10 h-10 text-white mb-2" />
                <span className="text-xs font-bold text-white text-center px-2 line-clamp-2">{fallbackResume.courseTitle}</span>
              </div>
              <div className="flex-1 space-y-3 w-full">
                <div className="flex justify-between items-start">
                  <span className="text-[9px] font-extrabold text-accent-grape uppercase tracking-wider">Resume Learning</span>
                  <span className="bg-success/10 text-success text-[10px] font-bold px-2 py-0.5 rounded-full border border-success/20">Active</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white leading-tight line-clamp-2">{fallbackResume.courseTitle}</h3>
                <p className="text-[11px] text-text-secondary">Enrolled: {new Date(fallbackResume.enrolledAt).toLocaleDateString()}</p>
                
                <div className="pt-2">
                  <div className="flex justify-between text-[10px] font-bold text-white mb-1.5">
                    <span>Progress</span>
                    <span>{fallbackResume.progress}%</span>
                  </div>
                  <div className="w-full bg-bg-secondary-dark h-2 rounded-full overflow-hidden">
                    <div className="bg-secondary-blue h-full rounded-full" style={{ width: `${fallbackResume.progress}%` }} />
                  </div>
                </div>

                <div className="pt-2">
                  <Link href={`/dashboard/course/${fallbackResume.courseId}/learn`} className="inline-block px-4 py-2 bg-white/5 border border-border-color text-white text-xs font-bold rounded-xl hover:bg-white/10 transition-colors">
                    Continue lesson
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card p-6 rounded-3xl flex flex-col items-center justify-center text-center gap-4 border border-border-color h-48">
              <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center">
                <Compass className="w-6 h-6 text-text-muted" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">No Active Courses</h3>
                <p className="text-[10px] text-text-secondary mt-1">Enroll in a course to track your online learning progress here.</p>
              </div>
              <Link href="/courses" className="px-4 py-2 bg-accent-grape/20 text-accent-grape border border-accent-grape/30 text-xs font-bold rounded-xl hover:bg-accent-grape/30 transition-colors">
                Explore Courses
              </Link>
            </div>
          )}

          {/* AI Study Assistant */}
          <div className="glass-card p-6 rounded-3xl border border-border-color relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent-blue/5 rounded-full blur-3xl pointer-events-none" />
            <div className="flex flex-col sm:flex-row gap-8 relative z-10">
              <div className="space-y-4 flex-1">
                <div className="w-10 h-10 bg-accent-grape/20 rounded-xl flex items-center justify-center border border-accent-grape/30">
                  <Zap className="w-5 h-5 text-accent-grape" />
                </div>
                <h3 className="text-2xl font-black text-white">AI Study Assistant</h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Turn any lesson into notes, quizzes, explanations, summaries, and voice-guided tutoring in seconds.
                </p>
                <Link href="/dashboard/ai" className="inline-flex px-5 py-2.5 bg-accent-grape text-white text-xs font-bold rounded-xl shadow-lg shadow-accent-grape/20 hover:scale-[1.02] transition-transform">
                  <Zap className="w-3.5 h-3.5 mr-1.5" /> Open AI Assistant
                </Link>
              </div>
              
              <div className="grid grid-cols-2 gap-3 shrink-0">
                <button className="px-4 py-3 bg-[#1E2335] border border-border-color text-white text-[10px] font-bold rounded-xl hover:border-accent-grape/50 transition-colors flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-accent-grape" /> Generate Notes
                </button>
                <button className="px-4 py-3 bg-[#1E2335] border border-border-color text-white text-[10px] font-bold rounded-xl hover:border-secondary-blue/50 transition-colors flex items-center gap-2">
                  <Compass className="w-3.5 h-3.5 text-secondary-blue" /> Explain Topic
                </button>
                <button className="px-4 py-3 bg-[#1E2335] border border-border-color text-white text-[10px] font-bold rounded-xl hover:border-success/50 transition-colors flex items-center gap-2">
                  <ClipboardList className="w-3.5 h-3.5 text-success" /> Create Quiz
                </button>
                <button className="px-4 py-3 bg-[#1E2335] border border-border-color text-white text-[10px] font-bold rounded-xl hover:border-warning/50 transition-colors flex items-center gap-2">
                  <Award className="w-3.5 h-3.5 text-warning" /> Ask Doubt
                </button>
                <button className="px-4 py-3 bg-[#1E2335] border border-border-color text-white text-[10px] font-bold rounded-xl hover:border-accent-blue/50 transition-colors flex items-center gap-2 col-span-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-accent-blue" /> Summarize Lesson
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Upcoming Classes */}
        <div className="glass-card p-6 rounded-3xl border border-border-color flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-extrabold text-white">Upcoming Classes</h3>
            {schedules.length > 0 && (
              <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-white font-bold">{schedules.length} Event{schedules.length !== 1 ? 's' : ''}</span>
            )}
          </div>
          
          {schedules.length > 0 ? (
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[5px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-accent-grape before:via-border-color before:to-transparent flex-1 overflow-y-auto pr-2 custom-scrollbar max-h-[500px]">
              {schedules.map((event: any, idx: number) => {
                const colors = ['bg-accent-grape', 'bg-secondary-blue', 'bg-success', 'bg-warning'];
                const colorClass = colors[idx % colors.length];
                const textColors = ['text-accent-grape', 'text-secondary-blue', 'text-success', 'text-warning'];
                const textColorClass = textColors[idx % textColors.length];

                return (
                  <div key={event.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group hover:bg-white/5 p-3 -mx-3 rounded-xl transition-colors">
                    <div className={`flex items-center justify-center w-3 h-3 rounded-full border-2 border-background ${colorClass} shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 relative z-10`} />
                    <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] pl-4 md:p-0 md:group-even:text-right">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${textColorClass}`}>
                        {new Date(event.eventDate).toLocaleDateString()} • {event.startTime.substring(0, 5)} - {event.endTime.substring(0, 5)}
                      </span>
                      <h4 className="text-sm font-bold text-white mt-1 group-hover:text-accent-blue transition-colors">{event.title}</h4>
                      <p className="text-[10px] text-text-muted mt-1 truncate">
                        {event.batchName ? `Batch: ${event.batchName}` : 'General Session'} 
                        {event.subjectName ? ` • ${event.subjectName}` : ''}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3 py-12 border border-dashed border-border-color rounded-2xl">
              <Calendar className="w-8 h-8 text-text-muted" />
              <div>
                <p className="text-xs font-bold text-white">No Upcoming Classes</p>
                <p className="text-[10px] text-text-muted mt-1 max-w-[200px] mx-auto">You have no offline lectures scheduled for this week.</p>
              </div>
            </div>
          )}
        </div>
      </div>
          </motion.div>
        )}
      </AnimatePresence>
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
      <div className="relative overflow-hidden bg-gradient-to-r from-bg-secondary-dark via-card-dark to-surface-dark p-6 lg:p-10 rounded-3xl border border-border-color shadow-2xl">
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-80 h-80 bg-accent-grape/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-1/3 w-64 h-64 bg-primary-blue/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-3">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-accent-blue bg-accent-blue/10 px-3 py-1 rounded-full border border-accent-blue/25 uppercase tracking-wider">
            Academic Operations Panel
          </span>
          <h2 className="text-2xl lg:text-3xl font-black tracking-tight text-white">
            Welcome back, {user?.name}. 👋
          </h2>
          <p className="text-text-secondary text-xs sm:text-sm max-w-xl leading-relaxed">
            Coordinate your offline batches, track attendance records, upload secure PDF study notes, and manage homework tasks from your unified control panel.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card hover-lift p-6 rounded-3xl flex items-center gap-5">
          <div className="w-12 h-12 bg-accent-grape/10 text-accent-grape border border-accent-grape/20 rounded-2xl flex items-center justify-center shadow-[0_0_15px_rgba(150,52,132,0.15)]">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-text-muted uppercase tracking-wider">Active Batches</p>
            <h3 className="text-2xl font-black text-white mt-1">
              {isBatchesLoading ? '...' : <AnimatedCounter value={batches.length} />}
            </h3>
          </div>
        </div>

        <div className="glass-card hover-lift p-6 rounded-3xl flex items-center gap-5">
          <div className="w-12 h-12 bg-primary-blue/10 text-secondary-blue border border-primary-blue/20 rounded-2xl flex items-center justify-center shadow-[0_0_15px_rgba(48,102,190,0.15)]">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-text-muted uppercase tracking-wider">Total Students</p>
            <h3 className="text-2xl font-black text-white mt-1">
              {isBatchesLoading ? '...' : <AnimatedCounter value={totalStudents} />}
            </h3>
          </div>
        </div>

        <div className="glass-card hover-lift p-6 rounded-3xl flex items-center gap-5">
          <div className="w-12 h-12 bg-success/10 text-success border border-success/20 rounded-2xl flex items-center justify-center shadow-[0_0_15px_rgba(34,197,94,0.15)]">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-text-muted uppercase tracking-wider">Lectures Today</p>
            <h3 className="text-2xl font-black text-white mt-1">
              {isSchedulesLoading ? '...' : <AnimatedCounter value={todaySchedules.length} />}
            </h3>
          </div>
        </div>
      </div>

      {/* Quick Action Panel & Today's Classes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Quick Actions (4 cols) */}
        <div className="lg:col-span-4 glass-card p-6 rounded-3xl space-y-5">
          <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">
            Quick Actions
          </h3>
          <div className="flex flex-col gap-3">
            <Link 
              href="/dashboard/instructor/batches?tab=attendance"
              className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 border border-border-color rounded-xl text-xs font-semibold transition-all text-text-secondary hover:text-white group cursor-pointer"
            >
              <span className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4.5 h-4.5 text-accent-grape" />
                Mark Attendance
              </span>
              <ArrowRight className="w-4 h-4 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
            </Link>

            <Link 
              href="/dashboard/instructor/batches?tab=notes"
              className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 border border-border-color rounded-xl text-xs font-semibold transition-all text-text-secondary hover:text-white group cursor-pointer"
            >
              <span className="flex items-center gap-2.5">
                <FileText className="w-4.5 h-4.5 text-accent-grape" />
                Upload PDF Notes
              </span>
              <ArrowRight className="w-4 h-4 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
            </Link>

            <Link 
              href="/dashboard/instructor/batches?tab=homework"
              className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 border border-border-color rounded-xl text-xs font-semibold transition-all text-text-secondary hover:text-white group cursor-pointer"
            >
              <span className="flex items-center gap-2.5">
                <ClipboardList className="w-4.5 h-4.5 text-accent-grape" />
                Post Homework Task
              </span>
              <ArrowRight className="w-4 h-4 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
            </Link>

            <Link 
              href="/dashboard/instructor/announcements"
              className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 border border-border-color rounded-xl text-xs font-semibold transition-all text-text-secondary hover:text-white group cursor-pointer"
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
                className="w-full flex items-center justify-between p-3 bg-indigo-650/10 hover:bg-indigo-650/20 disabled:opacity-50 border border-indigo-500/20 rounded-xl text-xs font-semibold transition-all text-indigo-300 hover:text-white cursor-pointer group"
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
        <div className="lg:col-span-8 glass-card p-6 rounded-3xl space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">
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
                <div key={event.id} className="p-4 bg-white/5 border border-border-color rounded-2xl flex items-center justify-between gap-4 shadow-sm hover:border-accent-grape/35 hover:bg-white/10 transition-all duration-300">
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

