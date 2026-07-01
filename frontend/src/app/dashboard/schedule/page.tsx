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
  Trash2,
  BookOpen,
  Plus
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

interface Batch {
  id: number;
  name: string;
  level: string;
  subjects: string[];
  studentCount: number;
}

export default function StudentSchedulePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAdminOrInstructor = user?.role === 'ADMIN' || user?.role === 'INSTRUCTOR';

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const date = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${date}`;
  });

  // Event Creator Form states
  const [createTitle, setCreateTitle] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createEventType, setCreateEventType] = useState<'CLASS' | 'TEST' | 'ASSIGNMENT' | 'SPECIAL' | 'HOLIDAY'>('CLASS');
  const [createTargetRole, setCreateTargetRole] = useState<'STUDENT' | 'INSTRUCTOR' | 'ALL'>('STUDENT');
  const [createMappingType, setCreateMappingType] = useState<'BATCH' | 'COURSE' | 'GENERAL'>('BATCH');
  const [createBatchId, setCreateBatchId] = useState<string>('');
  const [createCourseId, setCreateCourseId] = useState<string>('');
  const [createSubjectName, setCreateSubjectName] = useState('');
  const [createDate, setCreateDate] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const date = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${date}`;
  });
  const [createStartTime, setCreateStartTime] = useState('10:00');
  const [createEndTime, setCreateEndTime] = useState('11:00');
  const [createLocation, setCreateLocation] = useState('');
  const [createMeetingLink, setCreateMeetingLink] = useState('');
  const [createIsRecurring, setCreateIsRecurring] = useState(true);
  const [createNotifyStudents, setCreateNotifyStudents] = useState(false);

  // Mutations
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

  const addScheduleMutation = useMutation({
    mutationFn: async (payload: any) => {
      const response = await api.post('/schedules', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly-schedule'] });
      alert('Event scheduled successfully!');
      setCreateTitle('');
      setCreateDescription('');
      setCreateLocation('');
      setCreateMeetingLink('');
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to schedule event.');
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

  // 2. Fetch all batches (for event creator dropdown)
  const { data: batches = [] } = useQuery<Batch[]>({
    queryKey: ['schedule-batches-list'],
    enabled: isAdminOrInstructor,
    queryFn: async () => {
      const response = await api.get('/instructor/batches');
      const data = response.data.success ? response.data.data : [];
      if (data.length > 0 && !createBatchId) {
        setCreateBatchId(String(data[0].id));
      }
      return data;
    }
  });

  // 3. Fetch all courses (for event creator dropdown)
  const { data: courses = [] } = useQuery<any[]>({
    queryKey: ['schedule-courses-list'],
    enabled: isAdminOrInstructor,
    queryFn: async () => {
      const response = await api.get('/courses');
      const data = response.data.success 
        ? (response.data.data?.content || response.data.data || [])
        : [];
      if (data.length > 0 && !createCourseId) {
        setCreateCourseId(String(data[0].id));
      }
      return data;
    }
  });

  // Find currently active batch from selector
  const selectedBatchObj = React.useMemo(() => {
    if (!createBatchId) return null;
    return batches.find(b => b.id === parseInt(createBatchId)) || null;
  }, [batches, createBatchId]);

  // Set default subject when batch changes
  React.useEffect(() => {
    if (selectedBatchObj && selectedBatchObj.subjects.length > 0) {
      setCreateSubjectName(selectedBatchObj.subjects[0]);
    } else {
      setCreateSubjectName('');
    }
  }, [selectedBatchObj]);

  // Generate list of next 7 days (today + 6 days)
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

  // Filter events for the currently selected day
  const filteredEvents = React.useMemo(() => {
    return scheduleEvents.filter(e => e.eventDate === selectedDate);
  }, [scheduleEvents, selectedDate]);

  // Export all 7 days to calendar
  const handleExportFullWeek = () => {
    if (scheduleEvents.length === 0) return;
    generateIcsFile(scheduleEvents, 'learnstudio-full-week-schedule.ics');
  };

  // Export single event
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

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createTitle.trim()) {
      alert('Please enter a title.');
      return;
    }

    const selectedDateObj = new Date(createDate);
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const recurrenceDayName = weekdays[selectedDateObj.getDay()];

    const payload = {
      title: createTitle,
      description: createDescription,
      eventType: createEventType,
      targetRole: createTargetRole,
      batchId: createMappingType === 'BATCH' && createBatchId ? parseInt(createBatchId) : null,
      courseId: createMappingType === 'COURSE' && createCourseId ? parseInt(createCourseId) : null,
      subjectName: createMappingType === 'BATCH' ? createSubjectName : null,
      eventDate: createDate,
      startTime: createStartTime,
      endTime: createEndTime,
      location: (createMappingType === 'BATCH' || createMappingType === 'GENERAL') ? createLocation : null,
      meetingLink: createMappingType === 'COURSE' ? createMeetingLink : null,
      isRecurring: createIsRecurring,
      recurrenceDay: createIsRecurring ? recurrenceDayName : null,
      notifyStudents: createNotifyStudents
    };

    addScheduleMutation.mutate(payload);
  };

  if (isLoading) {
    return (
      <div className="h-[65vh] flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-955 text-slate-900 dark:text-white">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-650" />
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-450 font-medium">Loading schedule...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-550/5 border border-red-200 dark:border-red-900/10 rounded-3xl text-center max-w-xl mx-auto space-y-3">
        <h3 className="font-bold text-red-600 dark:text-red-400 text-lg">Failed to load schedule</h3>
        <p className="text-sm text-slate-500 dark:text-slate-450">Please check if the backend server is running and try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto text-slate-900 dark:text-white animate-in fade-in slide-in-from-bottom-3 duration-250">
      
      {/* Header and Bulk Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20 uppercase tracking-wider mb-2">
            Weekly Calendar & Bookings
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Weekly Planner</h2>
          <p className="text-slate-500 dark:text-slate-450 text-xs sm:text-sm mt-1">
            Coordinate online webinars, schedule offline lectures, and configure institutional holidays.
          </p>
        </div>
        
        {scheduleEvents.length > 0 && (
          <button
            onClick={handleExportFullWeek}
            className="inline-flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl shadow-lg shadow-indigo-600/10 dark:shadow-indigo-650/10 transition-all font-bold text-xs cursor-pointer self-start sm:self-auto hover:scale-[1.02] active:scale-[0.98]"
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
          const dayEvents = scheduleEvents.filter(e => e.eventDate === day.dateStr);
          const eventCount = dayEvents.length;
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
              <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-wide ${isSelected ? 'text-indigo-105' : 'text-slate-400 dark:text-slate-500'}`}>
                {day.dayName}
              </span>
              <span className="text-lg sm:text-2xl font-black mt-1 leading-none">
                {day.dateNum}
              </span>
              
              {eventCount > 0 && (
                <span className={`mt-2 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md ${
                  isSelected 
                    ? 'bg-indigo-500 text-indigo-100' 
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-750 dark:text-slate-300 border border-slate-300/50 dark:border-slate-700/50'
                }`}>
                  {eventCount}
                </span>
              )}

              {hasTest && (
                <span className={`absolute top-2 right-2 w-2 h-2 rounded-full animate-pulse ${
                  isSelected ? 'bg-white' : 'bg-red-500'
                }`} />
              )}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left / Main Section (Timeline details): 7/12 cols if admin, else full 12 cols */}
        <div className={isAdminOrInstructor ? "lg:col-span-7 space-y-5" : "lg:col-span-12 space-y-5"}>
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200 dark:border-slate-850">
            <Calendar className="w-5 h-5 text-indigo-650 dark:text-indigo-400" />
            <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
              Timeline for {new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
            </h3>
          </div>

          {filteredEvents.length === 0 ? (
            <div className="bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-850 py-16 px-6 rounded-3xl text-center space-y-4 max-w-md mx-auto shadow-sm">
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-450 dark:text-slate-500 rounded-xl flex items-center justify-center mx-auto">
                <Calendar className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-750 dark:text-slate-400 text-sm">No events scheduled</h4>
                <p className="text-slate-500 dark:text-slate-550 text-xs font-medium">There are no classes, tests, or holidays mapped to this day.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEvents.map((event) => {
                const isTest = event.eventType === 'TEST';
                const isAssignment = event.eventType === 'ASSIGNMENT';
                const isSpecial = event.eventType === 'SPECIAL';
                const isHoliday = event.eventType === 'HOLIDAY';

                let cardStyle = "bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-850 hover:border-slate-300 dark:hover:border-slate-800 shadow-sm";
                let badgeStyle = "bg-slate-100 dark:bg-slate-800/80 text-slate-650 dark:text-slate-300 border-slate-200 dark:border-slate-700/50";
                let glowStyle = "";

                if (isTest) {
                  cardStyle = "bg-red-50/45 dark:bg-red-950/10 border border-red-150 dark:border-red-900/20 hover:border-red-300 dark:hover:border-red-800/40 text-slate-900 dark:text-white shadow-sm";
                  badgeStyle = "bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20";
                } else if (isAssignment) {
                  cardStyle = "bg-sky-50/45 dark:bg-sky-950/10 border border-sky-150 dark:border-sky-900/20 hover:border-sky-350 dark:hover:border-sky-800/30 text-slate-900 dark:text-white shadow-sm";
                  badgeStyle = "bg-sky-100 dark:bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-550/20";
                } else if (isSpecial) {
                  cardStyle = "bg-gradient-to-r from-indigo-50/30 via-purple-50/30 to-indigo-50/30 dark:from-indigo-950/15 dark:via-purple-950/15 dark:to-indigo-950/15 border border-purple-200 dark:border-purple-500/20 hover:border-purple-300 dark:hover:border-purple-500/40 shadow-sm text-slate-900 dark:text-white";
                  badgeStyle = "bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/30";
                  glowStyle = "text-purple-650 dark:text-purple-400 animate-pulse";
                } else if (isHoliday) {
                  cardStyle = "bg-slate-50/70 dark:bg-slate-950/35 border border-slate-200 dark:border-slate-900/80 opacity-60 hover:opacity-75 select-none text-slate-650 dark:text-slate-400";
                  badgeStyle = "bg-slate-100 dark:bg-slate-900/50 text-slate-500 dark:text-slate-500 border-slate-200 dark:border-slate-800";
                }

                return (
                  <div 
                    key={event.id} 
                    className={`p-5 rounded-2xl transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${cardStyle}`}
                  >
                    <div className="space-y-3 flex-1 min-w-0">
                      
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wider border ${badgeStyle}`}>
                          {event.eventType}
                        </span>

                        {event.courseTitle && (
                          <span className="text-[9px] font-extrabold px-2 py-0.5 bg-slate-100 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-850 text-indigo-650 dark:text-indigo-400 rounded-full">
                            {event.courseTitle}
                          </span>
                        )}

                        {event.batchName && (
                          <span className="text-[9px] font-extrabold px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-850 text-indigo-650 dark:text-indigo-400 rounded-full">
                            Batch: {event.batchName}
                          </span>
                        )}

                        {event.subjectName && (
                          <span className="text-[9px] font-extrabold px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-855 text-emerald-655 dark:text-emerald-400 rounded-full">
                            Subject: {event.subjectName}
                          </span>
                        )}

                        {event.isCancelled && (
                          <span className="text-[9px] font-extrabold px-2 py-0.5 bg-red-500/10 border border-red-500/25 text-red-500 dark:text-red-400 rounded-full uppercase tracking-wider">
                            Cancelled
                          </span>
                        )}

                        {!event.isCancelled && event.isUpdated && (
                          <span className="text-[9px] font-extrabold px-2 py-0.5 bg-amber-500/10 border border-amber-500/25 text-amber-650 dark:text-amber-400 rounded-full uppercase tracking-wider animate-pulse">
                            Updated
                          </span>
                        )}
                      </div>

                      <div className="space-y-1">
                        <h4 className={`text-base font-black tracking-tight ${
                          event.isCancelled ? 'line-through text-slate-500' : 'text-slate-905 dark:text-white'
                        } flex items-center gap-1.5`}>
                          {event.title}
                          {isSpecial && <Sparkles className={`w-4.5 h-4.5 ${glowStyle}`} />}
                        </h4>
                        {event.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl">{event.description}</p>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-y-2 gap-x-4 text-slate-500 dark:text-slate-400 text-xs font-semibold">
                        {event.instructorName && (
                          <span className="flex items-center gap-1">
                            <span className="text-slate-400 dark:text-slate-500 font-medium">Instructor:</span> {event.instructorName}
                          </span>
                        )}

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

                        {event.location && !event.meetingLink && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" /> {event.location}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end justify-between w-full md:w-auto gap-4 pt-3 md:pt-0 border-t md:border-t-0 border-slate-200 dark:border-slate-850 shrink-0">
                      
                      <div className="space-y-0.5 text-left md:text-right">
                        <div className="flex items-center md:justify-end gap-1 text-indigo-650 dark:text-indigo-400 font-bold text-xs sm:text-sm">
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
                        {(user?.role === 'ADMIN' || user?.role === 'INSTRUCTOR') && (
                          <button
                            onClick={() => handleDeleteEvent(event.id)}
                            className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500 hover:text-white border border-rose-500/20 text-rose-500 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer self-stretch sm:self-auto shadow-sm"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete Event
                          </button>
                        )}
                        
                        {!event.isCancelled && (
                          <button
                            onClick={() => handleExportSingle(event)}
                            className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-350 hover:text-slate-900 dark:hover:text-white rounded-xl text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer self-stretch sm:self-auto shadow-sm"
                          >
                            <Download className="w-3 h-3" />
                            Export (.ics)
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

        {/* Right Section (Schedules Event Creator Form): 5/12 cols (Visible only to Admin/Instructor) */}
        {isAdminOrInstructor && (
          <div className="lg:col-span-5 space-y-4">
            <div className="glass-card p-6 rounded-3xl border border-slate-850 space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-indigo-400" /> Event Creator Workspace
              </h3>

              <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
                
                {/* Event Type */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-slate-400 font-bold uppercase text-[9px] tracking-wider">Event Type *</label>
                    <select
                      value={createEventType}
                      onChange={(e) => setCreateEventType(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                      required
                    >
                      <option value="CLASS">CLASS</option>
                      <option value="TEST">TEST / EXAM</option>
                      <option value="ASSIGNMENT">ASSIGNMENT</option>
                      <option value="SPECIAL">SPECIAL SESSION</option>
                      <option value="HOLIDAY">HOLIDAY</option>
                    </select>
                  </div>

                  {/* Target Audience */}
                  <div className="space-y-1">
                    <label className="block text-slate-400 font-bold uppercase text-[9px] tracking-wider">Target Audience *</label>
                    <select
                      value={createTargetRole}
                      onChange={(e) => setCreateTargetRole(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                      required
                    >
                      <option value="STUDENT">STUDENTS</option>
                      <option value="INSTRUCTOR">INSTRUCTORS</option>
                      <option value="ALL">ALL USERS</option>
                    </select>
                  </div>
                </div>

                {/* Event Title */}
                <div className="space-y-1">
                  <label className="block text-slate-400 font-bold uppercase text-[9px] tracking-wider">Title *</label>
                  <input
                    type="text"
                    required
                    value={createTitle}
                    onChange={(e) => setCreateTitle(e.target.value)}
                    placeholder="e.g. Science Revision Session"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Event Description */}
                <div className="space-y-1">
                  <label className="block text-slate-400 font-bold uppercase text-[9px] tracking-wider">Description</label>
                  <textarea
                    rows={2}
                    value={createDescription}
                    onChange={(e) => setCreateDescription(e.target.value)}
                    placeholder="Provide guidelines or details about this event..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>

                {/* Resource Mapping Type */}
                <div className="grid grid-cols-3 gap-2 bg-slate-950/45 p-1 rounded-xl border border-slate-855">
                  {(['BATCH', 'COURSE', 'GENERAL'] as const).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setCreateMappingType(type)}
                      className={`py-1.5 rounded-lg font-bold text-[9px] uppercase tracking-wider cursor-pointer transition-all ${
                        createMappingType === type
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-350'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                {/* Dynamic Mapping Fields */}
                {createMappingType === 'BATCH' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-slate-400 font-bold uppercase text-[9px] tracking-wider">Select Batch *</label>
                      <select
                        value={createBatchId}
                        onChange={(e) => setCreateBatchId(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                        required
                      >
                        <option value="">Choose batch...</option>
                        {batches.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-slate-400 font-bold uppercase text-[9px] tracking-wider">Subject Name *</label>
                      {selectedBatchObj && selectedBatchObj.subjects.length > 0 ? (
                        <select
                          value={createSubjectName}
                          onChange={(e) => setCreateSubjectName(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-855 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                          required
                        >
                          {selectedBatchObj.subjects.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          required
                          value={createSubjectName}
                          onChange={(e) => setCreateSubjectName(e.target.value)}
                          placeholder="e.g. Mathematics"
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-slate-200 focus:outline-none"
                        />
                      )}
                    </div>
                  </div>
                )}

                {createMappingType === 'COURSE' && (
                  <div className="space-y-1">
                    <label className="block text-slate-400 font-bold uppercase text-[9px] tracking-wider">Select Enrolled Course *</label>
                    <select
                      value={createCourseId}
                      onChange={(e) => setCreateCourseId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                      required
                    >
                      <option value="">Choose course...</option>
                      {courses.map(c => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Scheduling Details */}
                <div className="grid grid-cols-3 gap-2">
                  {/* Date */}
                  <div className="space-y-1">
                    <label className="block text-slate-400 font-bold uppercase text-[9px] tracking-wider">Date *</label>
                    <input
                      type="date"
                      required
                      value={createDate}
                      onChange={(e) => setCreateDate(e.target.value)}
                      className="w-full px-2 py-2 bg-slate-950 border border-slate-855 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                    />
                  </div>

                  {/* Start Time */}
                  <div className="space-y-1">
                    <label className="block text-slate-400 font-bold uppercase text-[9px] tracking-wider">Start Time *</label>
                    <input
                      type="time"
                      required
                      value={createStartTime}
                      onChange={(e) => setCreateStartTime(e.target.value)}
                      className="w-full px-2 py-2 bg-slate-950 border border-slate-855 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                    />
                  </div>

                  {/* End Time */}
                  <div className="space-y-1">
                    <label className="block text-slate-400 font-bold uppercase text-[9px] tracking-wider">End Time *</label>
                    <input
                      type="time"
                      required
                      value={createEndTime}
                      onChange={(e) => setCreateEndTime(e.target.value)}
                      className="w-full px-2 py-2 bg-slate-950 border border-slate-855 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Location or Meeting Link */}
                  {createMappingType !== 'COURSE' ? (
                    <div className="space-y-1 col-span-2">
                      <label className="block text-slate-400 font-bold uppercase text-[9px] tracking-wider">Classroom / Location</label>
                      <input
                        type="text"
                        value={createLocation}
                        onChange={(e) => setCreateLocation(e.target.value)}
                        placeholder="e.g. Lab 4B or Offline"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  ) : (
                    <div className="space-y-1 col-span-2">
                      <label className="block text-slate-400 font-bold uppercase text-[9px] tracking-wider">Webinar / Zoom Meeting Link</label>
                      <input
                        type="url"
                        value={createMeetingLink}
                        onChange={(e) => setCreateMeetingLink(e.target.value)}
                        placeholder="e.g. https://zoom.us/j/..."
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 border-t border-slate-850 pt-3">
                  {/* Frequency Selector */}
                  <div className="space-y-1">
                    <label className="block text-slate-400 font-bold uppercase text-[9px] tracking-wider">Frequency *</label>
                    <select
                      value={createIsRecurring ? 'true' : 'false'}
                      onChange={(e) => setCreateIsRecurring(e.target.value === 'true')}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-855 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="true">Weekly Recurring</option>
                      <option value="false">One-time Event</option>
                    </select>
                  </div>

                  {/* Target Audience notification option */}
                  <div className="flex items-center gap-2 pt-4 justify-end pr-2">
                    <input
                      type="checkbox"
                      id="notifyStudentsCheck"
                      checked={createNotifyStudents}
                      onChange={(e) => setCreateNotifyStudents(e.target.checked)}
                      className="rounded border-slate-800 text-indigo-650 focus:ring-indigo-500 bg-slate-950 cursor-pointer w-4 h-4"
                    />
                    <label htmlFor="notifyStudentsCheck" className="text-slate-400 font-bold text-[9px] uppercase tracking-wider cursor-pointer">
                      Send Email Alert
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={addScheduleMutation.isPending}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-[0.98]"
                >
                  {addScheduleMutation.isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Scheduling Event...
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      Add to Schedule Feed
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
