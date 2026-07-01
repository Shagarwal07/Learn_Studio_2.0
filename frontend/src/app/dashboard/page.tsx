'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
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
  Folder
} from 'lucide-react';

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

// Donut Chart representing Overall Course Progress
function OverallProgressDonut({ courses }: { courses: EnrolledCourse[] }) {
  const total = courses.length;
  const completed = courses.filter(c => c.progress === 100).length;
  const inProgress = courses.filter(c => c.progress > 0 && c.progress < 100).length;
  const notStarted = courses.filter(c => c.progress === 0).length;

  // Compute percentages
  const completedPct = total ? Math.round((completed / total) * 100) : 78;
  const inProgressPct = total ? Math.round((inProgress / total) * 100) : 15;
  const notStartedPct = total ? Math.round((notStarted / total) * 100) : 7;

  // Average progress across all courses
  const avgProgress = total ? Math.round(courses.reduce((sum, c) => sum + c.progress, 0) / total) : 78;

  // SVG parameters
  const radius = 45;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;

  // Segment lengths
  const completedStroke = (completedPct / 100) * circumference;
  const inProgressStroke = (inProgressPct / 100) * circumference;
  const notStartedStroke = (notStartedPct / 100) * circumference;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6 bg-card-bg/25 dark:bg-card-bg/10 rounded-3xl border border-border-color h-full">
      <div className="relative w-36 h-36 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90">
          {/* Base track */}
          <circle
            cx="72"
            cy="72"
            r={radius}
            className="stroke-border-color"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Completed Segment (Grape Soda) */}
          {completedStroke > 0 && (
            <circle
              cx="72"
              cy="72"
              r={radius}
              className="stroke-accent-grape"
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - completedStroke}
              strokeLinecap="round"
              style={{ filter: 'drop-shadow(0 0 4px rgba(150,52,132,0.45))' }}
            />
          )}
          {/* In Progress Segment (Primary Blue) */}
          {inProgressStroke > 0 && (
            <circle
              cx="72"
              cy="72"
              r={radius}
              className="stroke-secondary-blue"
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - inProgressStroke}
              strokeLinecap="round"
              style={{ 
                transformOrigin: '72px 72px',
                transform: `rotate(${ (completedPct / 100) * 360 }deg)`,
                filter: 'drop-shadow(0 0 4px rgba(96,175,255,0.45))'
              }}
            />
          )}
          {/* Not Started Segment */}
          {notStartedStroke > 0 && (
            <circle
              cx="72"
              cy="72"
              r={radius}
              className="stroke-text-muted/30"
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - notStartedStroke}
              strokeLinecap="round"
              style={{ 
                transformOrigin: '72px 72px',
                transform: `rotate(${ ((completedPct + inProgressPct) / 100) * 360 }deg)`
              }}
            />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-black text-white leading-none">
            {avgProgress}%
          </span>
          <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider mt-1.5">
            Completed
          </span>
        </div>
      </div>

      <div className="space-y-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-accent-grape shadow-[0_0_8px_rgba(150,52,132,0.6)]" />
          <div>
            <p className="text-xs font-black text-white">{completedPct}%</p>
            <p className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Completed</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-secondary-blue shadow-[0_0_8px_rgba(96,175,255,0.6)]" />
          <div>
            <p className="text-xs font-black text-white">{inProgressPct}%</p>
            <p className="text-[9px] font-bold text-text-muted uppercase tracking-wider">In Progress</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-text-muted/40" />
          <div>
            <p className="text-xs font-black text-white">{notStartedPct}%</p>
            <p className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Not Started</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Vector Line Chart with Gradient fill under curve for Quiz scores
function QuizPerformanceChart({ attempts }: { attempts: any[] }) {
  const dataPoints = attempts.length >= 2 
    ? attempts.map((a, idx) => ({
        label: new Date(a.attemptedAt || Date.now()).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        score: Math.round((a.score / a.totalQuestions) * 100)
      })).slice(-6)
    : [
        { label: 'May 20', score: 60 },
        { label: 'May 21', score: 75 },
        { label: 'May 22', score: 70 },
        { label: 'May 23', score: 82 },
        { label: 'May 24', score: 80 },
        { label: 'May 25', score: 90 }
      ];

  const width = 320;
  const height = 150;
  const padding = 20;

  const points = dataPoints.map((d, idx) => {
    const x = padding + (idx * (width - 2 * padding)) / (dataPoints.length - 1);
    const y = height - padding - (d.score * (height - 2 * padding)) / 100;
    return { x, y, score: d.score, label: d.label };
  });

  let dPath = '';
  if (points.length > 0) {
    dPath = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpX1 = p0.x + (p1.x - p0.x) / 2;
      const cpY1 = p0.y;
      const cpX2 = p0.x + (p1.x - p0.x) / 2;
      const cpY2 = p1.y;
      dPath += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
    }
  }

  const areaPath = dPath 
    ? `${dPath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`
    : '';

  return (
    <div className="p-6 bg-card-bg/25 dark:bg-card-bg/10 rounded-3xl border border-border-color h-full flex flex-col justify-between relative overflow-hidden">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">Quiz Performance</h4>
          <p className="text-[10px] text-text-muted mt-0.5">Average score over recent attempts</p>
        </div>
        {attempts.length < 2 && (
          <span className="text-[8px] bg-accent-grape/10 text-accent-grape border border-accent-grape/20 px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">
            Demo Trend
          </span>
        )}
      </div>

      <div className="relative w-full h-40 mt-4 flex items-center justify-center">
        <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#963484" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#3066BE" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#963484" />
              <stop offset="100%" stopColor="#60AFFF" />
            </linearGradient>
          </defs>

          {/* Grid Lines */}
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
          <line x1={padding} y1={height/2} x2={width - padding} y2={height/2} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

          {/* Fill area under curve */}
          {areaPath && (
            <path d={areaPath} fill="url(#chartGradient)" />
          )}

          {/* Vector bezier path */}
          {dPath && (
            <path
              d={dPath}
              fill="none"
              stroke="url(#lineGradient)"
              strokeWidth="3"
              strokeLinecap="round"
              style={{ filter: 'drop-shadow(0 4px 8px rgba(150,52,132,0.3))' }}
            />
          )}

          {/* Nodes */}
          {points.map((p, idx) => (
            <g key={idx} className="group cursor-pointer">
              <circle
                cx={p.x}
                cy={p.y}
                r="5"
                className="fill-background stroke-secondary-blue"
                strokeWidth="2"
              />
              <circle
                cx={p.x}
                cy={p.y}
                r="2"
                className="fill-accent-grape"
              />
              <title>{`${p.label}: ${p.score}%`}</title>
            </g>
          ))}
        </svg>
      </div>

      <div className="flex justify-between text-[9px] font-bold text-text-muted uppercase tracking-wider mt-2 px-1">
        {dataPoints.map((d, idx) => (
          <span key={idx}>{d.label}</span>
        ))}
      </div>
    </div>
  );
}

