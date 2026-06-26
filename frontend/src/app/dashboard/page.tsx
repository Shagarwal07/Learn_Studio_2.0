'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
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
  ArrowUpRight
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

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  // If the logged-in user is an Instructor or Admin, render the Instructor Dashboard View
  if (user?.role === 'INSTRUCTOR' || user?.role === 'ADMIN') {
    return <InstructorDashboardView />;
  }

  // 1. Fetch enrolled courses (Students only)
  const { data: enrollments, isLoading, error } = useQuery<EnrolledCourse[]>({
    queryKey: ['my-enrollments'],
    enabled: user?.role === 'STUDENT',
    queryFn: async () => {
      const response = await api.get('/enrollments/my');
      return response.data.success ? response.data.data : [];
    },
  });

  // 2. Fetch actual Resume Learning state (Students only)
  const { data: resumeState } = useQuery<any>({
    queryKey: ['resume-state'],
    enabled: user?.role === 'STUDENT',
    queryFn: async () => {
      const response = await api.get('/enrollments/resume');
      return response.data.success ? response.data.data : null;
    }
  });

  // 3. Fetch attendance summary (Students only)
  const { data: attendanceData } = useQuery<any>({
    queryKey: ['student-attendance-summary'],
    enabled: user?.role === 'STUDENT',
    queryFn: async () => {
      const response = await api.get('/student/attendance/summary');
      return response.data.success ? response.data.data : null;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-slate-200 dark:bg-slate-900 rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-24 bg-slate-200 dark:bg-slate-900 rounded-3xl" />
          <div className="h-24 bg-slate-200 dark:bg-slate-900 rounded-3xl" />
          <div className="h-24 bg-slate-200 dark:bg-slate-900 rounded-3xl" />
        </div>
        <div className="h-48 bg-slate-200 dark:bg-slate-900 rounded-3xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-500/5 border border-red-500/10 rounded-3xl text-center max-w-xl mx-auto space-y-2">
        <h3 className="font-bold text-red-400 text-lg">Failed to load dashboard data</h3>
        <p className="text-sm text-slate-400">Please check if the Spring Boot backend is running and try again.</p>
      </div>
    );
  }

  const courses = enrollments || [];
  const completedCourses = courses.filter(c => c.progress === 100);
  const activeCourses = courses.filter(c => c.progress < 100);

  // Fallback resume course if no activity logged yet
  const fallbackResume = courses.find(c => c.progress > 0 && c.progress < 100) || courses[0];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      
      {/* Welcome banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white p-6 lg:p-8 rounded-3xl border border-slate-800 shadow-xl">
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <h2 className="text-2xl lg:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.name}! 👋
          </h2>
          <p className="text-slate-300 text-sm max-w-xl">
            Check your progress, consult the AI assistant to clear doubts, and complete your lessons to earn certificates.
          </p>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800/80 flex items-center gap-5 shadow-sm">
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100/20 rounded-2xl flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">Enrolled Courses</p>
            <h3 className="text-2xl font-extrabold text-slate-800 dark:text-slate-105 mt-0.5">{courses.length}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800/80 flex items-center gap-5 shadow-sm">
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-455 border border-amber-100/20 rounded-2xl flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">Active Learning</p>
            <h3 className="text-2xl font-extrabold text-slate-800 dark:text-slate-105 mt-0.5">{activeCourses.length}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800/80 flex items-center gap-5 shadow-sm">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100/20 rounded-2xl flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-555 uppercase tracking-wider">Completed Courses</p>
            <h3 className="text-2xl font-extrabold text-slate-800 dark:text-slate-105 mt-0.5">{completedCourses.length}</h3>
          </div>
        </div>
      </div>

      {/* Resume & Attendance Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Resume Learning Card (Col span 2) */}
        <div className="lg:col-span-2">
          {(resumeState || fallbackResume) && (
            <div className="h-full bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800/80 shadow-sm flex flex-col justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1 text-[10px] bg-indigo-50 dark:bg-indigo-950/25 text-indigo-600 dark:text-indigo-400 border border-indigo-100/10 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  <Clock className="w-3 h-3" /> Resume Learning
                </div>
                <h4 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                  {resumeState ? resumeState.courseTitle : fallbackResume.courseTitle}
                </h4>
                {resumeState?.lessonTitle && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Last viewed: <strong className="text-slate-700 dark:text-slate-350">{resumeState.lessonTitle}</strong>
                  </p>
                )}
                <div className="flex items-center gap-3 pt-1">
                  <div className="flex-1 max-w-xs bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                      style={{ 
                        width: `${resumeState ? (courses.find(c => c.courseId === resumeState.courseId)?.progress || 0) : fallbackResume.progress}%` 
                      }}
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-455">
                    {resumeState ? (courses.find(c => c.courseId === resumeState.courseId)?.progress || 0) : fallbackResume.progress}% Completed
                  </span>
                </div>
              </div>
              <div className="pt-2">
                <Link
                  href={resumeState ? `/dashboard/course/${resumeState.courseId}/learn` : `/dashboard/course/${fallbackResume.courseId}/learn`}
                  className="inline-flex px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl shadow-lg shadow-indigo-650/10 transition-all font-bold items-center justify-center gap-2 text-sm cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Resume Lesson
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Right: Attendance Summary Card (Col span 1) */}
        <div className="lg:col-span-1">
          {attendanceData && (
            <div className="h-full bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800/80 shadow-sm flex flex-col justify-between gap-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    My Attendance
                  </h4>
                  <span className={`px-2.5 py-0.5 text-[9px] font-extrabold rounded-full border uppercase tracking-wider ${
                    attendanceData.overallRate >= 85
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-650 dark:text-emerald-400'
                      : attendanceData.overallRate >= 75
                      ? 'bg-amber-500/10 border-amber-500/20 text-amber-650 dark:text-amber-450'
                      : 'bg-rose-500/10 border-rose-500/20 text-rose-655 dark:text-rose-400'
                  }`}>
                    {attendanceData.overallRate >= 85 ? 'Good' : attendanceData.overallRate >= 75 ? 'Warning' : 'Critical'}
                  </span>
                </div>

                <div className="flex items-center gap-4 py-1">
                  <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="40"
                        cy="40"
                        r="28"
                        className="stroke-slate-105 dark:stroke-slate-800"
                        strokeWidth="5"
                        fill="transparent"
                      />
                      <circle
                        cx="40"
                        cy="40"
                        r="28"
                        className={`transition-all duration-500 ${
                          attendanceData.overallRate >= 85 
                            ? 'stroke-emerald-500' 
                            : attendanceData.overallRate >= 75 
                            ? 'stroke-amber-500' 
                            : 'stroke-rose-500'
                        }`}
                        strokeWidth="5"
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 28}
                        strokeDashoffset={2 * Math.PI * 28 - (attendanceData.overallRate / 100) * (2 * Math.PI * 28)}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-center">
                      <span className="text-base font-black text-slate-905 dark:text-white leading-none">
                        {Math.round(attendanceData.overallRate)}%
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 min-w-0">
                    <p className="text-sm font-black text-slate-850 dark:text-white leading-tight truncate">
                      {Math.round(attendanceData.overallRate)}% Attendance
                    </p>
                    <p className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider truncate">
                      Offline: {Math.round(attendanceData.offlineRate)}% | Online: {Math.round(attendanceData.onlineRate)}%
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 border-y border-slate-100 dark:border-slate-800/80 py-2.5 text-center text-xs">
                  <div>
                    <div className="font-extrabold text-emerald-600 dark:text-emerald-400">
                      {attendanceData.offlinePresent}
                    </div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Present</div>
                  </div>
                  <div className="border-x border-slate-100 dark:border-slate-800/60">
                    <div className="font-extrabold text-rose-600 dark:text-rose-400">
                      {attendanceData.offlineTotal - attendanceData.offlinePresent}
                    </div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Absent</div>
                  </div>
                  <div>
                    <div className="font-extrabold text-slate-800 dark:text-white">
                      {attendanceData.offlineTotal}
                    </div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total</div>
                  </div>
                </div>

              </div>

              <Link
                href="/dashboard/attendance"
                className="w-full py-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-600 dark:hover:bg-indigo-650 hover:text-white text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-800/85 hover:border-indigo-600 shadow-sm"
              >
                View Detailed Attendance
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>

      </div>

      {/* Courses List Section */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Your Learning Paths</h3>
          {courses.length > 0 && (
            <Link 
              href="/dashboard/my-courses" 
              className="text-sm font-bold text-indigo-600 hover:text-indigo-500 transition-all flex items-center gap-1"
            >
              See all <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        {courses.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 py-12 px-6 rounded-3xl border border-slate-205 dark:border-slate-800 shadow-sm text-center max-w-xl mx-auto space-y-6">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-855 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
              <Compass className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h4 className="text-base font-bold text-slate-700 dark:text-white">No courses enrolled yet</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Discover from our wide selection of professional full-stack development and cloud computing courses.
              </p>
            </div>
            <Link 
              href="/courses"
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl shadow-lg shadow-indigo-650/10 transition-all font-bold text-sm cursor-pointer"
            >
              <Compass className="w-4 h-4" /> Explore Catalog
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.slice(0, 3).map((item) => (
              <div 
                key={item.enrollmentId} 
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800/80 overflow-hidden shadow-sm flex flex-col justify-between"
              >
                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <span className={`inline-flex items-center gap-1 text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                      item.progress === 100
                        ? 'bg-emerald-500/10 text-emerald-450 border-emerald-500/10'
                        : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/10'
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
                    <h4 className="text-base font-bold text-slate-850 dark:text-slate-105 line-clamp-2">
                      {item.courseTitle}
                    </h4>
                    <p className="text-xs text-slate-450 mt-1">
                      Enrolled: {new Date(item.enrolledAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-slate-500 dark:text-slate-450">
                      <span>Progress</span>
                      <span>{item.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-slate-50/50 dark:bg-slate-850/20 border-t border-slate-100 dark:border-slate-800/50">
                  <Link
                    href={`/dashboard/course/${item.courseId}/learn`}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer"
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
    </div>
  );
}

function InstructorDashboardView() {
  const { user } = useAuth();

  // 1. Fetch batches
  const { data: batches = [], isLoading: isBatchesLoading } = useQuery<any[]>({
    queryKey: ['instructor-batches-dashboard'],
    enabled: user?.role === 'INSTRUCTOR' || user?.role === 'ADMIN',
    queryFn: async () => {
      const response = await api.get('/instructor/batches');
      return response.data.success ? response.data.data : [];
    }
  });

  // 2. Fetch schedules
  const { data: schedules = [], isLoading: isSchedulesLoading } = useQuery<any[]>({
    queryKey: ['instructor-schedules-dashboard'],
    enabled: user?.role === 'INSTRUCTOR' || user?.role === 'ADMIN',
    queryFn: async () => {
      const response = await api.get('/instructor/schedules');
      return response.data.success ? response.data.data : [];
    }
  });

  const todayStr = new Date().toISOString().split('T')[0];
  const todaySchedules = schedules.filter(s => s.eventDate === todayStr);

  const totalStudents = batches.reduce((acc, b) => acc + (b.studentCount || 0), 0);

  return (
    <div className="space-y-4 max-w-6xl mx-auto text-slate-100 animate-in fade-in duration-200">
      
      {/* Welcome banner */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
        <div className="space-y-1">
          <h2 className="text-base font-bold tracking-tight text-slate-100">
            Welcome back, {user?.name} 👋
          </h2>
          <p className="text-slate-400 text-xs max-w-2xl leading-normal">
            Here is your academic overview for today. Coordinate your offline batches, track attendance records, upload secure PDF study notes, and manage homework tasks from your unified control panel.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center gap-4 shadow-sm">
          <div className="w-8 h-8 bg-slate-950 border border-slate-800 text-violet-400 rounded-lg flex items-center justify-center shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Active Batches</p>
            <h3 className="text-base font-bold text-slate-100 tracking-tight mt-0.5">{isBatchesLoading ? '...' : batches.length}</h3>
          </div>
        </div>

        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center gap-4 shadow-sm">
          <div className="w-8 h-8 bg-slate-950 border border-slate-800 text-violet-400 rounded-lg flex items-center justify-center shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Total Students</p>
            <h3 className="text-base font-bold text-slate-100 tracking-tight mt-0.5">{isBatchesLoading ? '...' : totalStudents}</h3>
          </div>
        </div>

        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center gap-4 shadow-sm">
          <div className="w-8 h-8 bg-slate-950 border border-slate-800 text-violet-400 rounded-lg flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Lectures Today</p>
            <h3 className="text-base font-bold text-slate-100 tracking-tight mt-0.5">{isSchedulesLoading ? '...' : todaySchedules.length}</h3>
          </div>
        </div>
      </div>

      {/* Quick Action Panel & Today's Classes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left: Quick Actions (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-sm space-y-3">
          <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
            Quick Actions
          </h3>
          <div className="flex flex-col gap-2">
            <Link 
              href="/dashboard/instructor/batches?tab=attendance"
              className="flex items-center justify-between p-2.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-lg text-xs font-medium transition-all text-slate-300 hover:text-slate-100 group cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-violet-400" />
                Mark Attendance
              </span>
              <ArrowRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
            </Link>

            <Link 
              href="/dashboard/instructor/batches?tab=notes"
              className="flex items-center justify-between p-2.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-lg text-xs font-medium transition-all text-slate-300 hover:text-slate-100 group cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-violet-400" />
                Upload PDF Notes
              </span>
              <ArrowRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
            </Link>

            <Link 
              href="/dashboard/instructor/batches?tab=homework"
              className="flex items-center justify-between p-2.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-lg text-xs font-medium transition-all text-slate-300 hover:text-slate-100 group cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-violet-400" />
                Post Homework Task
              </span>
              <ArrowRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
            </Link>

            <Link 
              href="/dashboard/instructor/announcements"
              className="flex items-center justify-between p-2.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-lg text-xs font-medium transition-all text-slate-300 hover:text-slate-100 group cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-violet-400" />
                Post Announcement
              </span>
              <ArrowRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
            </Link>
          </div>
        </div>

        {/* Right: Today's Classes (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-sm space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Today&rsquo;s Lectures ({todaySchedules.length})
            </h3>
            <Link 
              href="/dashboard/instructor/batches?tab=schedule"
              className="text-[11px] font-medium text-violet-400 hover:text-violet-300 transition-all flex items-center gap-0.5"
            >
              Timetable View <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          {isSchedulesLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-5 h-5 animate-spin text-violet-500" />
            </div>
          ) : todaySchedules.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-slate-800 rounded-lg p-6 space-y-2">
              <Calendar className="w-6 h-6 mx-auto text-slate-600 mb-1" />
              <p className="text-xs font-medium text-slate-400">No lectures scheduled for today</p>
              <p className="text-[10px] text-slate-550 max-w-xs mx-auto">Create a schedule event to coordinate classes.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {todaySchedules.map(event => (
                <div key={event.id} className="p-3 bg-slate-955/60 border border-slate-800 rounded-lg flex items-center justify-between gap-4 shadow-sm">
                  <div className="min-w-0">
                    <h4 className="font-semibold text-xs text-slate-205 truncate">
                      {event.title}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">
                      Batch: {event.batchName || 'General'} {event.subjectName ? `• Subject: ${event.subjectName}` : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-semibold bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-md text-slate-400 shrink-0">
                    <Clock className="w-3.5 h-3.5 text-violet-400" />
                    {event.startTime.substring(0, 5)} - {event.endTime.substring(0, 5)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>



    </div>
  );
}

