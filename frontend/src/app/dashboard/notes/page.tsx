'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
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
  Eye,
  Trash2
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

const ACADEMIC_SUBJECTS = ['English', 'English Grammar', 'Hindi', 'Hindi Grammar', 'Mathematics', 'Science', 'Social Science'];

export default function NotesCoursesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'BATCH' | 'COURSES'>('BATCH');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  const isInstructorOrAdmin = user?.role === 'INSTRUCTOR' || user?.role === 'ADMIN';
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');

  const deleteMutation = useMutation({
    mutationFn: async (noteId: number) => {
      await api.delete(`/instructor/notes/${noteId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batch-notes'] });
      alert('Note deleted successfully!');
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to delete note');
    }
  });

  const handleDeleteNote = (noteId: number) => {
    if (confirm('Are you sure you want to delete this study note?')) {
      deleteMutation.mutate(noteId);
    }
  };

  // 1. Fetch online courses that have notes
  const { data: courses = [], isLoading: isCoursesLoading } = useQuery<CourseWithNotes[]>({
    queryKey: ['courses-with-notes'],
    queryFn: async () => {
      const response = await api.get('/student/notes/courses');
      return response.data.success ? response.data.data : [];
    },
  });

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

  // 2. Fetch batch notes (offline) - dynamically based on user role
  const { data: batchNotes = [], isLoading: isBatchNotesLoading } = useQuery<NoteDTO[]>({
    queryKey: ['batch-notes', isInstructorOrAdmin, selectedBatchId],
    queryFn: async () => {
      if (isInstructorOrAdmin) {
        if (!selectedBatchId) return [];
        const response = await api.get(`/instructor/batches/${selectedBatchId}/notes`);
        return response.data.success ? response.data.data : [];
      } else {
        const response = await api.get('/student/batch/notes');
        return response.data.success ? response.data.data : [];
      }
    },
  });

  const isLoading = isCoursesLoading || isBatchNotesLoading;

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
      <div className="h-[60vh] flex flex-col items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-accent-grape" />
        <p className="mt-4 text-sm text-text-secondary font-medium">Loading notes vault.</p>
      </div>
    );
  }

  // Get dynamic icons based on subject name
  const getSubjectColor = (subject: string) => {
    switch (subject.toLowerCase()) {
      case 'mathematics': return 'from-cyan-500/10 to-blue-500/10 text-cyan-400 border-cyan-500/20';
      case 'science': return 'from-emerald-500/10 to-teal-500/10 text-emerald-400 border-emerald-500/20';
      case 'english': return 'from-accent-grape/10 to-indigo-500/10 text-accent-grape border-accent-grape/20';
      case 'hindi': return 'from-warning/10 to-amber-500/10 text-warning border-warning/20';
      default: return 'from-purple-500/10 to-indigo-500/10 text-purple-450 border-purple-500/20';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 max-w-6xl mx-auto text-foreground"
    >
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">Study Notes Vault</h2>
          <p className="text-xs sm:text-sm text-text-secondary mt-1 leading-relaxed">
            Access chapter-level lecture notes, syllabus guides, and secure watermarked PDF resources.
          </p>
        </div>
        {isInstructorOrAdmin && (
          <Link 
            href="/dashboard/instructor/batches?tab=notes"
            className="btn-premium flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-white transition-all shadow-md cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Manage Batches & Notes
          </Link>
        )}
      </div>

      {/* Tabs Switcher (Only show if student belongs to a batch or is instructor) */}
      {(isInstructorOrAdmin || batchNotes.length > 0) && (
        <div className="flex items-center gap-2 border-b border-border-color pb-px">
          <button
            onClick={() => {
              setActiveTab('BATCH');
              setSelectedSubject(null);
            }}
            className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition-all ${
              activeTab === 'BATCH'
                ? 'border-accent-grape text-accent-grape'
                : 'border-transparent text-text-secondary hover:text-foreground'
            }`}
          >
            Offline Batch Subjects
          </button>
          <button
            onClick={() => {
              setActiveTab('COURSES');
              setSelectedSubject(null);
            }}
            className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition-all ${
              activeTab === 'COURSES'
                ? 'border-accent-grape text-accent-grape'
                : 'border-transparent text-text-secondary hover:text-foreground'
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
            className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-accent-grape hover:text-accent-blue transition-colors cursor-pointer self-start"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Academic Folders
          </button>
        ) : (
          <div className="relative max-w-md w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-text-muted" />
            <input
              type="text"
              placeholder={activeTab === 'BATCH' && !isInstructorOrAdmin ? "Search batch notes..." : "Search course folders..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-premium w-full pl-11 pr-4 py-2.5 rounded-2xl text-sm text-foreground placeholder-text-muted focus:outline-none transition-all"
            />
          </div>
        )}
      </div>

      {/* WORKSPACE VIEW */}
      
      {/* CASE A: Drill-down Subject Notes List */}
      {selectedSubject ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          <h3 className="text-[10px] font-extrabold text-text-muted uppercase tracking-wider">
            {selectedSubject} Notes Archive
          </h3>

          {filteredBatchNotes.length === 0 ? (
            <div className="py-16 text-center glass-card rounded-3xl text-xs text-text-secondary border border-border-color bg-card">
              No notes uploaded yet under this subject.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredBatchNotes.map((note) => (
                <div
                  key={note.id}
                  className="glass-card hover-lift rounded-3xl p-6 flex flex-col justify-between gap-6 bg-card border border-border-color shadow-sm"
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-accent-grape/15 text-accent-grape rounded-xl flex items-center justify-center shrink-0 border border-accent-grape/25">
                        <FileText className="w-4.5 h-4.5" />
                      </div>
                      <h4 className="text-sm font-black text-foreground truncate">
                        {note.title}
                      </h4>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed line-clamp-3">
                      {note.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-4 pt-4 border-t border-border-color mt-2">
                    <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">
                      {note.uploadedByName} • {new Date(note.createdAt).toLocaleDateString()}
                    </span>

                    <div className="flex items-center gap-2">
                      {user?.role === 'ADMIN' && (
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="flex items-center justify-center p-2 text-error hover:text-error bg-error/10 hover:bg-error/20 border border-error/20 rounded-xl transition-all cursor-pointer shadow-sm"
                          title="Delete Note"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <Link
                        href={`/dashboard/notes/view/${note.id}`}
                        className="flex items-center gap-1.5 px-4 py-2 bg-muted/50 hover:bg-gradient-to-r hover:from-accent-grape hover:to-primary-blue border border-border-color hover:border-accent-grape text-text-secondary hover:text-white rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View Secure PDF
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      ) : activeTab === 'BATCH' ? (
        
        /* CASE B: Batch Academic Subjects folders grid */
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h3 className="text-[10px] font-extrabold text-text-muted uppercase tracking-wider">
              Academic Subject Vaults
            </h3>
            {isInstructorOrAdmin && batches.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-secondary font-medium">Select Batch:</span>
                <select
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                  className="input-premium rounded-xl px-3 py-1.5 text-xs text-foreground focus:outline-none transition-all cursor-pointer"
                >
                  {batches.map(b => (
                    <option key={b.id} value={b.id} className="bg-card text-foreground">
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {ACADEMIC_SUBJECTS.map((subject) => {
              const noteCount = getSubjectNoteCount(subject);
              const colorClass = getSubjectColor(subject);
              
              return (
                <button
                  key={subject}
                  onClick={() => setSelectedSubject(subject)}
                  className="group text-left flex items-start gap-4 p-5 glass-card hover-lift rounded-3xl border border-border-color hover:border-accent-grape/50 transition-all cursor-pointer select-none bg-card shadow-sm"
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-gradient-to-br border ${colorClass} group-hover:scale-105 transition-transform`}>
                    <Folder className="w-5 h-5 fill-current opacity-70" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <h3 className="text-sm font-bold text-foreground group-hover:text-accent-grape transition-colors truncate">
                      {subject}
                    </h3>
                    <p className="text-xs text-text-muted font-bold uppercase tracking-wider">
                      {noteCount} Study Guides
                    </p>
                    
                    <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-accent-grape pt-3 opacity-0 group-hover:opacity-100 transition-all">
                      Open Subject
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>
      ) : (
        
        /* CASE C: Explore Course folders grid (Default online view) */
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          <h3 className="text-[10px] font-extrabold text-text-muted uppercase tracking-wider">
            Explore Course Notes
          </h3>

          {filteredCourses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <Link
                  key={course.id}
                  href={`/dashboard/notes/course/${course.id}`}
                  className="group flex items-start gap-4 p-5 glass-card hover-lift rounded-3xl border border-border-color hover:border-accent-grape/50 transition-all cursor-pointer select-none bg-card shadow-sm"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-accent-grape/10 to-primary-blue/10 text-accent-grape border border-accent-grape/20 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Folder className="w-5 h-5 fill-current opacity-70" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <h3 className="text-sm font-bold text-foreground group-hover:text-accent-grape transition-colors truncate">
                      {course.title}
                    </h3>
                    <p className="text-xs text-text-muted font-bold uppercase tracking-wider">
                      {course.noteCount} PDF Files
                    </p>
                    
                    <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-accent-grape pt-3 opacity-0 group-hover:opacity-100 transition-all">
                      Open Folder
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 glass-card rounded-3xl text-center border border-border-color bg-card">
              <BookOpen className="w-12 h-12 text-text-muted mb-4 opacity-70" />
              <h4 className="text-sm font-bold text-foreground">No course note folders found.</h4>
              <p className="text-xs text-text-secondary max-w-xs mt-1.5 font-medium leading-relaxed">
                {searchQuery ? 'No folders match your search query.' : 'Once you enroll in courses that have notes, they will appear here.'}
              </p>
            </div>
          )}
        </motion.div>
      )}

    </motion.div>
  );
}
