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
  Calendar, 
  User, 
  ExternalLink, 
  Instagram, 
  Trash2,
  X,
  Sparkles,
  BookOpen,
  Send
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
  const [posting, setPosting] = useState(false);

  // Fetch Announcements
  const { data: announcements, isLoading } = useQuery<AnnouncementDTO[]>({
    queryKey: ['announcements'],
    queryFn: async () => {
      const response = await api.get('/announcements');
      return response.data.success ? response.data.data : [];
    }
  });

  // Create Announcement Mutation
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
      alert('Announcement posted successfully!');
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to post announcement.');
    },
    onSettled: () => setPosting(false)
  });

  // Delete Announcement Mutation
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
    createMutation.mutate({
      title: titleInput,
      message: messageInput,
      targetRole: targetRoleInput,
      pinned: pinnedInput,
      instagramUrl: instagramInput || null,
      externalLink: externalInput || null,
      imageUrl: imageInput || null
    });
  };

  const isInstructorOrAdmin = user?.role === 'INSTRUCTOR' || user?.role === 'ADMIN';

  if (isLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
        <p className="mt-3 text-sm text-slate-400 font-medium">Checking notice board...</p>
      </div>
    );
  }

  // Separate pinned vs standard
  const pinnedAnnouncements = announcements?.filter(a => a.pinned) || [];
  const standardAnnouncements = announcements?.filter(a => !a.pinned) || [];

  return (
    <div className="space-y-6 max-w-4xl mx-auto relative">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Announcement Board</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Stay updated with the latest campus notifications, events, and course announcements.
          </p>
        </div>
        {isInstructorOrAdmin && (
          <button 
            onClick={() => setFormOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-indigo-650/10 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            Create Announcement
          </button>
        )}
      </div>

      {/* Creation Modal / Panel */}
      {formOpen && (
        <div className="bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 animate-in fade-in zoom-in duration-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-indigo-500" />
              Create New Announcement
            </h3>
            <button 
              onClick={() => setFormOpen(false)}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5 col-span-2">
              <label className="text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Title *</label>
              <input 
                type="text" 
                placeholder="Enter announcement title" 
                value={titleInput} 
                onChange={(e) => setTitleInput(e.target.value)}
                className="px-4 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex flex-col gap-1.5 col-span-2">
              <label className="text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Message *</label>
              <textarea 
                rows={3}
                placeholder="Write your announcement details here..." 
                value={messageInput} 
                onChange={(e) => setMessageInput(e.target.value)}
                className="px-4 py-2 bg-slate-50 dark:bg-slate-855 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Target Role</label>
              <select
                value={targetRoleInput}
                onChange={(e) => setTargetRoleInput(e.target.value as any)}
                className="px-4 py-2 bg-slate-50 dark:bg-slate-855 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">Everyone</option>
                <option value="STUDENT">Students Only</option>
                <option value="INSTRUCTOR">Instructors Only</option>
              </select>
            </div>

            <div className="flex items-center gap-2 mt-6">
              <input 
                type="checkbox" 
                id="pinned"
                checked={pinnedInput} 
                onChange={(e) => setPinnedInput(e.target.checked)}
                className="w-4 h-4 text-indigo-600 border-slate-300 dark:border-slate-800 rounded focus:ring-indigo-500"
              />
              <label htmlFor="pinned" className="text-xs font-bold text-slate-650 dark:text-slate-300 uppercase cursor-pointer select-none">
                Pin to top
              </label>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Instagram URL (Optional)</label>
              <input 
                type="text" 
                placeholder="https://instagram.com/p/..." 
                value={instagramInput} 
                onChange={(e) => setInstagramInput(e.target.value)}
                className="px-4 py-2 bg-slate-50 dark:bg-slate-855 border border-slate-200 dark:border-slate-805 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">External Link (Optional)</label>
              <input 
                type="text" 
                placeholder="https://example.com/learn-more" 
                value={externalInput} 
                onChange={(e) => setExternalInput(e.target.value)}
                className="px-4 py-2 bg-slate-50 dark:bg-slate-855 border border-slate-200 dark:border-slate-805 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              onClick={() => setFormOpen(false)}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handlePost}
              disabled={posting}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-indigo-650/10 cursor-pointer flex items-center gap-1.5"
            >
              {posting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Publish Notice
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Pinned Section */}
      {pinnedAnnouncements.length > 0 && (
        <div className="space-y-3.5">
          <h3 className="text-xs font-bold text-indigo-500 uppercase tracking-wider flex items-center gap-1.5">
            <Pin className="w-4 h-4 rotate-45 shrink-0" />
            Important / Pinned Notices
          </h3>

          <div className="grid grid-cols-1 gap-5">
            {pinnedAnnouncements.map((a) => (
              <div 
                key={a.id}
                className="relative bg-gradient-to-br from-indigo-500/10 via-indigo-600/[0.03] to-slate-900 border-2 border-indigo-500/35 rounded-3xl p-6 shadow-md space-y-4 animate-in fade-in duration-200"
              >
                {/* Notice Body */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="text-base font-extrabold text-white leading-snug">{a.title}</h4>
                    {isInstructorOrAdmin && (
                      <button 
                        onClick={() => { if (confirm('Delete announcement?')) deleteMutation.mutate(a.id); }}
                        className="p-1.5 bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/20 hover:border-red-600 rounded-lg transition-all cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">{a.message}</p>
                </div>

                {/* Footer and Links */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-t border-indigo-500/20 pt-4 gap-3 text-xs">
                  <div className="flex flex-wrap items-center gap-3 text-slate-450">
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4 text-indigo-400" />
                      {a.createdByName}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-indigo-400" />
                      {new Date(a.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {a.instagramUrl && (
                      <a 
                        href={a.instagramUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-650 to-pink-650 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl font-bold"
                      >
                        <Instagram className="w-4 h-4" />
                        Instagram Post
                      </a>
                    )}
                    {a.externalLink && (
                      <a 
                        href={a.externalLink} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Learn More
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Standard Notices */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">
          All Announcements ({standardAnnouncements.length})
        </h3>

        {standardAnnouncements.length > 0 ? (
          <div className="grid grid-cols-1 gap-5">
            {standardAnnouncements.map((a) => (
              <div 
                key={a.id}
                className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800/75 rounded-3xl p-6 shadow-sm space-y-4 transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="text-base font-bold text-slate-850 dark:text-white leading-snug">{a.title}</h4>
                    {isInstructorOrAdmin && (
                      <button 
                        onClick={() => { if (confirm('Delete announcement?')) deleteMutation.mutate(a.id); }}
                        className="p-1.5 bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/20 hover:border-red-600 rounded-lg transition-all cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">{a.message}</p>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-t border-slate-100 dark:border-slate-800/60 pt-4 gap-3 text-[11px] sm:text-xs">
                  <div className="flex flex-wrap items-center gap-3 text-slate-450 dark:text-slate-500">
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4 text-indigo-500/70" />
                      {a.createdByName}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-indigo-500/70" />
                      {new Date(a.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {a.instagramUrl && (
                      <a 
                        href={a.instagramUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 text-purple-650 dark:text-purple-400 hover:text-white hover:bg-gradient-to-r hover:from-purple-600 hover:to-pink-600 rounded-xl font-bold transition-all"
                      >
                        <Instagram className="w-4 h-4" />
                        Instagram Post
                      </a>
                    )}
                    {a.externalLink && (
                      <a 
                        href={a.externalLink} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-650 dark:text-indigo-400 hover:text-white border border-indigo-500/20 rounded-xl font-bold transition-all"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Learn More
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          pinnedAnnouncements.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-850 rounded-3xl text-center">
              <Megaphone className="w-12 h-12 text-slate-350 dark:text-slate-650 mb-3" />
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-300">No announcements posted</h4>
              <p className="text-xs text-slate-455 dark:text-slate-500 max-w-xs mt-1">
                Stay tuned! Updates will be published on this board as they arise.
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
