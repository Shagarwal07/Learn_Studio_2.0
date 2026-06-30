'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
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
  Users, 
  Calendar, 
  ClipboardCheck, 
  Megaphone, 
  Settings, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  PlusCircle, 
  Clock, 
  AlertTriangle,
  Award,
  BookMarked,
  Layers,
  MapPin,
  UploadCloud,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

interface BatchDTO {
  id: number;
  name: string;
  level: string;
  instructorId: number | null;
  instructorName: string | null;
  subjects: string[];
  studentCount: number;
}

interface UserDTO {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface BatchDetailsDTO {
  id: number;
  name: string;
  level: string;
  instructor: UserDTO | null;
  students: UserDTO[];
  subjects: string[];
}

interface TestDTO {
  id: number;
  title: string;
  description: string;
  batchId: number;
  batchName: string;
  subjectName: string;
  testDate: string;
  maxMarks: number;
  createdByName: string;
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

interface HomeworkDTO {
  id: number;
  title: string;
  description: string;
  batchId: number;
  batchName: string;
  subjectName: string;
  fileUrl: string;
  dueDate: string;
  createdByName: string;
  createdAt: string;
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

interface AttendanceDTO {
  id: number;
  studentId: number;
  studentName: string;
  subjectName: string;
  date: string;
  day: string;
  status: string;
}

interface ScheduleEvent {
  id: number;
  title: string;
  description: string;
  eventType: 'CLASS' | 'TEST' | 'ASSIGNMENT' | 'SPECIAL' | 'HOLIDAY';
  batchId: number | null;
  batchName: string | null;
  subjectName: string | null;
  eventDate: string;
  startTime: string;
  endTime: string;
  location: string | null;
  meetingLink: string | null;
  isRecurring: boolean;
  recurrenceDay: string | null;
}

const BATCH_LEVELS = ['Class VIII', 'Class IX', 'Class X', 'Class XI', 'Class XII', 'Undergraduate', 'Postgraduate'];
const ACADEMIC_SUBJECTS = ['English', 'Mathematics', 'Science', 'Social Science', 'Physics', 'Chemistry', 'Biology', 'Computer Science'];

export default function InstructorBatchesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Sync state with URL query parameters
  const batchIdParam = searchParams.get('batchId');
  const tabParam = searchParams.get('tab');

  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'students' | 'subjects' | 'schedule' | 'attendance' | 'notes' | 'homework' | 'tests' | 'announcements'>('students');

  useEffect(() => {
    if (batchIdParam) {
      const parsedId = parseInt(batchIdParam);
      if (!isNaN(parsedId)) {
        setSelectedBatchId(parsedId);
      }
    }
    if (tabParam && ['students', 'subjects', 'schedule', 'attendance', 'notes', 'homework', 'tests', 'announcements'].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
  }, [batchIdParam, tabParam]);

  const updateUrl = (batchId: number | null, tab: string) => {
    const params = new URLSearchParams();
    if (batchId) params.set('batchId', String(batchId));
    params.set('tab', tab);
    router.replace(`${pathname}?${params.toString()}`);
  };

  const handleBatchSelect = (id: number) => {
    setSelectedBatchId(id);
    updateUrl(id, activeTab);
  };

  const handleTabSelect = (tabName: string) => {
    setActiveTab(tabName as any);
    updateUrl(selectedBatchId, tabName);
  };

  // Form states for Create Batch
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBatchName, setNewBatchName] = useState('');
  const [newBatchLevel, setNewBatchLevel] = useState('Class X');
  const [createBatchError, setCreateBatchError] = useState('');

  // Tab Form states
  const [selectedStudentToAdd, setSelectedStudentToAdd] = useState('');
  const [scheduleDay, setScheduleDay] = useState('Monday');
  const [scheduleSubject, setScheduleSubject] = useState('');
  const [scheduleStartTime, setScheduleStartTime] = useState('10:00');
  const [scheduleEndTime, setScheduleEndTime] = useState('11:00');
  const [scheduleLocation, setScheduleLocation] = useState('Room 101');

  // Attendance marking states
  const [attendanceSubject, setAttendanceSubject] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<number, 'PRESENT' | 'ABSENT'>>({});

  // Notes tab states
  const [noteTitle, setNoteTitle] = useState('');
  const [noteDescription, setNoteDescription] = useState('');
  const [noteSubject, setNoteSubject] = useState('');
  const [notePdfFile, setNotePdfFile] = useState<File | null>(null);
  const [noteUploading, setNoteUploading] = useState(false);
  const [noteFormError, setNoteFormError] = useState('');
  const [noteFormSuccess, setNoteFormSuccess] = useState('');

  // Homework tab states
  const [hwTitle, setHwTitle] = useState('');
  const [hwDescription, setHwDescription] = useState('');
  const [hwSubject, setHwSubject] = useState('');
  const [hwDueDate, setHwDueDate] = useState(() => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek.toISOString().split('T')[0];
  });
  const [hwPdfFile, setHwPdfFile] = useState<File | null>(null);
  const [hwUploading, setHwUploading] = useState(false);
  const [hwFormError, setHwFormError] = useState('');
  const [hwFormSuccess, setHwFormSuccess] = useState('');

