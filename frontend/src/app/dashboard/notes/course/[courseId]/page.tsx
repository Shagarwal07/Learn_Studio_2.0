'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
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
      <div className="h-[60vh] flex flex-col items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-accent-grape" />
        <p className="mt-4 text-sm text-text-secondary font-medium">Opening secure folder.</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 max-w-6xl mx-auto text-foreground"
    >
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <button 
            onClick={() => router.push('/dashboard/notes')}
            className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-text-muted hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Folders
          </button>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
            {courseTitle}
          </h2>
          <p className="text-xs sm:text-sm text-text-secondary">
            Lecture notes and PDF study guides available in this classroom.
          </p>
        </div>
      </div>

      {/* Search notes */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-text-muted" />
        <input
          type="text"
          placeholder="Search by title or chapter."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-2.5 bg-white/5 border border-border-color rounded-2xl text-sm text-white placeholder-text-muted focus:outline-none focus:border-accent-grape focus:ring-1 focus:ring-accent-grape transition-all"
        />
      </div>

      {/* Notes Grid */}
      {filteredNotes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredNotes.map((note, index) => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group flex flex-col justify-between p-6 glass-card hover-lift rounded-3xl"
            >
              <div className="space-y-4">
                {/* File Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 bg-accent-grape/15 text-accent-grape border border-accent-grape/25 rounded-xl flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-black text-white group-hover:text-accent-grape transition-colors truncate leading-tight">
                        {note.title}
                      </h3>
                      {note.lessonTitle && (
                        <span className="text-[9px] bg-white/5 text-text-secondary border border-border-color px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider mt-1.5 inline-block">
                          {note.lessonTitle}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">
                  {note.description || 'No description provided.'}
                </p>
              </div>

              {/* Card Footer */}
              <div className="border-t border-border-color my-4" />

              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-col text-[10px] text-text-muted font-bold uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 shrink-0" />
                    By {note.uploadedByName}
                  </span>
                  <span className="flex items-center gap-1.5 mt-1">
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    {new Date(note.createdAt).toLocaleDateString()}
                  </span>
                </div>
                
                <Link
                  href={`/dashboard/notes/view/${note.id}`}
                  className="flex items-center gap-1.5 px-4.5 py-2 bg-gradient-to-r from-accent-grape to-primary-blue hover:from-accent-grape/90 hover:to-primary-blue/90 text-white rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all shadow-md shadow-accent-grape/15 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  View Note
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 glass-card rounded-3xl text-center border border-border-color">
          <FileText className="w-12 h-12 text-text-muted mb-3 opacity-70" />
          <h4 className="text-sm font-bold text-white">No note files found.</h4>
          <p className="text-xs text-text-secondary max-w-xs mt-1.5 leading-relaxed">
            {search ? 'No files match your search criteria.' : 'There are no notes uploaded for this course yet.'}
          </p>
        </div>
      )}
    </motion.div>
  );
}
