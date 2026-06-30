'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { motion } from 'framer-motion';
import { 
  Play, 
  CheckCircle2, 
  Compass, 
  Loader2, 
  GraduationCap,
  Sparkles
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

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 20 } }
};

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
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="relative">
          <Loader2 className="w-10 h-10 animate-spin text-accent-grape" />
          <div className="absolute inset-0 blur-md bg-accent-grape/20 rounded-full animate-pulse" />
        </div>
        <p className="text-text-secondary text-xs font-semibold uppercase tracking-wider animate-pulse">
          Loading your classroom...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto py-12 px-6">
        <div className="p-8 bg-error/5 border border-error/15 rounded-3xl text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 bg-error/10 text-error rounded-2xl flex items-center justify-center mx-auto shadow-[0_0_15px_rgba(239,68,68,0.15)]">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">Failed to Load Courses</h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Ensure the Spring Boot backend server is active on port 8080 and try again.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const courses = enrollments || [];

  return (
    <div className="space-y-8 max-w-6xl mx-auto text-foreground">
      
      {/* Page Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-bg-secondary-dark via-card-dark to-surface-dark p-6 lg:p-10 rounded-3xl border border-border-color shadow-2xl">
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-80 h-80 bg-accent-grape/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-1/3 w-64 h-64 bg-primary-blue/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-2">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-accent-grape bg-accent-grape/10 px-3 py-1 rounded-full border border-accent-grape/20 uppercase tracking-wider">
            <Sparkles className="w-3 h-3" /> Dashboard
          </span>
          <h2 className="text-2xl lg:text-3xl font-black tracking-tight text-white">
            Enrolled Courses
          </h2>
          <p className="text-text-secondary text-xs sm:text-sm max-w-xl leading-relaxed">
            Manage your educational milestones, trace lesson progress, and continue your specialized developer curriculum.
          </p>
        </div>
      </div>

      {courses.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card py-16 px-6 rounded-3xl border border-border-color text-center max-w-lg mx-auto space-y-6 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-accent-grape/5 to-primary-blue/5 pointer-events-none" />
          <div className="w-16 h-16 bg-white/5 border border-border-color text-text-muted rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <GraduationCap className="w-8 h-8" />
          </div>
          <div className="space-y-2 relative z-10">
            <h4 className="text-lg font-black text-white">Start learning today</h4>
            <p className="text-xs text-text-secondary max-w-xs mx-auto leading-relaxed">
              You have not enrolled in any professional learning tracks yet. Browse our selection and pick a path.
            </p>
          </div>
          <Link 
            href="/courses"
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-accent-grape to-primary-blue text-white rounded-xl shadow-lg shadow-accent-grape/15 font-bold text-xs uppercase tracking-wider hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer relative z-10"
          >
            <Compass className="w-4 h-4" /> Explore Catalog
          </Link>
        </motion.div>
      ) : (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {courses.map((item) => (
            <motion.div 
              key={item.enrollmentId}
              variants={itemVariants}
              className="glass-card hover-lift rounded-3xl overflow-hidden flex flex-col justify-between"
            >
              <div className="p-6 space-y-5">
                <div className="flex justify-between items-start">
                  <span className={`inline-flex items-center gap-1 text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                    item.progress === 100
                      ? 'bg-success/10 text-success border-success/20 shadow-[0_0_10px_rgba(34,197,94,0.15)]'
                      : 'bg-accent-grape/10 text-accent-grape border-accent-grape/20'
                  }`}>
                    {item.progress === 100 ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" /> Completed
                      </>
                    ) : (
                      'In Progress'
                    )}
                  </span>
                  <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider bg-white/5 border border-border-color px-2.5 py-0.5 rounded-full">
                    {item.completedLessons}/{item.totalLessons} Lessons
                  </span>
                </div>

                <h4 className="text-base font-black text-white line-clamp-2 min-h-[3rem] leading-snug">
                  {item.courseTitle}
                </h4>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold text-text-secondary">
                    <span>Progress</span>
                    <span className="text-white font-bold">{item.progress}%</span>
                  </div>
                  <div className="w-full bg-bg-secondary-dark h-1.5 rounded-full overflow-hidden border border-border-color">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(150,52,132,0.4)] ${
                        item.progress === 100 
                          ? 'bg-gradient-to-r from-success to-teal-500' 
                          : 'bg-gradient-to-r from-accent-grape to-primary-blue'
                      }`}
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="p-5 bg-white/5 border-t border-border-color">
                <Link
                  href={`/dashboard/course/${item.courseId}/learn`}
                  className="w-full py-3 bg-gradient-to-r from-accent-grape to-primary-blue hover:from-accent-grape/90 hover:to-primary-blue/90 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Enter Classroom
                </Link>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