// Subject-Wise Progress mapping to Enrolled Courses
function SubjectPerformance({ courses }: { courses: EnrolledCourse[] }) {
  const subjects = courses.length > 0
    ? courses.map((c, idx) => {
        const colors = [
          { bar: 'bg-success', glow: 'shadow-[0_0_10px_rgba(34,197,94,0.35)]' },
          { bar: 'bg-primary-blue', glow: 'shadow-[0_0_10px_rgba(48,102,190,0.35)]' },
          { bar: 'bg-warning', glow: 'shadow-[0_0_10px_rgba(234,179,8,0.35)]' },
          { bar: 'bg-accent-grape', glow: 'shadow-[0_0_10px_rgba(150,52,132,0.35)]' },
          { bar: 'bg-error', glow: 'shadow-[0_0_10px_rgba(239,68,68,0.35)]' }
        ];
        const color = colors[idx % colors.length];
        return {
          title: c.courseTitle,
          progress: c.progress,
          color
        };
      }).slice(0, 5)
    : [
        { title: 'Mathematics', progress: 85, color: { bar: 'bg-success', glow: 'shadow-[0_0_10px_rgba(34,197,94,0.35)]' } },
        { title: 'Physics', progress: 72, color: { bar: 'bg-primary-blue', glow: 'shadow-[0_0_10px_rgba(48,102,190,0.35)]' } },
        { title: 'Chemistry', progress: 60, color: { bar: 'bg-warning', glow: 'shadow-[0_0_10px_rgba(234,179,8,0.35)]' } },
        { title: 'English', progress: 90, color: { bar: 'bg-accent-grape', glow: 'shadow-[0_0_10px_rgba(150,52,132,0.35)]' } },
        { title: 'Computer Science', progress: 45, color: { bar: 'bg-error', glow: 'shadow-[0_0_10px_rgba(239,68,68,0.35)]' } }
      ];

  return (
    <div className="p-6 bg-card-bg/25 dark:bg-card-bg/10 rounded-3xl border border-border-color h-full flex flex-col justify-between">
      <div>
        <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">Subject Wise Performance</h4>
        <p className="text-[10px] text-text-muted mt-0.5">Progress across active courses</p>
      </div>

      <div className="space-y-4 mt-6">
        {subjects.map((s, idx) => (
          <div key={idx} className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-bold text-text-secondary">
              <span className="truncate max-w-[210px] text-white font-black">{s.title}</span>
              <span className="text-white">{s.progress}%</span>
            </div>
            <div className="w-full bg-bg-secondary-dark h-2 rounded-full overflow-hidden border border-border-color">
              <div
                className={`${s.color.bar} h-full rounded-full transition-all duration-500 ${s.color.glow}`}
                style={{ width: `${s.progress}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Sparkline statistics block matching mock bottom row
function StatsRow({ 
  quizAttempts = [], 
  streakData 
}: { 
  quizAttempts?: any[]; 
  streakData?: any 
}) {
  const totalQuizzes = quizAttempts.length;
  
  const avgScore = totalQuizzes 
    ? Math.round(quizAttempts.reduce((sum, a) => sum + ((a.score / a.totalQuestions) * 100), 0) / totalQuizzes) 
    : 72;

  const correctAnswers = totalQuizzes 
    ? quizAttempts.reduce((sum, a) => sum + a.score, 0) 
    : 342;

  const currentStreak = streakData 
    ? Math.max(streakData.currentOfflineStreak || 0, streakData.currentOnlineStreak || 0) 
    : 12;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Stat 1: Total Quizzes */}
      <div className="glass-card hover-lift p-6 rounded-3xl space-y-2">
        <p className="text-[10px] font-extrabold text-text-muted uppercase tracking-wider">Total Quizzes</p>
        <h3 className="text-3xl font-black text-white">
          <AnimatedCounter value={totalQuizzes || 24} />
        </h3>
        <span className="inline-flex items-center text-[10px] font-bold text-success gap-1">
          <span>↗ 12%</span> <span className="text-text-muted font-semibold">vs last week</span>
        </span>
      </div>

      {/* Stat 2: Average Score */}
      <div className="glass-card hover-lift p-6 rounded-3xl space-y-2">
        <p className="text-[10px] font-extrabold text-text-muted uppercase tracking-wider">Average Score</p>
        <h3 className="text-3xl font-black text-white">
          <AnimatedCounter value={avgScore} />%
        </h3>
        <span className="inline-flex items-center text-[10px] font-bold text-success gap-1">
          <span>↗ 8%</span> <span className="text-text-muted font-semibold">vs last week</span>
        </span>
      </div>

      {/* Stat 3: Correct Answers */}
      <div className="glass-card hover-lift p-6 rounded-3xl space-y-2">
        <p className="text-[10px] font-extrabold text-text-muted uppercase tracking-wider">Correct Answers</p>
        <h3 className="text-3xl font-black text-white">
          <AnimatedCounter value={correctAnswers} />
        </h3>
        <span className="inline-flex items-center text-[10px] font-bold text-success gap-1">
          <span>↗ 15%</span> <span className="text-text-muted font-semibold">vs last week</span>
        </span>
      </div>

      {/* Stat 4: Study Streak */}
      <div className="glass-card hover-lift p-6 rounded-3xl space-y-2">
        <p className="text-[10px] font-extrabold text-text-muted uppercase tracking-wider">Study Streak</p>
        <h3 className="text-3xl font-black text-white">
          <AnimatedCounter value={currentStreak} /> Days
        </h3>
        <span className="inline-flex items-center text-[10px] font-bold text-accent-grape gap-1">
          <span>🔥</span> <span className="text-text-muted font-semibold">Keep it up!</span>
        </span>
      </div>
    </div>
  );
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

  // Redirect if logged-in user is an Instructor or Admin
  if (user?.role === 'INSTRUCTOR' || user?.role === 'ADMIN') {
    return <InstructorDashboardView />;
  }

  // 1. Fetch enrolled courses
  const { data: enrollments, isLoading, error } = useQuery<EnrolledCourse[]>({
    queryKey: ['my-enrollments'],
    enabled: user?.role === 'STUDENT',
    queryFn: async () => {
      const response = await api.get('/enrollments/my');
      return response.data.success ? response.data.data : [];
    },
  });

  // 2. Fetch actual Resume Learning state
  const { data: resumeState } = useQuery<any>({
    queryKey: ['resume-state'],
    enabled: user?.role === 'STUDENT',
    queryFn: async () => {
      const response = await api.get('/enrollments/resume');
      return response.data.success ? response.data.data : null;
    }
  });

  // 3. Fetch attendance summary
  const { data: attendanceData } = useQuery<any>({
    queryKey: ['student-attendance-summary'],
    enabled: user?.role === 'STUDENT',
    queryFn: async () => {
      const response = await api.get('/student/attendance/summary');
      return response.data.success ? response.data.data : null;
    },
  });

  // 4. Fetch attendance streak
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

  if (isLoading) {
    return (
      <div className="space-y-8 max-w-6xl mx-auto">
        <div className="h-40 bg-gradient-to-r from-bg-secondary-dark to-card-dark rounded-3xl animate-pulse border border-border-color" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-28 bg-card-dark rounded-3xl border border-border-color animate-pulse" />
          <div className="h-28 bg-card-dark rounded-3xl border border-border-color animate-pulse" />
          <div className="h-28 bg-card-dark rounded-3xl border border-border-color animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-56 bg-card-dark rounded-3xl border border-border-color animate-pulse" />
          <div className="lg:col-span-1 h-56 bg-card-dark rounded-3xl border border-border-color animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-error/5 border border-error/15 rounded-3xl text-center max-w-xl mx-auto space-y-4">
        <h3 className="font-bold text-error text-lg">Failed to load dashboard data.</h3>
        <p className="text-xs text-text-secondary leading-relaxed">
          Please verify if the Spring Boot backend server is running and try again.
        </p>
      </div>
    );
  }

  const courses = enrollments || [];
  const completedCourses = courses.filter(c => c.progress === 100);
  const activeCourses = courses.filter(c => c.progress < 100);
  const fallbackResume = courses.find(c => c.progress > 0 && c.progress < 100) || courses[0];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8 max-w-6xl mx-auto text-foreground"
    >
      
      {/* Welcome banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-bg-secondary-dark via-card-dark to-surface-dark p-6 lg:p-10 rounded-3xl border border-border-color shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-80 h-80 bg-accent-grape/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-1/3 w-64 h-64 bg-primary-blue/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-3 max-w-xl">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-accent-blue bg-accent-blue/10 px-3 py-1 rounded-full border border-accent-blue/25 uppercase tracking-wider">
            Learning Portal Active
          </span>
          <h2 className="text-2xl lg:text-3xl font-black tracking-tight text-white">
            Welcome back, {user?.name}. 👋
          </h2>
          <p className="text-text-secondary text-xs sm:text-sm leading-relaxed">
            Check your progress, consult the AI assistant to clear doubts, and complete your lessons to earn certificates.
          </p>
        </div>

        {/* Studying Teddy Cartoon Illustration */}
        <motion.div 
          animate={{ y: [0, -8, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          className="relative z-10 w-24 h-24 sm:w-28 sm:h-28 shrink-0 mx-auto md:mx-0 select-none hidden sm:block"
        >
          <img 
            src="/images/study-teddy.png" 
            alt="Studying Teddy Bear"
            className="w-full h-full object-contain filter drop-shadow-[0_0_20px_rgba(150,52,132,0.3)]" 
          />
        </motion.div>
      </div>

      {/* PROGRESS & ANALYTICS HEADER */}
      <div className="space-y-2">
        <h3 className="text-lg sm:text-xl font-extrabold tracking-tight text-white uppercase flex items-center gap-2">
          <Zap className="w-5 h-5 text-accent-grape" />
          Progress & Analytics
        </h3>
        <p className="text-xs text-text-muted">A premium visualization of your course milestones and quiz accomplishments</p>
      </div>

      {/* PROGRESS & ANALYTICS WIDGETS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <OverallProgressDonut courses={courses} />
        </div>
        <div className="lg:col-span-1">
          <QuizPerformanceChart attempts={quizAttempts} />
        </div>
        <div className="lg:col-span-1">
          <SubjectPerformance courses={courses} />
        </div>
      </div>

      {/* Bottom row stats */}
      <StatsRow quizAttempts={quizAttempts} streakData={streakData} />

      {/* Resume Learning & Attendance Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Resume Learning Card (Col span 2) */}
        <div className="lg:col-span-2">
          {(resumeState || fallbackResume) && (
            <div className="h-full glass-card hover-lift p-6 rounded-3xl flex flex-col justify-between gap-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary-blue/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="space-y-4">
                <div className="inline-flex items-center gap-1.5 text-[10px] bg-accent-grape/10 text-accent-grape border border-accent-grape/20 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                  <Clock className="w-3.5 h-3.5 animate-pulse" /> Resume Learning
                </div>
                <h4 className="text-lg sm:text-xl font-black text-white">
                  {resumeState ? resumeState.courseTitle : fallbackResume.courseTitle}
                </h4>
                {resumeState?.lessonTitle && (
                  <p className="text-xs text-text-secondary">
                    Last viewed: <strong className="text-white">{resumeState.lessonTitle}</strong>
                  </p>
                )}
                
                <div className="flex items-center gap-4 pt-2">
                  <div className="flex-1 max-w-xs bg-bg-secondary-dark h-2 rounded-full overflow-hidden border border-border-color">
                    <div 
                      className="bg-gradient-to-r from-accent-grape to-primary-blue h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(150,52,132,0.5)]"
                      style={{ 
                        width: `${resumeState ? (courses.find(c => c.courseId === resumeState.courseId)?.progress || 0) : fallbackResume.progress}%` 
                      }}
                    />
                  </div>
                  <span className="text-xs font-bold text-text-secondary">
                    {resumeState ? (courses.find(c => c.courseId === resumeState.courseId)?.progress || 0) : fallbackResume.progress}% Completed
                  </span>
                </div>
              </div>
              
              <div className="pt-2">
                <Link
                  href={resumeState ? `/dashboard/course/${resumeState.courseId}/learn` : `/dashboard/course/${fallbackResume.courseId}/learn`}
                  className="inline-flex px-6 py-3.5 bg-gradient-to-r from-accent-grape to-primary-blue hover:from-accent-grape/90 hover:to-primary-blue/90 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-accent-grape/15 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Resume Lesson
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Right: Attendance Summary Card (Col span 1) */}
        <div className="lg:col-span-1">
          {attendanceData && (
            <div className="h-full glass-card hover-lift p-6 rounded-3xl flex flex-col justify-between gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                    My Attendance
                  </h4>
                  <span className={`px-2.5 py-0.5 text-[9px] font-extrabold rounded-full border uppercase tracking-wider ${
                    attendanceData.overallRate >= 85
                      ? 'bg-success/10 border-success/20 text-success'
                      : attendanceData.overallRate >= 75
                      ? 'bg-warning/10 border-warning/20 text-warning'
                      : 'bg-error/10 border-error/20 text-error'
                  }`}>
                    {attendanceData.overallRate >= 85 ? 'Good' : attendanceData.overallRate >= 75 ? 'Warning' : 'Critical'}
                  </span>
                </div>

                <div className="flex items-center gap-5 py-1.5">
                  <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="40"
                        cy="40"
                        r="28"
                        className="stroke-border-color"
                        strokeWidth="4"
                        fill="transparent"
                      />
                      <circle
                        cx="40"
                        cy="40"
                        r="28"
                        className={`transition-all duration-1000 ${
                          attendanceData.overallRate >= 85 
                            ? 'stroke-success' 
                            : attendanceData.overallRate >= 75 
                            ? 'stroke-warning' 
                            : 'stroke-error'
                        }`}
                        strokeWidth="4"
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 28}
                        strokeDashoffset={2 * Math.PI * 28 - (attendanceData.overallRate / 100) * (2 * Math.PI * 28)}
                        strokeLinecap="round"
                        style={{ filter: 'drop-shadow(0 0 4px currentColor)' }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-center">
                      <span className="text-base font-black text-white leading-none">
                        {Math.round(attendanceData.overallRate)}%
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 min-w-0">
                    <p className="text-sm font-black text-white leading-tight truncate">
                      {Math.round(attendanceData.overallRate)}% Attendance
                    </p>
                    <p className="text-[9px] font-extrabold text-text-muted uppercase tracking-wider truncate">
                      Offline: {Math.round(attendanceData.offlineRate)}% | Online: {Math.round(attendanceData.onlineRate)}%
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 border-y border-border-color py-3 text-center text-xs">
                  <div>
                    <div className="font-extrabold text-success">
                      {attendanceData.offlinePresent}
                    </div>
                    <div className="text-[9px] font-bold text-text-muted uppercase tracking-wider mt-0.5">Present</div>
                  </div>
                  <div className="border-x border-border-color">
                    <div className="font-extrabold text-error">
                      {attendanceData.offlineTotal - attendanceData.offlinePresent}
                    </div>
                    <div className="text-[9px] font-bold text-text-muted uppercase tracking-wider mt-0.5">Absent</div>
                  </div>
                  <div>
                    <div className="font-extrabold text-white">
                      {attendanceData.offlineTotal}
                    </div>
                    <div className="text-[9px] font-bold text-text-muted uppercase tracking-wider mt-0.5">Total</div>
                  </div>
                </div>
              </div>

              <Link
                href="/dashboard/attendance"
                className="w-full py-3 bg-white/5 hover:bg-gradient-to-r hover:from-accent-grape hover:to-primary-blue hover:text-white text-text-secondary rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer border border-border-color hover:border-accent-grape shadow-sm"
              >
                View Detailed Attendance
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>

      </div>

      {/* Learning Paths List */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg sm:text-xl font-bold text-white">Your Learning Paths</h3>
          {courses.length > 0 && (
            <Link 
              href="/dashboard/my-courses" 
              className="text-xs font-bold uppercase tracking-wider text-accent-grape hover:text-accent-blue transition-colors flex items-center gap-1"
            >
              See all <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        {courses.length === 0 ? (
          <div className="glass-card py-12 px-6 rounded-3xl border border-border-color text-center max-w-xl mx-auto space-y-6">
            <div className="w-16 h-16 bg-white/5 border border-border-color text-text-muted rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <Compass className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h4 className="text-base font-bold text-white">No courses enrolled yet.</h4>
              <p className="text-xs text-text-secondary max-w-xs mx-auto leading-relaxed">
                Discover from our wide selection of professional full-stack development and cloud computing courses.
              </p>
            </div>
            <Link 
              href="/courses"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-accent-grape to-primary-blue text-white rounded-2xl shadow-lg shadow-accent-grape/10 font-bold text-xs uppercase tracking-wider hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              <Compass className="w-4 h-4" /> Explore Catalog
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.slice(0, 3).map((item) => (
              <div 
                key={item.enrollmentId} 
                className="glass-card hover-lift rounded-3xl overflow-hidden flex flex-col justify-between"
              >
                <div className="p-6 space-y-5">
                  <div className="flex justify-between items-start">
                    <span className={`inline-flex items-center gap-1 text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                      item.progress === 100
                        ? 'bg-success/10 text-success border-success/20'
                        : 'bg-accent-grape/10 text-accent-grape border-accent-grape/20'
                    }`}>
                      {item.progress === 100 ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" /> Completed
                        </>
                      ) : (
                        'In Progress'
                      )}
                    </span>
                  </div>
                  
                  <div>
                    <h4 className="text-base font-black text-white line-clamp-2 leading-snug">
                      {item.courseTitle}
                    </h4>
                    <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider mt-1.5">
                      Enrolled: {new Date(item.enrolledAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold text-text-secondary">
                      <span>Progress</span>
                      <span className="text-white font-bold">{item.progress}%</span>
                    </div>
                    <div className="w-full bg-bg-secondary-dark h-1.5 rounded-full overflow-hidden border border-border-color">
                      <div 
                        className="bg-gradient-to-r from-accent-grape to-primary-blue h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(150,52,132,0.4)]"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="p-5 bg-white/5 border-t border-border-color">
                  <Link
                    href={`/dashboard/course/${item.courseId}/learn`}
                    className="w-full py-3 bg-gradient-to-r from-accent-grape to-primary-blue hover:from-accent-grape/90 hover:to-primary-blue/90 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Enter Classroom
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Consistent status colors legend */}
      <StatusColorsLegend />

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

