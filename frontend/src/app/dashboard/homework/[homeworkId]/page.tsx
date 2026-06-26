'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { 
  ArrowLeft, 
  Download, 
  Upload, 
  Calendar, 
  ClipboardList, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Clock,
  User,
  GraduationCap,
  MessageSquare,
  X
} from 'lucide-react';

interface HomeworkDTO {
  id: number;
  title: string;
  description: string;
  courseId: number;
  courseTitle: string;
  dueDate: string;
  fileUrl: string;
  createdByName: string;
}

interface SubmissionDTO {
  id: number;
  homeworkId: number;
  submissionFileUrl: string;
  submittedAt: string;
  status: 'SUBMITTED' | 'LATE' | 'REVIEWED';
  feedback: string | null;
  marks: number | null;
  studentName: string;
  studentEmail: string;
}

export default function HomeworkDetailPage() {
  const { homeworkId } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [reviewingSubId, setReviewingSubId] = useState<number | null>(null);
  const [marksInput, setMarksInput] = useState('');
  const [feedbackInput, setFeedbackInput] = useState('');
  const [gradingLoading, setGradingLoading] = useState(false);

  // 1. Fetch homework details
  const { data: homework, isLoading: hwLoading } = useQuery<HomeworkDTO>({
    queryKey: ['homework-detail', homeworkId],
    queryFn: async () => {
      const response = await api.get(`/student/homework/${homeworkId}`);
      return response.data.success ? response.data.data : null;
    }
  });

  // 2. Fetch student's submission (for student role)
  const { data: submission, isLoading: subLoading } = useQuery<SubmissionDTO | null>({
    queryKey: ['student-submission', homeworkId],
    enabled: user?.role === 'STUDENT',
    queryFn: async () => {
      const response = await api.get(`/student/homework/${homeworkId}/submission`);
      return response.data.success ? response.data.data : null;
    }
  });

  // 3. Fetch all submissions (for instructor/admin role)
  const { data: allSubmissions, isLoading: allSubsLoading } = useQuery<SubmissionDTO[]>({
    queryKey: ['all-submissions', homeworkId],
    enabled: user?.role === 'INSTRUCTOR' || user?.role === 'ADMIN',
    queryFn: async () => {
      const response = await api.get(`/instructor/homework/${homeworkId}/submissions`);
      return response.data.success ? response.data.data : [];
    }
  });

  // 4. Submit homework mutation
  const submitMutation = useMutation({
    mutationFn: async (fileToUpload: File) => {
      const formData = new FormData();
      formData.append('file', fileToUpload);
      const response = await api.post(`/student/homework/${homeworkId}/submit`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    },
    onMutate: () => setUploading(true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-submission', homeworkId] });
      setFile(null);
      alert('Homework submitted successfully!');
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to submit homework.');
    },
    onSettled: () => setUploading(false)
  });

  // 5. Grade submission mutation
  const gradeMutation = useMutation({
    mutationFn: async ({ subId, marks, feedback }: { subId: number, marks: number, feedback: string }) => {
      const response = await api.patch(`/instructor/homework/submissions/${subId}/review`, {
        marks,
        feedback
      });
      return response.data;
    },
    onMutate: () => setGradingLoading(true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-submissions', homeworkId] });
      setReviewingSubId(null);
      setMarksInput('');
      setFeedbackInput('');
      alert('Submission graded successfully!');
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to grade submission.');
    },
    onSettled: () => setGradingLoading(false)
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.type !== 'application/pdf') {
        alert('Only PDF files are allowed for homework submissions.');
        return;
      }
      setFile(selected);
    }
  };

  const handleUploadSubmit = () => {
    if (file) {
      submitMutation.mutate(file);
    }
  };

  const handleGradeSubmit = (subId: number) => {
    const marks = parseFloat(marksInput);
    if (isNaN(marks)) {
      alert('Please enter a valid number for marks.');
      return;
    }
    gradeMutation.mutate({ subId, marks, feedback: feedbackInput });
  };

  if (hwLoading) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center bg-slate-950 text-white">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
        <p className="mt-4 text-slate-400 font-medium text-sm">Loading assignment vault...</p>
      </div>
    );
  }

  if (!homework) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-center p-6 bg-slate-950 text-white">
        <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
        <p className="text-red-400 font-semibold text-lg">Homework not found or unauthorized access.</p>
        <button 
          onClick={() => router.push('/dashboard/homework')}
          className="mt-4 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-semibold transition-all cursor-pointer"
        >
          Back to list
        </button>
      </div>
    );
  }

  const isStudent = user?.role === 'STUDENT';
  const isOverdue = new Date() > new Date(homework.dueDate);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="space-y-1">
        <button 
          onClick={() => router.push(`/dashboard/homework/course/${homework.courseId}`)}
          className="flex items-center gap-2 text-xs font-bold text-slate-450 hover:text-slate-900 dark:hover:text-slate-205 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Course Assignments
        </button>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-indigo-500 shrink-0" />
          {homework.title}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Course: <strong className="text-slate-700 dark:text-slate-300">{homework.courseTitle}</strong>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Side: Info & Task Description */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Card: Description */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-5">
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Assignment Description</h3>
              <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed mt-2 whitespace-pre-line">
                {homework.description || 'No instruction details provided.'}
              </p>
            </div>

            <div className="border-t border-slate-150 dark:border-slate-800/60 pt-4 flex items-center justify-between gap-4">
              <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                Published by: <strong className="text-slate-605 dark:text-slate-350">{homework.createdByName}</strong>
              </span>
              
              <a
                href={homework.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-650/10"
              >
                <Download className="w-3.5 h-3.5" />
                Download Task PDF
              </a>
            </div>
          </div>

          {/* Instructor View: Submissions list */}
          {!isStudent && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-indigo-500" />
                Student Submissions ({allSubmissions?.length || 0})
              </h3>

              {allSubmissions && allSubmissions.length > 0 ? (
                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 divide-y divide-slate-100 dark:divide-slate-800/60">
                  {allSubmissions.map((sub) => {
                    const isReviewing = reviewingSubId === sub.id;
                    return (
                      <div key={sub.id} className="pt-4 first:pt-0 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                          <div>
                            <p className="font-bold text-slate-800 dark:text-slate-200">{sub.studentName}</p>
                            <p className="text-slate-450 dark:text-slate-500">{sub.studentEmail}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wider border ${
                              sub.status === 'REVIEWED'
                                ? 'bg-emerald-500/10 text-emerald-450 border-emerald-500/10'
                                : sub.status === 'LATE'
                                ? 'bg-amber-500/10 text-amber-450 border-amber-500/10'
                                : 'bg-blue-500/10 text-blue-450 border-blue-500/10'
                            }`}>
                              {sub.status}
                            </span>
                            <span className="text-slate-400 dark:text-slate-500">
                              Submitted: {new Date(sub.submittedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-850 p-3 rounded-2xl">
                          <a 
                            href={sub.submissionFileUrl} 
                            target="_blank" 
                            rel="noreferrer"
                            className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                          >
                            <FileText className="w-4 h-4" />
                            View Answer PDF
                          </a>

                          {sub.status === 'REVIEWED' ? (
                            <div className="text-xs font-semibold text-slate-600 dark:text-slate-350">
                              Grade: <strong className="text-indigo-500">{sub.marks} marks</strong>
                              {sub.feedback && <span className="block text-[10px] text-slate-450 font-medium mt-0.5">Feedback: {sub.feedback}</span>}
                            </div>
                          ) : isReviewing ? (
                            <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2 mt-2 sm:mt-0">
                              <input 
                                type="text" 
                                placeholder="Marks"
                                value={marksInput}
                                onChange={(e) => setMarksInput(e.target.value)}
                                className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-lg text-xs w-20"
                              />
                              <input 
                                type="text" 
                                placeholder="Feedback"
                                value={feedbackInput}
                                onChange={(e) => setFeedbackInput(e.target.value)}
                                className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-lg text-xs w-full sm:w-48"
                              />
                              <button
                                onClick={() => handleGradeSubmit(sub.id)}
                                disabled={gradingLoading}
                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs transition-all cursor-pointer"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setReviewingSubId(null)}
                                className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-400"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setReviewingSubId(sub.id);
                                setMarksInput(sub.marks ? String(sub.marks) : '');
                                setFeedbackInput(sub.feedback || '');
                              }}
                              className="px-3 py-1.5 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-650 dark:text-indigo-400 hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                            >
                              Grade Work
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-600 italic py-4 text-center">No submissions received yet.</p>
              )}
            </div>
          )}

        </div>

        {/* Right Side: Deadlines & Submission Form (Student View) */}
        <div className="space-y-6">
          
          {/* Card: Deadline status */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Milestone Details</h3>
            
            <div className="space-y-3.5">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Due Deadline</h4>
                  <p className={`text-xs mt-0.5 ${isOverdue ? 'text-red-500 font-bold' : 'text-slate-500 dark:text-slate-400 font-semibold'}`}>
                    {new Date(homework.dueDate).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Student View: Submission Status & Form */}
          {isStudent && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-5">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Submission State</h3>

              {submission ? (
                <div className="space-y-4">
                  {/* Status Indicator */}
                  <div className="flex items-center gap-2.5 p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                    <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-emerald-450 uppercase tracking-wider">Work Submitted</h4>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase border mt-1 inline-block ${
                        submission.status === 'REVIEWED'
                          ? 'bg-indigo-600/10 text-indigo-400 border-indigo-500/20'
                          : submission.status === 'LATE'
                          ? 'bg-amber-500/10 text-amber-450 border-amber-500/10'
                          : 'bg-emerald-500/10 text-emerald-450 border-emerald-500/10'
                      }`}>
                        {submission.status}
                      </span>
                    </div>
                  </div>

                  {/* Submission details */}
                  <div className="text-xs space-y-2 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/20 p-3.5 border border-slate-150 dark:border-slate-850 rounded-2xl">
                    <p className="flex items-center justify-between">
                      <span>Submitted Date:</span>
                      <strong className="text-slate-700 dark:text-slate-300">
                        {new Date(submission.submittedAt).toLocaleDateString()}
                      </strong>
                    </p>
                    <a
                      href={submission.submissionFileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline block pt-1 flex items-center gap-1 text-[11px]"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      View Submitted PDF
                    </a>
                  </div>

                  {/* Marks & Feedback */}
                  {submission.status === 'REVIEWED' && (
                    <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl space-y-2">
                      <p className="text-xs font-bold text-indigo-400 flex items-center justify-between">
                        <span>Grading Score:</span>
                        <span className="text-base font-extrabold">{submission.marks} marks</span>
                      </p>
                      {submission.feedback && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pt-1.5 border-t border-slate-150 dark:border-slate-800/40 flex gap-1">
                          <MessageSquare className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                          <span>Feedback: &ldquo;{submission.feedback}&rdquo;</span>
                        </p>
                      )}
                    </div>
                  )}

                  {/* Option to resubmit */}
                  <div className="border-t border-slate-150 dark:border-slate-800/60 pt-4" />
                </div>
              ) : (
                <div className="flex items-center gap-2.5 p-3 bg-amber-500/5 border border-amber-500/10 rounded-2xl select-none">
                  <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-amber-450 uppercase tracking-wider">No Submission</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Please submit before overdue deadline.</p>
                  </div>
                </div>
              )}

              {/* Upload input form */}
              <div className="space-y-3.5">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {submission ? 'Resubmit Assignment' : 'Upload Submission File'}
                </h4>

                <label className="group border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500/50 p-6 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all select-none">
                  <Upload className="w-8 h-8 text-slate-400 group-hover:text-indigo-500 transition-colors shrink-0" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-250 mt-2">
                    {file ? file.name : 'Select Answer PDF'}
                  </span>
                  <span className="text-[10px] text-slate-450 dark:text-slate-500 mt-0.5">
                    Click to browse files (max 10MB)
                  </span>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>

                {file && (
                  <button
                    onClick={handleUploadSubmit}
                    disabled={uploading}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-750 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-650/10 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Uploading to cloud...
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        Submit Assignment
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
