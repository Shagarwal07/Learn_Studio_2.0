'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { 
  Megaphone, 
  Loader2, 
  Layers, 
  MegaphoneIcon, 
  Calendar, 
  ShieldAlert, 
  CheckCircle2 
} from 'lucide-react';

interface BatchDTO {
  id: number;
  name: string;
  level: string;
}

interface CourseDTO {
  id: number;
  title: string;
}

interface AnnouncementDTO {
  id: number;
  title: string;
  message: string;
  batchId: number;
  batchName: string;
  createdByName: string;
  createdAt: string;
}

export default function InstructorAnnouncementsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [scope, setScope] = useState<'COURSE' | 'BATCH'>('BATCH');
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  
  // Form states
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // 1. Fetch Instructor Batches
  const { data: batches = [], isLoading: isBatchesLoading } = useQuery<BatchDTO[]>({
    queryKey: ['instructor-batches-announcements'],
    enabled: user?.role === 'INSTRUCTOR' || user?.role === 'ADMIN',
    queryFn: async () => {
      const response = await api.get('/instructor/batches');
      return response.data.success ? response.data.data : [];
    }
  });

  // 1b. Fetch Instructor Courses
  const { data: courses = [], isLoading: isCoursesLoading } = useQuery<CourseDTO[]>({
    queryKey: ['instructor-courses-announcements'],
    enabled: user?.role === 'INSTRUCTOR' || user?.role === 'ADMIN',
    queryFn: async () => {
      const response = await api.get('/courses?size=100');
      return response.data.success ? response.data.data.content : [];
    }
  });

  // 2. Fetch announcements for selected scope
  const { data: announcements = [], isLoading: isAnnouncementsLoading, refetch: refetchAnnouncements } = useQuery<AnnouncementDTO[]>({
    queryKey: ['instructor-announcements-list', scope, selectedBatchId, selectedCourseId],
    enabled: (scope === 'BATCH' && !!selectedBatchId) || (scope === 'COURSE' && !!selectedCourseId),
    queryFn: async () => {
      if (scope === 'BATCH') {
        const response = await api.get(`/instructor/batches/${selectedBatchId}/announcements`);
        return response.data.success ? response.data.data : [];
      } else {
        const response = await api.get(`/announcements?courseId=${selectedCourseId}`);
        return response.data.success ? response.data.data : [];
      }
    }
  });

  // 3. Create announcement mutation
  const createAnnouncementMutation = useMutation({
    mutationFn: async (newAnn: any) => {
      if (scope === 'BATCH') {
        const response = await api.post(`/instructor/batches/${selectedBatchId}/announcements`, newAnn);
        return response.data;
      } else {
        newAnn.courseId = Number(selectedCourseId);
        const response = await api.post(`/announcements`, newAnn);
        return response.data;
      }
    },
    onSuccess: () => {
      refetchAnnouncements();
      setTitle('');
      setMessage('');
      setFormSuccess('Announcement posted successfully.');
      setFormError('');
      setTimeout(() => setFormSuccess(''), 4000);
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || 'Failed to post announcement.');
    }
  });

  // Access control
  if (user?.role !== 'INSTRUCTOR' && user?.role !== 'ADMIN') {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center bg-rose-500/5 border border-rose-500/10 rounded-xl p-6 text-center max-w-xl mx-auto">
        <ShieldAlert className="w-10 h-10 text-rose-400 mb-3" />
        <h3 className="font-bold text-white text-base">Access Restrained</h3>
        <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
          This portal is reserved exclusively for Course Instructors and System Administrators.
        </p>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (scope === 'BATCH' && !selectedBatchId) {
      setFormError('Please select a batch.');
      return;
    }
    if (scope === 'COURSE' && !selectedCourseId) {
      setFormError('Please select a course.');
      return;
    }
    if (!title.trim() || !message.trim()) {
      setFormError('Please fill in all fields.');
      return;
    }

    setFormError('');
    setFormSuccess('');

    createAnnouncementMutation.mutate({
      title: title.trim(),
      message: message.trim()
    });
  };

  return (
    <div className="space-y-5 max-w-6xl mx-auto text-slate-100 pb-12 animate-in fade-in duration-200">
      
      {/* Header */}
      <div>
        <p className="text-violet-400 text-xs font-semibold uppercase tracking-wider">Instructor Control Panel</p>
        <h2 className="text-xl font-bold tracking-tight text-slate-100 mt-1">Announcements Hub</h2>
        <p className="text-xs text-slate-400 mt-1">
          Broadcast batch-wide notices, exam alerts, class schedule changes, or general updates.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Left Column: Post Announcement Form */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4 shadow-sm">
          
          <h3 className="font-semibold text-sm text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
            <Megaphone className="w-4 h-4 text-violet-400" /> Broadcast Announcement
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            
            <div className="space-y-1.5">
              <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider">Announcement Scope *</label>
              <div className="flex gap-4 mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={scope === 'BATCH'} onChange={() => { setScope('BATCH'); setFormError(''); setFormSuccess(''); }} className="text-violet-500" />
                  <span className="text-slate-200">Batch-Specific</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={scope === 'COURSE'} onChange={() => { setScope('COURSE'); setFormError(''); setFormSuccess(''); }} className="text-violet-500" />
                  <span className="text-slate-200">Course-Wide</span>
                </label>
              </div>
            </div>

            {/* Scope Selector */}
            {scope === 'BATCH' ? (
              <div className="space-y-1.5">
                <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider">Select Academic Batch *</label>
                {isBatchesLoading ? (
                  <div className="flex items-center gap-2 py-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-500" />
                    <span className="text-[10px] text-slate-400 font-medium">Loading batches...</span>
                  </div>
                ) : (
                  <select
                    value={selectedBatchId}
                    onChange={(e) => {
                      setSelectedBatchId(e.target.value);
                      setFormError('');
                      setFormSuccess('');
                    }}
                    className="w-full px-3 py-1.5 bg-slate-955 border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 rounded-lg text-xs h-9 transition-all cursor-pointer"
                    required
                  >
                    <option value="">-- Choose a Batch --</option>
                    {batches.map(b => (
                      <option key={b.id} value={b.id}>{b.name} ({b.level})</option>
                    ))}
                  </select>
                )}
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider">Select Course *</label>
                {isCoursesLoading ? (
                  <div className="flex items-center gap-2 py-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-500" />
                    <span className="text-[10px] text-slate-400 font-medium">Loading courses...</span>
                  </div>
                ) : (
                  <select
                    value={selectedCourseId}
                    onChange={(e) => {
                      setSelectedCourseId(e.target.value);
                      setFormError('');
                      setFormSuccess('');
                    }}
                    className="w-full px-3 py-1.5 bg-slate-955 border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 rounded-lg text-xs h-9 transition-all cursor-pointer"
                    required
                  >
                    <option value="">-- Choose a Course --</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {((scope === 'BATCH' && selectedBatchId) || (scope === 'COURSE' && selectedCourseId)) && (
              <>
                {/* Announcement Title */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider">Announcement Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Midterm Date & Syllabus Change"
                    className="w-full px-3 py-1.5 bg-slate-955 border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 rounded-lg text-xs h-9 transition-all"
                    required
                  />
                </div>

                {/* Message Body */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider">Broadcast Message *</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type the announcement details here..."
                    rows={5}
                    className="w-full px-3 py-2 bg-slate-955 border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 rounded-lg text-xs resize-none transition-all"
                    required
                  />
                </div>

                {formError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-450 rounded-lg text-center font-medium">
                    {formError}
                  </div>
                )}

                {formSuccess && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-center font-medium">
                    {formSuccess}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={createAnnouncementMutation.isPending}
                  className="w-full bg-violet-600 hover:bg-violet-700 text-slate-100 rounded-lg font-medium px-4 py-1.5 h-9 transition-colors text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-violet-500/10 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {createAnnouncementMutation.isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Broadcasting...
                    </>
                  ) : (
                    <>
                      <MegaphoneIcon className="w-3.5 h-3.5" />
                      Broadcast Announcement
                    </>
                  )}
                </button>
              </>
            )}

          </form>
        </div>

        {/* Right Column: Announcements List */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900">
              <h3 className="font-semibold text-sm text-slate-200 flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-violet-400" /> Recent Broadcasts List
              </h3>
              {((scope === 'BATCH' && selectedBatchId) || (scope === 'COURSE' && selectedCourseId)) && (
                <span className="text-[10px] bg-slate-955 border border-slate-800 px-2 py-0.5 rounded-full text-slate-400 font-medium">
                  {announcements.length} Notices Active
                </span>
              )}
            </div>

            {!((scope === 'BATCH' && selectedBatchId) || (scope === 'COURSE' && selectedCourseId)) ? (
              <div className="p-16 text-center text-slate-400 space-y-2">
                <Layers className="w-10 h-10 mx-auto text-slate-700 mb-4" />
                <p className="font-medium">No Scope Selected</p>
                <p className="text-xs">Please select a batch or course to view active announcements.</p>
              </div>
            ) : isAnnouncementsLoading ? (
              <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
                <span className="text-xs text-slate-455">Syncing broadcasts catalog...</span>
              </div>
            ) : announcements.length === 0 ? (
              <div className="p-16 text-center text-slate-400 space-y-2">
                <Megaphone className="w-8 h-8 mx-auto text-slate-600" />
                <p className="font-semibold text-xs text-slate-300">No announcements posted yet</p>
                <p className="text-xs text-slate-500 max-w-xs mx-auto leading-normal">
                  Type and broadcast a notice from the form on the left to alert all assigned students in this batch.
                </p>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {announcements.map((ann) => (
                  <div key={ann.id} className="p-4 bg-slate-955/40 border border-slate-800 border-l-2 border-l-violet-600 rounded-r-lg rounded-l-none space-y-2.5 shadow-sm hover:bg-slate-955/70 transition-all duration-200">
                    
                    <div className="space-y-1">
                      <h4 className="font-semibold text-slate-200 text-xs">
                        {ann.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed whitespace-pre-wrap">
                        {ann.message}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-semibold border-t border-slate-800/60 pt-2.5">
                      <span>Broadcasted by: {ann.createdByName}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-800" />
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-550" />
                        {formatDate(ann.createdAt)}
                      </span>
                    </div>

                  </div>
                ))}
              </div>
            )}

          </div>
        </div>

      </div>

    </div>
  );
}
