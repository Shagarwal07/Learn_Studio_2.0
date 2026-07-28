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
  ArrowRight, 
  ChevronLeft,
  Calendar,
  Eye,
  CheckCircle2,
  XCircle,
  Trash2
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

const ACADEMIC_SUBJECTS = ['English', 'English Grammar', 'Hindi', 'Hindi Grammar', 'Mathematics', 'Science', 'Social Science'];

export default function HomeworkCoursesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'BATCH' | 'COURSES'>('BATCH');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  const isInstructorOrAdmin = user?.role === 'INSTRUCTOR' || user?.role === 'ADMIN';
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');

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

  // 2. Fetch batch homework (offline) - dynamically based on user role
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

  // Filter courses
  const filteredCourses = courses.filter(c => 
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  // Count batch homework per subject
  const getSubjectHomeworkCount = (subject: string) => {
    return batchHomeworks.filter(hw => hw.subjectName.toLowerCase() === subject.toLowerCase()).length;
  };

  // Filter batch homework by selected subject and search
  const filteredBatchHomeworks = batchHomeworks.filter(hw => {
    const matchesSubject = selectedSubject ? hw.subjectName.toLowerCase() === selectedSubject.toLowerCase() : true;
    const matchesSearch = hw.title.toLowerCase().includes(search.toLowerCase()) || 
                          hw.description.toLowerCase().includes(search.toLowerCase());
    return matchesSubject && matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
        <p className="mt-3 text-sm text-slate-400 font-medium">Opening homework lockbox...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto text-foreground">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">Homework Assignments</h2>
          <p className="text-xs sm:text-sm text-text-secondary mt-1 leading-relaxed">
            Submit course assignments, view marks, and check instructor feedback.
          </p>
        </div>
        {isInstructorOrAdmin && (
          <Link 
            href="/dashboard/instructor/batches?tab=homework"
            className="btn-premium flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-white transition-all shadow-md cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Manage Batches & Homework
          </Link>
        )}
      </div>

      {/* Tabs Switcher (Only show if student belongs to a batch or is instructor) */}
      {(isInstructorOrAdmin || batchHomeworks.length > 0) && (
        <div className="flex items-center gap-2 border-b border-border-color pb-px">
          <button
            onClick={() => {
              setActiveTab('BATCH');
              setSelectedSubject(null);
            }}
            className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition-all ${
              activeTab === 'BATCH'
                ? 'border-accent-grape text-accent-grape'
                : 'border-transparent text-text-secondary hover:text-foreground'
            }`}
          >
            Offline Batch Tasks
          </button>
          <button
            onClick={() => {
              setActiveTab('COURSES');
              setSelectedSubject(null);
            }}
            className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition-all ${
              activeTab === 'COURSES'
                ? 'border-accent-grape text-accent-grape'
                : 'border-transparent text-text-secondary hover:text-foreground'
            }`}
          >
            Explore Courses
          </button>
        </div>
      )}

      {/* Search and Back button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {selectedSubject ? (
          <button
            onClick={() => setSelectedSubject(null)}
            className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-accent-grape hover:text-accent-blue transition-colors cursor-pointer self-start"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Academic Tasks
          </button>
        ) : (
          <div className="relative max-w-md w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-text-muted" />
            <input
              type="text"
              placeholder={activeTab === 'BATCH' && !isInstructorOrAdmin ? "Search batch tasks..." : "Search course folders..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-premium w-full pl-11 pr-4 py-2.5 rounded-2xl text-sm text-foreground placeholder-text-muted focus:outline-none transition-all"
            />
          </div>
        )}
      </div>

      {/* WORKSPACE VIEW */}
      
      {/* CASE A: Drill-down Subject Homework List */}
      {selectedSubject ? (
        <div className="space-y-4 animate-in fade-in duration-200">
          <h3 className="text-[10px] font-extrabold text-text-muted uppercase tracking-wider">
            {selectedSubject} Homework Archive
          </h3>

          {filteredBatchHomeworks.length === 0 ? (
            <div className="py-16 text-center glass-card rounded-3xl text-xs text-text-secondary border border-border-color bg-card">
              No homework tasks assigned under this subject.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredBatchHomeworks.map((hw) => {
                const isOverdue = new Date(hw.dueDate) < new Date();
                return (
                  <div
                    key={hw.id}
                    className="glass-card hover-lift rounded-3xl p-6 flex flex-col justify-between gap-6 bg-card border border-border-color shadow-sm"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 bg-accent-grape/15 text-accent-grape rounded-xl flex items-center justify-center shrink-0 border border-accent-grape/25">
                            <FileText className="w-4.5 h-4.5" />
                          </div>
                          <h4 className="text-sm font-black text-foreground truncate">
                            {hw.title}
                          </h4>
                        </div>
                        <span className={`px-2.5 py-1 text-[9px] font-extrabold rounded-full uppercase tracking-wider shrink-0 border ${
                          isOverdue 
                            ? 'bg-error/10 text-error border-error/20' 
                            : 'bg-success/10 text-success border-success/20'
                        }`}>
                          {isOverdue ? 'Overdue' : 'Active'}
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary leading-relaxed line-clamp-3">
                        {hw.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-4 pt-4 border-t border-border-color mt-2">
                      <div className="flex flex-col text-[10px] text-text-muted font-bold uppercase tracking-wider gap-0.5">
                        <span>Assigned by {hw.createdByName}</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-accent-grape" />
                          Due: {new Date(hw.dueDate).toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {user?.role === 'ADMIN' && (
                          <button
                            onClick={() => handleDeleteHomework(hw.id)}
                            className="flex items-center justify-center p-2 text-error hover:text-error bg-error/10 hover:bg-error/20 border border-error/20 rounded-xl transition-all cursor-pointer shadow-sm"
                            title="Delete Homework"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <Link
                          href={`/dashboard/homework/${hw.id}`}
                          className="flex items-center gap-1.5 px-4 py-2 bg-muted/50 hover:bg-gradient-to-r hover:from-accent-grape hover:to-primary-blue border border-border-color hover:border-accent-grape text-text-secondary hover:text-white rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm"
                        >
                          <Eye className="w-3.5 h-3.5" />
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
        
        /* CASE B: Batch Academic Subjects folders grid */
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h3 className="text-[10px] font-extrabold text-text-muted uppercase tracking-wider">
              Academic Subject Task Folders
            </h3>
            {isInstructorOrAdmin && batches.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-secondary font-medium">Select Batch:</span>
                <select
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                  className="input-premium rounded-xl px-3 py-1.5 text-xs text-foreground focus:outline-none transition-all cursor-pointer"
                >
                  {batches.map(b => (
                    <option key={b.id} value={b.id} className="bg-card text-foreground">
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {ACADEMIC_SUBJECTS.map((subject) => {
              const hwCount = getSubjectHomeworkCount(subject);
              return (
                <button
                  key={subject}
                  onClick={() => setSelectedSubject(subject)}
                  className="group text-left flex items-start gap-4 p-5 glass-card hover-lift rounded-3xl border border-border-color hover:border-accent-grape/50 transition-all cursor-pointer select-none bg-card shadow-sm"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-accent-grape/10 to-primary-blue/10 text-accent-grape border border-accent-grape/20 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Folder className="w-5 h-5 fill-current opacity-70" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <h3 className="text-sm font-bold text-foreground group-hover:text-accent-grape transition-colors truncate">
                      {subject}
                    </h3>
                    <p className="text-xs text-text-muted font-bold uppercase tracking-wider">
                      {hwCount} Active Tasks
                    </p>
                    
                    <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-accent-grape pt-3 opacity-0 group-hover:opacity-100 transition-all">
                      Open Folder
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        
        /* CASE C: Explore Course folders grid (Default online view) */
        <div className="space-y-4 animate-in fade-in duration-200">
          <h3 className="text-[10px] font-extrabold text-text-muted uppercase tracking-wider">
            Explore Course Homework
          </h3>

          {filteredCourses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <Link
                  key={course.id}
                  href={`/dashboard/homework/course/${course.id}`}
                  className="group flex items-start gap-4 p-5 glass-card hover-lift rounded-3xl border border-border-color hover:border-accent-grape/50 transition-all cursor-pointer select-none bg-card shadow-sm"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-accent-grape/10 to-primary-blue/10 text-accent-grape border border-accent-grape/20 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Folder className="w-5 h-5 fill-current opacity-70" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <h3 className="text-sm font-bold text-foreground group-hover:text-accent-grape transition-colors truncate">
                      {course.title}
                    </h3>
                    <p className="text-xs text-text-muted font-bold uppercase tracking-wider">
                      {course.homeworkCount} Active Tasks
                    </p>
                    
                    <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-accent-grape pt-3 opacity-0 group-hover:opacity-100 transition-all">
                      Open Folder
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 glass-card rounded-3xl text-center border border-border-color bg-card">
              <ClipboardCheck className="w-12 h-12 text-text-muted mb-3 opacity-70" />
              <h4 className="text-sm font-bold text-foreground">No course homework found</h4>
              <p className="text-xs text-text-secondary max-w-xs mt-1.5 font-medium leading-relaxed">
                {search ? 'No folders match your search query.' : 'Once course homework is assigned, it will appear here.'}
              </p>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
