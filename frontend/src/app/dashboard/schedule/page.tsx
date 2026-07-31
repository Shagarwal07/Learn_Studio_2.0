'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Video, 
  BookOpen, 
  AlertCircle, 
  ChevronRight, 
  Filter, 
  Loader2,
  CheckCircle2
} from 'lucide-react';

interface ScheduleItem {
  id: number;
  title: string;
  description?: string;
  eventType?: string; // CLASS, EXAM, WEBINAR, DEADLINE
  courseTitle?: string;
  batchName?: string;
  subjectName?: string;
  instructorName?: string;
  eventDate?: string; // e.g. "2026-07-31"
  startTime?: string; // e.g. "09:30:00" or "09:30"
  endTime?: string;
  location?: string;
  meetingLink?: string;
  isCancelled?: boolean;
}

export default function StudentSchedulePage() {
  const { user } = useAuth();
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'CLASS' | 'EXAM' | 'WEBINAR'>('ALL');

  // Fetch only real schedule data from backend API with NO fake fallback data
  const { data: scheduleItems = [], isLoading, isError, refetch } = useQuery<ScheduleItem[]>({
    queryKey: ['my-weekly-schedule', (user as any)?.id],
    queryFn: async () => {
      // Endpoint returning real weekly schedule events from database
      const res = await api.get('/schedules/week');
      if (res.data && res.data.success && Array.isArray(res.data.data)) {
        return res.data.data;
      }
      return [];
    }
  });

  const formatTime = (timeString?: string) => {
    if (!timeString) return '--:--';
    try {
      // Handle both HH:mm:ss and HH:mm
      const parts = timeString.split(':');
      if (parts.length >= 2) {
        let hours = parseInt(parts[0], 10);
        const minutes = parts[1];
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        return `${hours}:${minutes} ${ampm}`;
      }
      return timeString;
    } catch {
      return timeString;
    }
  };

  const formatDateLabel = (dateString?: string) => {
    if (!dateString) return 'Date TBA';
    try {
      // YYYY-MM-DD
      const date = new Date(dateString + 'T00:00:00');
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      if (date.getTime() === today.getTime()) return 'Today';
      if (date.getTime() === tomorrow.getTime()) return 'Tomorrow';
      return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const getTypeStyle = (type?: string) => {
    const norm = (type || 'CLASS').toUpperCase();
    switch(norm) {
      case 'EXAM':
      case 'DEADLINE':
        return { label: 'Exam / Deadline', color: 'text-red-400 bg-red-500/10 border-red-500/20' };
      case 'WEBINAR':
      case 'ONLINE':
        return { label: 'Online Webinar', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' };
      case 'CLASS':
      default:
        return { label: 'Campus Class', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
    }
  };

  const filteredItems = scheduleItems.filter(item => {
    const type = (item.eventType || 'CLASS').toUpperCase();
    if (selectedFilter === 'ALL') return true;
    if (selectedFilter === 'CLASS') return type === 'CLASS';
    if (selectedFilter === 'EXAM') return type === 'EXAM' || type === 'DEADLINE';
    if (selectedFilter === 'WEBINAR') return type === 'WEBINAR' || type === 'ONLINE' || Boolean(item.meetingLink);
    return true;
  });

  if (isLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
        <p className="text-sm font-medium text-slate-500">Loading live schedule from database...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 text-slate-100 pb-20 px-2 sm:px-4 pt-2">
      
      {/* Clean Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">Academic Timetable & Schedule</h1>
          <p className="text-sm text-slate-400 mt-1">
            Live schedule feed showing scheduled lectures, exams, and webinars for your assigned batch and courses.
          </p>
        </div>

        <button 
          onClick={() => refetch()} 
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer shadow-sm border border-slate-700/60 self-start sm:self-auto"
        >
          <CalendarIcon className="w-4 h-4 text-slate-400" />
          <span>Refresh Schedule</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setSelectedFilter('ALL')}
          className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            selectedFilter === 'ALL'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          All Scheduled ({scheduleItems.length})
        </button>
        <button
          onClick={() => setSelectedFilter('CLASS')}
          className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            selectedFilter === 'CLASS'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          Campus Classes ({scheduleItems.filter(i => (i.eventType || 'CLASS').toUpperCase() === 'CLASS').length})
        </button>
        <button
          onClick={() => setSelectedFilter('WEBINAR')}
          className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            selectedFilter === 'WEBINAR'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          Online Webinars ({scheduleItems.filter(i => {
            const t = (i.eventType || '').toUpperCase();
            return t === 'WEBINAR' || t === 'ONLINE' || Boolean(i.meetingLink);
          }).length})
        </button>
        <button
          onClick={() => setSelectedFilter('EXAM')}
          className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            selectedFilter === 'EXAM'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          Exams & Deadlines ({scheduleItems.filter(i => {
            const t = (i.eventType || '').toUpperCase();
            return t === 'EXAM' || t === 'DEADLINE';
          }).length})
        </button>
      </div>

      {/* Schedule Timeline */}
      <div className="space-y-4">
        {isError ? (
          <div className="py-16 text-center bg-red-950/20 border border-red-500/20 rounded-2xl text-slate-400 space-y-2">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto stroke-1" />
            <p className="text-sm font-medium text-slate-300">Could not connect to schedule service.</p>
            <p className="text-xs text-slate-500">Please ensure the backend database server is running.</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-16 text-center bg-slate-900/40 border border-slate-800/60 rounded-2xl text-slate-400 space-y-2">
            <Clock className="w-8 h-8 text-slate-600 mx-auto stroke-1" />
            <p className="text-sm font-medium text-slate-300">No schedule events found for this week.</p>
            <p className="text-xs text-slate-500">
              Your academic timetable currently has no upcoming lectures or exams scheduled in the system.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => {
              const typeStyle = getTypeStyle(item.eventType);

              return (
                <div 
                  key={item.id} 
                  className="p-5 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl transition-all duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-5"
                >
                  <div className="flex items-start gap-4 min-w-0">
                    
                    {/* Time Block */}
                    <div className="w-24 shrink-0 p-3 bg-slate-950 border border-slate-800/80 rounded-xl text-center space-y-0.5">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400 block truncate">
                        {formatDateLabel(item.eventDate)}
                      </span>
                      <p className="text-sm font-bold text-white font-mono">
                        {formatTime(item.startTime)}
                      </p>
                      {item.endTime && (
                        <p className="text-[10px] text-slate-500 font-mono">
                          to {formatTime(item.endTime)}
                        </p>
                      )}
                    </div>

                    {/* Details Block */}
                    <div className="space-y-2 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${typeStyle.color}`}>
                          {typeStyle.label}
                        </span>
                        {(item.courseTitle || item.subjectName || item.batchName) && (
                          <span className="text-xs text-slate-400 font-medium truncate">
                            {[item.subjectName, item.courseTitle, item.batchName].filter(Boolean).join(' • ')}
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-semibold text-white truncate">
                        {item.title}
                      </h3>

                      {item.description && (
                        <p className="text-xs text-slate-400 line-clamp-2">
                          {item.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-0.5">
                        {item.instructorName && (
                          <span>Instructor: <strong className="text-slate-300 font-normal">{item.instructorName}</strong></span>
                        )}
                        {item.location && (
                          <span className="flex items-center gap-1 text-slate-400">
                            <MapPin className="w-3.5 h-3.5 text-slate-500" />
                            <span>{item.location}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2.5 shrink-0 sm:self-center self-end pt-3 sm:pt-0 border-t sm:border-0 border-slate-800/80 w-full sm:w-auto justify-end">
                    {item.meetingLink ? (
                      <a
                        href={item.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium transition-colors shadow-sm inline-flex items-center gap-1.5"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Join Online Class</span>
                      </a>
                    ) : (
                      <span className="px-3.5 py-1.5 bg-slate-800/60 text-slate-400 rounded-xl text-xs font-medium">
                        {item.location ? 'On Campus' : 'In-Person'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
