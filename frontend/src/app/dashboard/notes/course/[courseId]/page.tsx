'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { FileText, ArrowLeft, Loader2, Calendar, User, Eye, Search } from 'lucide-react';

interface NoteDTO {
  id: number;
  title: string;
  description: string;
  courseId: number;
  courseTitle: string;
  lessonId: number | null;
  lessonTitle: string | null;
  fileUrl: string;
  uploadedByName: string;
  createdAt: string;
}

export default function CourseNotesPage() {
  const { courseId } = useParams();
  const router = useRouter();
  const [search, setSearch] = useState('');

  // Fetch notes for this course
  const { data: notes, isLoading, error } = useQuery<NoteDTO[]>({
    queryKey: ['course-notes', courseId],
    queryFn: async () => {
      const response = await api.get(`/student/notes/course/${courseId}`);
      return response.data.success ? response.data.data : [];
    },
  });

  const filteredNotes = notes?.filter(note => 
    note.title.toLowerCase().includes(search.toLowerCase()) ||
    (note.lessonTitle && note.lessonTitle.toLowerCase().includes(search.toLowerCase()))
  ) || [];

  const courseTitle = notes && notes.length > 0 ? notes[0].courseTitle : 'Course Folders';

  if (isLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
        <p className="mt-3 text-sm text-slate-400 font-medium">Opening secure folder...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <button 
            onClick={() => router.push('/dashboard/notes')}
            className="flex items-center gap-2 text-xs font-bold text-slate-450 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Folders
          </button>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {courseTitle}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Lecture notes and PDF study guides available in this classroom.
          </p>
        </div>
      </div>

      {/* Search notes */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-405" />
        <input
          type="text"
          placeholder="Search by title or chapter..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
        />
      </div>

      {/* Notes Grid */}
      {filteredNotes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className="group flex flex-col justify-between p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/75 rounded-3xl hover:border-indigo-500/50 hover:shadow-lg dark:hover:shadow-slate-950/15 transition-all"
            >
              <div className="space-y-3">
                {/* File Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100/25 dark:border-indigo-900/10 rounded-xl flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-250 group-hover:text-indigo-600 dark:group-hover:text-indigo-450 transition-colors truncate">
                        {note.title}
                      </h3>
                      {note.lessonTitle && (
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/60 px-2 py-0.5 rounded-full font-semibold mt-1 inline-block">
                          {note.lessonTitle}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                  {note.description || 'No description provided.'}
                </p>
              </div>

              {/* Card Footer */}
              <div className="border-t border-slate-100 dark:border-slate-800/60 my-4" />

              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-col text-[10px] text-slate-450 dark:text-slate-500 font-medium">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                    By {note.uploadedByName}
                  </span>
                  <span className="flex items-center gap-1 mt-0.5">
                    <Calendar className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                    {new Date(note.createdAt).toLocaleDateString()}
                  </span>
                </div>
                
                <Link
                  href={`/dashboard/notes/view/${note.id}`}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-650 dark:text-indigo-400 hover:text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  View Note
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-3xl text-center">
          <FileText className="w-12 h-12 text-slate-355 dark:text-slate-600 mb-3" />
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-300">No note files found</h4>
          <p className="text-xs text-slate-450 dark:text-slate-500 max-w-xs mt-1">
            {search ? 'No files match your search criteria.' : 'There are no notes uploaded for this course yet.'}
          </p>
        </div>
      )}
    </div>
  );
}
