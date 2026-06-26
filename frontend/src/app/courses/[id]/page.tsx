'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { 
  Play, 
  CheckCircle2, 
  Loader2, 
  Star, 
  Award, 
  BookOpen, 
  Clock, 
  FileText, 
  ClipboardList, 
  ArrowLeft,
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

export default function CourseDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  // 1. Fetch course details
  const { data: course, isLoading: courseLoading, error: courseError } = useQuery<CourseDTO>({
    queryKey: ['course-detail', id],
    queryFn: async () => {
      const response = await api.get(`/courses/${id}`);
      return response.data.success ? response.data.data : null;
    },
  });

  // 2. Fetch course curriculum / progress to show lessons list
  const { data: progress, isLoading: progressLoading } = useQuery<any>({
    queryKey: ['course-curriculum', id],
    enabled: !!user,
    queryFn: async () => {
      const response = await api.get(`/enrollments/${id}/progress`);
      return response.data.success ? response.data.data : null;
    },
  });

  // 3. Fetch user's enrollments to check if already enrolled
  const { data: myEnrollments } = useQuery<any[]>({
    queryKey: ['my-enrollments-for-detail'],
    enabled: !!user,
    queryFn: async () => {
      const response = await api.get('/enrollments/my');
      return response.data.success ? response.data.data : [];
    },
  });

  // 4. Fetch notes count for this course
  const { data: notes } = useQuery<any[]>({
    queryKey: ['course-detail-notes', id],
    enabled: !!user,
    queryFn: async () => {
      const response = await api.get(`/student/notes/course/${id}`);
      return response.data.success ? response.data.data : [];
    },
  });

  // 5. Fetch homework count for this course
  const { data: homework } = useQuery<any[]>({
    queryKey: ['course-detail-homework', id],
    enabled: !!user,
    queryFn: async () => {
      const response = await api.get(`/student/homework/course/${id}`);
      return response.data.success ? response.data.data : [];
    },
  });

  const isEnrolled = myEnrollments ? myEnrollments.some(e => e.courseId === Number(id)) : false;

  // Enrollment mutation
  const enrollMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/enrollments/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-enrollments-for-detail'] });
      router.push(`/dashboard/course/${id}/learn`);
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Enrollment failed. Please try again.');
    }
  });

  const handleEnroll = () => {
    if (!user) {
      router.push(`/login?redirect=courses/${id}`);
      return;
    }
    enrollMutation.mutate();
  };

  if (courseLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
        <p className="mt-4 text-slate-400 font-medium text-sm">Loading course details...</p>
      </div>
    );
  }

  if (courseError || !course) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-955 text-white p-6">
        <p className="text-red-400 font-semibold text-lg">Course not found or failed to load.</p>
        <button 
          onClick={() => router.push('/courses')}
          className="mt-4 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-semibold transition-all"
        >
          Back to Catalog
        </button>
      </div>
    );
  }

  // Fallback curriculum if not logged in
  const mockLessons = [
    { title: "Introduction & Setup", duration: "15 mins" },
    { title: "Core Concepts & Fundamentals", duration: "25 mins" },
    { title: "Building your first module", duration: "35 mins" },
    { title: "Advanced Architecture & Patterns", duration: "40 mins" },
    { title: "Testing & Deployment Guide", duration: "30 mins" }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      
      {/* Upper banner section */}
      <div className="relative bg-slate-900 border-b border-slate-800/80 py-12 px-6 sm:px-12">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8 items-center">
          
          {/* Left Side Info */}
          <div className="flex-1 space-y-4">
            <button 
              onClick={() => router.push('/courses')}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-semibold mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Catalog
            </button>
            <span className="px-3 py-1 bg-indigo-600/20 border border-indigo-500/20 text-indigo-400 rounded-full text-xs font-bold uppercase tracking-wider">
              {course.level}
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              {course.title}
            </h1>
            <p className="text-slate-400 text-sm sm:text-base max-w-2xl">
              {course.description}
            </p>
            
            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-350 pt-2">
              <span className="flex items-center gap-1">
                <GraduationCap className="w-4 h-4 text-indigo-450" />
                Instructor: <strong className="text-slate-200">{course.instructorName}</strong>
              </span>
              <span className="flex items-center gap-1">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                {course.averageRating > 0 ? `${course.averageRating.toFixed(1)} (${course.totalReviews} reviews)` : 'No reviews yet'}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-emerald-450" />
                {course.totalLessons} lectures
              </span>
            </div>
          </div>

          {/* Right Side: Card Thumbnail & Buy Button */}
          <div className="w-full lg:w-96 shrink-0 bg-slate-850 border border-slate-750 p-5 rounded-3xl shadow-xl space-y-5">
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-slate-700/65">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={course.thumbnail || 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=500'} 
                alt={course.title} 
                className="object-cover w-full h-full"
              />
            </div>
            
            <div className="flex items-end justify-between">
              <div>
                <span className="text-xs text-slate-450 uppercase block font-bold">Lifetime Access</span>
                <span className="text-2xl font-extrabold text-white">${course.price}</span>
              </div>
              <span className="text-xs text-emerald-450 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/10">
                100% Secure
              </span>
            </div>

            {isEnrolled ? (
              <button 
                onClick={() => router.push(`/dashboard/course/${course.id}/learn`)}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-550 text-white font-bold rounded-2xl transition-all shadow-lg shadow-emerald-650/10 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                Enter Classroom
              </button>
            ) : (
              <button 
                onClick={handleEnroll}
                disabled={enrollMutation.isPending}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-750 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-650/15 flex items-center justify-center gap-2 cursor-pointer"
              >
                {enrollMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enrolling...
                  </>
                ) : (
                  <>
                    <GraduationCap className="w-5 h-5" />
                    Enroll in Course
                  </>
                )}
              </button>
            )}
          </div>
          
        </div>
      </div>

      {/* Main Content Info */}
      <div className="max-w-6xl mx-auto px-6 sm:px-12 py-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
        
        {/* Left Side: About & Curriculum */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Description */}
          <div className="bg-slate-900/45 border border-slate-850/80 rounded-3xl p-6 sm:p-8 space-y-4">
            <h3 className="text-lg font-bold text-white">Course Overview</h3>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed whitespace-pre-line">
              {course.description}
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              <div className="flex items-center gap-3 p-4 bg-slate-950/40 rounded-2xl border border-slate-850/65">
                <FileText className="w-6 h-6 text-indigo-400 shrink-0" />
                <div>
                  <h4 className="text-xs text-slate-455 font-bold uppercase">Study Resources</h4>
                  <p className="text-sm font-bold text-slate-250 mt-0.5">
                    {notes && notes.length > 0 ? `${notes.length} PDF lecture notes` : 'Notes downloadable'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-slate-955/40 rounded-2xl border border-slate-855/65">
                <ClipboardList className="w-6 h-6 text-emerald-450 shrink-0" />
                <div>
                  <h4 className="text-xs text-slate-455 font-bold uppercase">Practical Homework</h4>
                  <p className="text-sm font-bold text-slate-250 mt-0.5">
                    {homework && homework.length > 0 ? `${homework.length} assignments active` : 'Assessments available'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Curriculum */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-500" />
              Course Curriculum & Chapters
            </h3>
            
            <div className="bg-slate-900/60 border border-slate-850 rounded-3xl overflow-hidden divide-y divide-slate-800/80 shadow-md">
              {progress && progress.lessons && progress.lessons.length > 0 ? (
                progress.lessons.map((lesson: any, idx: number) => (
                  <div key={lesson.id} className="flex items-center justify-between p-4 px-6 hover:bg-slate-900/90 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-6 h-6 bg-slate-800/85 text-xs font-bold text-slate-400 rounded-full flex items-center justify-center shrink-0">
                        {idx + 1}
                      </div>
                      <p className="text-sm font-semibold text-slate-250 truncate">{lesson.title}</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-450 shrink-0 font-medium">
                      <span>{lesson.duration}</span>
                      {lesson.completed && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      )}
                    </div>
                  </div>
                ))
              ) : (
                mockLessons.map((l, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 px-6 hover:bg-slate-900/90 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-6 h-6 bg-slate-800/85 text-xs font-bold text-slate-400 rounded-full flex items-center justify-center shrink-0">
                        {idx + 1}
                      </div>
                      <p className="text-sm font-semibold text-slate-400 truncate">{l.title}</p>
                    </div>
                    <span className="text-xs text-slate-500 shrink-0">{l.duration}</span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Right Side: Learning Outcomes & Highlights */}
        <div className="space-y-6">
          <div className="bg-slate-900/65 border border-slate-855 rounded-3xl p-6 space-y-4 shadow-md">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">What you will learn</h3>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                Comprehensive coverage of all industry-standard topics and frameworks.
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                Hands-on practical homework assignments and lecture notes.
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                Interactive quizzes and AI tutor available inside the workspace.
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                Cryptographically verifiable PDF completion certificates.
              </li>
            </ul>
          </div>

          <div className="bg-slate-900/65 border border-slate-855 rounded-3xl p-6 space-y-4 shadow-md">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Accreditation</h3>
            <div className="flex items-center gap-3">
              <Award className="w-8 h-8 text-indigo-500 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-slate-200">Verified Credentials</h4>
                <p className="text-xs text-slate-455 mt-0.5">Upon finishing 100% of curriculum and milestones.</p>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
