'use client';

import React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { ClipboardList, ArrowLeft, Loader2, Calendar, User, BookOpen, ChevronRight } from 'lucide-react';

interface HomeworkDTO {
  id: number;
  title: string;
  description: string;
  courseId: number;
  courseTitle: string;
  lessonTitle: string | null;
  dueDate: string;
  createdByName: string;
  createdAt: string;
}

export default function CourseHomeworksPage() {
  const { courseId } = useParams();
  const router = useRouter();

  // Fetch homeworks for this course
  const { data: homeworks, isLoading } = useQuery<HomeworkDTO[]>({
    queryKey: ['course-homeworks', courseId],
    queryFn: async () => {
      const response = await api.get(`/student/homework/course/${courseId}`);
      return response.data.success ? response.data.data : [];
    },
  });

  const courseTitle = homeworks && homeworks.length > 0 ? homeworks[0].courseTitle : 'Course Assignments';

  if (isLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
        <p className="mt-3 text-sm text-slate-405 font-medium">Opening assignments folder...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="space-y-1">
        <button 
          onClick={() => router.push('/dashboard/homework')}
          className="flex items-center gap-2 text-xs font-bold text-slate-450 hover:text-slate-900 dark:hover:text-slate-205 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Folders
        </button>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
          {courseTitle}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Complete the following tasks before their respective deadlines.
        </p>
      </div>

      {/* Homework List */}
      {homeworks && homeworks.length > 0 ? (
        <div className="space-y-4">
          {homeworks.map((hw) => {
            const isOverdue = new Date() > new Date(hw.dueDate);
            return (
              <Link
                key={hw.id}
                href={`/dashboard/homework/${hw.id}`}
                className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl hover:border-indigo-500/50 dark:hover:border-indigo-500/40 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-650 dark:text-indigo-400 rounded-2xl flex items-center justify-center shrink-0">
                    <ClipboardList className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <h3 className="text-sm font-bold text-slate-850 dark:text-slate-250 group-hover:text-indigo-600 dark:group-hover:text-indigo-455 transition-colors truncate">
                      {hw.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 max-w-xl">
                      {hw.description || 'No description provided.'}
                    </p>
                    {hw.lessonTitle && (
                      <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full font-bold uppercase mt-1 inline-block tracking-wider">
                        {hw.lessonTitle}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0 justify-between sm:justify-end">
                  <div className="flex flex-col text-right">
                    <span className="text-[10px] text-slate-450 dark:text-slate-500 font-bold uppercase tracking-wider">Due Date</span>
                    <span className={`text-xs font-semibold mt-0.5 flex items-center gap-1 ${
                      isOverdue ? 'text-red-500' : 'text-slate-650 dark:text-slate-350'
                    }`}>
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(hw.dueDate).toLocaleDateString()} at {new Date(hw.dueDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-550 dark:group-hover:text-indigo-400 transition-colors" />
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-3xl text-center">
          <ClipboardList className="w-12 h-12 text-slate-350 dark:text-slate-650 mb-3" />
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-300">No assignments found</h4>
          <p className="text-xs text-slate-455 dark:text-slate-500 max-w-xs mt-1">
            There are no homework tasks configured for this course yet.
          </p>
        </div>
      )}
    </div>
  );
}
