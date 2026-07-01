'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import AdminAttendanceView from './AdminAttendanceView';
import { 
  CheckCircle2, 
  XCircle, 
  Search, 
  Filter, 
  Calendar, 
  UserCheck, 
  AlertTriangle, 
  Clock, 
  BookOpen, 
  ChevronRight,
  Loader2,
  RefreshCw,
  Flame,
  Award,
  Activity,
  CheckSquare,
  Trophy
} from 'lucide-react';

interface AttendanceRecord {
  id: number;
  studentId: number;
  studentName: string;
  subjectName: string;
  date: string; // "YYYY-MM-DD"
  day: string;
  status: 'PRESENT' | 'ABSENT';
}

interface OnlineActivityLog {
  id: number;
  studentId: number;
  studentName: string;
  courseName: string;
  date: string;
  activityType: string;
  status: string;
}

interface SubjectStat {
  subjectName: string;
  percentage: number;
  present: number;
  total: number;
}

interface OfflineResponse {
  offlineRate: number;
  offlinePresent: number;
  offlineTotal: number;
  subjectWiseStats: SubjectStat[];
  records: AttendanceRecord[];
}

interface OnlineResponse {
  onlineRate: number;
  onlineActiveDays: number;
  onlineTotalDays: number;
  streak: number;
  completionRate: number;
  activities: OnlineActivityLog[];
  courseParticipation: Record<string, number>;
}

interface StreakResponse {
  currentOfflineStreak: number;
  bestOfflineStreak: number;
  currentOnlineStreak: number;
  bestOnlineStreak: number;
  lastUpdatedOffline: string | null;
  lastUpdatedOnline: string | null;
}

