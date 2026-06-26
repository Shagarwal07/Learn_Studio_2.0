'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
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
  XCircle
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

const ACADEMIC_SUBJECTS = ['English', 'Hindi', 'Mathematics', 'Science', 'Social Science'];

export default function HomeworkCoursesPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'BATCH' | 'COURSES'>('BATCH');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  // 1. Fetch online courses that have homework
  const { data: courses = [], isLoading: isCoursesLoading } = useQuery<CourseWithHomework[]>({
    queryKey: ['courses-with-homework'],
    queryFn: async () => {
      const response = await api.get('/student/homework/courses');
      return response.data.success ? response.data.data : [];
    },
  });

  // 2. Fetch student's batch homework (offline)
  const { data: batchHomeworks = [], isLoading: isBatchHomeworksLoading } = useQuery<HomeworkDTO[]>({
    queryKey: ['student-batch-homework'],
    queryFn: async () => {
      const response = await api.get('/student/batch/homework');
      return response.data.success ? response.data.data : [];
    },
  });

  const isLoading = isCoursesLoading || isBatchHomeworksLoading;
  const isInstructorOrAdmin = user?.role === 'INSTRUCTOR' || user?.role === 'ADMIN';

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
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Homework Assignments</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Submit course assignments, view marks, and check instructor feedback.
          </p>
        </div>
        {isInstructorOrAdmin && (
          <Link 
            href="/dashboard/instructor/batches"
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-indigo-655/10 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            Manage Batches & Homework
          </Link>
        )}
      </div>

      {/* Tabs Switcher (Only show if student belongs to a batch or is instructor) */}
      {(!isInstructorOrAdmin && batchHomeworks.length > 0) && (
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-850 pb-px">
          <button
            onClick={() => {
              setActiveTab('BATCH');
              setSelectedSubject(null);
            }}
            className={`px-4 py-2.5 text-xs font-extrabold border-b-2 cursor-pointer transition-all ${
              activeTab === 'BATCH'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-450 hover:text-slate-750 dark:hover:text-slate-305'
            }`}
          >
            Offline Batch Tasks
          </button>
          <button
            onClick={() => {
              setActiveTab('COURSES');
              setSelectedSubject(null);
            }}
            className={`px-4 py-2.5 text-xs font-extrabold border-b-2 cursor-pointer transition-all ${
              activeTab === 'COURSES'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-450 hover:text-slate-750 dark:hover:text-slate-305'
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
            className="flex items-center gap-1 text-xs font-extrabold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer self-start"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Academic Tasks
          </button>
        ) : (
          <div className="relative max-w-md w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder={activeTab === 'BATCH' && !isInstructorOrAdmin ? "Search batch tasks..." : "Search course folders..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm text-slate-805 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>
        )}
      </div>

      {/* WORKSPACE VIEW */}
      
      {/* CASE A: Drill-down Subject Homework List */}
      {selectedSubject ? (
        <div className="space-y-4 animate-in fade-in duration-200">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
            {selectedSubject} Homework Archive
          </h3>

          {filteredBatchHomeworks.length === 0 ? (
            <div className="py-16 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-3xl text-xs text-slate-400">
              No homework tasks assigned under this subject.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredBatchHomeworks.map((hw) => {
                const isOverdue = new Date(hw.dueDate) < new Date();
                return (
                  <div
                    key={hw.id}
                    className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between gap-4 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-4.5 h-4.5 text-amber-500 shrink-0" />
                          <h4 className="text-sm font-black text-slate-900 dark:text-white truncate">
                            {hw.title}
                          </h4>
                        </div>
                        <span className={`px-2 py-0.5 text-[8px] font-extrabold rounded-full uppercase tracking-wider shrink-0 ${
                          isOverdue 
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-450 border border-rose-500/10' 
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border border-emerald-500/10'
                        }`}>
                          {isOverdue ? 'Overdue' : 'Active'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3">
                        {hw.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-4 pt-3 border-t border-slate-50 dark:border-slate-800/60 mt-1">
                      <div className="flex flex-col text-[10px] text-slate-400 font-semibold gap-0.5">
                        <span>Assigned by {hw.createdByName}</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Due: {new Date(hw.dueDate).toLocaleString()}
                        </span>
                      </div>

                      <Link
                        href={`/dashboard/homework/${hw.id}`}
                        className="flex items-center gap-1 px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/60 border border-indigo-100/20 text-indigo-700 dark:text-indigo-400 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Open Task
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : activeTab === 'BATCH' && !isInstructorOrAdmin ? (
        
        /* CASE B: Batch Academic Subjects folders grid */
        <div className="space-y-4 animate-in fade-in duration-200">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
            Academic Subject Task Folders
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {ACADEMIC_SUBJECTS.map((subject) => {
              const hwCount = getSubjectHomeworkCount(subject);
              return (
                <button
                  key={subject}
                  onClick={() => setSelectedSubject(subject)}
                  className="group text-left flex items-start gap-4 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl hover:border-indigo-500 dark:hover:border-indigo-500/80 hover:shadow-lg dark:hover:shadow-slate-950/20 transition-all cursor-pointer select-none"
                >
                  <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Folder className="w-6 h-6 fill-indigo-100 dark:fill-indigo-900/30" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-450 transition-colors truncate">
                      {subject}
                    </h3>
                    <p className="text-xs text-slate-455 dark:text-slate-500 font-medium">
                      {hwCount} Active tasks
                    </p>
                    
                    <div className="flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
            Explore Course Homework
          </h3>

          {filteredCourses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <Link
                  key={course.id}
                  href={`/dashboard/homework/course/${course.id}`}
                  className="group flex items-start gap-4 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl hover:border-indigo-500 dark:hover:border-indigo-500/80 hover:shadow-lg dark:hover:shadow-slate-950/20 transition-all cursor-pointer select-none"
                >
                  <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Folder className="w-6 h-6 fill-indigo-100 dark:fill-indigo-900/30" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-450 transition-colors truncate">
                      {course.title}
                    </h3>
                    <p className="text-xs text-slate-450 dark:text-slate-500 font-medium">
                      {course.homeworkCount} active tasks
                    </p>
                    
                    <div className="flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      Open Folder
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-850 rounded-3xl text-center">
              <ClipboardCheck className="w-12 h-12 text-slate-355 dark:text-slate-605 mb-3" />
              <h4 className="text-sm font-bold text-slate-850 dark:text-slate-300">No course homework found</h4>
              <p className="text-xs text-slate-450 dark:text-slate-505 max-w-xs mt-1 font-medium">
                {search ? 'No folders match your search query.' : 'Once course homework is assigned, it will appear here.'}
              </p>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
