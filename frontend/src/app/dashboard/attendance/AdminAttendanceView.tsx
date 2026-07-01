'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
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
  Loader2,
  RefreshCw,
  Trophy,
  Trash2,
  Plus,
  User,
  Users,
  ChevronRight,
  Sparkles,
  Layers
} from 'lucide-react';

interface Batch {
  id: number;
  name: string;
  level: string;
  subjects: string[];
  studentCount: number;
  instructorName?: string;
  instructorId?: number;
}

interface Student {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface AttendanceRecord {
  id: number;
  studentId: number;
  studentName: string;
  subjectName: string;
  date: string;
  day: string;
  status: 'PRESENT' | 'ABSENT';
}

interface SubjectStat {
  subjectName: string;
  percentage: number;
  present: number;
  total: number;
}

interface StudentAttendanceDetails {
  offlineRate: number;
  offlinePresent: number;
  offlineTotal: number;
  subjectWiseStats: SubjectStat[];
  records: AttendanceRecord[];
}

export default function AdminAttendanceView() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Navigation & Sub-views State
  const [activeTab, setActiveTab] = useState<'BATCHES' | 'STUDENTS'>('BATCHES');
  
  // Selected Entities
  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  
  // Mark Attendance Form State
  const [markingSubject, setMarkingSubject] = useState('');
  const [markingDate, setMarkingDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [markingRecords, setMarkingRecords] = useState<Record<number, 'PRESENT' | 'ABSENT'>>({});
  const [showMarkingPanel, setShowMarkingPanel] = useState(false);

  // Filters for Batch Register Log
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [logSubjectFilter, setLogSubjectFilter] = useState('ALL');
  const [logStatusFilter, setLogStatusFilter] = useState<'ALL' | 'PRESENT' | 'ABSENT'>('ALL');

  // ────────────────────────────────────────────────────────────────────────
  // DATA FETCHING QUERIES
  // ────────────────────────────────────────────────────────────────────────

  // 1. Fetch all batches
  const { data: batches = [], isLoading: isBatchesLoading, refetch: refetchBatches } = useQuery<Batch[]>({
    queryKey: ['admin-attendance-batches'],
    queryFn: async () => {
      const response = await api.get('/instructor/batches');
      const data = response.data.success ? response.data.data : [];
      
      // Auto-select first batch if none selected
      if (data.length > 0 && selectedBatchId === null) {
        setSelectedBatchId(data[0].id);
      }
      return data;
    }
  });

  // Find the currently active batch details from cached list
  const activeBatch = useMemo(() => {
    return batches.find(b => b.id === selectedBatchId) || null;
  }, [batches, selectedBatchId]);

  // 2. Fetch all students in the database for the search/select filter
  const { data: studentsList = [], isLoading: isStudentsLoading } = useQuery<Student[]>({
    queryKey: ['admin-attendance-all-students'],
    queryFn: async () => {
      const response = await api.get('/instructor/attendance/students');
      const data = response.data.success ? response.data.data : [];
      if (data.length > 0 && selectedStudentId === null) {
        setSelectedStudentId(data[0].id);
      }
      return data;
    }
  });

  // 3. Fetch detailed attendance records for the selected batch
  const { data: batchAttendance = [], isLoading: isBatchAttendanceLoading, refetch: refetchBatchAttendance } = useQuery<AttendanceRecord[]>({
    queryKey: ['admin-batch-attendance-logs', selectedBatchId],
    queryFn: async () => {
      if (!selectedBatchId) return [];
      const response = await api.get(`/instructor/batches/${selectedBatchId}/attendance`);
      return response.data.success ? response.data.data : [];
    },
    enabled: !!selectedBatchId
  });

  // 4. Fetch the selected batch detailed roster (to get student details)
  const { data: batchRoster = null, isLoading: isRosterLoading } = useQuery<{ students: Student[] } | null>({
    queryKey: ['admin-batch-roster', selectedBatchId],
    queryFn: async () => {
      if (!selectedBatchId) return null;
      const response = await api.get(`/instructor/batches/${selectedBatchId}`);
      return response.data.success ? response.data.data : null;
    },
    enabled: !!selectedBatchId
  });

  // 5. Fetch details for selected student
  const { data: studentAttendance = null, isLoading: isStudentAttendanceLoading, refetch: refetchStudentAttendance } = useQuery<StudentAttendanceDetails | null>({
    queryKey: ['admin-student-attendance-details', selectedStudentId],
    queryFn: async () => {
      if (!selectedStudentId) return null;
      const response = await api.get(`/instructor/attendance/student/${selectedStudentId}`);
      return response.data.success ? response.data.data : null;
    },
    enabled: !!selectedStudentId
  });

  // Initialize markingRecords when roster loads or marking panel is opened
  React.useEffect(() => {
    if (batchRoster?.students) {
      const records: Record<number, 'PRESENT' | 'ABSENT'> = {};
      batchRoster.students.forEach(st => {
        records[st.id] = 'PRESENT';
      });
      setMarkingRecords(records);
    }
    if (activeBatch && activeBatch.subjects.length > 0) {
      setMarkingSubject(activeBatch.subjects[0]);
    }
  }, [batchRoster, activeBatch]);

  // ────────────────────────────────────────────────────────────────────────
  // MUTATIONS (MUTATING ATTENDANCE STATUS)
  // ────────────────────────────────────────────────────────────────────────

  // Mutation: Mark new attendance roster
  const markAttendanceMutation = useMutation({
    mutationFn: async (payload: any) => {
      await api.post('/instructor/attendance/mark', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-batch-attendance-logs'] });
      queryClient.invalidateQueries({ queryKey: ['admin-student-attendance-details'] });
      alert('Attendance roster submitted successfully.');
      setShowMarkingPanel(false);
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to mark attendance.');
    }
  });

  // Mutation: Toggle single attendance log status
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: 'PRESENT' | 'ABSENT' }) => {
      await api.put(`/instructor/attendance/update/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-batch-attendance-logs'] });
      queryClient.invalidateQueries({ queryKey: ['admin-student-attendance-details'] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to update status.');
    }
  });

  // Mutation: Delete single attendance record
  const deleteRecordMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/instructor/attendance/delete/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-batch-attendance-logs'] });
      queryClient.invalidateQueries({ queryKey: ['admin-student-attendance-details'] });
      alert('Record deleted successfully.');
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to delete record.');
    }
  });

  // ────────────────────────────────────────────────────────────────────────
  // HANDLERS & COMPUTATIONS
  // ────────────────────────────────────────────────────────────────────────

  const handleMarkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatchId || !markingSubject) {
      alert('Please select a subject.');
      return;
    }
    const studentRecords = Object.keys(markingRecords).map(idStr => {
      const studentId = parseInt(idStr);
      return {
        studentId,
        status: markingRecords[studentId]
      };
    });

    markAttendanceMutation.mutate({
      batchId: selectedBatchId,
      subjectName: markingSubject,
      date: markingDate,
      records: studentRecords
    });
  };

  const handleToggleStatus = (record: AttendanceRecord) => {
    const nextStatus = record.status === 'PRESENT' ? 'ABSENT' : 'PRESENT';
    toggleStatusMutation.mutate({ id: record.id, status: nextStatus });
  };

  const handleDeleteRecord = (id: number) => {
    if (confirm('Are you sure you want to permanently delete this attendance record?')) {
      deleteRecordMutation.mutate(id);
    }
  };

  // Compute batch summary stats dynamically from batchAttendance
  const batchStats = useMemo(() => {
    if (batchAttendance.length === 0) return { rate: 0, present: 0, total: 0 };
    const present = batchAttendance.filter(r => r.status === 'PRESENT').length;
    const total = batchAttendance.length;
    return {
      rate: Math.round((present / total) * 100),
      present,
      total
    };
  }, [batchAttendance]);

  // Filter batch log table records
  const filteredBatchLogs = useMemo(() => {
    return batchAttendance.filter(r => {
      const matchesSearch = r.studentName.toLowerCase().includes(logSearchQuery.toLowerCase()) || r.subjectName.toLowerCase().includes(logSearchQuery.toLowerCase());
      const matchesSubject = logSubjectFilter === 'ALL' || r.subjectName === logSubjectFilter;
      const matchesStatus = logStatusFilter === 'ALL' || r.status === logStatusFilter;
      return matchesSearch && matchesSubject && matchesStatus;
    });
  }, [batchAttendance, logSearchQuery, logSubjectFilter, logStatusFilter]);

  // Filtered Students list for search dropdown
  const filteredStudentsForSelect = useMemo(() => {
    if (!studentSearchQuery.trim()) return studentsList.slice(0, 5);
    return studentsList
      .filter(s => s.name.toLowerCase().includes(studentSearchQuery.toLowerCase()) || s.email.toLowerCase().includes(studentSearchQuery.toLowerCase()))
      .slice(0, 10);
  }, [studentsList, studentSearchQuery]);

  const activeStudent = useMemo(() => {
    return studentsList.find(s => s.id === selectedStudentId) || null;
  }, [studentsList, selectedStudentId]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-300">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20 uppercase tracking-wider mb-2">
            <Sparkles className="w-3 h-3 text-indigo-400" /> Academic Subsystem Control
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Attendance Workspace</h2>
          <p className="text-xs sm:text-sm text-slate-450 mt-1 leading-normal max-w-2xl">
            Monitor overall offline attendance metrics, mark class rosters, adjust single student records, and explore profile logs.
          </p>
        </div>

        {/* Tab switch buttons */}
        <div className="bg-slate-950/60 p-1.5 rounded-2xl border border-slate-850 flex items-center gap-1 self-start sm:self-center shrink-0">
          <button
            onClick={() => setActiveTab('BATCHES')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'BATCHES'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-650/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Batch Rosters
          </button>
          <button
            onClick={() => setActiveTab('STUDENTS')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'STUDENTS'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-650/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Student Profiles
          </button>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────
         TAB 1: BATCH ROSTERS VIEW
         ──────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'BATCHES' && (
        <div className="space-y-6">
          {/* Batches horizontal list cards */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Users className="w-4 h-4 text-indigo-400" /> Active Offline Academic Batches
            </h3>
            {isBatchesLoading ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
              </div>
            ) : batches.length === 0 ? (
              <div className="py-8 text-center border border-dashed border-slate-850 rounded-2xl text-xs text-slate-500 bg-slate-955/15">
                No active batches found in the system. Create a batch first.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {batches.map(b => {
                  const isActive = b.id === selectedBatchId;
                  return (
                    <button
                      key={b.id}
                      onClick={() => {
                        setSelectedBatchId(b.id);
                        setShowMarkingPanel(false);
                      }}
                      className={`text-left p-5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between h-36 ${
                        isActive
                          ? 'bg-indigo-650/10 border-indigo-500/80 shadow-lg shadow-indigo-650/5 ring-1 ring-indigo-500/20'
                          : 'bg-slate-900/30 hover:bg-slate-900/50 border-slate-850 text-slate-450 hover:border-slate-800'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/15 tracking-wider">
                            {b.level}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500">
                            {b.studentCount} Students
                          </span>
                        </div>
                        <h4 className="text-sm font-black text-white truncate mt-1">
                          {b.name}
                        </h4>
                      </div>

                      <div className="flex items-end justify-between border-t border-slate-850/80 pt-2 text-[10px]">
                        <div>
                          <span className="text-slate-500 block">Instructor</span>
                          <span className="font-bold text-slate-300 truncate block max-w-[130px]">
                            {b.instructorName || 'Unassigned'}
                          </span>
                        </div>
                        {isActive && (
                          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {activeBatch && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column (5/12 cols): Stats Summary & Mark Attendance */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Stats summary widget */}
                <div className="glass-card p-6 rounded-3xl border border-slate-850 space-y-5">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                    Roster Snapshot: {activeBatch.name}
                  </h4>

                  <div className="flex items-center gap-6">
                    <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="40" cy="40" r="24" className="stroke-slate-950" strokeWidth="5" fill="transparent" />
                        <circle cx="40" cy="40" r="24" className="stroke-indigo-500 transition-all duration-700" strokeWidth="5" fill="transparent" strokeDasharray={2 * Math.PI * 24} strokeDashoffset={2 * Math.PI * 24 - (batchStats.rate / 100) * (2 * Math.PI * 24)} strokeLinecap="round" />
                      </svg>
                      <span className="absolute text-sm font-black text-white">{batchStats.rate}%</span>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Average Attendance Rate</p>
                      <h4 className="text-2xl font-black text-white">{batchStats.present} Present Logs</h4>
                      <p className="text-[10px] text-slate-500">Out of {batchStats.total} total logged classes</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 border-t border-slate-855 pt-4 text-xs font-bold text-slate-350">
                    <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850 text-center">
                      <span className="text-emerald-450 block text-lg font-black">{batchStats.present}</span>
                      <span className="text-[9px] text-slate-500 uppercase tracking-wider">Presents Logged</span>
                    </div>
                    <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850 text-center">
                      <span className="text-rose-455 block text-lg font-black">{batchStats.total - batchStats.present}</span>
                      <span className="text-[9px] text-slate-500 uppercase tracking-wider">Absents Logged</span>
                    </div>
                  </div>

                  {!showMarkingPanel && (
                    <button
                      onClick={() => setShowMarkingPanel(true)}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-650/15 flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98]"
                    >
                      <Plus className="w-4 h-4" />
                      Mark New Attendance
                    </button>
                  )}
                </div>

                {/* Mark Attendance Form panel */}
                {showMarkingPanel && (
                  <form onSubmit={handleMarkSubmit} className="glass-card p-6 rounded-3xl border border-indigo-950/40 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-1.5">
                        <UserCheck className="w-4 h-4 text-indigo-400" /> Roster Sheet
                      </h4>
                      <button
                        type="button"
                        onClick={() => setShowMarkingPanel(false)}
                        className="text-slate-500 hover:text-slate-300 text-[10px] uppercase font-bold"
                      >
                        Cancel
                      </button>
                    </div>

                    {/* Subject Selector */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="space-y-1">
                        <label className="block text-slate-400 font-bold uppercase text-[9px] tracking-wider">Subject *</label>
                        <select
                          value={markingSubject}
                          onChange={(e) => setMarkingSubject(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                          required
                        >
                          <option value="">Select subject...</option>
                          {activeBatch.subjects.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>

                      {/* Date */}
                      <div className="space-y-1">
                        <label className="block text-slate-400 font-bold uppercase text-[9px] tracking-wider">Date *</label>
                        <input
                          type="date"
                          value={markingDate}
                          onChange={(e) => setMarkingDate(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-855 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                          required
                        />
                      </div>
                    </div>

                    {/* Students Checklist */}
                    <div className="space-y-2 border-t border-slate-850 pt-3">
                      <div className="flex items-center justify-between text-[9px] uppercase tracking-wider text-slate-500 px-1 font-bold">
                        <span>Student Name</span>
                        <span>Status</span>
                      </div>

                      {isRosterLoading ? (
                        <div className="py-6 flex justify-center">
                          <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                        </div>
                      ) : !batchRoster?.students || batchRoster.students.length === 0 ? (
                        <div className="text-center py-4 text-xs text-slate-500">
                          No students assigned to this batch. Go to batch settings to add students.
                        </div>
                      ) : (
                        <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                          {batchRoster.students.map(st => {
                            const isPresent = markingRecords[st.id] === 'PRESENT';
                            return (
                              <div key={st.id} className="flex items-center justify-between p-2 bg-slate-955/30 border border-slate-900 rounded-xl hover:border-slate-850 transition-colors">
                                <div className="min-w-0 pr-2">
                                  <span className="text-xs font-bold text-slate-300 truncate block">
                                    {st.name}
                                  </span>
                                  <span className="text-[9px] text-slate-550 truncate block">
                                    {st.email}
                                  </span>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setMarkingRecords(prev => ({
                                      ...prev,
                                      [st.id]: isPresent ? 'ABSENT' : 'PRESENT'
                                    }));
                                  }}
                                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider cursor-pointer transition-all ${
                                    isPresent
                                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/25'
                                  }`}
                                >
                                  {markingRecords[st.id] || 'PRESENT'}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={markAttendanceMutation.isPending}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {markAttendanceMutation.isPending ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Submitting Marks...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Submit Attendance Log
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>

              {/* Right Column (7/12 cols): Batch Attendance Register log table */}
              <div className="lg:col-span-7 space-y-4">
                <div className="glass-card p-6 rounded-3xl border border-slate-850 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                      Attendance Register Logs ({filteredBatchLogs.length})
                    </h4>
                  </div>

                  {/* Filter bar */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950/45 p-3 rounded-2xl border border-slate-855 text-xs">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                      <input
                        type="text"
                        value={logSearchQuery}
                        onChange={(e) => setLogSearchQuery(e.target.value)}
                        placeholder="Search student..."
                        className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-850 text-slate-200 placeholder-slate-500 rounded-xl focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    {/* Subject Filter */}
                    <div className="flex items-center gap-1">
                      <Filter className="w-3 h-3 text-slate-500 shrink-0" />
                      <select
                        value={logSubjectFilter}
                        onChange={(e) => setLogSubjectFilter(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 text-slate-305 py-1 px-2 rounded-xl focus:outline-none cursor-pointer"
                      >
                        <option value="ALL">All Subjects</option>
                        {activeBatch.subjects.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    {/* Status Filter */}
                    <div className="flex items-center gap-1">
                      <Filter className="w-3 h-3 text-slate-500 shrink-0" />
                      <select
                        value={logStatusFilter}
                        onChange={(e) => setLogStatusFilter(e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-855 text-slate-305 py-1 px-2 rounded-xl focus:outline-none cursor-pointer"
                      >
                        <option value="ALL">All Status</option>
                        <option value="PRESENT">Present</option>
                        <option value="ABSENT">Absent</option>
                      </select>
                    </div>
                  </div>

                  {/* Table */}
                  {isBatchAttendanceLoading ? (
                    <div className="py-20 flex justify-center">
                      <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                    </div>
                  ) : filteredBatchLogs.length === 0 ? (
                    <div className="py-16 text-center border border-dashed border-slate-850 rounded-2xl text-xs text-slate-500">
                      No attendance log records found. Choose "Mark New Attendance" to begin logging class sessions.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-850 text-slate-400 font-extrabold uppercase text-[9px] tracking-wider">
                            <th className="pb-3 px-2">Student Name</th>
                            <th className="pb-3 px-2">Subject</th>
                            <th className="pb-3 px-2">Date / Day</th>
                            <th className="pb-3 px-2 text-center">Status</th>
                            <th className="pb-3 px-2 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850/60 font-semibold text-slate-300">
                          {filteredBatchLogs.map(record => {
                            const isPresent = record.status === 'PRESENT';
                            return (
                              <tr key={record.id} className="hover:bg-slate-950/20 transition-colors">
                                <td className="py-3 px-2 max-w-[130px] truncate" title={record.studentName}>
                                  {record.studentName}
                                </td>
                                <td className="py-3 px-2">
                                  {record.subjectName}
                                </td>
                                <td className="py-3 px-2 text-slate-500">
                                  <div>{record.date}</div>
                                  <div className="text-[9px] text-indigo-400">{record.day}</div>
                                </td>
                                <td className="py-3 px-2 text-center">
                                  <button
                                    onClick={() => handleToggleStatus(record)}
                                    className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider cursor-pointer hover:scale-[1.05] transition-transform ${
                                      isPresent
                                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/25'
                                    }`}
                                    title="Click to toggle status"
                                  >
                                    {record.status}
                                  </button>
                                </td>
                                <td className="py-3 px-2 text-right">
                                  <button
                                    onClick={() => handleDeleteRecord(record.id)}
                                    className="p-1.5 text-slate-500 hover:text-rose-455 hover:bg-rose-955/20 rounded-lg cursor-pointer transition-colors"
                                    title="Delete Record"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────
         TAB 2: STUDENT PROFILES VIEW
         ──────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'STUDENTS' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column (4/12 cols): Search Student */}
            <div className="lg:col-span-4 space-y-4">
              <div className="glass-card p-6 rounded-3xl border border-slate-850 space-y-4">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Search className="w-4 h-4 text-indigo-400" /> Search Student Profiles
                </h4>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-550" />
                  <input
                    type="text"
                    value={studentSearchQuery}
                    onChange={(e) => setStudentSearchQuery(e.target.value)}
                    placeholder="Enter student name or email..."
                    className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-950 border border-slate-850 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* List results */}
                {isStudentsLoading ? (
                  <div className="py-6 flex justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-505" />
                  </div>
                ) : filteredStudentsForSelect.length === 0 ? (
                  <div className="text-center py-4 text-xs text-slate-500">
                    No matching students found in system.
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {filteredStudentsForSelect.map(s => {
                      const isSelected = s.id === selectedStudentId;
                      return (
                        <button
                          key={s.id}
                          onClick={() => setSelectedStudentId(s.id)}
                          className={`w-full text-left p-3 rounded-xl border transition-all duration-200 flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-650/10 border-indigo-500/80 text-white'
                              : 'bg-slate-955/30 hover:bg-slate-900/40 border-slate-900 text-slate-450'
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <span className="text-xs font-bold block truncate">
                              {s.name}
                            </span>
                            <span className="text-[9px] text-slate-550 block truncate">
                              {s.email}
                            </span>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-60" />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column (8/12 cols): Detailed Student logs */}
            <div className="lg:col-span-8 space-y-6">
              {isStudentAttendanceLoading ? (
                <div className="py-32 flex justify-center">
                  <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                </div>
              ) : !studentAttendance || !activeStudent ? (
                <div className="glass-card p-12 rounded-3xl border border-slate-850 text-center text-slate-500 text-xs">
                  Please select a student from the sidebar list to view detailed attendance history.
                </div>
              ) : (
                <div className="space-y-6 animate-in fade-in duration-200">
                  
                  {/* Student Profile Card Header */}
                  <div className="glass-card p-6 rounded-3xl border border-slate-850 flex flex-col sm:flex-row items-center gap-6 justify-between">
                    <div className="flex items-center gap-4 text-left">
                      <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center shrink-0">
                        <User className="w-6 h-6" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-base font-black text-white truncate">{activeStudent.name}</h3>
                        <p className="text-xs text-slate-500 truncate">{activeStudent.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 sm:border-l sm:border-slate-850 sm:pl-6 shrink-0">
                      <div className="text-center sm:text-left">
                        <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider">Attendance Percentage</span>
                        <div className="flex items-baseline gap-1.5 mt-0.5 justify-center sm:justify-start">
                          <span className="text-2xl font-black text-white">{Math.round(studentAttendance.offlineRate)}%</span>
                          <span className={`px-1.5 py-0.5 text-[8px] font-black rounded uppercase border tracking-wider ${
                            studentAttendance.offlineRate >= 85 
                              ? 'bg-emerald-500/10 text-emerald-405 border-emerald-500/20'
                              : studentAttendance.offlineRate >= 75
                              ? 'bg-amber-500/10 text-amber-405 border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-455 border-rose-500/20'
                          }`}>
                            {studentAttendance.offlineRate >= 85 ? 'Good' : studentAttendance.offlineRate >= 75 ? 'Warn' : 'Crit'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Summary Grid Widgets */}
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-slate-900/35 border border-slate-850 p-4 rounded-2xl shadow-sm">
                      <span className="text-2xl font-black text-indigo-400 block">
                        {studentAttendance.offlineTotal}
                      </span>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Total Lectures</span>
                    </div>
                    <div className="bg-slate-900/35 border border-slate-850 p-4 rounded-2xl shadow-sm">
                      <span className="text-2xl font-black text-emerald-450 block">
                        {studentAttendance.offlinePresent}
                      </span>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Presents</span>
                    </div>
                    <div className="bg-slate-900/35 border border-slate-850 p-4 rounded-2xl shadow-sm">
                      <span className="text-2xl font-black text-rose-450 block">
                        {studentAttendance.offlineTotal - studentAttendance.offlinePresent}
                      </span>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Absents</span>
                    </div>
                  </div>

                  {/* Subject wise stats */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Subject Breakdown</h4>
                    {studentAttendance.subjectWiseStats.length === 0 ? (
                      <div className="text-center py-6 text-xs text-slate-500 border border-slate-850 rounded-2xl">
                        No subject logs found for this student.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {studentAttendance.subjectWiseStats.map(sub => {
                          const rateColor = sub.percentage >= 85 ? 'bg-emerald-500' : sub.percentage >= 75 ? 'bg-amber-500' : 'bg-rose-500';
                          return (
                            <div key={sub.subjectName} className="bg-slate-900/30 border border-slate-850 p-4 rounded-2xl space-y-2">
                              <div className="flex justify-between font-bold text-xs">
                                <span className="text-white truncate max-w-[130px]">{sub.subjectName}</span>
                                <span className="text-slate-405">{sub.present} / {sub.total} Classes</span>
                              </div>
                              <div className="flex justify-between items-baseline text-xs font-black text-white">
                                <span>{Math.round(sub.percentage)}%</span>
                              </div>
                              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full transition-all duration-550 ${rateColor}`} style={{ width: `${sub.percentage}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* All logs list */}
                  <div className="glass-card p-6 rounded-3xl border border-slate-850 space-y-4">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                      Full Attendance Registry History
                    </h4>

                    {studentAttendance.records.length === 0 ? (
                      <div className="text-center py-8 text-xs text-slate-550">
                        No historical attendance logged for this student.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-slate-855 text-slate-400 font-extrabold uppercase text-[9px] tracking-wider">
                              <th className="pb-3 px-2">Subject Name</th>
                              <th className="pb-3 px-2">Date / Weekday</th>
                              <th className="pb-3 px-2 text-center">Status</th>
                              <th className="pb-3 px-2 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-850/60 font-semibold text-slate-300">
                            {studentAttendance.records.map(record => {
                              const isPresent = record.status === 'PRESENT';
                              return (
                                <tr key={record.id} className="hover:bg-slate-950/20 transition-colors">
                                  <td className="py-3 px-2">
                                    {record.subjectName}
                                  </td>
                                  <td className="py-3 px-2 text-slate-500">
                                    {record.date} <span className="text-[10px] text-indigo-400 ml-1">({record.day})</span>
                                  </td>
                                  <td className="py-3 px-2 text-center">
                                    <button
                                      onClick={() => handleToggleStatus(record)}
                                      className={`px-2.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider cursor-pointer hover:scale-[1.05] transition-transform ${
                                        isPresent
                                          ? 'bg-emerald-500/10 text-emerald-405 border border-emerald-500/25'
                                          : 'bg-rose-500/10 text-rose-455 border border-rose-500/25'
                                      }`}
                                      title="Toggle status"
                                    >
                                      {record.status}
                                    </button>
                                  </td>
                                  <td className="py-3 px-2 text-right">
                                    <button
                                      onClick={() => handleDeleteRecord(record.id)}
                                      className="p-1.5 text-slate-500 hover:text-rose-455 hover:bg-rose-955/20 rounded-lg cursor-pointer transition-colors"
                                      title="Delete record"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
