'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { 
  Megaphone, 
  Loader2, 
  Layers, 
  Calendar, 
  ShieldAlert, 
  Trash2,
  Send,
  User
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
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
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
      setFormSuccess('Announcement published and sent to student dashboards.');
      setFormError('');
      setTimeout(() => setFormSuccess(''), 4000);
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || 'Failed to post announcement.');
    }
  });

  // Delete Announcement Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/announcements/${id}`);
    },
    onSuccess: () => {
      refetchAnnouncements();
      alert('Announcement deleted successfully.');
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to delete announcement.');
    }
  });

  if (user?.role !== 'INSTRUCTOR' && user?.role !== 'ADMIN') {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center bg-slate-900/40 border border-slate-800 rounded-2xl p-8 text-center max-w-xl mx-auto space-y-3">
        <ShieldAlert className="w-10 h-10 text-red-400 mx-auto" />
        <h3 className="font-semibold text-white text-base">Access Restrained</h3>
        <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
          This broadcast station is reserved solely for Course Instructors and System Administrators.
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
    <div className="space-y-8 max-w-6xl mx-auto text-slate-100 pb-20 px-2 sm:px-4 pt-2">
      
      {/* Clean Header */}
      <div className="pb-4 border-b border-slate-800/80">
        <h1 className="text-xl font-bold tracking-tight text-white">Instructor Announcements Hub</h1>
        <p className="text-sm text-slate-400 mt-1">
          Broadcast official academic notices, exam alerts, or timetable changes directly to your batches and courses.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Post Announcement Workspace */}
        <div className="lg:col-span-5 bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-5">
          <h3 className="font-semibold text-sm text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Megaphone className="w-4 h-4 text-indigo-400" />
            <span>Broadcast New Notice</span>
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            
            <div className="space-y-2">
              <label className="block font-medium text-slate-300">Target Scope *</label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800 text-center font-medium">
                <button
                  type="button"
                  onClick={() => { setScope('BATCH'); setFormError(''); setFormSuccess(''); }}
                  className={`py-1.5 rounded-lg transition-colors cursor-pointer ${
                    scope === 'BATCH' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Batch Specific
                </button>
                <button
                  type="button"
                  onClick={() => { setScope('COURSE'); setFormError(''); setFormSuccess(''); }}
                  className={`py-1.5 rounded-lg transition-colors cursor-pointer ${
                    scope === 'COURSE' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Course Wide
                </button>
              </div>
            </div>

            {scope === 'BATCH' ? (
              <div className="space-y-1.5">
                <label className="block font-medium text-slate-300">Select Academic Batch *</label>
                {isBatchesLoading ? (
                  <div className="flex items-center gap-2 py-2 text-slate-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Loading batches...</span>
                  </div>
                ) : (
                  <select
                    value={selectedBatchId}
                    onChange={(e) => { setSelectedBatchId(e.target.value); setFormError(''); setFormSuccess(''); }}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-slate-200 rounded-xl focus:outline-none focus:border-slate-700 transition-colors cursor-pointer"
                    required
                  >
                    <option value="" className="bg-slate-950">-- Choose Target Batch --</option>
                    {batches.map(b => (
                      <option key={b.id} value={b.id} className="bg-slate-950">{b.name} ({b.level})</option>
                    ))}
                  </select>
                )}
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="block font-medium text-slate-300">Select Target Course *</label>
                {isCoursesLoading ? (
                  <div className="flex items-center gap-2 py-2 text-slate-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Loading courses...</span>
                  </div>
                ) : (
                  <select
                    value={selectedCourseId}
                    onChange={(e) => { setSelectedCourseId(e.target.value); setFormError(''); setFormSuccess(''); }}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-slate-200 rounded-xl focus:outline-none focus:border-slate-700 transition-colors cursor-pointer"
                    required
                  >
                    <option value="" className="bg-slate-950">-- Choose Target Course --</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id} className="bg-slate-950">{c.title}</option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {((scope === 'BATCH' && selectedBatchId) || (scope === 'COURSE' && selectedCourseId)) && (
              <>
                <div className="space-y-1.5">
                  <label className="block font-medium text-slate-300">Headline Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Midterm Examination Schedule Released"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 rounded-xl focus:outline-none focus:border-slate-700 text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block font-medium text-slate-300">Broadcast Message *</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type official announcement details here..."
                    rows={6}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 rounded-xl focus:outline-none focus:border-slate-700 text-xs leading-relaxed"
                    required
                  />
                </div>

                {formError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-center font-medium">
                    {formError}
                  </div>
                )}

                {formSuccess && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-center font-medium">
                    {formSuccess}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={createAnnouncementMutation.isPending}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium text-xs transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {createAnnouncementMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Publishing...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Publish Broadcast</span>
                    </>
                  )}
                </button>
              </>
            )}
          </form>
        </div>

        {/* Right Column: Active Broadcasts List */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-semibold text-sm text-white flex items-center gap-2">
              <span>Published Broadcasts Archive</span>
            </h3>
            {((scope === 'BATCH' && selectedBatchId) || (scope === 'COURSE' && selectedCourseId)) && (
              <span className="text-xs text-slate-400 font-mono">
                {announcements.length} item{announcements.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {!((scope === 'BATCH' && selectedBatchId) || (scope === 'COURSE' && selectedCourseId)) ? (
            <div className="p-16 text-center bg-slate-900/40 border border-slate-800/60 rounded-2xl text-slate-400 space-y-2">
              <Layers className="w-8 h-8 mx-auto text-slate-600 stroke-1" />
              <p className="text-sm font-medium text-slate-300">No Scope Selected</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Please select an academic batch or course on the left to view and manage active broadcasts.
              </p>
            </div>
          ) : isAnnouncementsLoading ? (
            <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
              <span className="text-xs">Loading broadcast archive...</span>
            </div>
          ) : announcements.length === 0 ? (
            <div className="p-16 text-center bg-slate-900/40 border border-slate-800/60 rounded-2xl text-slate-400 space-y-2">
              <Megaphone className="w-8 h-8 mx-auto text-slate-600 stroke-1" />
              <p className="text-sm font-medium text-slate-300">No notices broadcasted yet</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Use the control panel on the left to broadcast your first academic notice to students.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map((ann) => (
                <div 
                  key={ann.id} 
                  className="p-5 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl transition-all duration-150 space-y-3"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="font-semibold text-white text-sm">
                        {ann.title}
                      </h4>
                      <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        <span>By {ann.createdByName}</span>
                      </p>
                    </div>

                    <button
                      onClick={() => { if (confirm('Permanently delete this notice?')) deleteMutation.mutate(ann.id); }}
                      title="Delete Notice"
                      className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/60 whitespace-pre-wrap">
                    {ann.message}
                  </p>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-800/60">
                    <span>Status: Active on Feed</span>
                    <span className="flex items-center gap-1.5 font-mono">
                      <Calendar className="w-3.5 h-3.5 text-slate-600" />
                      <span>{formatDate(ann.createdAt)}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