  // Test states
  const [testTitle, setTestTitle] = useState('');
  const [testDescription, setTestDescription] = useState('');
  const [testSubject, setTestSubject] = useState('');
  const [testDate, setTestDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [testMaxMarks, setTestMaxMarks] = useState(25);

  // Announcement states
  const [annTitle, setAnnTitle] = useState('');
  const [annMessage, setAnnMessage] = useState('');

  // Refs
  const noteFileInputRef = useRef<HTMLInputElement>(null);
  const hwFileInputRef = useRef<HTMLInputElement>(null);

  // ────────────────────────────────────────────────────────────────────────
  // DATA QUERIES
  // ────────────────────────────────────────────────────────────────────────

  // 1. Fetch Batches
  const { data: batches = [], isLoading: isBatchesLoading } = useQuery<BatchDTO[]>({
    queryKey: ['instructor-batches-workspace'],
    queryFn: async () => {
      const response = await api.get('/instructor/batches');
      return response.data.success ? response.data.data : [];
    }
  });

  // 2. Fetch Selected Batch Details
  const { data: batchDetails, isLoading: isDetailsLoading } = useQuery<BatchDetailsDTO>({
    queryKey: ['batch-details-workspace', selectedBatchId],
    queryFn: async () => {
      if (!selectedBatchId) return null;
      const response = await api.get(`/instructor/batches/${selectedBatchId}`);
      return response.data.success ? response.data.data : null;
    },
    enabled: !!selectedBatchId
  });

  useEffect(() => {
    if (batchDetails) {
      if (batchDetails.subjects.length > 0) {
        setScheduleSubject(batchDetails.subjects[0]);
        setAttendanceSubject(batchDetails.subjects[0]);
        setNoteSubject(batchDetails.subjects[0]);
        setHwSubject(batchDetails.subjects[0]);
        setTestSubject(batchDetails.subjects[0]);
      } else {
        setScheduleSubject('');
        setAttendanceSubject('');
        setNoteSubject('');
        setHwSubject('');
        setTestSubject('');
      }

      const records: Record<number, 'PRESENT' | 'ABSENT'> = {};
      batchDetails.students.forEach(s => {
        records[s.id] = 'PRESENT';
      });
      setAttendanceRecords(records);
    }
  }, [batchDetails]);

  // 3. Fetch All Students (for assigning to batch, admin only)
  const { data: allStudents = [] } = useQuery<UserDTO[]>({
    queryKey: ['all-students-workspace-assign'],
    enabled: user?.role === 'ADMIN',
    queryFn: async () => {
      const response = await api.get('/instructor/attendance/students');
      return response.data.success ? response.data.data : [];
    }
  });

  // 4. Fetch schedules for selected batch
  const { data: batchSchedules = [], refetch: refetchSchedules } = useQuery<ScheduleEvent[]>({
    queryKey: ['batch-schedules-workspace', selectedBatchId],
    queryFn: async () => {
      if (!selectedBatchId) return [];
      const response = await api.get('/instructor/schedules');
      const allEvents: ScheduleEvent[] = response.data.success ? response.data.data : [];
      return allEvents.filter(e => e.batchId === selectedBatchId);
    },
    enabled: !!selectedBatchId
  });

  // 5. Fetch Notes for selected batch
  const { data: batchNotes = [], refetch: refetchNotes } = useQuery<NoteDTO[]>({
    queryKey: ['batch-notes-workspace', selectedBatchId],
    queryFn: async () => {
      if (!selectedBatchId) return [];
      const response = await api.get(`/instructor/batches/${selectedBatchId}/notes`);
      return response.data.success ? response.data.data : [];
    },
    enabled: !!selectedBatchId
  });

  // 6. Fetch Homework for selected batch
  const { data: batchHomeworks = [], refetch: refetchHomeworks } = useQuery<HomeworkDTO[]>({
    queryKey: ['batch-homeworks-workspace', selectedBatchId],
    queryFn: async () => {
      if (!selectedBatchId) return [];
      const response = await api.get(`/instructor/batches/${selectedBatchId}/homework`);
      return response.data.success ? response.data.data : [];
    },
    enabled: !!selectedBatchId
  });

  // 7. Fetch Tests for selected batch
  const { data: batchTests = [], refetch: refetchTests } = useQuery<TestDTO[]>({
    queryKey: ['batch-tests-workspace', selectedBatchId],
    queryFn: async () => {
      if (!selectedBatchId) return [];
      const response = await api.get(`/instructor/batches/${selectedBatchId}/tests`);
      return response.data.success ? response.data.data : [];
    },
    enabled: !!selectedBatchId
  });

  // 8. Fetch Announcements for selected batch
  const { data: batchAnnouncements = [], refetch: refetchAnnouncements } = useQuery<AnnouncementDTO[]>({
    queryKey: ['batch-announcements-workspace', selectedBatchId],
    queryFn: async () => {
      if (!selectedBatchId) return [];
      const response = await api.get(`/instructor/batches/${selectedBatchId}/announcements`);
      return response.data.success ? response.data.data : [];
    },
    enabled: !!selectedBatchId
  });

  // 9. Fetch previous attendance logs for selected batch
  const { data: attendanceLogs = [], refetch: refetchAttendanceLogs } = useQuery<AttendanceDTO[]>({
    queryKey: ['batch-attendance-logs', selectedBatchId],
    queryFn: async () => {
      if (!selectedBatchId) return [];
      const response = await api.get(`/instructor/batches/${selectedBatchId}/attendance`);
      return response.data.success ? response.data.data : [];
    },
    enabled: !!selectedBatchId
  });

  // ────────────────────────────────────────────────────────────────────────
  // MUTATIONS
  // ────────────────────────────────────────────────────────────────────────

  // Create Batch (Admin only)
  const createBatchMutation = useMutation({
    mutationFn: async (payload: any) => {
      const response = await api.post('/instructor/batches', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor-batches-workspace'] });
      setShowCreateModal(false);
      setNewBatchName('');
      setCreateBatchError('');
    },
    onError: (err: any) => {
      setCreateBatchError(err.response?.data?.message || 'Failed to create batch.');
    }
  });

  // Delete Batch (Admin only)
  const deleteBatchMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/instructor/batches/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor-batches-workspace'] });
      setSelectedBatchId(null);
      alert('Batch deleted successfully.');
    }
  });

  // Assign Students (Admin only)
  const assignStudentsMutation = useMutation({
    mutationFn: async (payload: { batchId: number; studentIds: number[] }) => {
      await api.post(`/instructor/batches/${payload.batchId}/assign-students`, payload.studentIds);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batch-details-workspace', selectedBatchId] });
      queryClient.invalidateQueries({ queryKey: ['instructor-batches-workspace'] });
      setSelectedStudentToAdd('');
      alert('Roster updated successfully.');
    }
  });

  // Assign Subjects (Admin only)
  const assignSubjectsMutation = useMutation({
    mutationFn: async (payload: { batchId: number; subjects: string[] }) => {
      await api.post(`/instructor/batches/${payload.batchId}/assign-subjects`, payload.subjects);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batch-details-workspace', selectedBatchId] });
      alert('Subjects list updated successfully.');
    }
  });

  // Add Schedule Timing
  const addScheduleMutation = useMutation({
    mutationFn: async (payload: any) => {
      await api.post('/schedules', payload);
    },
    onSuccess: () => {
      refetchSchedules();
      alert('Class timing scheduled successfully!');
    }
  });

