'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { 
  Folder, 
  Search, 
  Loader2, 
  ClipboardCheck, 
  Plus, 
  FileText, 
  ChevronLeft,
  Calendar,
  CheckCircle2,
  Trash2,
  Check,
  ArrowUpRight
} from 'lucide-react';

interface CourseWithHomework {
  id: number;
  title: string;
  thumbnail: string;
  homeworkCount: number;
}

interface HomeworkDTO {
  id: number;
  title: string;
  description: string;
  batchId: number;
  batchName: string;
  subjectName: string;
  fileUrl: string;
  dueDate: string;
  createdByName: string;
  createdAt: string;
}

const ACADEMIC_SUBJECTS = ['English', 'English Grammar', 'Hindi', 'Hindi Grammar', 'Sanskrit', 'Sanskrit Grammar', 'Mathematics', 'Science', 'Social Science'];

export default function HomeworkCoursesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'BATCH' | 'COURSES'>('BATCH');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  // Completed status state
  const [completedIds, setCompletedIds] = useState<number[]>([]);
  const isInstructorOrAdmin = user?.role === 'INSTRUCTOR' || user?.role === 'ADMIN';
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');

  const toggleComplete = (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCompletedIds(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  const deleteMutation = useMutation({
    mutationFn: async (homeworkId: number) => {
      await api.delete(`/instructor/homework/${homeworkId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batch-homeworks'] });
      alert('Homework deleted successfully!');
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to delete homework');
    }
  });

  const handleDeleteHomework = (homeworkId: number) => {
    if (confirm('Are you sure you want to delete this homework assignment?')) {
      deleteMutation.mutate(homeworkId);
    }
  };

  // 1. Fetch online courses that have homework
  const { data: courses = [], isLoading: isCoursesLoading } = useQuery<CourseWithHomework[]>({
    queryKey: ['courses-with-homework'],
    queryFn: async () => {
      const response = await api.get('/student/homework/courses');
      return response.data.success ? response.data.data : [];
    },
  });

  // Fetch all batches if instructor/admin
  const { data: batches = [] } = useQuery<any[]>({
    queryKey: ['admin-homework-batches-list'],
    enabled: isInstructorOrAdmin,
    queryFn: async () => {
      const response = await api.get('/instructor/batches');
      return response.data.success ? response.data.data : [];
    }
  });

  React.useEffect(() => {
    if (isInstructorOrAdmin && batches.length > 0 && !selectedBatchId) {
      setSelectedBatchId(String(batches[0].id));
    }
  }, [batches, isInstructorOrAdmin, selectedBatchId]);

  // 2. Fetch batch homework (offline)
  const { data: batchHomeworks = [], isLoading: isBatchHomeworksLoading } = useQuery<HomeworkDTO[]>({
    queryKey: ['batch-homeworks', isInstructorOrAdmin, selectedBatchId],
    queryFn: async () => {
      if (isInstructorOrAdmin) {
        if (!selectedBatchId) return [];
        const response = await api.get(`/instructor/batches/${selectedBatchId}/homework`);
        return response.data.success ? response.data.data : [];
      } else {
        const response = await api.get('/student/batch/homework');
        return response.data.success ? response.data.data : [];
      }
    },
  });

  const isLoading = isCoursesLoading || isBatchHomeworksLoading;

  const filteredCourses = courses.filter(c => 
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  const getSubjectHomeworkCount = (subject: string) => {
    return batchHomeworks.filter(hw => hw.subjectName.toLowerCase() === subject.toLowerCase()).length;
  };

  const filteredBatchHomeworks = batchHomeworks
    .filter(hw => {
      const matchesSubject = selectedSubject ? hw.subjectName.toLowerCase() === selectedSubject.toLowerCase() : true;
      const matchesSearch = hw.title.toLowerCase().includes(search.toLowerCase()) || 
                            hw.description.toLowerCase().includes(search.toLowerCase());
      return matchesSubject && matchesSearch;
    })
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  if (isLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
        <p className="text-sm font-medium text-slate-500">Loading coursework...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 text-slate-100 pb-16 px-2 sm:px-4 pt-2">
      
      {/* Clean Header & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">Academic Assignments & Homework</h1>
          <p className="text-sm text-slate-400 mt-1">
            Track coursework deadlines, review task instructions, and manage assignment completion.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search assignments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-600 transition-colors"
            />
          </div>

          {isInstructorOrAdmin && (
            <Link 
              href="/dashboard/instructor/batches?tab=homework"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 shadow-sm"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Assign New</span>
            </Link>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      {(isInstructorOrAdmin || batchHomeworks.length > 0) && (
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <button
            onClick={() => { setActiveTab('BATCH'); setSelectedSubject(null); }}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'BATCH'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            Offline Batch Tasks
          </button>
          <button
            onClick={() => { setActiveTab('COURSES'); setSelectedSubject(null); }}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'COURSES'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            Course Assignments
          </button>
        </div>
      )}

      {/* WORKSPACE VIEW */}
      {selectedSubject ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSelectedSubject(null)}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg text-xs font-medium transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Subjects</span>
            </button>

            <span className="text-sm font-semibold text-slate-300">
              {selectedSubject} ({filteredBatchHomeworks.length} task{filteredBatchHomeworks.length !== 1 ? 's' : ''})
            </span>
          </div>

          {filteredBatchHomeworks.length === 0 ? (
            <div className="py-16 text-center bg-slate-900/40 border border-slate-800/60 rounded-2xl text-slate-400 space-y-2">
              <ClipboardCheck className="w-8 h-8 text-slate-600 mx-auto stroke-1" />
              <p className="text-sm font-medium text-slate-300">No active assignments for {selectedSubject}.</p>
              <p className="text-xs text-slate-500">You are completely up to date with your coursework in this subject.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredBatchHomeworks.map((hw) => {
                const isOverdue = new Date(hw.dueDate) < new Date();
                const isCompleted = completedIds.includes(hw.id);

                return (
                  <div
                    key={hw.id}
                    className={`p-5 rounded-2xl border transition-all duration-150 flex flex-col justify-between gap-4 ${
                      isCompleted 
                        ? 'bg-slate-900/30 border-emerald-500/20 opacity-80' 
                        : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                            isCompleted ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30' : 'bg-slate-800/80 text-slate-300 border-slate-700/60'
                          }`}>
                            {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <FileText className="w-5 h-5 stroke-[1.5]" />}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-semibold text-slate-200 truncate">{hw.title}</h4>
                            <p className="text-xs text-slate-500 mt-0.5">By {hw.createdByName}</p>
                          </div>
                        </div>

                        <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-md border shrink-0 ${
                          isCompleted
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : isOverdue
                              ? 'bg-red-500/10 text-red-400 border-red-500/20'
                              : 'bg-slate-800 text-slate-300 border-slate-700/50'
                        }`}>
                          {isCompleted ? 'Completed' : isOverdue ? 'Overdue' : 'Active'}
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                        {hw.description || 'No specific task instructions provided.'}
                      </p>

                      <div className="flex items-center justify-between text-xs pt-1 text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span>Due Date:</span>
                        </span>
                        <span className="font-mono text-slate-200 font-medium">
                          {new Date(hw.dueDate).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    {/* Clean Essential Action Bar */}
                    <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
                      <button
                        onClick={(e) => toggleComplete(hw.id, e)}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                          isCompleted
                            ? 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            : 'bg-slate-800/80 hover:bg-slate-800 text-slate-200'
                        }`}
                      >
                        <Check className={`w-3.5 h-3.5 ${isCompleted ? 'text-emerald-400' : 'text-slate-400'}`} />
                        <span>{isCompleted ? 'Marked Done' : 'Mark Complete'}</span>
                      </button>

                      <div className="flex items-center gap-2">
                        {user?.role === 'ADMIN' && (
                          <button
                            onClick={() => handleDeleteHomework(hw.id)}
                            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="Delete Assignment"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}

                        <Link
                          href={`/dashboard/homework/${hw.id}`}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors shadow-sm"
                        >
                          Open Task
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : activeTab === 'BATCH' ? (
        
        /* BATCH SUBJECTS FOLDER GRID */
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Subject Folders ({ACADEMIC_SUBJECTS.length})
            </h2>
            {isInstructorOrAdmin && batches.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Target Batch:</span>
                <select
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                  className="px-3 py-1 bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg focus:outline-none focus:border-slate-700 cursor-pointer"
                >
                  {batches.map(b => (
                    <option key={b.id} value={b.id} className="bg-slate-950">
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ACADEMIC_SUBJECTS.map((subject) => {
              const hwCount = getSubjectHomeworkCount(subject);
              const overdueCount = batchHomeworks.filter(h => h.subjectName.toLowerCase() === subject.toLowerCase() && new Date(h.dueDate) < new Date() && !completedIds.includes(h.id)).length;

              return (
                <div
                  key={subject}
                  onClick={() => setSelectedSubject(subject)}
                  className="p-5 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl cursor-pointer transition-all duration-150 flex items-center justify-between group select-none"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700/50 flex items-center justify-center text-slate-300 shrink-0 group-hover:text-white transition-colors">
                      <Folder className="w-5 h-5 stroke-[1.5]" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors truncate">
                        {subject}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5 font-mono flex items-center gap-2">
                        <span>{hwCount} assignment{hwCount !== 1 ? 's' : ''}</span>
                        {overdueCount > 0 && (
                          <span className="text-red-400 font-medium">• {overdueCount} overdue</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 group-hover:text-slate-300 group-hover:bg-slate-800 transition-all">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (

        /* COURSES FOLDER GRID */
        <div className="space-y-4">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Online Course Assignments
          </h2>

          {filteredCourses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCourses.map((course) => (
                <Link
                  key={course.id}
                  href={`/dashboard/homework/course/${course.id}`}
                  className="p-5 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl transition-all duration-150 flex items-center justify-between group select-none"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700/50 flex items-center justify-center text-indigo-400 shrink-0">
                      <Folder className="w-5 h-5 stroke-[1.5]" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors truncate">
                        {course.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5 font-mono">
                        {course.homeworkCount} task{course.homeworkCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 group-hover:text-slate-300 group-hover:bg-slate-800 transition-all">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center bg-slate-900/40 border border-slate-800/60 rounded-2xl text-slate-400 text-xs">
              {search ? 'No folders match your search query.' : 'No course coursework assigned at the moment.'}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
