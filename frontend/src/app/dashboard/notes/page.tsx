'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { 
  Folder, 
  Search, 
  Loader2, 
  BookOpen, 
  Plus, 
  FileText, 
  ArrowRight, 
  ChevronLeft,
  Calendar,
  Eye
} from 'lucide-react';

interface CourseWithNotes {
  id: number;
  title: string;
  thumbnail: string;
  noteCount: number;
}

interface NoteDTO {
  id: number;
  title: string;
  description: string;
  batchId: number;
  batchName: string;
  subjectName: string;
  fileUrl: string;
  uploadedByName: string;
  createdAt: string;
}

const ACADEMIC_SUBJECTS = ['English', 'Hindi', 'Mathematics', 'Science', 'Social Science'];

export default function NotesCoursesPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'BATCH' | 'COURSES'>('BATCH');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  // 1. Fetch online courses that have notes
  const { data: courses = [], isLoading: isCoursesLoading } = useQuery<CourseWithNotes[]>({
    queryKey: ['courses-with-notes'],
    queryFn: async () => {
      const response = await api.get('/student/notes/courses');
      return response.data.success ? response.data.data : [];
    },
  });

  // 2. Fetch student's batch notes (offline)
  const { data: batchNotes = [], isLoading: isBatchNotesLoading } = useQuery<NoteDTO[]>({
    queryKey: ['student-batch-notes'],
    queryFn: async () => {
      const response = await api.get('/student/batch/notes');
      return response.data.success ? response.data.data : [];
    },
  });

  const isLoading = isCoursesLoading || isBatchNotesLoading;
  const isInstructorOrAdmin = user?.role === 'INSTRUCTOR' || user?.role === 'ADMIN';

  // Filter courses
  const filteredCourses = courses.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Count batch notes per subject
  const getSubjectNoteCount = (subject: string) => {
    return batchNotes.filter(n => n.subjectName.toLowerCase() === subject.toLowerCase()).length;
  };

  // Filter batch notes by selected subject and search
  const filteredBatchNotes = batchNotes.filter(note => {
    const matchesSubject = selectedSubject ? note.subjectName.toLowerCase() === selectedSubject.toLowerCase() : true;
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          note.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSubject && matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
        <p className="mt-3 text-sm text-slate-400 font-medium">Loading notes vault...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Study Notes Vault</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Access chapter-level lecture notes, guides, and secure PDF resources.
          </p>
        </div>
        {isInstructorOrAdmin && (
          <Link 
            href="/dashboard/instructor/batches"
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-indigo-650/10 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            Manage Batches & Notes
          </Link>
        )}
      </div>

      {/* Tabs Switcher (Only show if student belongs to a batch or is instructor) */}
      {(!isInstructorOrAdmin && batchNotes.length > 0) && (
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-850 pb-px">
          <button
            onClick={() => {
              setActiveTab('BATCH');
              setSelectedSubject(null);
            }}
            className={`px-4 py-2.5 text-xs font-extrabold border-b-2 cursor-pointer transition-all ${
              activeTab === 'BATCH'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-450 hover:text-slate-750 dark:hover:text-slate-305'
            }`}
          >
            Offline Batch Subjects
          </button>
          <button
            onClick={() => {
              setActiveTab('COURSES');
              setSelectedSubject(null);
            }}
            className={`px-4 py-2.5 text-xs font-extrabold border-b-2 cursor-pointer transition-all ${
              activeTab === 'COURSES'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-450 hover:text-slate-750 dark:hover:text-slate-305'
            }`}
          >
            Explore Courses
          </button>
        </div>
      )}

      {/* Search and Back button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {selectedSubject ? (
          <button
            onClick={() => setSelectedSubject(null)}
            className="flex items-center gap-1 text-xs font-extrabold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer self-start"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Academic Folders
          </button>
        ) : (
          <div className="relative max-w-md w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder={activeTab === 'BATCH' && !isInstructorOrAdmin ? "Search batch notes..." : "Search course folders..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>
        )}
      </div>

      {/* WORKSPACE VIEW */}
      
      {/* CASE A: Drill-down Subject Notes List */}
      {selectedSubject ? (
        <div className="space-y-4 animate-in fade-in duration-200">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
            {selectedSubject} Notes Archive
          </h3>

          {filteredBatchNotes.length === 0 ? (
            <div className="py-16 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-3xl text-xs text-slate-400">
              No notes uploaded yet under this subject.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredBatchNotes.map((note) => (
                <div
                  key={note.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between gap-4 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4.5 h-4.5 text-indigo-500 shrink-0" />
                      <h4 className="text-sm font-black text-slate-900 dark:text-white truncate">
                        {note.title}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3">
                      {note.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-4 pt-3 border-t border-slate-50 dark:border-slate-800/60 mt-1">
                    <span className="text-[10px] text-slate-400 font-semibold">
                      Uploaded by {note.uploadedByName} • {new Date(note.createdAt).toLocaleDateString()}
                    </span>

                    <Link
                      href={`/dashboard/notes/view/${note.id}`}
                      className="flex items-center gap-1 px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/60 border border-indigo-100/20 text-indigo-700 dark:text-indigo-400 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Secure PDF
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : activeTab === 'BATCH' && !isInstructorOrAdmin ? (
        
        /* CASE B: Batch Academic Subjects folders grid */
        <div className="space-y-4 animate-in fade-in duration-200">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
            Academic Subject Vaults
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {ACADEMIC_SUBJECTS.map((subject) => {
              const noteCount = getSubjectNoteCount(subject);
              return (
                <button
                  key={subject}
                  onClick={() => setSelectedSubject(subject)}
                  className="group text-left flex items-start gap-4 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl hover:border-indigo-500 dark:hover:border-indigo-500/80 hover:shadow-lg dark:hover:shadow-slate-950/20 transition-all cursor-pointer select-none"
                >
                  <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Folder className="w-6 h-6 fill-indigo-100 dark:fill-indigo-900/30" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-450 transition-colors truncate">
                      {subject}
                    </h3>
                    <p className="text-xs text-slate-450 dark:text-slate-500 font-medium">
                      {noteCount} Study guides
                    </p>
                    
                    <div className="flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      Open Subject
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        
        /* CASE C: Explore Course folders grid (Default online view) */
        <div className="space-y-4 animate-in fade-in duration-200">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
            Explore Course Notes
          </h3>

          {filteredCourses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <Link
                  key={course.id}
                  href={`/dashboard/notes/course/${course.id}`}
                  className="group flex items-start gap-4 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl hover:border-indigo-500 dark:hover:border-indigo-500/80 hover:shadow-lg dark:hover:shadow-slate-950/20 transition-all cursor-pointer select-none"
                >
                  <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Folder className="w-6 h-6 fill-indigo-100 dark:fill-indigo-900/30" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-450 transition-colors truncate">
                      {course.title}
                    </h3>
                    <p className="text-xs text-slate-450 dark:text-slate-500 font-medium">
                      {course.noteCount} PDF files
                    </p>
                    
                    <div className="flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      Open Folder
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-855 rounded-3xl text-center">
              <BookOpen className="w-12 h-12 text-slate-355 dark:text-slate-600 mb-3" />
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-300">No course note folders found</h4>
              <p className="text-xs text-slate-450 dark:text-slate-500 max-w-xs mt-1 font-medium">
                {searchQuery ? 'No folders match your search query.' : 'Once you enroll in courses that have notes, they will appear here.'}
              </p>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
