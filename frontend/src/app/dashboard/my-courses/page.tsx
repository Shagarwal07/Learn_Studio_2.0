'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { 
  Play, 
  CheckCircle2, 
  Compass, 
  Loader2, 
  GraduationCap
} from 'lucide-react';

interface EnrolledCourse {
  enrollmentId: number;
  courseId: number;
  courseTitle: string;
  enrolledAt: string;
  progress: number;
  completedLessons: number;
  totalLessons: number;
}

export default function MyCoursesPage() {
  const { data: enrollments, isLoading, error } = useQuery<EnrolledCourse[]>({
    queryKey: ['my-enrollments'],
    queryFn: async () => {
      const response = await api.get('/enrollments/my');
      return response.data.success ? response.data.data : [];
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-center text-red-700 text-sm max-w-xl mx-auto">
        Failed to load enrolled courses. Ensure the backend server is running.
      </div>
    );
  }

  const courses = enrollments || [];

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-5">
        <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">My Classroom</p>
        <h2 className="text-2xl font-extrabold text-slate-900 mt-1">Enrolled Courses</h2>
      </div>

      {courses.length === 0 ? (
        <div className="bg-white py-16 px-6 rounded-2xl border border-slate-200 shadow-sm text-center max-w-lg mx-auto space-y-5">
          <div className="w-16 h-16 bg-slate-50 border border-slate-200 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
            <GraduationCap className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h4 className="text-lg font-bold text-slate-900">Start learning today</h4>
            <p className="text-sm text-slate-500 max-w-xs mx-auto">
              You have not enrolled in any courses yet. Browse our selection and pick a path.
            </p>
          </div>
          <Link 
            href="/courses"
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/10 transition-all font-bold text-sm cursor-pointer"
          >
            <Compass className="w-4 h-4" /> Explore Catalog
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((item) => (
            <div 
              key={item.enrollmentId} 
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between"
            >
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    item.progress === 100
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                      : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                  }`}>
                    {item.progress === 100 ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" /> Completed
                      </>
                    ) : (
                      'In Progress'
                    )}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    {item.completedLessons}/{item.totalLessons} Lessons
                  </span>
                </div>

                <h4 className="text-lg font-bold text-slate-900 line-clamp-2 min-h-[3.5rem] leading-snug">
                  {item.courseTitle}
                </h4>
                
                <div className="space-y-1.5">
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${
                        item.progress === 100 ? 'bg-emerald-500' : 'bg-indigo-600'
                      }`}
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-400">{item.progress}% Completed</span>
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
                <Link
                  href={`/dashboard/course/${item.courseId}/learn`}
                  className="w-full py-2.5 bg-white border border-slate-200 hover:bg-indigo-600 hover:text-white text-slate-700 rounded-xl transition-all text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm hover:shadow-md"
                >
                  <Play className="w-3 h-3 fill-current" />
                  Enter Classroom
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
