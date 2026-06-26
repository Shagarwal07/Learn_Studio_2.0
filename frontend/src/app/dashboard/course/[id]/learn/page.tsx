'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import SmartBackButton from '@/components/SmartBackButton';
import { 
  Play, 
  CheckCircle2, 
  Lock, 
  Unlock, 
  ChevronRight, 
  Clock, 
  Sparkles, 
  Send, 
  Loader2, 
  Award,
  BookOpen,
  Trophy
} from 'lucide-react';

interface LessonProgressDTO {
  id: number;
  title: string;
  position: number;
  videoUrl: string;
  duration: string;
  completed: boolean;
  unlocked: boolean;
  completedAt: string | null;
}

interface CourseProgressDTO {
  enrollmentId: number;
  courseId: number;
  courseTitle: string;
  progress: number;
  completedLessons: number;
  totalLessons: number;
  nextLessonId: number | null;
  lessons: LessonProgressDTO[];
}

export default function ClassroomPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const courseId = params.id;

  const [activeLesson, setActiveLesson] = useState<LessonProgressDTO | null>(null);
  const [doubtQuestion, setDoubtQuestion] = useState('');
  const [doubtAnswer, setDoubtAnswer] = useState('');
  const [doubtLoading, setDoubtLoading] = useState(false);

  // Fetch course progress & lessons
  const { data: progressData, isLoading, error } = useQuery<CourseProgressDTO>({
    queryKey: ['course-progress', courseId],
    queryFn: async () => {
      const response = await api.get(`/enrollments/${courseId}/progress`);
      return response.data.success ? response.data.data : null;
    },
  });

  // Set initial active lesson on load
  useEffect(() => {
    if (progressData && progressData.lessons.length > 0 && !activeLesson) {
      const nextLesson = progressData.lessons.find(l => !l.completed && l.unlocked);
      setActiveLesson(nextLesson || progressData.lessons[0]);
    }
  }, [progressData, activeLesson]);

  // Update Resume Learning progress in backend when active lesson changes
  useEffect(() => {
    if (activeLesson && courseId) {
      api.post(`/enrollments/${courseId}/lessons/${activeLesson.id}/progress`, {
        lastWatchedSeconds: 0 // Default to 0, updates last accessed timestamp
      }).catch(err => console.warn('Failed to update resume learning progress:', err.message || err));
    }
  }, [activeLesson, courseId]);

  // Complete lesson mutation
  const completeLessonMutation = useMutation({
    mutationFn: async (lessonId: number) => {
      const response = await api.post(`/enrollments/${courseId}/lessons/${lessonId}/complete`);
      return response.data;
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['course-progress', courseId] });
      queryClient.invalidateQueries({ queryKey: ['my-enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['resume-state'] });
      
      if (res.success && res.data) {
        const updatedLessons: LessonProgressDTO[] = res.data.lessons;
        const currentActive = updatedLessons.find(l => l.id === activeLesson?.id);
        if (currentActive) {
          setActiveLesson(currentActive);
        }
        
        const next = updatedLessons.find(l => !l.completed && l.unlocked);
        if (next && next.id !== activeLesson?.id) {
          setTimeout(() => {
            setActiveLesson(next);
          }, 1500);
        }
      }
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to complete lesson');
    }
  });

  // Ask doubt mutation
  const askDoubt = async () => {
    if (!doubtQuestion.trim() || !activeLesson) return;
    
    setDoubtAnswer('');
    setDoubtLoading(true);
    
    try {
      const response = await api.post('/ai/doubt', {
        question: doubtQuestion,
        courseName: progressData?.courseTitle || 'Programming',
        model: 'gemini',
      });
      
      const { success, data } = response.data;
      if (success && data?.answer) {
        setDoubtAnswer(data.answer);
      } else {
        setDoubtAnswer('Failed to retrieve answer. Please try again.');
      }
    } catch (e: any) {
      console.warn('AI doubt solver failed:', e.message || e);
      setDoubtAnswer('Failed to connect to AI server. Check if your backend is running.');
    } finally {
      setDoubtLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center bg-slate-950 text-white">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
        <p className="mt-3 text-sm text-slate-400 font-medium">Entering classroom...</p>
      </div>
    );
  }

  if (error || !progressData) {
    return (
      <div className="p-6 bg-red-500/5 border border-red-500/10 rounded-3xl text-center max-w-xl mx-auto space-y-4 text-white">
        <h3 className="font-bold text-lg text-red-400">Classroom not found</h3>
        <p className="text-sm text-slate-400">Verify you are enrolled in this course or that the database seeder completed successfully.</p>
        <button 
          onClick={() => router.push('/dashboard')}
          className="px-4 py-2 bg-indigo-650 hover:bg-indigo-600 text-white font-semibold rounded-xl transition-all text-xs cursor-pointer"
        >
          Go Back
        </button>
      </div>
    );
  }

  const handleComplete = () => {
    if (activeLesson) {
      completeLessonMutation.mutate(activeLesson.id);
    }
  };

  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('youtube.com/embed/')) return url;
    if (url.includes('youtube.com/watch?v=')) {
      return url.replace('watch?v=', 'embed/');
    }
    if (url.includes('youtu.be/')) {
      return url.replace('youtu.be/', 'youtube.com/embed/');
    }
    return url;
  };

  const activeVideoEmbed = activeLesson ? getEmbedUrl(activeLesson.videoUrl) : '';
  const currentProgress = progressData.progress;

  // Milestone badge thresholds
  const milestones = [
    { name: 'Bronze Explorer', percent: 25, color: 'text-amber-655 border-amber-500/20 bg-amber-500/5' },
    { name: 'Silver Achiever', percent: 50, color: 'text-slate-400 border-slate-400/20 bg-slate-400/5' },
    { name: 'Gold Specialist', percent: 75, color: 'text-yellow-500 border-yellow-500/20 bg-yellow-500/5' },
    { name: 'Diamond Graduate', percent: 100, color: 'text-cyan-400 border-cyan-400/20 bg-cyan-400/5' }
  ];

  return (
    <div className="flex flex-col xl:flex-row gap-8 max-w-6xl mx-auto">
      
      {/* Left: Video Area & Doubt Solver */}
      <div className="flex-1 space-y-6 min-w-0">
        
        {/* Back navigation */}
        <div className="flex items-center justify-between">
          <SmartBackButton />
          <span className="text-xs text-slate-450 dark:text-slate-500 font-medium">
            Course ID: #{courseId}
          </span>
        </div>

        {/* Video Player Box */}
        <div className="bg-slate-900 border border-slate-850 rounded-3xl overflow-hidden shadow-lg aspect-video relative">
          {activeLesson ? (
            activeLesson.videoUrl ? (
              <iframe
                src={activeVideoEmbed}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl flex items-center justify-center">
                  <Play className="w-6 h-6 fill-current" />
                </div>
                <div className="space-y-1 text-white">
                  <h5 className="font-bold text-base">{activeLesson.title}</h5>
                  <p className="text-xs text-slate-450 max-w-xs mx-auto">
                    This lesson does not have a video. Read the text content or proceed to complete it.
                  </p>
                </div>
              </div>
            )
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-550">
              Select a lesson from the outline to begin.
            </div>
          )}
        </div>

        {/* Lesson Description & Actions */}
        {activeLesson && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 dark:border-slate-800/60 pb-4">
              <div>
                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/60 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Lesson {activeLesson.position}
                </span>
                <h3 className="text-lg sm:text-xl font-extrabold text-slate-850 dark:text-white mt-1.5">{activeLesson.title}</h3>
              </div>

              {/* Complete button */}
              <div>
                {activeLesson.completed ? (
                  <div className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-705 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/10 rounded-xl text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4" /> Lesson Completed
                  </div>
                ) : (
                  <button
                    onClick={handleComplete}
                    disabled={completeLessonMutation.isPending}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-750 text-white rounded-xl font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    {completeLessonMutation.isPending ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" /> Mark as Completed
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              This lesson covers the fundamentals of {activeLesson.title}. Follow the video instructions, work on the assignments, and make sure to test your code locally. If you run into issues, ask our AI doubt solver below.
            </p>
          </div>
        )}

        {/* AI Doubt Solver Context-Box */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white p-6 rounded-3xl border border-slate-800 shadow-md space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-sm">Contextual AI Doubt Solver</h4>
              <p className="text-[10px] text-indigo-300">Powered by Gemini · Clear your doubts instantly</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <input
                type="text"
                value={doubtQuestion}
                onChange={(e) => setDoubtQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && askDoubt()}
                placeholder={`Ask a doubt about "${activeLesson?.title || 'this lesson'}"...`}
                className="w-full pl-4 pr-12 py-3.5 bg-slate-950/45 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-200 placeholder-slate-500 transition-all text-sm"
              />
              <button
                onClick={askDoubt}
                disabled={doubtLoading || !doubtQuestion.trim()}
                className="absolute right-2 top-2 p-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg transition-all cursor-pointer"
              >
                {doubtLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>

            {/* Answer Display */}
            {doubtAnswer && (
              <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-xl text-sm space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
                <div className="text-xs font-bold text-indigo-450 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> AI Assistant Response:
                </div>
                <p className="text-slate-300 leading-relaxed text-xs whitespace-pre-wrap">{doubtAnswer}</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Right: Course Outline & Roadmap Milestones */}
      <div className="w-full xl:w-80 space-y-6">
        
        {/* Progress Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-3">
          <h4 className="font-bold text-slate-900 dark:text-white text-sm">Course Completion</h4>
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-450">
            <span>{progressData.completedLessons} of {progressData.totalLessons} completed</span>
            <span className="text-indigo-600 dark:text-indigo-400">{currentProgress}%</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div 
              className="bg-indigo-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${currentProgress}%` }}
            />
          </div>
        </div>

        {/* Visual Roadmap & Milestones */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-4">
          <h4 className="font-bold text-slate-700 dark:text-white text-sm flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-indigo-500" />
            Milestone Milestones
          </h4>
          
          <div className="space-y-3">
            {milestones.map((m) => {
              const reached = currentProgress >= m.percent;
              return (
                <div 
                  key={m.name} 
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                    reached 
                      ? `${m.color} scale-[1.01] shadow-sm` 
                      : 'border-slate-150 dark:border-slate-850 opacity-45'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Trophy className={`w-4 h-4 ${reached ? 'text-current' : 'text-slate-400'}`} />
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold truncate text-slate-800 dark:text-slate-200 leading-none">{m.name}</p>
                      <span className="text-[9px] font-semibold text-slate-450 dark:text-slate-500 mt-0.5 block">{m.percent}% Completion</span>
                    </div>
                  </div>
                  {reached && (
                    <span className="text-[9px] font-extrabold bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-lg uppercase tracking-wider shrink-0 border border-indigo-500/10">
                      Unlocked
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Outline Box */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-850/20">
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">Course Outline</h4>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/65 max-h-[40vh] overflow-y-auto pr-0.5">
            {progressData.lessons.map((lesson) => {
              const isSelected = activeLesson?.id === lesson.id;
              
              return (
                <button
                  key={lesson.id}
                  disabled={!lesson.unlocked}
                  onClick={() => setActiveLesson(lesson)}
                  className={`w-full p-4 flex items-start gap-3 text-left transition-all group ${
                    !lesson.unlocked 
                      ? 'bg-slate-50/40 dark:bg-slate-950/20 cursor-not-allowed text-slate-500 dark:text-slate-600' 
                      : isSelected
                        ? 'bg-indigo-50/50 dark:bg-indigo-950/20'
                        : 'hover:bg-slate-50/50 dark:hover:bg-slate-850/40 cursor-pointer text-slate-700 dark:text-slate-305'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {lesson.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : !lesson.unlocked ? (
                      <Lock className="w-4 h-4 text-slate-450 dark:text-slate-600" />
                    ) : (
                      <Play className={`w-4 h-4 ${isSelected ? 'text-indigo-600 dark:text-indigo-400 fill-current' : 'text-slate-400 group-hover:text-indigo-550 dark:group-hover:text-indigo-455'}`} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <p className={`text-xs font-bold leading-tight ${
                      isSelected ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-200'
                    }`}>
                      {lesson.position}. {lesson.title}
                    </p>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1 font-medium">
                      <Clock className="w-3.5 h-3.5" /> {lesson.duration}
                    </span>
                  </div>

                  {lesson.unlocked && <ChevronRight className="w-3.5 h-3.5 text-slate-350 dark:text-slate-600 self-center shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
