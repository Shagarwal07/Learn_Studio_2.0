'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { 
  Megaphone, 
  Pin, 
  Plus, 
  Loader2, 
  User, 
  ExternalLink, 
  Instagram, 
  Trash2,
  X,
  Send,
  Calendar
} from 'lucide-react';

interface AnnouncementDTO {
  id: number;
  title: string;
  message: string;
  imageUrl: string | null;
  targetRole: 'ALL' | 'STUDENT' | 'INSTRUCTOR';
  courseId: number | null;
  courseTitle: string | null;
  instagramUrl: string | null;
  externalLink: string | null;
  pinned: boolean;
  createdByName: string;
  createdAt: string;
  batchId?: number;
  batchName?: string;
}

interface CourseDTO {
  id: number;
  title: string;
}

interface BatchDTO {
  id: number;
  name: string;
  level: string;
}

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [formOpen, setFormOpen] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [targetRoleInput, setTargetRoleInput] = useState<'ALL' | 'STUDENT' | 'INSTRUCTOR'>('ALL');
  const [pinnedInput, setPinnedInput] = useState(false);
  const [instagramInput, setInstagramInput] = useState('');
  const [externalInput, setExternalInput] = useState('');
  const [imageInput, setImageInput] = useState('');
  const [scope, setScope] = useState<'GLOBAL' | 'COURSE' | 'BATCH'>('GLOBAL');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [posting, setPosting] = useState(false);

  const [activeFilter, setActiveFilter] = useState<'ALL' | 'PINNED' | 'SPECIFIC'>('ALL');
  const isInstructorOrAdmin = user?.role === 'INSTRUCTOR' || user?.role === 'ADMIN';

  const { data: courses = [] } = useQuery<CourseDTO[]>({
    queryKey: ['announcements-courses'],
    enabled: isInstructorOrAdmin,
    queryFn: async () => {
      const response = await api.get('/courses?size=100');
      return response.data.success ? response.data.data.content : [];
    }
  });

  const { data: batches = [] } = useQuery<BatchDTO[]>({
    queryKey: ['announcements-batches'],
    enabled: isInstructorOrAdmin,
    queryFn: async () => {
      const response = await api.get('/instructor/batches');
      return response.data.success ? response.data.data : [];
    }
  });

  const { data: announcements = [], isLoading } = useQuery<AnnouncementDTO[]>({
    queryKey: ['announcements'],
    queryFn: async () => {
      const response = await api.get('/announcements');
      return response.data.success ? response.data.data : [];
    }
  });

  const createMutation = useMutation({
    mutationFn: async (newAnn: Partial<AnnouncementDTO>) => {
      const response = await api.post('/announcements', newAnn);
      return response.data;
    },
    onMutate: () => setPosting(true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      setFormOpen(false);
      setTitleInput('');
      setMessageInput('');
      setInstagramInput('');
      setExternalInput('');
      setImageInput('');
      setPinnedInput(false);
      setScope('GLOBAL');
      setSelectedCourseId('');
      setSelectedBatchId('');
      alert('Announcement posted successfully!');
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to post announcement.');
    },
    onSettled: () => setPosting(false)
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete(`/announcements/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      alert('Announcement deleted successfully!');
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to delete announcement.');
    }
  });

  const handlePost = () => {
    if (!titleInput.trim() || !messageInput.trim()) {
      alert('Please fill out Title and Message.');
      return;
    }
    if (scope === 'COURSE' && !selectedCourseId) {
      alert('Please select a course.');
      return;
    }
    if (scope === 'BATCH' && !selectedBatchId) {
      alert('Please select a batch.');
      return;
    }

    createMutation.mutate({
      title: titleInput,
      message: messageInput,
      targetRole: targetRoleInput,
      pinned: pinnedInput,
      instagramUrl: instagramInput || null,
      externalLink: externalInput || null,
      imageUrl: imageInput || null,
      courseId: scope === 'COURSE' ? Number(selectedCourseId) : undefined,
      batchId: scope === 'BATCH' ? Number(selectedBatchId) : undefined
    });
  };

  if (isLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
        <p className="text-sm font-medium text-slate-500">Loading campus announcements...</p>
      </div>
    );
  }

  const filteredAnnouncements = announcements.filter(a => {
    if (activeFilter === 'PINNED') return a.pinned;
    if (activeFilter === 'SPECIFIC') return a.courseTitle || a.batchName;
    return true;
  });

  const pinnedNotices = filteredAnnouncements.filter(a => a.pinned);
  const standardNotices = filteredAnnouncements.filter(a => !a.pinned);

  return (
    <div className="max-w-4xl mx-auto space-y-8 text-slate-100 pb-16 px-2 sm:px-4 pt-2">
      
      {/* Clean Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">Campus Notice Board</h1>
          <p className="text-sm text-slate-400 mt-1">
            Stay informed with official instructor updates, exam schedules, and institutional broadcasts.
          </p>
        </div>

        {isInstructorOrAdmin && (
          <button 
            onClick={() => setFormOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Post Notice</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveFilter('ALL')}
          className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            activeFilter === 'ALL'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          All Notices ({announcements.length})
        </button>
        <button
          onClick={() => setActiveFilter('PINNED')}
          className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            activeFilter === 'PINNED'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          Pinned Alerts ({announcements.filter(a => a.pinned).length})
        </button>
        <button
          onClick={() => setActiveFilter('SPECIFIC')}
          className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            activeFilter === 'SPECIFIC'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          Batch & Course Specific
        </button>
      </div>

      {/* Creation Modal / Panel */}
      {formOpen && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-indigo-400" />
              <span>Broadcast New Campus Notice</span>
            </h3>
            <button 
              onClick={() => setFormOpen(false)}
              className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="flex flex-col gap-1.5 col-span-2">
              <label className="font-medium text-slate-300">Title *</label>
              <input 
                type="text" 
                placeholder="Announcement subject line" 
                value={titleInput} 
                onChange={(e) => setTitleInput(e.target.value)}
                className="px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-slate-700"
              />
            </div>

            <div className="flex flex-col gap-1.5 col-span-2">
              <label className="font-medium text-slate-300">Message Details *</label>
              <textarea 
                rows={4}
                placeholder="Write your announcement text here..." 
                value={messageInput} 
                onChange={(e) => setMessageInput(e.target.value)}
                className="px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-slate-700 leading-relaxed"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-medium text-slate-300">Target Role</label>
              <select
                value={targetRoleInput}
                onChange={(e) => setTargetRoleInput(e.target.value as any)}
                className="px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-slate-700 cursor-pointer"
              >
                <option value="ALL" className="bg-slate-950">Everyone</option>
                <option value="STUDENT" className="bg-slate-950">Students Only</option>
                <option value="INSTRUCTOR" className="bg-slate-950">Instructors Only</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-medium text-slate-300">Broadcast Scope</label>
              <select
                value={scope}
                onChange={(e) => setScope(e.target.value as any)}
                className="px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-slate-700 cursor-pointer"
              >
                <option value="GLOBAL" className="bg-slate-950">Global Campus Notice</option>
                <option value="COURSE" className="bg-slate-950">Course Specific</option>
                <option value="BATCH" className="bg-slate-950">Batch Specific</option>
              </select>
            </div>

            {scope === 'COURSE' && (
              <div className="flex flex-col gap-1.5 col-span-2">
                <label className="font-medium text-slate-300">Select Course *</label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-slate-700 cursor-pointer"
                >
                  <option value="">-- Choose a Course --</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id} className="bg-slate-950">{c.title}</option>
                  ))}
                </select>
              </div>
            )}

            {scope === 'BATCH' && (
              <div className="flex flex-col gap-1.5 col-span-2">
                <label className="font-medium text-slate-300">Select Batch *</label>
                <select
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                  className="px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-slate-700 cursor-pointer"
                >
                  <option value="">-- Choose a Batch --</option>
                  {batches.map(b => (
                    <option key={b.id} value={b.id} className="bg-slate-950">{b.name} ({b.level})</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center gap-2.5 mt-2 col-span-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
              <input 
                type="checkbox" 
                id="pinned"
                checked={pinnedInput} 
                onChange={(e) => setPinnedInput(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-700 focus:ring-0 cursor-pointer"
              />
              <label htmlFor="pinned" className="text-xs font-medium text-slate-200 cursor-pointer select-none">
                Pin to top of notice board as high-priority alert
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              onClick={() => setFormOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handlePost}
              disabled={posting}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors shadow-sm cursor-pointer flex items-center gap-1.5"
            >
              {posting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>Publish Notice</span>
            </button>
          </div>
        </div>
      )}

      {/* Pinned Section */}
      {pinnedNotices.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <Pin className="w-3.5 h-3.5 rotate-45 shrink-0" />
            <span>Pinned Alerts ({pinnedNotices.length})</span>
          </h2>

          <div className="space-y-4">
            {pinnedNotices.map((a) => (
              <div 
                key={a.id}
                className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-4 shadow-sm relative overflow-hidden"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        Pinned
                      </span>
                      <span className="text-xs font-medium text-slate-400">
                        {a.batchName ? `Batch: ${a.batchName}` : a.courseTitle ? `Course: ${a.courseTitle}` : 'Global Campus Notice'}
                      </span>
                    </div>
                    <h3 className="text-base font-semibold text-white">{a.title}</h3>
                  </div>

                  {isInstructorOrAdmin && (
                    <button 
                      onClick={() => { if (confirm('Delete announcement?')) deleteMutation.mutate(a.id); }}
                      className="text-slate-500 hover:text-red-400 p-1 rounded transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {a.message}
                </p>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-800/80">
                  <span>By {a.createdByName}</span>
                  <div className="flex items-center gap-3">
                    {a.externalLink && (
                      <a 
                        href={a.externalLink} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-medium"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>External Link</span>
                      </a>
                    )}
                    <span className="font-mono">{new Date(a.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Standard Notices Section */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Standard Notice Archive ({standardNotices.length})
        </h2>

        {standardNotices.length === 0 ? (
          <div className="py-16 text-center bg-slate-900/40 border border-slate-800/60 rounded-2xl text-slate-400 text-xs">
            {activeFilter !== 'ALL' ? `No notices found matching the "${activeFilter}" filter.` : 'No announcements have been published yet.'}
          </div>
        ) : (
          <div className="space-y-4">
            {standardNotices.map((a) => (
              <div 
                key={a.id}
                className="p-6 bg-slate-900/50 hover:bg-slate-900/80 border border-slate-800/80 hover:border-slate-800 rounded-2xl space-y-3.5 transition-all duration-150"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-[11px] font-medium text-slate-400 block mb-1">
                      {a.batchName ? `Batch: ${a.batchName}` : a.courseTitle ? `Course: ${a.courseTitle}` : 'Global Notice'}
                    </span>
                    <h3 className="text-base font-semibold text-slate-200">{a.title}</h3>
                  </div>

                  {isInstructorOrAdmin && (
                    <button 
                      onClick={() => { if (confirm('Delete announcement?')) deleteMutation.mutate(a.id); }}
                      className="text-slate-500 hover:text-red-400 p-1 rounded transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {a.message}
                </p>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-2.5 border-t border-slate-800/60">
                  <span>By {a.createdByName}</span>
                  <div className="flex items-center gap-3">
                    {a.externalLink && (
                      <a 
                        href={a.externalLink} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-medium"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Link</span>
                      </a>
                    )}
                    <span className="font-mono">{new Date(a.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
