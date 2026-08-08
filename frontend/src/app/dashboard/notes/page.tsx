'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { 
  Folder, 
  FileText, 
  Search, 
  Loader2, 
  Calendar, 
  Download, 
  ExternalLink,
  ChevronLeft,
  BookOpen,
  ArrowUpRight,
  Plus
} from 'lucide-react';
import Link from 'next/link';

interface BatchNoteDTO {
  id: number;
  title: string;
  description?: string;
  subjectName: string;
  fileUrl: string;
  originalFileName?: string;
  fileType?: string;
  uploadedByName: string;
  createdAt: string;
  batchId?: number;
  batchName?: string;
}

interface CourseDTO {
  id: number;
  title: string;
  description: string;
  notesCount?: number;
}

const ACADEMIC_SUBJECTS = [
  'English', 
  'English Grammar', 
  'Hindi', 
  'Hindi Grammar', 
  'Sanskrit',
  'Sanskrit Grammar',
  'Mathematics', 
  'Science', 
  'Social Science'
];

export default function NotesPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'BATCH' | 'COURSES'>('BATCH');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  
  const isInstructorOrAdmin = user?.role === 'INSTRUCTOR' || user?.role === 'ADMIN';

  // Fetch all batches if instructor/admin
  const { data: batches = [] } = useQuery<any[]>({
    queryKey: ['admin-notes-batches-list'],
    enabled: isInstructorOrAdmin,
    queryFn: async () => {
      const response = await api.get('/instructor/batches');
      return response.data.success ? response.data.data : [];
    }
  });

  React.useEffect(() => {
    if (isInstructorOrAdmin && batches.length > 0 && !selectedBatchId) {
      setSelectedBatchId(String(batches[0].id));
    }
  }, [batches, isInstructorOrAdmin, selectedBatchId]);

  // 1. Fetch academic batch notes
  const { data: batchNotes = [], isLoading: isBatchNotesLoading } = useQuery<BatchNoteDTO[]>({
    queryKey: ['batch-notes'],
    queryFn: async () => {
      const response = await api.get('/student/batch/notes');
      return response.data.success ? response.data.data : [];
    },
    staleTime: 1000 * 60 * 5
  });

  // 2. Fetch courses with notes
  const { data: courses = [], isLoading: isCoursesLoading } = useQuery<CourseDTO[]>({
    queryKey: ['courses-with-notes'],
    queryFn: async () => {
      const response = await api.get('/student/notes/courses');
      return response.data.success ? response.data.data : [];
    },
    staleTime: 1000 * 60 * 5
  });

  const isLoading = isBatchNotesLoading || isCoursesLoading;

  // Filter notes for selected subject & search query
  const filteredNotes = batchNotes.filter((note) => {
    const matchesSubject = selectedSubject 
      ? note.subjectName.toLowerCase() === selectedSubject.toLowerCase() 
      : true;
    const matchesSearch = note.title.toLowerCase().includes(search.toLowerCase()) || 
                          (note.description && note.description.toLowerCase().includes(search.toLowerCase()));
    
    // Admin/Instructors see all notes, so filter by selected batch
    const matchesBatch = isInstructorOrAdmin && selectedBatchId
      ? note.batchId === Number(selectedBatchId)
      : true;
      
    return matchesSubject && matchesSearch && matchesBatch;
  });

  // Filter courses by search query
  const filteredCourses = courses.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  const getSubjectNoteCount = (subject: string) => {
    return batchNotes.filter(n => 
      n.subjectName.toLowerCase() === subject.toLowerCase() &&
      (!isInstructorOrAdmin || !selectedBatchId || n.batchId === Number(selectedBatchId))
    ).length;
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
        <p className="text-sm font-medium text-slate-500">Loading study materials...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 text-slate-100 pb-16 px-2 sm:px-4 pt-2">
      
      {/* Clean Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">Study Notes & Reference Vault</h1>
          <p className="text-sm text-slate-400 mt-1">
            Access chapter notes, revision guides, and lecture PDFs across your academic subjects and enrolled courses.
          </p>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          {isInstructorOrAdmin && batches.length > 0 && (
            <select
              value={selectedBatchId}
              onChange={(e) => {
                setSelectedBatchId(e.target.value);
                setSelectedSubject(null);
              }}
              className="w-full sm:w-48 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
            >
              <option value="" disabled>Select Batch</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          )}

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search notes or topics..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-600 transition-colors"
            />
          </div>

          {isInstructorOrAdmin && (
            <Link 
              href="/dashboard/instructor/batches?tab=notes"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 shadow-sm"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Upload Note</span>
            </Link>
          )}
        </div>
      </div>

      {/* VIEW 1: SELECTED SUBJECT NOTES LIST */}
      {selectedSubject ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSelectedSubject(null)}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg text-xs font-medium transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Subjects</span>
            </button>

            <span className="text-sm font-semibold text-slate-300">
              {selectedSubject} ({filteredNotes.length} item{filteredNotes.length !== 1 ? 's' : ''})
            </span>
          </div>

          {filteredNotes.length === 0 ? (
            <div className="py-16 text-center bg-slate-900/40 border border-slate-800/60 rounded-2xl text-slate-400 space-y-2">
              <FileText className="w-8 h-8 text-slate-600 mx-auto stroke-1" />
              <p className="text-sm font-medium text-slate-300">No study notes uploaded for {selectedSubject} yet.</p>
              <p className="text-xs text-slate-500">When instructors publish materials for this subject, they will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredNotes.map((note) => (
                <div 
                  key={note.id}
                  className="p-5 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl transition-all duration-150 flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center shrink-0 text-slate-300">
                          <FileText className="w-5 h-5 stroke-[1.5]" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-semibold text-slate-200 truncate">{note.title}</h4>
                          <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                            <span>By {note.uploadedByName}</span>
                            <span>•</span>
                            <span>{formatDate(note.createdAt)}</span>
                          </p>
                        </div>
                      </div>

                      <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-400 shrink-0">
                        PDF
                      </span>
                    </div>

                    {note.description && (
                      <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                        {note.description}
                      </p>
                    )}
                  </div>

                  {/* Minimal Essential Actions */}
                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800/80">
                    <a
                      href={note.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors shadow-sm"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open Document</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (

        /* VIEW 2: FOLDER GRID OVERVIEW */
        <div className="space-y-6">

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <button
              onClick={() => setActiveTab('BATCH')}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'BATCH'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              Offline Batch Notes
            </button>
            <button
              onClick={() => setActiveTab('COURSES')}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'COURSES'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              Course Notes
            </button>
          </div>
          
          {/* Section A: Academic Subjects */}
          {activeTab === 'BATCH' && (
            <div className="space-y-4 pt-2">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Academic Subjects ({ACADEMIC_SUBJECTS.length})
              </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {ACADEMIC_SUBJECTS.map((subject) => {
                const count = getSubjectNoteCount(subject);
                
                return (
                  <div
                    key={subject}
                    onClick={() => setSelectedSubject(subject)}
                    className="p-5 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl cursor-pointer transition-all duration-150 flex items-center justify-between group select-none"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700/50 flex items-center justify-center text-slate-300 shrink-0 group-hover:text-white transition-colors">
                        <Folder className="w-5 h-5 stroke-[1.5]" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors truncate">
                          {subject}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5 font-mono">
                          {count} document{count !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>

                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 group-hover:text-slate-300 group-hover:bg-slate-800 transition-all">
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                  </div>
                );
              })}
              </div>
            </div>
          )}

          {/* Section B: Enrolled Course Notes */}
          {activeTab === 'COURSES' && (
            <div className="space-y-4 pt-2">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Course Study Vaults ({filteredCourses.length})
              </h2>

            {filteredCourses.length === 0 ? (
              <div className="py-12 text-center bg-slate-900/40 border border-slate-800/60 rounded-2xl text-slate-400 text-xs">
                {search ? 'No courses match your search term.' : 'You have no separate online courses with uploaded materials right now.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCourses.map((course) => (
                  <Link
                    key={course.id}
                    href={`/dashboard/notes/course/${course.id}`}
                    className="p-5 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl transition-all duration-150 flex items-center justify-between group select-none"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700/50 flex items-center justify-center text-indigo-400 shrink-0">
                        <BookOpen className="w-5 h-5 stroke-[1.5]" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors truncate">
                          {course.title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5 font-mono">
                          {course.notesCount !== undefined ? `${course.notesCount} items` : 'Open folder'}
                        </p>
                      </div>
                    </div>

                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 group-hover:text-slate-300 group-hover:bg-slate-800 transition-all">
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
            </div>
          )}

        </div>
      )}

    </div>
  );
}
