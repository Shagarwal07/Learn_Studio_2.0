'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { 
  Compass, 
  Search, 
  Filter, 
  BookOpen, 
  Play, 
  CheckCircle2, 
  Loader2, 
  Star,
  GraduationCap
} from 'lucide-react';

interface CourseDTO {
  id: number;
  title: string;
  description: string;
  price: number;
  thumbnail: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  instructorName: string;
  totalLessons: number;
  previewVideoUrl: string | null;
  averageRating: number;
  totalReviews: number;
}

export default function CourseCatalogPage() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Redirect to lock explore page (comment out or delete to unlock in future)
  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  const [search, setSearch] = useState('');
  const [level, setLevel] = useState<string>('ALL');
  const [page, setPage] = useState(0);

  // Fetch courses via React Query using paginated backend
  const { data, isLoading, error } = useQuery<{ content: CourseDTO[]; totalPages: number }>({
    queryKey: ['catalog-courses', search, level, page],
    queryFn: async () => {
      const levelParam = level !== 'ALL' ? `&level=${level}` : '';
      const response = await api.get(
        `/courses?search=${search}&page=${page}&size=6&sortBy=id&sortDir=asc${levelParam}`
      );
      // In the backend, the paginated endpoint returns Page<CourseDTO>
      // Page contains the list under "content", and totalPages
      return response.data.success ? response.data.data : { content: [], totalPages: 0 };
    },
  });

  // Query to check user's enrollments to change "Enroll" buttons to "Enter Classroom"
  const { data: myEnrollments } = useQuery<any[]>({
    queryKey: ['my-enrollments-for-catalog'],
    enabled: !!user,
    queryFn: async () => {
      const response = await api.get('/enrollments/my');
      return response.data.success ? response.data.data : [];
    },
  });

  const enrolledCourseIds = myEnrollments ? myEnrollments.map(e => e.courseId) : [];

  // Enrollment mutation
  const enrollMutation = useMutation({
    mutationFn: async (courseId: number) => {
      const response = await api.post(`/enrollments/${courseId}`);
      return response.data;
    },
    onSuccess: (res, courseId) => {
      queryClient.invalidateQueries({ queryKey: ['my-enrollments-for-catalog'] });
      router.push(`/dashboard/course/${courseId}/learn`);
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Enrollment failed. Please try again.');
    }
  });

  const handleEnroll = (courseId: number) => {
    if (!user) {
      router.push('/login?redirect=catalog');
      return;
    }
    enrollMutation.mutate(courseId);
  };

  const courses = data?.content || [];
  const totalPages = data?.totalPages || 0;

  return (
    <div className="min-h-screen bg-muted text-foreground pb-16">
      
      {/* Header Banner */}
      <div className="bg-card text-white py-12 px-6 border-b border-border-color shadow-inner">
        <div className="max-w-7xl mx-auto space-y-4">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-white transition-colors">
            ← Home
          </Link>
          <div className="space-y-1">
            <h2 className="text-3xl font-black tracking-tight">Explore Learning Paths</h2>
            <p className="text-muted-foreground text-sm max-w-xl">
              Learn advanced software engineering, backend development, design systems, and cloud management from industry professionals.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8 space-y-8">
        
        {/* Filters and Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-border-color shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search bar */}
          <div className="relative w-full md:max-w-md">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-405">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              placeholder="Search courses by title..."
              className="w-full pl-10 pr-4 py-2.5 bg-muted border border-border-color rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-foreground"
            />
          </div>

          {/* Level Filter */}
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto py-1 scrollbar-none">
            <span className="text-xs font-bold text-muted-foreground flex items-center gap-1 shrink-0">
              <Filter className="w-3.5 h-3.5" /> Difficulty:
            </span>
            {['ALL', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => { setLevel(lvl); setPage(0); }}
                className={`px-3 py-1.5 border rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
level === lvl
? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
: 'bg-muted border-border-color text-muted-foreground hover:border-border-color'
}`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="py-24 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-center text-red-700 max-w-xl mx-auto">
            <h3 className="font-bold text-base">Failed to fetch courses</h3>
            <p className="text-xs mt-1">Please ensure your Spring Boot server and PostgreSQL instance are online.</p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && courses.length === 0 && (
          <div className="bg-white py-16 px-6 rounded-2xl border border-border-color shadow-sm text-center max-w-lg mx-auto space-y-4">
            <div className="w-12 h-12 bg-muted border border-border-color text-muted-foreground rounded-xl flex items-center justify-center mx-auto">
              <Compass className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold text-foreground">No courses match your criteria</h4>
              <p className="text-xs text-muted-foreground">Try adjusting your search terms or difficulty filter.</p>
            </div>
          </div>
        )}

        {/* Course Cards Grid */}
        {!isLoading && !error && courses.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course) => {
              const isEnrolled = enrolledCourseIds.includes(course.id);
              return (
                <div 
                  key={course.id}
                  className="bg-white rounded-2xl border border-border-color overflow-hidden shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow group"
                >
                  {/* Thumbnail / Level */}
                  <div className="relative aspect-video bg-muted overflow-hidden border-b border-slate-150">
                    {course.thumbnail ? (
                      <img 
                        src={course.thumbnail} 
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-350 bg-muted">
                        <BookOpen className="w-10 h-10" />
                      </div>
                    )}
                    <span className="absolute top-3 left-3 px-2 py-0.5 bg-slate-900/85 backdrop-blur-sm text-white border border-border-color rounded-md text-[9px] font-extrabold tracking-wider uppercase">
                      {course.level}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                        <span>By {course.instructorName}</span>
                        <span>•</span>
                        <span>{course.totalLessons} Lessons</span>
                      </div>
                      <h4 className="text-lg font-extrabold text-slate-950 leading-snug line-clamp-2 group-hover:text-indigo-650 transition-colors">
                        {course.title}
                      </h4>
                      <p className="text-muted-foreground text-xs leading-relaxed line-clamp-3">
                        {course.description}
                      </p>
                    </div>

                    {/* Review Ratings */}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <div className="flex items-center text-amber-500">
                        <Star className="w-4 h-4 fill-current" />
                      </div>
                      <span className="font-bold text-foreground">{course.averageRating || '0.0'}</span>
                      <span className="text-muted-foreground">({course.totalReviews} ratings)</span>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="px-6 py-4 bg-muted border-t border-border-color flex items-center justify-between gap-4">
                    <span className="text-lg font-black text-foreground">${course.price}</span>
                    {isEnrolled ? (
                      <Link
                        href={`/dashboard/course/${course.id}/learn`}
                        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                      >
                        <Play className="w-3 h-3 fill-current" /> Enter Classroom
                      </Link>
                    ) : (
                      <button
                        onClick={() => handleEnroll(course.id)}
                        disabled={enrollMutation.isPending}
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                      >
                        {enrollMutation.isPending ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <GraduationCap className="w-3.5 h-3.5" />
                        )}
                        Enroll Now
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-6 border-t border-border-color">
            <button
              disabled={page === 0}
              onClick={() => setPage(prev => Math.max(0, prev - 1))}
              className="px-4 py-2 border border-border-color disabled:opacity-50 disabled:cursor-not-allowed bg-white hover:bg-muted text-slate-750 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Previous
            </button>
            <span className="text-xs font-semibold text-muted-foreground">
              Page {page + 1} of {totalPages}
            </span>
            <button
              disabled={page + 1 >= totalPages}
              onClick={() => setPage(prev => prev + 1)}
              className="px-4 py-2 border border-border-color disabled:opacity-50 disabled:cursor-not-allowed bg-white hover:bg-muted text-slate-750 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Next
            </button>
          </div>
        )}

      </div>

    </div>
  );
}
