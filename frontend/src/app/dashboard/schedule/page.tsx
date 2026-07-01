'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { generateIcsFile } from '@/lib/icsHelper';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Video, 
  Download, 
  Sparkles, 
  AlertTriangle, 
  FileText, 
  Coffee, 
  Loader2,
  CalendarCheck,
  Trash2
} from 'lucide-react';

interface ScheduleEvent {
  id: number;
  title: string;
  description: string;
  eventType: 'CLASS' | 'TEST' | 'ASSIGNMENT' | 'SPECIAL' | 'HOLIDAY';
  courseId: number | null;
  courseTitle: string | null;
  instructorId: number | null;
  instructorName: string | null;
  targetRole: string;
  eventDate: string; // YYYY-MM-DD
  startTime: string; // HH:MM:SS or HH:MM
  endTime: string; // HH:MM:SS or HH:MM
  location: string | null;
  meetingLink: string | null;
  isRecurring: boolean;
  recurrenceDay: string | null;
  isCancelled: boolean;
  createdById: number;
  createdByName: string;
  isUpdated: boolean;
  batchId: number | null;
  batchName: string | null;
  subjectName: string | null;
}

export default function StudentSchedulePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const date = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${date}`;
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/schedules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly-schedule'] });
      alert('Event deleted successfully!');
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to delete event');
    }
  });

  const handleDeleteEvent = (id: number) => {
    if (confirm('Are you sure you want to delete this schedule event?')) {
      deleteMutation.mutate(id);
    }
  };

  // 1. Fetch 7-day schedule
  const { data: scheduleEvents = [], isLoading, error } = useQuery<ScheduleEvent[]>({
    queryKey: ['weekly-schedule'],
    queryFn: async () => {
      const response = await api.get('/schedules/week');
      return response.data.success ? response.data.data : [];
    }
  });

  // 2. Generate list of next 7 days (today + 6 days)
  const daysList = React.useMemo(() => {
    const list = [];
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const date = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${date}`;
      list.push({
        dateStr,
        dayName: weekdays[d.getDay()],
        dateNum: d.getDate(),
        isToday: i === 0
      });
    }
    return list;
  }, []);

  // 3. Filter events for the currently selected day
  const filteredEvents = React.useMemo(() => {
    return scheduleEvents.filter(e => e.eventDate === selectedDate);
  }, [scheduleEvents, selectedDate]);

  // 4. Export all 7 days to calendar
  const handleExportFullWeek = () => {
    if (scheduleEvents.length === 0) return;
    generateIcsFile(scheduleEvents, 'learnstudio-full-week-schedule.ics');
  };

  // 5. Export single event
  const handleExportSingle = (event: ScheduleEvent) => {
    generateIcsFile([event], `event-${event.id}.ics`);
  };

  // Helper to format time (e.g. 10:00:00 -> 10:00 AM)
  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    const parts = timeStr.split(':');
    let hh = parseInt(parts[0] || '0');
    const mm = parts[1] || '00';
    const ampm = hh >= 12 ? 'PM' : 'AM';
    hh = hh % 12;
    hh = hh ? hh : 12; // 0 should be 12
    return `${hh}:${mm} ${ampm}`;
  };

  if (isLoading) {
    return (
      <div className="h-[65vh] flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-650" />
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-450 font-medium">Loading schedule...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-550/5 border border-red-200 dark:border-red-900/10 rounded-3xl text-center max-w-xl mx-auto space-y-3">
        <h3 className="font-bold text-red-600 dark:text-red-400 text-lg">Failed to load schedule</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">Please check if the backend server is running and try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto text-slate-900 dark:text-white">
      
      {/* Header and Bulk Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">This Week&apos;s Schedule</h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">Stay updated with class timings, exams, assignments, and special lectures.</p>
        </div>
        
        {scheduleEvents.length > 0 && (
          <button
            onClick={handleExportFullWeek}
            className="inline-flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl shadow-lg shadow-indigo-600/10 dark:shadow-indigo-650/10 transition-all font-bold text-xs cursor-pointer self-start sm:self-auto"
          >
            <CalendarCheck className="w-4 h-4" />
            Add Full Week to Calendar
          </button>
        )}
      </div>

      {/* 7-day Horizontal Calendar Strip */}
      <div className="grid grid-cols-7 gap-2 sm:gap-3 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-850 p-3 rounded-3xl shadow-sm dark:shadow-md">
        {daysList.map((day) => {
          const isSelected = selectedDate === day.dateStr;
          
          // Count events on this day
          const dayEvents = scheduleEvents.filter(e => e.eventDate === day.dateStr);
          const eventCount = dayEvents.length;
          
          // Check for exams (tests) on this day for the dot indicator
          const hasTest = dayEvents.some(e => e.eventType === 'TEST');

          return (
            <button
              key={day.dateStr}
              onClick={() => setSelectedDate(day.dateStr)}
              className={`flex flex-col items-center p-3 rounded-2xl transition-all cursor-pointer relative group ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 scale-[1.03]'
                  : 'bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800/60 text-slate-700 dark:text-slate-350 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-wide ${isSelected ? 'text-indigo-100' : 'text-slate-400 dark:text-slate-500'}`}>
                {day.dayName}
              </span>
              <span className="text-lg sm:text-2xl font-black mt-1 leading-none">
                {day.dateNum}
              </span>
              
              {/* Event count badge */}
              {eventCount > 0 && (
                <span className={`mt-2 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md ${
                  isSelected 
                    ? 'bg-indigo-500 text-indigo-100' 
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-750 dark:text-slate-300 border border-slate-300/50 dark:border-slate-700/50'
                }`}>
                  {eventCount}
                </span>
              )}

              {/* Test milestone dot indicator */}
              {hasTest && (
                <span className={`absolute top-2 right-2 w-2 h-2 rounded-full animate-pulse ${
                  isSelected ? 'bg-white' : 'bg-red-500'
                }`} />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Day details & Timeline view */}
      <div className="space-y-5">
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200 dark:border-slate-800/80">
          <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
            Timeline for {new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
          </h3>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-850/55 py-12 px-6 rounded-3xl text-center space-y-4 max-w-md mx-auto shadow-sm">
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-450 dark:text-slate-500 rounded-xl flex items-center justify-center mx-auto">
              <Calendar className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-slate-700 dark:text-slate-400 text-sm">No schedule found for this day</h4>
              <p className="text-slate-500 dark:text-slate-550 text-xs font-medium">There are no classes, tests, or events mapped to this date.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEvents.map((event) => {
              const isClass = event.eventType === 'CLASS';
              const isTest = event.eventType === 'TEST';
              const isAssignment = event.eventType === 'ASSIGNMENT';
              const isSpecial = event.eventType === 'SPECIAL';
              const isHoliday = event.eventType === 'HOLIDAY';

              // Card styling depending on event type (Fully Adaptive to Themes!)
              let cardStyle = "bg-white dark:bg-slate-900/65 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-750 shadow-sm";
              let badgeStyle = "bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-300 border-slate-200 dark:border-slate-700/50";
              let glowStyle = "";

              if (isTest) {
                cardStyle = "bg-red-50/40 dark:bg-red-950/15 border border-red-150 dark:border-red-900/30 hover:border-red-350 dark:hover:border-red-800/50 text-slate-900 dark:text-white shadow-sm";
                badgeStyle = "bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20";
              } else if (isAssignment) {
                cardStyle = "bg-sky-50/40 dark:bg-sky-950/15 border border-sky-150 dark:border-sky-900/20 hover:border-sky-350 dark:hover:border-sky-800/40 text-slate-900 dark:text-white shadow-sm";
                badgeStyle = "bg-sky-100 dark:bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-550/20";
              } else if (isSpecial) {
                cardStyle = "bg-gradient-to-r from-indigo-50/40 via-purple-50/40 to-indigo-50/40 dark:from-indigo-950/20 dark:via-purple-950/20 dark:to-indigo-950/20 border border-purple-200 dark:border-purple-500/25 hover:border-purple-355 dark:hover:border-purple-500/40 shadow-sm dark:shadow-md text-slate-900 dark:text-white";
                badgeStyle = "bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/30";
                glowStyle = "text-purple-650 dark:text-purple-400 animate-pulse";
              } else if (isHoliday) {
                cardStyle = "bg-slate-50/70 dark:bg-slate-950/35 border border-slate-200 dark:border-slate-900/80 opacity-60 dark:opacity-55 hover:opacity-80 dark:hover:opacity-75 select-none text-slate-650 dark:text-slate-350";
                badgeStyle = "bg-slate-100 dark:bg-slate-950/50 text-slate-500 dark:text-slate-500 border-slate-200 dark:border-slate-800";
              }

              return (
                <div 
                  key={event.id} 
                  className={`p-6 rounded-3xl transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-6 ${cardStyle}`}
                >
                  <div className="space-y-3.5 flex-1 min-w-0">
                    
                    {/* Top Row: Badges */}
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className={`inline-flex items-center gap-1 text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border ${badgeStyle}`}>
                        {isSpecial && <Sparkles className="w-3 h-3" />}
                        {isTest && <AlertTriangle className="w-3 h-3" />}
                        {isAssignment && <FileText className="w-3 h-3" />}
                        {isHoliday && <Coffee className="w-3 h-3" />}
                        {event.eventType}
                      </span>

                      {/* Course badge */}
                      {event.courseTitle && (
                        <span className="text-[9px] font-extrabold px-2.5 py-0.5 bg-slate-100 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 text-indigo-650 dark:text-indigo-400 rounded-full">
                          {event.courseTitle}
                        </span>
                      )}

                      {/* Batch badge */}
                      {event.batchName && (
                        <span className="text-[9px] font-extrabold px-2.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-650 dark:text-indigo-400 rounded-full">
                          Batch: {event.batchName}
                        </span>
                      )}

                      {/* Subject badge */}
                      {event.subjectName && (
                        <span className="text-[9px] font-extrabold px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-650 dark:text-emerald-450 rounded-full">
                          Subject: {event.subjectName}
                        </span>
                      )}

                      {/* Cancelled Badge */}
                      {event.isCancelled && (
                        <span className="text-[9px] font-extrabold px-2.5 py-0.5 bg-red-500/10 border border-red-555/25 dark:border-red-500/25 text-red-500 dark:text-red-400 rounded-full uppercase tracking-wider">
                          Cancelled
                        </span>
                      )}

                      {/* Updated Badge */}
                      {!event.isCancelled && event.isUpdated && (
                        <span className="text-[9px] font-extrabold px-2.5 py-0.5 bg-amber-500/10 border border-amber-555/25 dark:border-amber-500/25 text-amber-650 dark:text-amber-400 rounded-full uppercase tracking-wider animate-pulse">
                          Updated
                        </span>
                      )}
                    </div>

                    {/* Event Title & Description */}
                    <div className="space-y-1">
                      <h4 className={`text-base sm:text-lg font-black tracking-tight ${
                        event.isCancelled 
                          ? 'line-through text-slate-450 dark:text-slate-500' 
                          : 'text-slate-900 dark:text-white'
                      } flex items-center gap-2`}>
                        {event.title}
                        {isSpecial && <Sparkles className={`w-4 h-4 ${glowStyle}`} />}
                      </h4>
                      {event.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl">{event.description}</p>
                      )}
                    </div>

                    {/* Metadata Row: Instructor, Location, Meeting Link */}
                    <div className="flex flex-wrap gap-y-2 gap-x-4 text-slate-500 dark:text-slate-400 text-xs font-semibold">
                      {event.instructorName && (
                        <span className="flex items-center gap-1">
                          <span className="text-slate-400 dark:text-slate-500 font-medium">Instructor:</span> {event.instructorName}
                        </span>
                      )}

                      {/* Meeting Link (if available) */}
                      {event.meetingLink && !event.isCancelled && (
                        <a 
                          href={event.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-indigo-650 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 font-bold transition-all hover:underline"
                        >
                          <Video className="w-3.5 h-3.5" /> Join Online Class
                        </a>
                      )}

                      {/* Location (if available) */}
                      {event.location && !event.meetingLink && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" /> {event.location}
                        </span>
                      )}
                    </div>

                  </div>

                  {/* Right Column: Time Slot & Action Button */}
                  <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end justify-between w-full md:w-auto gap-4 pt-4 md:pt-0 border-t md:border-t-0 border-slate-200 dark:border-slate-800/60 shrink-0">
                    
                    {/* Time details */}
                    <div className="space-y-1 text-left md:text-right">
                      <div className="flex items-center md:justify-end gap-1.5 text-indigo-650 dark:text-indigo-400 font-bold text-xs sm:text-sm">
                        <Clock className="w-4 h-4 shrink-0" />
                        <span>{formatTime(event.startTime)} - {formatTime(event.endTime)}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-medium">
                        Duration: {event.startTime && event.endTime ? (
                          (() => {
                            const [h1, m1] = event.startTime.split(':').map(Number);
                            const [h2, m2] = event.endTime.split(':').map(Number);
                            if (h1 !== undefined && m1 !== undefined && h2 !== undefined && m2 !== undefined) {
                              const min1 = h1 * 60 + m1;
                              const min2 = h2 * 60 + m2;
                              const diff = min2 - min1;
                              const hrs = Math.floor(diff / 60);
                              const mins = diff % 60;
                              return hrs > 0 ? `${hrs}h ${mins}m` : `${mins} min`;
                            }
                            return 'N/A';
                          })()
                        ) : 'N/A'}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row md:flex-col gap-2 self-stretch sm:self-auto">
                      {/* Delete Event Button */}
                      {(user?.role === 'ADMIN' || user?.role === 'INSTRUCTOR') && (
                        <button
                          onClick={() => handleDeleteEvent(event.id)}
                          className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500 hover:text-white border border-rose-550/15 text-rose-500 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer self-stretch sm:self-auto shadow-sm"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete Event
                        </button>
                      )}
                      
                      {/* Export to ICS Button */}
                      {!event.isCancelled && (
                        <button
                          onClick={() => handleExportSingle(event)}
                          className="px-4 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-350 hover:text-slate-900 dark:hover:text-white rounded-xl text-[10px] font-bold transition-all flex items-center gap-1.5 cursor-pointer self-stretch sm:self-auto shadow-sm"
                        >
                          <Download className="w-3 h-3" />
                          Add to Calendar
                        </button>
                      )}
                    </div>

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