function StudentAttendanceView() {
  const [activeSubsystem, setActiveSubsystem] = useState<'OFFLINE' | 'ONLINE'>('OFFLINE');
  
  // Filters for Offline
  const [offlineSearch, setOfflineSearch] = useState('');
  const [offlineStatusFilter, setOfflineStatusFilter] = useState<'ALL' | 'PRESENT' | 'ABSENT'>('ALL');
  const [offlineSubjectFilter, setOfflineSubjectFilter] = useState('ALL');

  // Filters for Online
  const [onlineSearch, setOnlineSearch] = useState('');
  const [onlineCourseFilter, setOnlineCourseFilter] = useState('ALL');

  // 1. Fetch Offline Attendance
  const { 
    data: offlineData, 
    isLoading: isOfflineLoading, 
    error: offlineError, 
    refetch: refetchOffline 
  } = useQuery<OfflineResponse>({
    queryKey: ['student-attendance-offline'],
    queryFn: async () => {
      const response = await api.get('/student/attendance/offline');
      return response.data.success ? response.data.data : null;
    },
  });

  // 2. Fetch Online Attendance
  const { 
    data: onlineData, 
    isLoading: isOnlineLoading, 
    error: onlineError, 
    refetch: refetchOnline 
  } = useQuery<OnlineResponse>({
    queryKey: ['student-attendance-online'],
    queryFn: async () => {
      const response = await api.get('/student/attendance/online');
      return response.data.success ? response.data.data : null;
    },
  });

  // 3. Fetch Streaks
  const { 
    data: streakData, 
    isLoading: isStreakLoading, 
    error: streakError, 
    refetch: refetchStreak 
  } = useQuery<StreakResponse>({
    queryKey: ['student-attendance-streak'],
    queryFn: async () => {
      const response = await api.get('/student/attendance/streak');
      return response.data.success ? response.data.data : null;
    },
  });

  const handleSyncAll = async () => {
    await Promise.all([refetchOffline(), refetchOnline(), refetchStreak()]);
  };

  const isLoading = isOfflineLoading || isOnlineLoading || isStreakLoading;
  const isError = offlineError || onlineError || streakError;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="relative">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
          <div className="absolute inset-0 blur-md bg-indigo-500/15 rounded-full animate-pulse" />
        </div>
        <p className="text-slate-400 text-sm font-medium animate-pulse">Syncing logs and streaks...</p>
      </div>
    );
  }

  if (isError || !offlineData || !onlineData || !streakData) {
    return (
      <div className="max-w-xl mx-auto py-12 px-6">
        <div className="p-6 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 rounded-2xl text-center space-y-4">
          <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Attendance Sync Failed</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              There was an error connecting to the attendance APIs. Verify the Spring Boot backend is running.
            </p>
          </div>
          <button 
            onClick={handleSyncAll}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 mx-auto cursor-pointer shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // Circular progress math helpers
  const getProgressStyles = (rate: number) => {
    const radius = 28;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (rate / 100) * circumference;
    
    let ringColor = 'stroke-rose-500';
    let badgeStyle = 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400';
    let statusText = 'Critical';
    
    if (rate >= 85) {
      ringColor = 'stroke-emerald-500';
      badgeStyle = 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-455';
      statusText = 'Good';
    } else if (rate >= 75) {
      ringColor = 'stroke-amber-500';
      badgeStyle = 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-455';
      statusText = 'Warning';
    }
    
    return { radius, circumference, offset, ringColor, badgeStyle, statusText };
  };

  const offlineStyles = getProgressStyles(offlineData.offlineRate);
  const onlineStyles = getProgressStyles(onlineData.onlineRate);

  // Filters Offline
  const filteredOfflineRecords = offlineData.records.filter(record => {
    const matchesSearch = 
      record.subjectName.toLowerCase().includes(offlineSearch.toLowerCase()) ||
      record.date.includes(offlineSearch) ||
      record.day.toLowerCase().includes(offlineSearch.toLowerCase());
    const matchesStatus = offlineStatusFilter === 'ALL' || record.status === offlineStatusFilter;
    const matchesSubject = offlineSubjectFilter === 'ALL' || record.subjectName === offlineSubjectFilter;
    return matchesSearch && matchesStatus && matchesSubject;
  });

  // Filters Online
  const filteredOnlineRecords = onlineData.activities.filter(activity => {
    const matchesSearch = 
      activity.courseName.toLowerCase().includes(onlineSearch.toLowerCase()) ||
      activity.activityType.toLowerCase().includes(onlineSearch.toLowerCase()) ||
      activity.status.toLowerCase().includes(onlineSearch.toLowerCase()) ||
      activity.date.includes(onlineSearch);
    const matchesCourse = onlineCourseFilter === 'ALL' || activity.courseName === onlineCourseFilter;
    return matchesSearch && matchesCourse;
  });

  // Derived filters lists
  const uniqueOfflineSubjects = Array.from(
    new Set(offlineData.subjectWiseStats.map(stat => stat.subjectName))
  );

  const uniqueOnlineCourses = Object.keys(onlineData.courseParticipation || {});

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-300">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <p className="text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">Attendance Dashboard</p>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">Academics & Activities</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Dynamic, database-driven attendance metrics and learning streaks.
          </p>
        </div>
        
        <button
          onClick={handleSyncAll}
          className="self-start sm:self-center px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 rounded-xl transition-all text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm animate-in fade-in"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Sync All Data
        </button>
      </div>

      {/* TOP SECTION: TWO SIDE-BY-SIDE INTERACTIVE SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* LEFT CARD: Offline Batch Attendance */}
        <button
          onClick={() => setActiveSubsystem('OFFLINE')}
          className={`text-left w-full p-6 sm:p-8 rounded-3xl border transition-all duration-300 flex flex-col sm:flex-row items-center gap-6 cursor-pointer ${
            activeSubsystem === 'OFFLINE'
              ? 'bg-white dark:bg-slate-900 border-indigo-500 dark:border-indigo-500/80 shadow-md ring-2 ring-indigo-500/10'
              : 'bg-white/70 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700/80 hover:shadow-sm'
          }`}
        >
          <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="48" cy="48" r={offlineStyles.radius} className="stroke-slate-100 dark:stroke-slate-850" strokeWidth="6" fill="transparent" />
              <circle cx="48" cy="48" r={offlineStyles.radius} className={`transition-all duration-700 ${offlineStyles.ringColor}`} strokeWidth="6" fill="transparent" strokeDasharray={offlineStyles.circumference} strokeDashoffset={offlineStyles.offset} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-center">
              <span className="text-lg font-black text-slate-905 dark:text-white leading-none">
                {Math.round(offlineData.offlineRate)}%
              </span>
            </div>
          </div>

          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white truncate">Offline Batch</h3>
              <span className={`px-2 py-0.5 text-[8px] font-extrabold rounded-full border uppercase tracking-wider shrink-0 ${offlineStyles.badgeStyle}`}>
                {offlineStyles.statusText}
              </span>
            </div>
            
            <p className="text-xl font-black text-slate-855 dark:text-white leading-none">
              {offlineData.offlinePresent} <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Present</span> / {offlineData.offlineTotal} <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total</span>
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal line-clamp-2">
              Classroom attendance marked by instructors. Updates instantly upon instructor changes.
            </p>
          </div>
        </button>

        {/* RIGHT CARD: Online Course Attendance */}
        <button
          onClick={() => setActiveSubsystem('ONLINE')}
          className={`text-left w-full p-6 sm:p-8 rounded-3xl border transition-all duration-300 flex flex-col sm:flex-row items-center gap-6 cursor-pointer ${
            activeSubsystem === 'ONLINE'
              ? 'bg-white dark:bg-slate-900 border-indigo-500 dark:border-indigo-500/80 shadow-md ring-2 ring-indigo-500/10'
              : 'bg-white/70 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700/80 hover:shadow-sm'
          }`}
        >
          <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="48" cy="48" r={onlineStyles.radius} className="stroke-slate-105 dark:stroke-slate-850" strokeWidth="6" fill="transparent" />
              <circle cx="48" cy="48" r={onlineStyles.radius} className={`transition-all duration-700 ${onlineStyles.ringColor}`} strokeWidth="6" fill="transparent" strokeDasharray={onlineStyles.circumference} strokeDashoffset={onlineStyles.offset} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-center">
              <span className="text-lg font-black text-slate-905 dark:text-white leading-none">
                {Math.round(onlineData.onlineRate)}%
              </span>
            </div>
          </div>

          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white truncate">Online Course</h3>
              <span className={`px-2 py-0.5 text-[8px] font-extrabold rounded-full border uppercase tracking-wider shrink-0 ${onlineStyles.badgeStyle}`}>
                {onlineStyles.statusText}
              </span>
            </div>
            
            <p className="text-xl font-black text-slate-855 dark:text-white leading-none">
              {onlineData.onlineActiveDays} <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Days</span> / {onlineData.onlineTotalDays} <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total</span>
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal line-clamp-2">
              Automatically calculated from lessons completed, homeworks submitted, and quiz attempts.
            </p>
          </div>
        </button>

      </div>

      {/* DUAL DETAILED WORKSPACE */}
      {activeSubsystem === 'OFFLINE' ? (
        
        /* ───────────────────────────────────────────────────────────
           OFFLINE BATCH DETAILS (ACADEMIC SUBJECTS)
           ─────────────────────────────────────────────────────────── */
        <div className="space-y-8 animate-in fade-in duration-250">
          
          {/* Stats Bar & Streak Card Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Offline Streak Card */}
            <div className="lg:col-span-1 bg-gradient-to-br from-indigo-600 to-indigo-700 text-white p-6 rounded-3xl shadow-sm space-y-4 relative overflow-hidden">
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest bg-white/20 px-2.5 py-0.5 rounded-full">
                  Batch Streak
                </span>
                <Flame className="w-6 h-6 animate-pulse text-amber-400" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-semibold text-indigo-200 uppercase tracking-wider">Current Streak</p>
                  <h4 className="text-2xl font-black">{streakData.currentOfflineStreak} Classes</h4>
                </div>
                <div className="border-l border-white/20 pl-4">
                  <p className="text-[10px] font-semibold text-indigo-200 uppercase tracking-wider">Best Streak</p>
                  <h4 className="text-2xl font-black flex items-center gap-1">
                    <Trophy className="w-5 h-5 text-amber-300 shrink-0" />
                    {streakData.bestOfflineStreak}
                  </h4>
                </div>
              </div>

              <div className="text-[10px] text-indigo-250 font-semibold border-t border-white/10 pt-2 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-indigo-300 shrink-0" />
                Last Marked: {streakData.lastUpdatedOffline ? formatDate(streakData.lastUpdatedOffline) : 'No records yet'}
              </div>
            </div>

            {/* Offline Batch Stats Description */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div className="space-y-1.5">
                <h3 className="text-sm font-bold text-slate-905 dark:text-white uppercase tracking-wider">
                  Academic Subsystem Mapping
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-455 leading-relaxed">
                  Academic subjects are fully synchronized with physical classroom records marked by course instructors. All Homework, Notes, Tests, and Timetables strictly utilize this database-driven mapping.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 border-t border-slate-100 dark:border-slate-800/80 pt-3 text-center">
                <div>
                  <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 block">{offlineData.offlinePresent}</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Present Classes</span>
                </div>
                <div className="border-x border-slate-100 dark:border-slate-800/60">
                  <span className="text-lg font-black text-rose-600 dark:text-rose-400 block">{offlineData.offlineTotal - offlineData.offlinePresent}</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Absent Classes</span>
                </div>
                <div>
                  <span className="text-lg font-black text-slate-800 dark:text-white block">{offlineData.offlineTotal}</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total Classes</span>
                </div>
              </div>
            </div>
          </div>

          {/* Subject-wise Attendance Grid */}
          <div className="space-y-4 animate-in fade-in delay-100">
            <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Subject-wise batch rates
            </h3>

            {offlineData.subjectWiseStats.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                No subjects registered for attendance in this batch.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {offlineData.subjectWiseStats.map((subj) => {
                  const subColor = subj.percentage >= 85 
                    ? 'text-emerald-600 dark:text-emerald-450 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-150 dark:border-emerald-900/30' 
                    : subj.percentage >= 75 
                    ? 'text-amber-600 dark:text-amber-450 bg-amber-50 dark:bg-amber-950/20 border-amber-150 dark:border-amber-900/30' 
                    : 'text-rose-600 dark:text-rose-450 bg-rose-50 dark:bg-rose-950/20 border-rose-155 dark:border-rose-900/30';
                  return (
                    <div 
                      key={subj.subjectName}
                      className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-3 shadow-sm hover:shadow-md transition-all bg-white dark:bg-slate-900"
                    >
                      <div className="space-y-0.5">
                        <h4 className="text-sm font-black text-slate-850 dark:text-white truncate" title={subj.subjectName}>
                          {subj.subjectName}
                        </h4>
                        <div className="text-[10px] font-bold text-slate-400">
                          {subj.present} / {subj.total} Classes
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between items-baseline">
                          <span className="text-base font-black text-slate-900 dark:text-white">
                            {Math.round(subj.percentage)}%
                          </span>
                          <span className={`px-1.5 py-0.5 text-[8px] font-bold rounded border uppercase tracking-wider ${subColor}`}>
                            {subj.percentage >= 85 ? 'Good' : subj.percentage >= 75 ? 'Warn' : 'Crit'}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              subj.percentage >= 85 ? 'bg-emerald-500' : subj.percentage >= 75 ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${subj.percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Offline Table Logs list */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Offline Academic Logs
            </h3>

            {/* Filter controls */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              
              <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute top-1/2 left-3.5 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search logs by subject, date, weekday..."
                    value={offlineSearch}
                    onChange={(e) => setOfflineSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl text-slate-850 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                </div>

                {/* Subject filter */}
                <div className="flex items-center gap-1.5 w-full sm:w-auto">
                  <Filter className="w-3.5 h-3.5 text-slate-450 shrink-0" />
                  <select
                    value={offlineSubjectFilter}
                    onChange={(e) => setOfflineSubjectFilter(e.target.value)}
                    className="w-full sm:w-auto bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 py-2 px-3 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="ALL">All Subjects</option>
                    {uniqueOfflineSubjects.map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status Tabs */}
              <div className="flex items-center gap-2 border-t border-slate-100 dark:border-slate-800/60 pt-3">
                <button
                  onClick={() => setOfflineStatusFilter('ALL')}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    offlineStatusFilter === 'ALL'
                      ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                      : 'text-slate-500 dark:text-slate-455 hover:bg-slate-50 dark:hover:bg-slate-850'
                  }`}
                >
                  All Classes ({offlineData.records.length})
                </button>
                <button
                  onClick={() => setOfflineStatusFilter('PRESENT')}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                    offlineStatusFilter === 'PRESENT'
                      ? 'bg-emerald-650 text-white'
                      : 'text-emerald-600 dark:text-emerald-450 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Present ({offlineData.offlinePresent})
                </button>
                <button
                  onClick={() => setOfflineStatusFilter('ABSENT')}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                    offlineStatusFilter === 'ABSENT'
                      ? 'bg-rose-655 text-white'
                      : 'text-rose-600 dark:text-rose-450 hover:bg-rose-50/50 dark:hover:bg-rose-950/20'
                  }`}
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Absent ({offlineData.offlineTotal - offlineData.offlinePresent})
                </button>
              </div>

            </div>

            {/* List */}
            {filteredOfflineRecords.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 py-12 px-6 rounded-2xl border border-slate-205 dark:border-slate-800 text-center max-w-md mx-auto space-y-2.5">
                <Search className="w-8 h-8 text-slate-350 dark:text-slate-600 mx-auto" />
                <h4 className="text-sm font-bold text-slate-800 dark:text-white">No matching logs found</h4>
                <p className="text-xs text-slate-550 dark:text-slate-455">
                  Try adjusting filters or searching.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredOfflineRecords.map((record) => {
                  const isPresent = record.status === 'PRESENT';
                  return (
                    <div
                      key={record.id}
                      className={`bg-white dark:bg-slate-900 rounded-2xl border ${
                        isPresent 
                          ? 'border-slate-200 dark:border-slate-800 border-l-4 border-l-emerald-500' 
                          : 'border-slate-200 dark:border-slate-800 border-l-4 border-l-rose-500'
                      } p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-205`}
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isPresent 
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400' 
                            : 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400'
                        }`}>
                          {isPresent ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                        </div>
                        
                        <div className="min-w-0 space-y-0.5">
                          <h4 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                            {record.subjectName}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-slate-450 dark:text-slate-550">
                            <span className="font-semibold text-slate-600 dark:text-slate-400">{record.day}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-350" />
                              {formatDate(record.date)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <span className={`px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase tracking-wider shrink-0 ${
                        isPresent 
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400' 
                          : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400'
                      }`}>
                        {record.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

          </div>

        </div>
      ) : (
        
        /* ───────────────────────────────────────────────────────────
           ONLINE COURSE DETAILS (DIGITAL PLATFORM ACTIVITIES)
           ─────────────────────────────────────────────────────────── */
        <div className="space-y-8 animate-in fade-in duration-250">
          
          {/* Stats Bar & Streak Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Online Streak Card */}
            <div className="lg:col-span-1 bg-gradient-to-br from-amber-500 to-orange-600 text-white p-6 rounded-3xl shadow-sm space-y-4 relative overflow-hidden">
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest bg-white/20 px-2.5 py-0.5 rounded-full">
                  Learning Streak
                </span>
                <Flame className="w-6 h-6 animate-bounce text-white" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-semibold text-amber-100 uppercase tracking-wider">Current Streak</p>
                  <h4 className="text-2xl font-black">{streakData.currentOnlineStreak} Days</h4>
                </div>
                <div className="border-l border-white/20 pl-4">
                  <p className="text-[10px] font-semibold text-amber-100 uppercase tracking-wider">Best Streak</p>
                  <h4 className="text-2xl font-black flex items-center gap-1">
                    <Trophy className="w-5 h-5 text-yellow-250 shrink-0 animate-pulse" />
                    {streakData.bestOnlineStreak}
                  </h4>
                </div>
              </div>

              <div className="text-[10px] text-amber-150 font-semibold border-t border-white/10 pt-2 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-205 shrink-0" />
                Last Active: {streakData.lastUpdatedOnline ? formatDate(streakData.lastUpdatedOnline) : 'No activity yet'}
              </div>
            </div>

            {/* Platform Activity Stats Breakdown */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between gap-4">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center shrink-0">
                  <Activity className="w-6 h-6" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block font-sans">Completion Rate</span>
                  <span className="text-2xl font-black text-slate-900 dark:text-white leading-none">
                    {onlineData.completionRate}%
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">
                    Calculated dynamically from course syllabus
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-455 leading-relaxed border-t border-slate-100 dark:border-slate-800/80 pt-3">
                Online activities are calculated directly from explore course learning progress. Submitting assignments, completing digital lessons, or attempting module quizzes immediately updates this dashboard.
              </p>
            </div>

          </div>

          {/* Course-wise Participation */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Course participation breakdown
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Volume of logged digital activities per explore course in the database.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              {Object.keys(onlineData.courseParticipation || {}).length === 0 ? (
                <div className="text-center py-4 text-xs text-slate-400 col-span-2">
                  No online course activity registered yet. Enter the classroom to log progress!
                </div>
              ) : (
                Object.keys(onlineData.courseParticipation).map(course => {
                  const count = onlineData.courseParticipation[course];
                  const maxCount = Math.max(...Object.values(onlineData.courseParticipation), 1);
                  const widthPercent = (count / maxCount) * 100;
                  return (
                    <div key={course} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                        <span className="truncate max-w-[200px] sm:max-w-xs">{course}</span>
                        <span>{count} Activities</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-indigo-650 h-full rounded-full transition-all duration-500"
                          style={{ width: `${widthPercent}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Online activity list logs */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Online Activity Logs
            </h3>

            {/* Filter controls */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute top-1/2 left-3.5 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search online logs by course, activity type, status..."
                  value={onlineSearch}
                  onChange={(e) => setOnlineSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800/80 rounded-xl text-slate-850 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>

              {/* Course filter */}
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <Filter className="w-3.5 h-3.5 text-slate-450 shrink-0" />
                <select
                  value={onlineCourseFilter}
                  onChange={(e) => setOnlineCourseFilter(e.target.value)}
                  className="w-full sm:w-auto bg-slate-50 dark:bg-slate-905 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 py-2 px-3 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="ALL">All Courses</option>
                  {uniqueOnlineCourses.map(course => (
                    <option key={course} value={course}>{course}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* List */}
            {filteredOnlineRecords.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 py-12 px-6 rounded-2xl border border-slate-205 dark:border-slate-800 text-center max-w-md mx-auto space-y-2.5">
                <Search className="w-8 h-8 text-slate-350 dark:text-slate-600 mx-auto" />
                <h4 className="text-sm font-bold text-slate-800 dark:text-white">No matching activity logs found</h4>
                <p className="text-xs text-slate-550 dark:text-slate-455">
                  Try adjusting filters or course selectors.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredOnlineRecords.map((activity) => {
                  let statusBadgeColor = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300';
                  if (activity.status === 'Completed' || activity.status === 'SUBMITTED' || activity.status === 'REVIEWED') {
                    statusBadgeColor = 'bg-emerald-50 dark:bg-emerald-950/35 text-emerald-750 dark:text-emerald-450 border border-emerald-100/10';
                  } else if (activity.status === 'Submitted') {
                    statusBadgeColor = 'bg-indigo-50 dark:bg-indigo-950/35 text-indigo-750 dark:text-indigo-400 border border-indigo-100/10';
                  } else if (activity.status.startsWith('Score:') || activity.status === 'Attempted') {
                    statusBadgeColor = 'bg-amber-50 dark:bg-amber-950/35 text-amber-750 dark:text-amber-450 border border-amber-100/10';
                  }

                  return (
                    <div
                      key={activity.id}
                      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 animate-in fade-in"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100/20 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center shrink-0">
                          <CheckSquare className="w-5.5 h-5.5" />
                        </div>
                        
                        <div className="min-w-0 space-y-0.5">
                          <h4 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate">
                            {activity.courseName}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-slate-450 dark:text-slate-550">
                            <span className="font-semibold text-indigo-600 dark:text-indigo-400">{activity.activityType}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-355" />
                              {formatDate(activity.date)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 border-t border-slate-50 dark:border-none pt-3 sm:pt-0">
                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase tracking-wider ${statusBadgeColor}`}>
                          {activity.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}

export default function AttendancePage() {
  const { user } = useAuth();

  if (user?.role === 'ADMIN' || user?.role === 'INSTRUCTOR') {
    return <AdminAttendanceView />;
  }

  return <StudentAttendanceView />;
}