  // Delete Schedule Timing
  const deleteScheduleMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/schedules/${id}`);
    },
    onSuccess: () => {
      refetchSchedules();
      alert('Class timing deleted.');
    }
  });

  // Add Test
  const addTestMutation = useMutation({
    mutationFn: async (payload: any) => {
      await api.post(`/instructor/batches/${selectedBatchId}/tests`, payload);
    },
    onSuccess: () => {
      refetchTests();
      setTestTitle('');
      setTestDescription('');
      alert('Offline test scheduled successfully.');
    }
  });

  // Delete Test
  const deleteTestMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/instructor/batches/tests/${id}`);
    },
    onSuccess: () => {
      refetchTests();
      alert('Test deleted.');
    }
  });

  // Add Announcement
  const addAnnouncementMutation = useMutation({
    mutationFn: async (payload: any) => {
      await api.post(`/instructor/batches/${selectedBatchId}/announcements`, payload);
    },
    onSuccess: () => {
      refetchAnnouncements();
      setAnnTitle('');
      setAnnMessage('');
      alert('Announcement posted to batch feed.');
    }
  });

  // Bulk Attendance Mark
  const markAttendanceMutation = useMutation({
    mutationFn: async (payload: any) => {
      await api.post(`/instructor/batches/${selectedBatchId}/attendance`, payload);
    },
    onSuccess: () => {
      refetchAttendanceLogs();
      alert('Batch attendance registered successfully.');
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to submit batch attendance.');
    }
  });

  // Save Notes Metadata
  const saveNoteMutation = useMutation({
    mutationFn: async (payload: any) => {
      await api.post(`/instructor/batches/${selectedBatchId}/notes`, payload);
    },
    onSuccess: () => {
      refetchNotes();
      setNoteTitle('');
      setNoteDescription('');
      setNotePdfFile(null);
      if (noteFileInputRef.current) noteFileInputRef.current.value = '';
      setNoteFormSuccess('Study guide PDF uploaded and secure-mapped successfully.');
      setNoteFormError('');
      setTimeout(() => setNoteFormSuccess(''), 4000);
    },
    onError: (err: any) => {
      setNoteFormError(err.response?.data?.message || 'Failed to save note in database.');
    }
  });

  // Save Homework Metadata
  const saveHomeworkMutation = useMutation({
    mutationFn: async (payload: any) => {
      await api.post(`/instructor/batches/${selectedBatchId}/homework`, payload);
    },
    onSuccess: () => {
      refetchHomeworks();
      setHwTitle('');
      setHwDescription('');
      setHwPdfFile(null);
      if (hwFileInputRef.current) hwFileInputRef.current.value = '';
      setHwFormSuccess('Homework task assigned successfully.');
      setHwFormError('');
      setTimeout(() => setHwFormSuccess(''), 4000);
    },
    onError: (err: any) => {
      setHwFormError(err.response?.data?.message || 'Failed to save homework in database.');
    }
  });

  // ────────────────────────────────────────────────────────────────────────
  // ACTIONS & SUBMISSIONS HANDLERS
  // ────────────────────────────────────────────────────────────────────────

  const handleCreateBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBatchName.trim()) return;
    createBatchMutation.mutate({
      name: newBatchName,
      level: newBatchLevel,
      instructorId: user?.id
    });
  };

  const handleDeleteBatch = (id: number) => {
    if (confirm('Are you sure you want to delete this batch? All student rosters will be unlinked.')) {
      deleteBatchMutation.mutate(id);
    }
  };

  const handleAddStudent = () => {
    if (!selectedStudentToAdd || !batchDetails) return;
    const currentStudentIds = batchDetails.students.map(s => s.id);
    const newStudentId = parseInt(selectedStudentToAdd);
    if (currentStudentIds.includes(newStudentId)) return;
    
    assignStudentsMutation.mutate({
      batchId: batchDetails.id,
      studentIds: [...currentStudentIds, newStudentId]
    });
  };

  const handleRemoveStudent = (studentId: number) => {
    if (!batchDetails) return;
    const updatedIds = batchDetails.students.map(s => s.id).filter(id => id !== studentId);
    assignStudentsMutation.mutate({
      batchId: batchDetails.id,
      studentIds: updatedIds
    });
  };

  const handleToggleSubject = (subject: string) => {
    if (!batchDetails) return;
    if (user?.role !== 'ADMIN') {
      alert('Curriculum subject mapping is restricted to System Administrators.');
      return;
    }
    const currentSubjects = [...batchDetails.subjects];
    let updatedSubjects;
    if (currentSubjects.includes(subject)) {
      updatedSubjects = currentSubjects.filter(s => s !== subject);
    } else {
      updatedSubjects = [...currentSubjects, subject];
    }
    assignSubjectsMutation.mutate({
      batchId: batchDetails.id,
      subjects: updatedSubjects
    });
  };

  const handleAddSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchDetails || !scheduleSubject) return;

    addScheduleMutation.mutate({
      title: `${scheduleSubject} Class`,
      description: `Regular offline lecture for ${batchDetails.name}`,
      eventType: 'CLASS',
      batchId: batchDetails.id,
      subjectName: scheduleSubject,
      targetRole: 'STUDENT',
      eventDate: new Date().toISOString().split('T')[0],
      startTime: scheduleStartTime,
      endTime: scheduleEndTime,
      location: scheduleLocation,
      meetingLink: '',
      isRecurring: true,
      recurrenceDay: scheduleDay
    });
  };

  const handleMarkAttendance = () => {
    if (!batchDetails || !attendanceSubject) return;

    const recordsPayload = Object.keys(attendanceRecords).map(studentIdStr => {
      const studentId = parseInt(studentIdStr);
      return {
        studentId,
        status: attendanceRecords[studentId]
      };
    });

    markAttendanceMutation.mutate({
      subjectName: attendanceSubject,
      date: attendanceDate,
      records: recordsPayload
    });
  };

  const handleNoteFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf') {
        setNoteFormError('Only PDF files are allowed.');
        setNotePdfFile(null);
        e.target.value = '';
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setNoteFormError('File size exceeds 10MB limit.');
        setNotePdfFile(null);
        e.target.value = '';
        return;
      }
      setNoteFormError('');
      setNotePdfFile(file);
    }
  };

  const handleNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatchId || !noteTitle.trim() || !noteSubject || !notePdfFile) {
      setNoteFormError('Please select a batch, fill in the title, and select a PDF file.');
      return;
    }

    setNoteUploading(true);
    setNoteFormError('');
    setNoteFormSuccess('');

    try {
      const formData = new FormData();
      formData.append('file', notePdfFile);
      formData.append('title', noteTitle.trim());
      formData.append('description', noteDescription.trim());
      formData.append('subjectName', noteSubject);

      const response = await api.post(`/instructor/batches/${selectedBatchId}/notes`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        refetchNotes();
        setNoteTitle('');
        setNoteDescription('');
        setNotePdfFile(null);
        if (noteFileInputRef.current) noteFileInputRef.current.value = '';
        setNoteFormSuccess('Study guide PDF uploaded and secure-mapped successfully.');
        setNoteFormError('');
        setTimeout(() => setNoteFormSuccess(''), 4000);
      } else {
        throw new Error(response.data.message || 'Note upload failed.');
      }

    } catch (err: any) {
      setNoteFormError(err.response?.data?.message || err.message || 'File upload failed. Please try again.');
    } finally {
      setNoteUploading(false);
    }
  };

  const handleHwFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf') {
        setHwFormError('Only PDF files are allowed.');
        setHwPdfFile(null);
        e.target.value = '';
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setHwFormError('File size exceeds 10MB limit.');
        setHwPdfFile(null);
        e.target.value = '';
        return;
      }
      setHwFormError('');
      setHwPdfFile(file);
    }
  };

  const handleHomeworkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatchId || !hwTitle.trim() || !hwSubject) {
      setHwFormError('Please fill in all mandatory fields.');
      return;
    }

    setHwUploading(true);
    setHwFormError('');
    setHwFormSuccess('');

    try {
      let secureUrl = '';
      let uploadedPublicId: string | null = null;
      if (hwPdfFile) {
        const formData = new FormData();
        formData.append('file', hwPdfFile);
        formData.append('folder', 'homework');

        const uploadResponse = await api.post('/media/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        secureUrl = uploadResponse.data?.data?.url || '';
        uploadedPublicId = uploadResponse.data?.data?.publicId || null;
        if (!secureUrl) throw new Error('Upload server failed to return secure URL.');
      }

      saveHomeworkMutation.mutate({
        title: hwTitle.trim(),
        description: hwDescription.trim(),
        subjectName: hwSubject,
        fileUrl: secureUrl,
        publicId: uploadedPublicId,
        dueDate: hwDueDate ? `${hwDueDate}T23:59:59` : null,
        isVisible: true
      });

    } catch (err: any) {
      setHwFormError(err.message || 'File upload failed. Please try again.');
    } finally {
      setHwUploading(false);
    }
  };

  const handleAddTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchDetails || !testTitle.trim() || !testSubject) return;

    addTestMutation.mutate({
      title: testTitle.trim(),
      description: testDescription.trim(),
      subjectName: testSubject,
      testDate: testDate,
      maxMarks: testMaxMarks
    });
  };

  const handleAddAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchDetails || !annTitle.trim() || !annMessage.trim()) return;

    addAnnouncementMutation.mutate({
      title: annTitle.trim(),
      message: annMessage.trim(),
      targetRole: 'STUDENT',
      pinned: true
    });
  };

  // ────────────────────────────────────────────────────────────────────────
  // ROLE PROTECTION GUARD
  // ────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-7xl mx-auto text-xs sm:text-sm animate-in fade-in duration-300 text-slate-100">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-500/20">
            Academic Panel
          </span>
          <h2 className="text-2xl font-black text-slate-105 mt-2.5 tracking-tight">
            Batch Management Workspace
          </h2>
          <p className="text-xs text-slate-400 mt-1.5 leading-normal max-w-2xl">
            Configure offline batches, assign academic curriculum subjects, schedule timings, upload secure notes, assign homework, and mark attendance.
          </p>
        </div>
        
        {user?.role === 'ADMIN' ? (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-650/15 cursor-pointer shrink-0 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Create Academic Batch
          </button>
        ) : (
          <button
            onClick={() => alert('Academic batch creation is restricted to System Administrators. Instructors can manage operational tasks for assigned batches.')}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-slate-500 border border-slate-800/80 rounded-xl text-xs font-bold cursor-not-allowed shrink-0"
            disabled
          >
            <Settings className="w-4 h-4" />
            Create Batch (Admin Only)
          </button>
        )}
      </div>

      {/* Main Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Batches List Sidebar (4/12 cols) */}
        <div className="lg:col-span-4 bg-slate-900/50 backdrop-blur-md border border-slate-800/80 rounded-2xl p-4 shadow-xl space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            Assigned Offline Batches ({batches.length})
          </h3>

          {isBatchesLoading ? (
            <div className="py-16 text-center flex flex-col items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
              <span className="text-xs text-slate-400 font-medium">Syncing batches...</span>
            </div>
          ) : batches.length === 0 ? (
            <div className="py-12 px-4 text-center border border-dashed border-slate-800/85 rounded-xl bg-slate-950/20 text-slate-400 space-y-2">
              <BookOpen className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs font-bold">No academic batches created</p>
              <p className="text-[11px] text-slate-500">Administrators can create batches to begin onboarding.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin">
              {batches.map((b) => {
                const isSelected = b.id === selectedBatchId;
                return (
                  <div
                    key={b.id}
                    className={`group w-full p-3.5 rounded-xl border transition-all duration-200 flex items-center justify-between gap-3 cursor-pointer select-none ${
                      isSelected
                        ? 'bg-indigo-950/20 border-indigo-500/80 shadow-md shadow-indigo-500/5'
                        : 'bg-slate-950/30 border-slate-900 hover:bg-slate-900/40 hover:border-slate-800/80'
                    }`}
                    onClick={() => handleBatchSelect(b.id)}
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-indigo-500/10 text-indigo-450 uppercase border border-indigo-500/20">
                          {b.level}
                        </span>
                        <h4 className={`text-xs font-black truncate transition-colors ${
                          isSelected ? 'text-indigo-400' : 'text-slate-200'
                        }`}>
                          {b.name}
                        </h4>
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium">
                        {b.studentCount} Students Assigned
                      </p>
                    </div>

                    {user?.role === 'ADMIN' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteBatch(b.id);
                        }}
                        className="p-1.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg cursor-pointer transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title="Delete Batch"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Tabbed Detail workspace (8/12 cols) */}
        <div className="lg:col-span-8">
          
          {!selectedBatchId ? (
            <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 text-center shadow-xl space-y-4 py-20">
              <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl flex items-center justify-center mx-auto shadow-inner">
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="space-y-1.5 max-w-sm mx-auto">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wide">Batch Console Inactive</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Select an offline academic batch from the left sidebar panel to load student rosters, class timetables, attendance registers, and assignments.
                </p>
              </div>
            </div>
          ) : isDetailsLoading || !batchDetails ? (
            <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800/80 rounded-2xl p-20 text-center shadow-xl flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-505" />
              <span className="text-xs text-slate-400 font-medium animate-pulse">Syncing batch workspace details...</span>
            </div>
          ) : (
            <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800/80 rounded-2xl shadow-xl overflow-hidden flex flex-col animate-in fade-in duration-300">
              
              {/* Batch Banner Header */}
              <div className="p-4 sm:p-5 bg-slate-950/40 border-b border-slate-850/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[8px] font-extrabold rounded-full bg-indigo-600 text-white uppercase tracking-wider">
                      {batchDetails.level}
                    </span>
                    <h3 className="text-base font-black text-slate-100">
                      {batchDetails.name}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 font-medium">
                    Instructor (Class Teacher): <span className="font-bold text-indigo-400">{batchDetails.instructor?.name || 'Unassigned'}</span>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {batchDetails.subjects.map(s => (
                    <span key={s} className="px-2 py-0.5 text-[9px] font-bold rounded-lg border border-slate-800 text-slate-300 bg-slate-950/60">
                      {s}
                    </span>
                  ))}
                  {batchDetails.subjects.length === 0 && (
                    <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1 bg-amber-500/5 px-2 py-0.5 border border-amber-500/10 rounded-lg">
                      <AlertTriangle className="w-3 h-3" /> No active subjects
                    </span>
                  )}
                </div>
              </div>

              {/* Tabs Navigation */}
              <div className="flex items-center gap-1 px-4 border-b border-slate-850 bg-slate-955/20 overflow-x-auto scrollbar-none">
                {([
                  { id: 'students', label: 'Students' },
                  { id: 'subjects', label: 'Subjects' },
                  { id: 'schedule', label: 'Schedule' },
                  { id: 'attendance', label: 'Attendance' },
                  { id: 'notes', label: 'Notes / PDF Upload' },
                  { id: 'homework', label: 'Homework' },
                  { id: 'tests', label: 'Tests' },
                  { id: 'announcements', label: 'Announcements' }
                ] as const).map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabSelect(tab.id)}
                      className={`px-3.5 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                        isActive
                          ? 'border-indigo-500 text-indigo-400 font-extrabold'
                          : 'border-transparent text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Tab Content Panels */}
              <div className="p-5">
                
                {/* 1. STUDENTS TAB */}
                {activeTab === 'students' && (
                  <div className="space-y-5 animate-in fade-in duration-200">
                    <div>
                      <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Batch Student Roster</h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        Verify and organize students assigned to this offline cohort. Note that students can belong to only one batch at a time.
                      </p>
                    </div>

                    {user?.role === 'ADMIN' ? (
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-slate-955/40 p-3.5 rounded-xl border border-slate-850/80">
                        <div className="relative flex-1">
                          <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                          <select
                            value={selectedStudentToAdd}
                            onChange={(e) => setSelectedStudentToAdd(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-slate-950/60 border border-slate-800 text-slate-200 placeholder-slate-600 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 cursor-pointer"
                          >
                            <option value="">Select a student to assign...</option>
                            {allStudents
                              .filter(s => s.role === 'STUDENT' && (!batchDetails.students.map(bs => bs.id).includes(s.id)))
                              .map(s => (
                                <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
                              ))}
                          </select>
                        </div>

                        <button
                          onClick={handleAddStudent}
                          disabled={!selectedStudentToAdd || assignStudentsMutation.isPending}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md shadow-indigo-650/15 active:scale-95 shrink-0"
                        >
                          {assignStudentsMutation.isPending ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <PlusCircle className="w-3.5 h-3.5" />
                          )}
                          Assign Student
                        </button>
                      </div>
                    ) : (
                      <div className="p-3.5 bg-slate-955/40 border border-slate-850/80 rounded-xl text-xs text-slate-400 flex items-center gap-2.5 font-medium">
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 animate-pulse" />
                        <span>Student batch enrollment and assignments are managed at the Administrator level. Instructors have read-only roster access.</span>
                      </div>
                    )}

                    {/* Students List */}
                    <div className="space-y-3">
                      <h5 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                        Assigned Student List ({batchDetails.students.length})
                      </h5>

                      {batchDetails.students.length === 0 ? (
                        <div className="py-10 text-center border border-dashed border-slate-850 rounded-xl text-xs text-slate-500 bg-slate-955/10">
                          No students currently enrolled in this batch.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {batchDetails.students.map((st) => (
                            <div
                              key={st.id}
                              className="bg-slate-955/30 border border-slate-900 p-3 rounded-xl flex items-center justify-between gap-3 shadow-sm hover:border-slate-800/80 transition-colors"
                            >
                              <div className="min-w-0 space-y-0.5">
                                <h4 className="text-xs font-bold text-slate-205 truncate">
                                  {st.name}
                                </h4>
                                <p className="text-[10px] text-slate-500 truncate">
                                  {st.email}
                                </p>
                              </div>

                              {user?.role === 'ADMIN' && (
                                <button
                                  onClick={() => handleRemoveStudent(st.id)}
                                  disabled={assignStudentsMutation.isPending}
                                  className="p-1.5 text-slate-500 hover:text-rose-455 hover:bg-rose-955/20 rounded-lg cursor-pointer transition-colors"
                                  title="Remove student from batch"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 2. SUBJECTS TAB */}
                {activeTab === 'subjects' && (
                  <div className="space-y-5 animate-in fade-in duration-200">
                    <div>
                      <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Active Curriculum Subjects</h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        Identify which academic subjects are mapped to this offline batch.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {ACADEMIC_SUBJECTS.map((subject) => {
                        const isAssigned = batchDetails.subjects.includes(subject);
                        return (
                          <button
                            key={subject}
                            onClick={() => handleToggleSubject(subject)}
                            disabled={assignSubjectsMutation.isPending}
                            className={`p-4 rounded-xl border text-left flex items-center justify-between gap-3 cursor-pointer transition-all ${
                              isAssigned
                                ? 'bg-indigo-950/20 border-indigo-500/80 shadow-md shadow-indigo-500/5 ring-1 ring-indigo-500/25'
                                : 'bg-slate-950/30 border-slate-905 hover:border-slate-800/80 hover:bg-slate-900/30'
                            }`}
                          >
                            <div className="space-y-0.5">
                              <span className={`text-xs font-black block ${
                                isAssigned ? 'text-indigo-400' : 'text-slate-300'
                              }`}>
                                {subject}
                              </span>
                              <span className="text-[9px] text-slate-500 block font-bold uppercase tracking-wider">
                                {isAssigned ? 'Active Syllabus' : 'Inactive'}
                              </span>
                            </div>

                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                              isAssigned
                                ? 'bg-indigo-600 border-indigo-600 text-white'
                                : 'border-slate-800 bg-slate-950'
                            }`}>
                              {isAssigned && <CheckCircle2 className="w-3.5 h-3.5 fill-white text-indigo-600" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3. SCHEDULE TAB */}
                {activeTab === 'schedule' && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <div>
                      <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Class Timings & Weekly Planner</h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        Configure weekly classroom schedules for active subjects. Timing edits instantly sync to student timetable feeds.
                      </p>
                    </div>

                    {/* Schedule Timing Add Form */}
                    {batchDetails.subjects.length === 0 ? (
                      <div className="p-3.5 bg-amber-500/5 border border-amber-500/10 rounded-xl text-xs text-amber-400 flex items-center gap-2.5">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        Please assign at least one active subject in the **Subjects** tab before scheduling class timings.
                      </div>
                    ) : (
                      <form onSubmit={handleAddSchedule} className="bg-slate-955/40 p-4 rounded-xl border border-slate-850/80 space-y-4 text-xs">
                        <h5 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                          Schedule New Lecture Timing
                        </h5>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                          {/* Subject */}
                          <div className="space-y-1">
                            <label className="block text-slate-400 font-bold text-[10px] uppercase tracking-wider">Subject *</label>
                            <select
                              value={scheduleSubject}
                              onChange={(e) => setScheduleSubject(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 text-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 cursor-pointer"
                            >
                              {batchDetails.subjects.map(s => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          </div>

                          {/* Day */}
                          <div className="space-y-1">
                            <label className="block text-slate-400 font-bold text-[10px] uppercase tracking-wider">Day of Week *</label>
                            <select
                              value={scheduleDay}
                              onChange={(e) => setScheduleDay(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-955/60 border border-slate-800 text-slate-202 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 cursor-pointer"
                            >
                              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(d => (
                                <option key={d} value={d}>{d}</option>
                              ))}
                            </select>
                          </div>

                          {/* Location */}
                          <div className="space-y-1">
                            <label className="block text-slate-400 font-bold text-[10px] uppercase tracking-wider">Classroom / Room *</label>
                            <input
                              type="text"
                              required
                              value={scheduleLocation}
                              onChange={(e) => setScheduleLocation(e.target.value)}
                              placeholder="e.g. Room 201"
                              className="w-full px-3 py-2 bg-slate-955/60 border border-slate-800 text-slate-202 placeholder-slate-650 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                            />
                          </div>

                          {/* Start Time */}
                          <div className="space-y-1">
                            <label className="block text-slate-400 font-bold text-[10px] uppercase tracking-wider">Start Time *</label>
                            <input
                              type="time"
                              required
                              value={scheduleStartTime}
                              onChange={(e) => setScheduleStartTime(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-955/60 border border-slate-800 text-slate-202 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 cursor-pointer"
                            />
                          </div>

                          {/* End Time */}
                          <div className="space-y-1">
                            <label className="block text-slate-400 font-bold text-[10px] uppercase tracking-wider">End Time *</label>
                            <input
                              type="time"
                              required
                              value={scheduleEndTime}
                              onChange={(e) => setScheduleEndTime(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-955/60 border border-slate-800 text-slate-202 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 cursor-pointer"
                            />
                          </div>

                          {/* Submit */}
                          <div className="flex items-end">
                            <button
                              type="submit"
                              disabled={addScheduleMutation.isPending}
                              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-indigo-650/15 disabled:opacity-50 active:scale-95"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Add Timing Event
                            </button>
                          </div>
                        </div>
                      </form>
                    )}

                    {/* Schedules Timetable view */}
                    <div className="space-y-3">
                      <h5 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                        Current Weekly Schedule Timetable
                      </h5>

                      {batchSchedules.length === 0 ? (
                        <div className="py-10 text-center border border-dashed border-slate-850 rounded-xl text-xs text-slate-500 bg-slate-955/10">
                          No class timings scheduled yet for this batch.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(dayName => {
                            const dayEvents = batchSchedules.filter(e => e.recurrenceDay === dayName);
                            if (dayEvents.length === 0) return null;

                            return (
                              <div key={dayName} className="space-y-2 bg-slate-955/20 p-3.5 rounded-xl border border-slate-850/80">
                                <h6 className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">
                                  {dayName}
                                </h6>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {dayEvents.map(event => (
                                    <div key={event.id} className="bg-slate-950/40 border border-slate-900 p-3 rounded-xl flex items-center justify-between gap-3 shadow-sm hover:border-slate-800/85 transition-colors">
                                      <div className="min-w-0 space-y-1">
                                        <div className="flex items-center gap-1.5">
                                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                                          <h4 className="text-xs font-bold text-slate-205 truncate">
                                            {event.subjectName}
                                          </h4>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[9px] text-slate-500 font-semibold">
                                          <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3 text-indigo-400" />
                                            {event.startTime.substring(0, 5)} - {event.endTime.substring(0, 5)}
                                          </span>
                                          <span className="flex items-center gap-1">
                                            <MapPin className="w-3 h-3 text-indigo-400" />
                                            {event.location}
                                          </span>
                                        </div>
                                      </div>

                                      <button
                                        onClick={() => deleteScheduleMutation.mutate(event.id)}
                                        className="p-1.5 text-slate-500 hover:text-rose-455 hover:bg-rose-955/20 rounded-lg cursor-pointer transition-colors"
                                        title="Delete Timing"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 4. ATTENDANCE TAB */}
                {activeTab === 'attendance' && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <div>
                      <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Batch Attendance Register</h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        Conduct attendance checks and review historical logs for the current academic batch.
                      </p>
                    </div>

                    {batchDetails.subjects.length === 0 ? (
                      <div className="p-3.5 bg-amber-500/5 border border-amber-500/10 rounded-xl text-xs text-amber-400 flex items-center gap-2.5">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        Please assign at least one active subject in the **Subjects** tab before marking attendance.
                      </div>
                    ) : batchDetails.students.length === 0 ? (
                      <div className="p-3.5 bg-amber-500/5 border border-amber-500/10 rounded-xl text-xs text-amber-400 flex items-center gap-2.5">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        Please assign students in the **Students** tab before marking attendance.
                      </div>
                    ) : (
                      <div className="space-y-5">
                        {/* Selector Controls */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-955/40 p-4 rounded-xl border border-slate-850/80 text-xs">
                          {/* Subject Select */}
                          <div className="space-y-1">
                            <label className="block text-slate-400 font-bold text-[10px] uppercase tracking-wider">Select Subject *</label>
                            <select
                              value={attendanceSubject}
                              onChange={(e) => setAttendanceSubject(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 text-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 cursor-pointer"
                            >
                              {batchDetails.subjects.map(s => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          </div>

                          {/* Date Select */}
                          <div className="space-y-1">
                            <label className="block text-slate-400 font-bold text-[10px] uppercase tracking-wider">Select Date *</label>
                            <input
                              type="date"
                              value={attendanceDate}
                              onChange={(e) => setAttendanceDate(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-955/60 border border-slate-800 text-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 cursor-pointer"
                            />
                          </div>
                        </div>

                        {/* Student Attendance List Grid */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-4 px-1">
                            <h5 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                              Student Marking Roster ({batchDetails.students.length})
                            </h5>

                            {/* Mass Actions */}
                            <div className="flex gap-2.5 text-[9px] font-extrabold uppercase tracking-wider">
                              <button
                                onClick={() => {
                                  const records: Record<number, 'PRESENT' | 'ABSENT'> = {};
                                  batchDetails.students.forEach(s => { records[s.id] = 'PRESENT'; });
                                  setAttendanceRecords(records);
                                }}
                                className="text-emerald-405 hover:text-emerald-400 cursor-pointer transition-colors"
                              >
                                Mark All Present
                              </button>
                              <span className="text-slate-800">|</span>
                              <button
                                onClick={() => {
                                  const records: Record<number, 'PRESENT' | 'ABSENT'> = {};
                                  batchDetails.students.forEach(s => { records[s.id] = 'ABSENT'; });
                                  setAttendanceRecords(records);
                                }}
                                className="text-rose-405 hover:text-rose-400 cursor-pointer transition-colors"
                              >
                                Mark All Absent
                              </button>
                            </div>
                          </div>

                          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                            {batchDetails.students.map((st) => {
                              const status = attendanceRecords[st.id] || 'PRESENT';
                              const isPresent = status === 'PRESENT';

                              return (
                                <div
                                  key={st.id}
                                  className={`p-3 rounded-xl border flex items-center justify-between gap-4 transition-all duration-200 bg-slate-955/20 ${
                                    isPresent
                                      ? 'border-emerald-950/40 border-l-4 border-l-emerald-500/80'
                                      : 'border-rose-955/40 border-l-4 border-l-rose-500/80'
                                  }`}
                                >
                                  <div className="min-w-0 space-y-0.5">
                                    <h4 className="text-xs font-bold text-slate-205 truncate">
                                      {st.name}
                                    </h4>
                                    <p className="text-[9px] text-slate-500 truncate">
                                      {st.email}
                                    </p>
                                  </div>

                                  {/* Checkbox toggle status */}
                                  <button
                                    onClick={() => {
                                      setAttendanceRecords(prev => ({
                                        ...prev,
                                        [st.id]: isPresent ? 'ABSENT' : 'PRESENT'
                                      }));
                                    }}
                                    className={`px-3 py-1.5 text-[9px] font-extrabold rounded-lg border uppercase tracking-wider cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 ${
                                      isPresent
                                        ? 'bg-emerald-500/10 border-emerald-500/10 text-emerald-400'
                                        : 'bg-rose-500/10 border-rose-500/10 text-rose-400'
                                    }`}
                                  >
                                    {isPresent ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                                    {status}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Submit Button */}
                        <button
                          onClick={handleMarkAttendance}
                          disabled={markAttendanceMutation.isPending}
                          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md shadow-indigo-650/15 text-xs active:scale-[0.98]"
                        >
                          {markAttendanceMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <ClipboardCheck className="w-4 h-4" />
                          )}
                          Submit Batch Attendance ({batchDetails.students.length} Students)
                        </button>

                        {/* Previous Attendance Logs Section */}
                        <div className="space-y-3 pt-5 border-t border-slate-850/80">
                          <h5 className="text-xs font-bold text-slate-205 uppercase tracking-wider">
                            Previous Attendance Logs
                          </h5>

                          {attendanceLogs.length === 0 ? (
                            <div className="py-8 text-center border border-dashed border-slate-850 rounded-xl text-slate-500 text-xs bg-slate-955/10">
                              No attendance records logged yet for this batch.
                            </div>
                          ) : (
                            <div className="overflow-hidden border border-slate-850/80 rounded-xl bg-slate-955/20">
                              <div className="max-h-60 overflow-y-auto pr-1">
                                <table className="w-full border-collapse text-left text-[11px] font-semibold text-slate-305">
                                  <thead className="bg-slate-900/80 font-bold border-b border-slate-850 text-slate-200">
                                    <tr>
                                      <th className="px-4 py-2.5">Date</th>
                                      <th className="px-4 py-2.5">Subject</th>
                                      <th className="px-4 py-2.5">Student</th>
                                      <th className="px-4 py-2.5 text-right">Status</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-850/40">
                                    {attendanceLogs.map((log) => {
                                      const isPres = log.status === 'PRESENT';
                                      return (
                                        <tr key={log.id} className="hover:bg-slate-900/30 transition-colors">
                                          <td className="px-4 py-2">{new Date(log.date).toLocaleDateString()} ({log.day})</td>
                                          <td className="px-4 py-2">{log.subjectName}</td>
                                          <td className="px-4 py-2">{log.studentName}</td>
                                          <td className="px-4 py-2 text-right">
                                            <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider ${
                                              isPres
                                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10'
                                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/10'
                                            }`}>
                                              {log.status}
                                            </span>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 5. NOTES TAB */}
                {activeTab === 'notes' && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <div>
                      <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Batch Study Notes</h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        Upload lecture handouts, curriculum PDFs, and study guides directly to students assigned to this batch.
                      </p>
                    </div>

                    {batchDetails.subjects.length === 0 ? (
                      <div className="p-3.5 bg-amber-500/5 border border-amber-500/10 rounded-xl text-xs text-amber-400 flex items-center gap-2.5">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        Please assign at least one active subject in the **Subjects** tab before publishing notes.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                        
                        {/* Notes Form (5/12 cols) */}
                        <form onSubmit={handleNoteSubmit} className="md:col-span-5 bg-slate-955/40 p-4 rounded-xl border border-slate-850/80 space-y-4 text-xs">
                          <h5 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <UploadCloud className="w-4 h-4 text-indigo-400" /> Publish Study Note
                          </h5>

                          {/* Subject */}
                          <div className="space-y-1">
                            <label className="block text-slate-400 font-bold text-[10px] uppercase tracking-wider">Subject *</label>
                            <select
                              value={noteSubject}
                              onChange={(e) => setNoteSubject(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 text-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 cursor-pointer"
                              required
                            >
                              <option value="">Select subject...</option>
                              {batchDetails.subjects.map(s => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          </div>

                          {/* Title */}
                          <div className="space-y-1">
                            <label className="block text-slate-400 font-bold text-[10px] uppercase tracking-wider">Document Title *</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Chapter 2: Trigonometric Ratios"
                              value={noteTitle}
                              onChange={(e) => setNoteTitle(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 text-slate-200 placeholder-slate-650 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                            />
                          </div>

                          {/* Description */}
                          <div className="space-y-1">
                            <label className="block text-slate-400 font-bold text-[10px] uppercase tracking-wider">Brief Description</label>
                            <textarea
                              rows={2}
                              placeholder="Topics covered, revision formulas..."
                              value={noteDescription}
                              onChange={(e) => setNoteDescription(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 text-slate-200 placeholder-slate-650 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 resize-none"
                            />
                          </div>

                          {/* File Dropzone */}
                          <div className="space-y-1">
                            <label className="block text-slate-400 font-bold text-[10px] uppercase tracking-wider">Select PDF Document *</label>
                            <div className="relative border border-dashed border-slate-800 hover:border-indigo-500 rounded-xl p-4 text-center cursor-pointer bg-slate-950/20 transition-colors">
                              <input
                                ref={noteFileInputRef}
                                type="file"
                                accept=".pdf"
                                required
                                onChange={handleNoteFileChange}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                              />
                              <UploadCloud className="w-5 h-5 text-slate-500 mx-auto mb-1" />
                              <p className="font-bold text-[9px] text-slate-350 truncate px-2">
                                {notePdfFile ? notePdfFile.name : 'Click to select PDF document'}
                              </p>
                              <p className="text-[8px] text-slate-500 mt-0.5">PDF format only, Max 10MB</p>
                            </div>
                          </div>

                          {noteFormError && (
                            <div className="p-2.5 bg-rose-500/5 border border-rose-500/10 text-rose-400 rounded-xl text-center font-bold text-[10px]">
                              {noteFormError}
                            </div>
                          )}

                          {noteFormSuccess && (
                            <div className="p-2.5 bg-emerald-500/5 border border-emerald-500/10 text-emerald-405 rounded-xl text-center font-bold text-[10px]">
                              {noteFormSuccess}
                            </div>
                          )}

                          <button
                            type="submit"
                            disabled={noteUploading || saveNoteMutation.isPending}
                            className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-indigo-650/15 disabled:opacity-50 active:scale-95"
                          >
                            {noteUploading || saveNoteMutation.isPending ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                {noteUploading ? 'Uploading to Cloudinary...' : 'Saving to Database...'}
                              </>
                            ) : (
                              <>
                                <PlusCircle className="w-3.5 h-3.5" />
                                Publish Study Note
                              </>
                            )}
                          </button>
                        </form>

                        {/* Notes List (7/12 cols) */}
                        <div className="md:col-span-7 space-y-3">
                          <h5 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                            Uploaded Notes List ({batchNotes.length})
                          </h5>

                          {batchNotes.length === 0 ? (
                            <div className="py-16 text-center border border-dashed border-slate-850 rounded-xl text-slate-500 text-xs bg-slate-955/10">
                              No study notes uploaded yet for this batch.
                            </div>
                          ) : (
                            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                              {batchNotes.map(note => (
                                <div key={note.id} className="bg-slate-950/30 border border-slate-900 p-3.5 rounded-xl flex items-start justify-between gap-4 shadow-sm hover:border-slate-800/80 transition-colors">
                                  <div className="min-w-0 flex-1 space-y-1.5">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="px-2 py-0.5 text-[8px] font-extrabold rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase">
                                        {note.subjectName}
                                      </span>
                                      <h4 className="text-xs font-bold text-slate-200 truncate">
                                        {note.title}
                                      </h4>
                                    </div>
                                    {note.description && (
                                      <p className="text-[10px] text-slate-400 leading-relaxed line-clamp-2">
                                        {note.description}
                                      </p>
                                    )}
                                    <div className="flex items-center gap-2 text-[9px] text-slate-500 font-semibold pt-1 border-t border-slate-900 mt-1">
                                      <span>By: {note.uploadedByName}</span>
                                      <span>&bull;</span>
                                      <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                                    </div>
                                  </div>

                                  <a
                                    href={`/dashboard/notes/view/${note.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-600 hover:text-white rounded-lg font-bold text-[9px] transition-all shrink-0 cursor-pointer shadow-sm active:scale-95"
                                  >
                                    <ExternalLink className="w-3 h-3" /> View PDF
                                  </a>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                      </div>
                    )}
                  </div>
                )}

                {/* 6. HOMEWORK TAB */}
                {activeTab === 'homework' && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <div>
                      <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Batch Homework Tasks</h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        Create homework tasks, specify due dates, and optionally attach reference PDF exercise sheets for this batch.
                      </p>
                    </div>

                    {batchDetails.subjects.length === 0 ? (
                      <div className="p-3.5 bg-amber-500/5 border border-amber-500/10 rounded-xl text-xs text-amber-405 flex items-center gap-2.5">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        Please assign at least one active subject in the **Subjects** tab before assigning homework.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                        
                        {/* Homework Form (5/12 cols) */}
                        <form onSubmit={handleHomeworkSubmit} className="md:col-span-5 bg-slate-955/40 p-4 rounded-xl border border-slate-850/80 space-y-4 text-xs">
                          <h5 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <FileText className="w-4 h-4 text-indigo-400" /> Assign Homework
                          </h5>

                          {/* Subject */}
                          <div className="space-y-1">
                            <label className="block text-slate-400 font-bold text-[10px] uppercase tracking-wider">Subject *</label>
                            <select
                              value={hwSubject}
                              onChange={(e) => setHwSubject(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 text-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 cursor-pointer"
                              required
                            >
                              <option value="">Select subject...</option>
                              {batchDetails.subjects.map(s => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          </div>

                          {/* Title */}
                          <div className="space-y-1">
                            <label className="block text-slate-400 font-bold text-[10px] uppercase tracking-wider">Task Title *</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Physics Motion Exercise Sheet"
                              value={hwTitle}
                              onChange={(e) => setHwTitle(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 text-slate-202 placeholder-slate-650 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                            />
                          </div>

                          {/* Description */}
                          <div className="space-y-1">
                            <label className="block text-slate-400 font-bold text-[10px] uppercase tracking-wider">Instructions & Syllabus *</label>
                            <textarea
                              rows={2}
                              required
                              placeholder="Solve exercises on page 24-25. Show detailed steps..."
                              value={hwDescription}
                              onChange={(e) => setHwDescription(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-955/60 border border-slate-800 text-slate-202 placeholder-slate-650 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 resize-none"
                            />
                          </div>

                          {/* Due Date */}
                          <div className="space-y-1">
                            <label className="block text-slate-400 font-bold text-[10px] uppercase tracking-wider">Submission Due Date *</label>
                            <input
                              type="date"
                              required
                              value={hwDueDate}
                              onChange={(e) => setHwDueDate(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-955/60 border border-slate-800 text-slate-202 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 cursor-pointer"
                            />
                          </div>

                          {/* File Dropzone */}
                          <div className="space-y-1">
                            <label className="block text-slate-400 font-bold text-[10px] uppercase tracking-wider">Reference Attachment (Optional)</label>
                            <div className="relative border border-dashed border-slate-800 hover:border-indigo-500 rounded-xl p-3 text-center cursor-pointer bg-slate-955/20 transition-colors">
                              <input
                                ref={hwFileInputRef}
                                type="file"
                                accept=".pdf"
                                onChange={handleHwFileChange}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                              />
                              <UploadCloud className="w-5 h-5 text-slate-500 mx-auto mb-1" />
                              <p className="font-bold text-[9px] text-slate-300 truncate px-2">
                                {hwPdfFile ? hwPdfFile.name : 'Attach exercise sheet PDF'}
                              </p>
                              <p className="text-[8px] text-slate-500 mt-0.5">PDF format only, Max 10MB</p>
                            </div>
                          </div>

                          {hwFormError && (
                            <div className="p-2.5 bg-rose-500/5 border border-rose-500/10 text-rose-400 rounded-xl text-center font-bold text-[10px]">
                              {hwFormError}
                            </div>
                          )}

                          {hwFormSuccess && (
                            <div className="p-2.5 bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 rounded-xl text-center font-bold text-[10px]">
                              {hwFormSuccess}
                            </div>
                          )}

                          <button
                            type="submit"
                            disabled={hwUploading || saveHomeworkMutation.isPending}
                            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50 active:scale-95"
                          >
                            {hwUploading || saveHomeworkMutation.isPending ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                {hwUploading ? 'Uploading to Cloudinary...' : 'Saving to Database...'}
                              </>
                            ) : (
                              <>
                                <PlusCircle className="w-3.5 h-3.5" />
                                Assign Homework Task
                              </>
                            )}
                          </button>
                        </form>

                        {/* Homework List (7/12 cols) */}
                        <div className="md:col-span-7 space-y-3">
                          <h5 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                            Assigned Homework Tasks ({batchHomeworks.length})
                          </h5>

                          {batchHomeworks.length === 0 ? (
                            <div className="py-16 text-center border border-dashed border-slate-850 rounded-xl text-slate-500 text-xs bg-slate-950/10">
                              No homework tasks assigned yet for this batch.
                            </div>
                          ) : (
                            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                              {batchHomeworks.map(hw => (
                                <div key={hw.id} className="bg-slate-955/30 border border-slate-900 p-3.5 rounded-xl flex items-start justify-between gap-4 shadow-sm hover:border-slate-800/80 transition-colors">
                                  <div className="min-w-0 flex-1 space-y-1.5">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="px-2 py-0.5 text-[8px] font-extrabold rounded bg-amber-500/10 text-amber-405 border border-amber-500/20 uppercase">
                                        {hw.subjectName}
                                      </span>
                                      <h4 className="text-xs font-bold text-slate-200 truncate">
                                        {hw.title}
                                      </h4>
                                    </div>
                                    <p className="text-[10px] text-slate-400 leading-relaxed line-clamp-2">
                                      {hw.description}
                                    </p>
                                    <div className="flex items-center justify-between gap-2 text-[9px] text-slate-500 font-semibold pt-1.5 border-t border-slate-900 mt-1.5">
                                      <span>By: {hw.createdByName}</span>
                                      <span className="flex items-center gap-1 text-indigo-400">
                                        <Calendar className="w-3.5 h-3.5" />
                                        Due: {new Date(hw.dueDate).toLocaleDateString()}
                                      </span>
                                    </div>
                                  </div>

                                  {hw.fileUrl && (
                                    <a
                                      href={hw.fileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-600 hover:text-white rounded-lg font-bold text-[9px] transition-all shadow-sm shrink-0 cursor-pointer active:scale-95"
                                    >
                                      <ExternalLink className="w-3 h-3" /> Sheets
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                      </div>
                    )}
                  </div>
                )}

                {/* 7. TESTS TAB */}
                {activeTab === 'tests' && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <div>
                      <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Batch Academic Tests</h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        Schedule and coordinate offline unit assessments, quizzes, and term exams for this batch.
                      </p>
                    </div>

                    {batchDetails.subjects.length === 0 ? (
                      <div className="p-3.5 bg-amber-500/5 border border-amber-500/10 rounded-xl text-xs text-amber-400 flex items-center gap-2.5">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        Please assign at least one active subject in the **Subjects** tab before scheduling tests.
                      </div>
                    ) : (
                      <form onSubmit={handleAddTest} className="bg-slate-955/40 p-4 rounded-xl border border-slate-850/80 space-y-4 text-xs">
                        <h5 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                          Schedule New Academic Assessment
                        </h5>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="space-y-1">
                            <label className="block text-slate-400 font-bold text-[10px] uppercase tracking-wider">Test Title *</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Unit Test 1: Calculus"
                              value={testTitle}
                              onChange={(e) => setTestTitle(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 text-slate-200 placeholder-slate-650 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="block text-slate-400 font-bold text-[10px] uppercase tracking-wider">Subject *</label>
                            <select
                              value={testSubject}
                              onChange={(e) => setTestSubject(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 text-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 cursor-pointer"
                            >
                              <option value="">Select subject...</option>
                              {batchDetails.subjects.map(s => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="block text-slate-400 font-bold text-[10px] uppercase tracking-wider">Test Date *</label>
                            <input
                              type="date"
                              required
                              value={testDate}
                              onChange={(e) => setTestDate(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-955/60 border border-slate-800 text-slate-202 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 cursor-pointer"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="block text-slate-400 font-bold text-[10px] uppercase tracking-wider">Maximum Marks *</label>
                            <input
                              type="number"
                              required
                              min={1}
                              value={testMaxMarks}
                              onChange={(e) => setTestMaxMarks(parseInt(e.target.value))}
                              className="w-full px-3 py-2 bg-slate-955/60 border border-slate-800 text-slate-202 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                            />
                          </div>

                          <div className="md:col-span-4 space-y-1">
                            <label className="block text-slate-400 font-bold text-[10px] uppercase tracking-wider">Syllabus / Details</label>
                            <textarea
                              rows={2}
                              placeholder="Topics, formula requirements, exam rules..."
                              value={testDescription}
                              onChange={(e) => setTestDescription(e.target.value)}
                              className="w-full px-3.5 py-2.5 bg-slate-955/60 border border-slate-800 text-slate-202 placeholder-slate-650 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 resize-none"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={addTestMutation.isPending}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-indigo-655/10 disabled:opacity-50 active:scale-95"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          Schedule Batch Test
                        </button>
                      </form>
                    )}

                    {/* Tests List */}
                    <div className="space-y-3">
                      <h5 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                        Scheduled Tests List ({batchTests.length})
                      </h5>

                      {batchTests.length === 0 ? (
                        <div className="py-10 text-center border border-dashed border-slate-850 rounded-xl text-xs text-slate-500 bg-slate-950/10">
                          No exams or tests scheduled yet.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {batchTests.map(test => (
                            <div key={test.id} className="bg-slate-955/30 border border-slate-900 p-3.5 rounded-xl flex items-start justify-between gap-4 shadow-sm hover:border-slate-800/80 transition-colors">
                              <div className="min-w-0 space-y-1.5 flex-1">
                                <div className="flex items-center gap-2">
                                  <Award className="w-4 h-4 text-rose-400 shrink-0" />
                                  <h4 className="text-xs font-bold text-slate-200 truncate">
                                    {test.title}
                                  </h4>
                                </div>
                                {test.description && (
                                  <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                                    {test.description}
                                  </p>
                                )}
                                <div className="flex items-center justify-between gap-2 text-[9px] font-bold text-slate-500 pt-2 border-t border-slate-900 mt-1">
                                  <span className="uppercase text-rose-400">{test.subjectName} &bull; {test.maxMarks} Marks</span>
                                  <span className="flex items-center gap-1 text-slate-400">
                                    <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                                    Date: {new Date(test.testDate).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>

                              <button
                                onClick={() => deleteTestMutation.mutate(test.id)}
                                className="p-1.5 text-slate-500 hover:text-rose-405 hover:bg-rose-955/20 rounded-lg cursor-pointer transition-colors"
                                title="Delete Test"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 8. ANNOUNCEMENTS TAB */}
                {activeTab === 'announcements' && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <div>
                      <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Batch Announcements</h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        Broadcast alert notices and academic updates pinned directly to this batch's student dashboard stream.
                      </p>
                    </div>

                    {/* Announcement Form */}
                    <form onSubmit={handleAddAnnouncement} className="bg-slate-955/40 p-4 rounded-xl border border-slate-850/80 space-y-4 text-xs">
                      <h5 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Megaphone className="w-4 h-4 text-indigo-400" /> Broadcast Batch Notice
                      </h5>

                      <div className="space-y-4">
                        <div className="space-y-1">
                          <label className="block text-slate-400 font-bold text-[10px] uppercase tracking-wider">Notice Title *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Special Practical Class Scheduled"
                            value={annTitle}
                            onChange={(e) => setAnnTitle(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 text-slate-200 placeholder-slate-650 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-slate-400 font-bold text-[10px] uppercase tracking-wider">Broadcast message details *</label>
                          <textarea
                            rows={3}
                            required
                            placeholder="Type details, rules, or requirements..."
                            value={annMessage}
                            onChange={(e) => setAnnMessage(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 text-slate-200 placeholder-slate-650 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={addAnnouncementMutation.isPending}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-indigo-650/15 disabled:opacity-50 active:scale-95"
                      >
                        <Megaphone className="w-3.5 h-3.5" />
                        Broadcast Batch Announcement
                      </button>
                    </form>

                    {/* Announcements List */}
                    <div className="space-y-3">
                      <h5 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                        Current Batch Notices ({batchAnnouncements.length})
                      </h5>

                      {batchAnnouncements.length === 0 ? (
                        <div className="py-10 text-center border border-dashed border-slate-850 rounded-xl text-xs text-slate-500 bg-slate-950/10">
                          No batch notices broadcasted yet.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {batchAnnouncements.map(ann => (
                            <div key={ann.id} className="bg-slate-955/30 border border-slate-900 p-4 rounded-xl shadow-sm space-y-2 hover:border-slate-800/85 transition-colors">
                              <div className="flex items-center justify-between gap-4">
                                <h4 className="text-xs font-bold text-slate-200">
                                  {ann.title}
                                </h4>
                                <span className="px-2 py-0.5 text-[8px] font-extrabold bg-amber-500/10 text-amber-400 border border-amber-500/15 rounded-full uppercase tracking-wider shrink-0">
                                  Pinned Alert
                                </span>
                              </div>
                              <p className="text-xs text-slate-405 leading-relaxed">
                                {ann.message}
                              </p>
                              <div className="text-[9px] font-bold text-slate-500 pt-2 border-t border-slate-900 mt-1.5 flex items-center gap-2">
                                <span>Broadcast by {ann.createdByName}</span>
                                <span>&bull;</span>
                                <span>{new Date(ann.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>

            </div>
          )}

        </div>

      </div>

      {/* CREATE BATCH DIALOG MODAL (ADMIN ONLY) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="fixed inset-0"
            onClick={() => setShowCreateModal(false)}
          />
          
          <div className="relative bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 space-y-5">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">Create Offline Academic Batch</h3>
              <p className="text-xs text-slate-500">
                Setup a new offline batch level.
              </p>
            </div>

            <form onSubmit={handleCreateBatch} className="space-y-4 text-xs">
              {/* Batch Name */}
              <div className="space-y-1.5">
                <label className="block text-slate-400 font-bold text-[10px] uppercase tracking-wider">Batch Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Class IX Evening Cohort"
                  value={newBatchName}
                  onChange={(e) => setNewBatchName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950/60 border border-slate-800 text-slate-200 placeholder-slate-650 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-550"
                />
              </div>

              {/* Level */}
              <div className="space-y-1.5">
                <label className="block text-slate-400 font-bold text-[10px] uppercase tracking-wider">Batch Grade Level *</label>
                <select
                  value={newBatchLevel}
                  onChange={(e) => setNewBatchLevel(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 text-slate-202 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  {BATCH_LEVELS.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>

              {createBatchError && (
                <p className="text-[10px] text-rose-400 font-bold flex items-center gap-1 bg-rose-500/5 p-2 rounded-lg border border-rose-500/10">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  {createBatchError}
                </p>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createBatchMutation.isPending}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all cursor-pointer shadow-md shadow-indigo-650/15 flex items-center gap-1.5 disabled:opacity-50 active:scale-95"
                >
                  {createBatchMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Create Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );

}
