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
  ChevronRight,
  Mail,
  Check,
  Info
} from 'lucide-react';

interface BatchDTO {
  id: number;
  name: string;
  level: string;
  instructorIds: number[];
  instructors: { id: number; name: string }[];
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
  uploadedById: number;
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
  createdById: number;
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

import UploadMarksModal from './UploadMarksModal';
import AssignmentsPanel from './AssignmentsPanel';

const BATCH_LEVELS = ['Class V', 'Class VI', 'Class VII', 'Class VIII', 'Class IX', 'Class X', 'Foundation', 'Sanskrit Vedic'];
const ACADEMIC_SUBJECTS = ['English', 'English Grammar', 'Hindi', 'Hindi Grammar', 'Sanskrit', 'Sanskrit Grammar', 'Mathematics', 'Science', 'Social Science', 'Biology', 'Computer Science'];

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
  const [newBatchInstructorIds, setNewBatchInstructorIds] = useState<number[]>([]);
  const [createBatchError, setCreateBatchError] = useState('');

  // Tab Form states
  const [selectedStudentToAdd, setSelectedStudentToAdd] = useState('');
  const [scheduleDay, setScheduleDay] = useState('Monday');
  const [scheduleSubject, setScheduleSubject] = useState('');
  const [scheduleStartTime, setScheduleStartTime] = useState('10:00');
  const [scheduleEndTime, setScheduleEndTime] = useState('11:00');
  const [scheduleLocation, setScheduleLocation] = useState('Room 101');
  const [scheduleDate, setScheduleDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [scheduleIsRecurring, setScheduleIsRecurring] = useState(true);

  // Attendance marking states
  const [attendanceSubject, setAttendanceSubject] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<number, 'PRESENT' | 'ABSENT'>>({});
  const [attendanceSearchQuery, setAttendanceSearchQuery] = useState('');

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

  // Google Drive Sync State & Handler
  const [syncingDrive, setSyncingDrive] = useState(false);
  const handleSyncGoogleDrive = async () => {
    setSyncingDrive(true);
    try {
      const response = await api.post('/admin/sync/drive');
      if (response.data.success) {
        alert('Google Drive synchronization completed successfully!');
        refetchNotes();
        refetchHomeworks();
      } else {
        alert(response.data.message || 'Sync failed.');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to sync with Google Drive. Check backend configuration.');
    } finally {
      setSyncingDrive(false);
    }
  };

  // Test states
  const [testTitle, setTestTitle] = useState('');
  const [testDescription, setTestDescription] = useState('');
  const [testSubject, setTestSubject] = useState('');
  const [testDate, setTestDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [testMaxMarks, setTestMaxMarks] = useState(25);
  const [selectedTestForMarks, setSelectedTestForMarks] = useState<TestDTO | null>(null);

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

  // Fetch all instructors (admin only, for batch assignments)
  const { data: allInstructors = [] } = useQuery<UserDTO[]>({
    queryKey: ['all-instructors-workspace-assign'],
    enabled: user?.role === 'ADMIN',
    queryFn: async () => {
      const response = await api.get('/users/instructors');
      return response.data.success ? response.data.data : [];
    }
  });

  // 4. Fetch schedules for selected batch
  const { data: batchSchedules = [], refetch: refetchSchedules } = useQuery<ScheduleEvent[]>({
    queryKey: ['batch-schedules-workspace', selectedBatchId],
    queryFn: async () => {
      if (!selectedBatchId) return [];
      const url = user?.role === 'ADMIN' ? '/admin/schedules' : '/instructor/schedules';
      const response = await api.get(url);
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

  // Filtered lists for attendance search
  const filteredStudentsForAttendance = batchDetails?.students.filter(st =>
    st.name.toLowerCase().includes(attendanceSearchQuery.toLowerCase())
  ) || [];

  const filteredAttendanceLogs = attendanceLogs.filter(log =>
    log.studentName.toLowerCase().includes(attendanceSearchQuery.toLowerCase())
  );

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
      setNewBatchInstructorIds([]);
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

  // Assign Instructors & Subjects (Admin only)
  const updateAssignmentsMutation = useMutation({
    mutationFn: async (payload: { batchId: number; instructorIds: number[]; subjects: string[] }) => {
      await api.put(`/instructor/batches/${payload.batchId}/assignments`, {
        instructorIds: payload.instructorIds,
        subjects: payload.subjects
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batch-details-workspace', selectedBatchId] });
      queryClient.invalidateQueries({ queryKey: ['instructor-batches-workspace'] });
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

  // Send Report Cards Mutation
  const sendReportCardsMutation = useMutation({
    mutationFn: async (testId: number) => {
      const response = await api.post(`/tests/${testId}/send-emails`);
      return response.data;
    },
    onSuccess: () => {
      alert('Report cards are being sent asynchronously to all students.');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to send report cards.');
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

  // Delete Note Mutation
  const deleteNoteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/instructor/notes/${id}`);
    },
    onSuccess: () => {
      refetchNotes();
      alert('Study note deleted successfully.');
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to delete note.');
    }
  });

  // Delete Homework Mutation
  const deleteHomeworkMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/instructor/homework/${id}`);
    },
    onSuccess: () => {
      refetchHomeworks();
      alert('Homework assignment deleted successfully.');
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to delete homework.');
    }
  });

  // Delete Announcement Mutation
  const deleteAnnouncementMutation = useMutation({
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

  // ────────────────────────────────────────────────────────────────────────
  // ACTIONS & SUBMISSIONS HANDLERS
  // ────────────────────────────────────────────────────────────────────────

  const handleCreateBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBatchName.trim()) return;
    createBatchMutation.mutate({
      name: newBatchName,
      level: newBatchLevel,
      instructorIds: newBatchInstructorIds
    });
  };

  const handleAssignInstructors = (batchId: number, instructorIds: number[]) => {
    updateAssignmentsMutation.mutate({ batchId, instructorIds: instructorIds, subjects: batchDetails?.subjects || [] });
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

  const [sendingEmailStudentId, setSendingEmailStudentId] = useState<number | null>(null);

  const handleSendWelcomeEmail = async (student: { id: number; name: string; email: string }) => {
    const pwd = prompt(`Enter portal login password for student "${student.name}" (${student.email}):`);
    if (!pwd || !pwd.trim()) return;

    try {
      setSendingEmailStudentId(student.id);
      const params = new URLSearchParams();
      params.append('email', student.email);
      params.append('studentName', student.name);
      params.append('password', pwd.trim());
      if (batchDetails) {
        params.append('batchName', batchDetails.name);
      }

      await api.post(`/admin/send-welcome-credentials?${params.toString()}`);
      alert(`Welcome credentials email successfully sent to ${student.email}!`);
    } catch (err: any) {
      alert(`Failed to send welcome email: ${err?.response?.data?.message || err.message || 'Error occurred'}`);
    } finally {
      setSendingEmailStudentId(null);
    }
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
    updateAssignmentsMutation.mutate({ 
      batchId: batchDetails.id, 
      instructorIds: batchDetails.instructors?.map((i: any) => i.id) || [],
      subjects: [subject] 
    });
  };

  const handleAddSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchDetails || !scheduleSubject) return;

    // Derived day of week from the selected date if recurring (using local date parsing)
    const dateParts = scheduleDate.split('-');
    const selectedDateObj = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const autoDay = weekdays[selectedDateObj.getDay()];

    addScheduleMutation.mutate({
      title: `${scheduleSubject} Class`,
      description: `Regular offline lecture for ${batchDetails.name}`,
      eventType: 'CLASS',
      batchId: batchDetails.id,
      subjectName: scheduleSubject,
      targetRole: 'STUDENT',
      eventDate: scheduleDate,
      startTime: scheduleStartTime,
      endTime: scheduleEndTime,
      location: scheduleLocation,
      meetingLink: '',
      isRecurring: scheduleIsRecurring,
      recurrenceDay: scheduleIsRecurring ? autoDay : null
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
    if (!selectedBatchId || !hwTitle.trim() || !hwSubject || !hwPdfFile) {
      setHwFormError('Please select a batch, fill in the title, and select a homework PDF file.');
      return;
    }

    setHwUploading(true);
    setHwFormError('');
    setHwFormSuccess('');

    try {
      const formData = new FormData();
      formData.append('file', hwPdfFile);
      formData.append('title', hwTitle.trim());
      formData.append('description', hwDescription.trim());
      formData.append('subjectName', hwSubject);
      formData.append('dueDate', hwDueDate ? `${hwDueDate}T23:59:59` : '');

      const response = await api.post(`/instructor/batches/${selectedBatchId}/homework`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        refetchHomeworks();
        setHwTitle('');
        setHwDescription('');
        setHwPdfFile(null);
        if (hwFileInputRef.current) hwFileInputRef.current.value = '';
        setHwFormSuccess('Homework assigned and secure-mapped successfully.');
        setHwFormError('');
        setTimeout(() => setHwFormSuccess(''), 4000);
      } else {
        throw new Error(response.data.message || 'Homework upload failed.');
      }

    } catch (err: any) {
      setHwFormError(err.response?.data?.message || err.message || 'File upload failed. Please try again.');
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
    <div className="space-y-6 text-xs sm:text-sm animate-in fade-in duration-300 text-foreground">

      {/* Header Hero Card */}
      <div className="hero-header-card">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-card rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent-blue/20 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4"></div>

        <div className="relative z-10">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-white bg-white/20 px-3 py-1.5 rounded-lg backdrop-blur-md border border-white/30 shadow-sm">
            Academic Panel
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white mt-4 tracking-tight drop-shadow-sm">
            Batch Management
          </h2>
          <p className="text-xs sm:text-sm text-indigo-100 mt-2 leading-relaxed max-w-2xl font-medium">
            Configure offline batches, assign academic curriculum subjects, schedule timings, upload secure notes, assign homework, and mark attendance.
          </p>
        </div>

        <div className="relative z-10 flex flex-col sm:items-end gap-3 w-full sm:w-auto">
          {user?.role === 'ADMIN' && (
            <button
              onClick={handleSyncGoogleDrive}
              disabled={syncingDrive}
              type="button"
              title="Backup newly uploaded Notes to Google Drive (Scheduled automatically at 11:00 PM)"
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-5 py-3 bg-white hover:bg-indigo-50 disabled:opacity-80 text-indigo-600 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
            >
              {syncingDrive ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Backing up Notes...
                </>
              ) : (
                <>
                  <Folder className="w-4 h-4" />
                  Backup Notes to Drive
                </>
              )}
            </button>
          )}

          {user?.role === 'ADMIN' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-650/15 cursor-pointer shrink-0 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Create Academic Batch
            </button>
          )}
        </div>
      </div>

      {/* Main Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* LEFT COLUMN: Batches List Sidebar (4/12 cols) */}
        <div className="lg:col-span-4 panel-sidebar">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            Assigned Offline Batches ({batches.length})
          </h3>

          {isBatchesLoading ? (
            <div className="py-16 text-center flex flex-col items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
              <span className="text-xs text-muted-foreground font-medium">Syncing batches...</span>
            </div>
          ) : batches.length === 0 ? (
            <div className="py-12 px-4 text-center border border-dashed border-border-color rounded-xl bg-muted/20 text-muted-foreground space-y-2">
              <BookOpen className="w-8 h-8 text-muted-foreground mx-auto" />
              <p className="text-xs font-bold text-foreground">No academic batches created</p>
              <p className="text-[11px] text-muted-foreground">Administrators can create batches to begin onboarding.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin">
              {batches.map((b) => {
                const isSelected = b.id === selectedBatchId;
                return (
                  <div
                    key={b.id}
                    className={`group interactive-card flex items-center justify-between gap-3 cursor-pointer select-none ${isSelected ? 'interactive-card-active' : ''
                      }`}
                    onClick={() => handleBatchSelect(b.id)}
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-indigo-500/10 text-indigo-450 uppercase border border-indigo-500/20">
                          {b.level}
                        </span>
                        <h4 className={`text-xs font-black truncate transition-colors ${isSelected ? 'text-indigo-500 dark:text-indigo-400' : 'text-foreground'
                          }`}>
                          {b.name}
                        </h4>
                      </div>
                      <div className="text-[10px] text-muted-foreground font-medium flex flex-wrap justify-between items-center gap-2">
                        <span>{b.studentCount} Students</span>
                        <span>
                          Teacher: <span className="text-foreground font-bold">{b.instructors?.map(i => i.name).join(', ') || 'Unassigned'}</span>
                        </span>
                      </div>
                    </div>

                    {user?.role === 'ADMIN' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteBatch(b.id);
                        }}
                        className="p-1.5 bg-card border border-border-color text-muted-foreground hover:text-rose-400 hover:bg-rose-950/30 rounded-lg cursor-pointer transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
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
            <div className="glass-card border border-border-color rounded-3xl p-8 text-center shadow-sm space-y-4 py-24 bg-card dark:bg-card">
              <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl flex items-center justify-center mx-auto shadow-inner">
                {activeTab === 'notes' ? <FileText className="w-6 h-6" /> : activeTab === 'homework' ? <BookOpen className="w-6 h-6" /> : <Layers className="w-6 h-6" />}
              </div>
              <div className="space-y-4 max-w-sm mx-auto">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">
                  {activeTab === 'notes' ? 'Publish Notes' : activeTab === 'homework' ? 'Assign Homework' : 'Batch Console Inactive'}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {activeTab === 'notes' 
                    ? 'Please select a batch to upload notes and study materials.' 
                    : activeTab === 'homework' 
                    ? 'Please select a batch to assign homework.' 
                    : 'Select an offline academic batch to load student rosters, class timetables, attendance registers, and assignments.'}
                </p>
                <div className="pt-4 max-w-xs mx-auto">
                  <select 
                    className="w-full px-4 py-3 bg-card border border-border-color text-foreground font-medium rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 cursor-pointer shadow-sm"
                    onChange={(e) => handleBatchSelect(Number(e.target.value))}
                    value=""
                  >
                    <option value="" disabled>-- Choose a batch --</option>
                    {batches.map(b => (
                      <option key={b.id} value={b.id}>{b.name} ({b.level})</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ) : isDetailsLoading || !batchDetails ? (
            <div className="glass-card backdrop-blur-md border border-border-color rounded-2xl p-20 text-center shadow-xl flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-505" />
              <span className="text-xs text-muted-foreground font-medium animate-pulse">Syncing batch workspace details...</span>
            </div>
          ) : (
            <div className="glass-card backdrop-blur-md border border-border-color rounded-2xl shadow-xl overflow-hidden flex flex-col animate-in fade-in duration-300">

              {/* Batch Banner Header */}
              <div className="p-4 sm:p-5 bg-card border-b border-border-color flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[8px] font-extrabold rounded-full bg-indigo-600 text-white uppercase tracking-wider">
                      {batchDetails.level}
                    </span>
                    <h3 className="text-base font-black text-foreground">
                      {batchDetails.name}
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground font-medium flex items-center gap-2">
                    <span>Instructors (Class Teachers):</span>
                    <span className="font-bold text-indigo-400">{batchDetails.instructors?.map((i: any) => i.name).join(', ') || 'Unassigned'}</span>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {batchDetails.subjects.map(s => (
                    <span key={s} className="px-2 py-0.5 text-[9px] font-bold rounded-lg border border-border-color text-foreground bg-card">
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
              <div className="flex items-center gap-1 px-4 border-b border-border-color bg-card overflow-x-auto scrollbar-none">
                {([
                  { id: 'students', label: 'Students' },
                  { id: 'subjects', label: 'Assignments' },
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
                      className={`px-3.5 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${isActive
                        ? 'border-indigo-500 text-indigo-400 font-extrabold'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
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
                      <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Batch Student Roster</h4>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        Verify and organize students assigned to this offline cohort. Note that students can belong to only one batch at a time.
                      </p>
                    </div>

                    {user?.role === 'ADMIN' ? (
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-card p-3.5 rounded-xl border border-border-color">
                        <div className="relative flex-1">
                          <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                          <select
                            value={selectedStudentToAdd}
                            onChange={(e) => setSelectedStudentToAdd(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-card border border-border-color text-foreground placeholder-slate-600 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 cursor-pointer"
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
                      <div className="p-3.5 bg-card border border-border-color rounded-xl text-xs text-muted-foreground flex items-center gap-2.5 font-medium">
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 animate-pulse" />
                        <span>Student batch enrollment and assignments are managed at the Administrator level. Instructors have read-only roster access.</span>
                      </div>
                    )}

                    {/* Students List */}
                    <div className="space-y-3">
                      <h5 className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">
                        Assigned Student List ({batchDetails.students.length})
                      </h5>

                      {batchDetails.students.length === 0 ? (
                        <div className="py-10 text-center border border-dashed border-border-color rounded-xl text-xs text-muted-foreground bg-card">
                          No students currently enrolled in this batch.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {batchDetails.students.map((st) => (
                            <div
                              key={st.id}
                              className="bg-card border border-border-color p-3 rounded-xl flex items-center justify-between gap-3 shadow-sm hover:border-border-color transition-colors"
                            >
                              <div className="min-w-0 space-y-0.5">
                                <h4 className="text-xs font-bold text-slate-205 truncate">
                                  {st.name}
                                </h4>
                                <p className="text-[10px] text-muted-foreground truncate">
                                  {st.email}
                                </p>
                              </div>

                              {user?.role === 'ADMIN' && (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleSendWelcomeEmail(st)}
                                    disabled={sendingEmailStudentId === st.id}
                                    className="p-1.5 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-lg cursor-pointer transition-colors"
                                    title="Send Portal Login Credentials Email to student"
                                  >
                                    {sendingEmailStudentId === st.id ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <Mail className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                  <button
                                    onClick={() => handleRemoveStudent(st.id)}
                                    disabled={assignStudentsMutation.isPending}
                                    className="p-1.5 text-muted-foreground hover:text-rose-455 hover:bg-rose-955/20 rounded-lg cursor-pointer transition-colors"
                                    title="Remove student from batch"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 2. ASSIGNMENTS TAB */}
                {activeTab === 'subjects' && (
                  <AssignmentsPanel
                    batchId={batchDetails.id}
                    batchName={batchDetails.name}
                    initialInstructors={batchDetails.instructors || []}
                    initialSubjects={batchDetails.subjects || []}
                    allInstructors={allInstructors}
                    allSubjects={Array.from(new Set([...ACADEMIC_SUBJECTS, ...(batchDetails.subjects || [])]))}
                    onSave={(instructorIds, subjects) => {
                      Promise.all([
                        assignInstructorMutation.mutateAsync({ batchId: batchDetails.id, instructorIds }),
                        assignSubjectsMutation.mutateAsync({ batchId: batchDetails.id, subjects })
                      ]).then(() => {
                        alert('Assignments saved successfully!');
                        queryClient.invalidateQueries({ queryKey: ['batch', batchDetails.id] });
                      }).catch(err => {
                        console.error("Failed to save assignments", err);
                        alert("Failed to save assignments");
                      });
                    }}
                    isSaving={assignInstructorMutation.isPending || assignSubjectsMutation.isPending}
                  />
                )}

                {/* 3. SCHEDULE TAB */}
                {activeTab === 'schedule' && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <div>
                      <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Class Timings & Weekly Planner</h4>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
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
                      <form onSubmit={handleAddSchedule} className="bg-card p-4 rounded-xl border border-border-color space-y-4 text-xs">
                        <h5 className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">
                          Schedule New Lecture Timing
                        </h5>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                          {/* Subject */}
                          <div className="space-y-1">
                            <label className="block text-muted-foreground font-bold text-[10px] uppercase tracking-wider">Subject *</label>
                            <select
                              value={scheduleSubject}
                              onChange={(e) => setScheduleSubject(e.target.value)}
                              className="w-full px-3 py-2 bg-card border border-border-color text-foreground rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 cursor-pointer"
                            >
                              {batchDetails.subjects.map(s => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          </div>

                          {/* Start / Event Date */}
                          <div className="space-y-1">
                            <label className="block text-muted-foreground font-bold text-[10px] uppercase tracking-wider">Date *</label>
                            <input
                              type="date"
                              required
                              value={scheduleDate}
                              onChange={(e) => setScheduleDate(e.target.value)}
                              className="w-full px-3 py-2 bg-card border border-border-color text-slate-202 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 cursor-pointer"
                            />
                          </div>

                          {/* Is Recurring Select */}
                          <div className="space-y-1">
                            <label className="block text-muted-foreground font-bold text-[10px] uppercase tracking-wider">Frequency *</label>
                            <select
                              value={scheduleIsRecurring ? 'true' : 'false'}
                              onChange={(e) => setScheduleIsRecurring(e.target.value === 'true')}
                              className="w-full px-3 py-2 bg-card border border-border-color text-slate-202 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 cursor-pointer"
                            >
                              <option value="true">Weekly Recurring Class</option>
                              <option value="false">One-time Class Only</option>
                            </select>
                          </div>

                          {/* Location */}
                          <div className="space-y-1">
                            <label className="block text-muted-foreground font-bold text-[10px] uppercase tracking-wider">Classroom / Room *</label>
                            <input
                              type="text"
                              required
                              value={scheduleLocation}
                              onChange={(e) => setScheduleLocation(e.target.value)}
                              placeholder="e.g. Room 201"
                              className="w-full px-3 py-2 bg-card border border-border-color text-slate-202 placeholder-slate-650 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                            />
                          </div>

                          {/* Start Time */}
                          <div className="space-y-1">
                            <label className="block text-muted-foreground font-bold text-[10px] uppercase tracking-wider">Start Time *</label>
                            <input
                              type="time"
                              required
                              value={scheduleStartTime}
                              onChange={(e) => setScheduleStartTime(e.target.value)}
                              className="w-full px-3 py-2 bg-card border border-border-color text-slate-202 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 cursor-pointer"
                            />
                          </div>

                          {/* End Time */}
                          <div className="space-y-1">
                            <label className="block text-muted-foreground font-bold text-[10px] uppercase tracking-wider">End Time *</label>
                            <input
                              type="time"
                              required
                              value={scheduleEndTime}
                              onChange={(e) => setScheduleEndTime(e.target.value)}
                              className="w-full px-3 py-2 bg-card border border-border-color text-slate-202 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 cursor-pointer"
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
                      <h5 className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">
                        Current Weekly Schedule Timetable
                      </h5>

                      {batchSchedules.length === 0 ? (
                        <div className="py-10 text-center border border-dashed border-border-color rounded-xl text-xs text-muted-foreground bg-card">
                          No class timings scheduled yet for this batch.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(dayName => {
                            const dayEvents = batchSchedules.filter(e => {
                              if (e.recurrenceDay && e.recurrenceDay.trim().toLowerCase() === dayName.toLowerCase()) return true;
                              if (!e.recurrenceDay && e.eventDate) {
                                const parts = e.eventDate.split('-');
                                const dt = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                                const names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                                return names[dt.getDay()] === dayName;
                              }
                              return false;
                            });
                            if (dayEvents.length === 0) return null;

                            return (
                              <div key={dayName} className="space-y-2 bg-card p-3.5 rounded-xl border border-border-color">
                                <h6 className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">
                                  {dayName}
                                </h6>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {dayEvents.map(event => (
                                    <div key={event.id} className="bg-card border border-border-color p-3 rounded-xl flex items-center justify-between gap-3 shadow-sm hover:border-border-color transition-colors">
                                      <div className="min-w-0 space-y-1">
                                        <div className="flex items-center gap-1.5">
                                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                                          <h4 className="text-xs font-bold text-slate-205 truncate">
                                            {event.subjectName}
                                          </h4>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[9px] text-muted-foreground font-semibold">
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
                                        className="p-1.5 text-muted-foreground hover:text-rose-455 hover:bg-rose-955/20 rounded-lg cursor-pointer transition-colors"
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
                      <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Batch Attendance Register</h4>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-card p-4 rounded-xl border border-border-color text-xs">
                          {/* Subject Select */}
                          <div className="space-y-1">
                            <label className="block text-muted-foreground font-bold text-[10px] uppercase tracking-wider">Select Subject *</label>
                            <select
                              value={attendanceSubject}
                              onChange={(e) => setAttendanceSubject(e.target.value)}
                              className="w-full px-3 py-2 bg-card border border-border-color text-foreground rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 cursor-pointer"
                            >
                              {batchDetails.subjects.map(s => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          </div>

                          {/* Date Select */}
                          <div className="space-y-1">
                            <label className="block text-muted-foreground font-bold text-[10px] uppercase tracking-wider">Select Date *</label>
                            <input
                              type="date"
                              value={attendanceDate}
                              onChange={(e) => setAttendanceDate(e.target.value)}
                              className="w-full px-3 py-2 bg-card border border-border-color text-foreground rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 cursor-pointer"
                            />
                          </div>
                        </div>

                        {/* Student Attendance List Grid */}
                        <div className="space-y-3">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
                            <div className="flex flex-wrap items-center gap-3 flex-1">
                              <h5 className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                                Student Marking Roster ({filteredStudentsForAttendance.length} of {batchDetails.students.length})
                              </h5>

                              {/* Search Bar */}
                              <div className="relative flex-1 min-w-[200px] max-w-xs">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                                <input
                                  type="text"
                                  value={attendanceSearchQuery}
                                  onChange={(e) => setAttendanceSearchQuery(e.target.value)}
                                  placeholder="Search student by name..."
                                  className="w-full pl-9 pr-8 py-1.5 bg-card border border-border-color text-foreground placeholder-slate-500 rounded-xl text-[11px] font-semibold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                                />
                                {attendanceSearchQuery && (
                                  <button
                                    type="button"
                                    onClick={() => setAttendanceSearchQuery('')}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-slate-350 text-[10px] font-bold"
                                  >
                                    Clear
                                  </button>
                                )}
                              </div>
                            </div>

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
                              <span className="text-foreground">|</span>
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
                            {filteredStudentsForAttendance.length === 0 ? (
                              <div className="py-8 text-center border border-dashed border-border-color rounded-xl text-xs text-muted-foreground bg-card">
                                No students found matching "{attendanceSearchQuery}".
                              </div>
                            ) : (
                              filteredStudentsForAttendance.map((st) => {
                                const status = attendanceRecords[st.id] || 'PRESENT';
                                const isPresent = status === 'PRESENT';

                                return (
                                  <div
                                    key={st.id}
                                    className={`p-3 rounded-xl border flex items-center justify-between gap-4 transition-all duration-200 bg-card ${isPresent
                                      ? 'border-emerald-950/40 border-l-4 border-l-emerald-500/80'
                                      : 'border-rose-955/40 border-l-4 border-l-rose-500/80'
                                      }`}
                                  >
                                    <div className="min-w-0 space-y-0.5">
                                      <h4 className="text-xs font-bold text-slate-205 truncate">
                                        {st.name}
                                      </h4>
                                      <p className="text-[9px] text-muted-foreground truncate">
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
                                      className={`px-3 py-1.5 text-[9px] font-extrabold rounded-lg border uppercase tracking-wider cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 ${isPresent
                                        ? 'bg-emerald-500/10 border-emerald-500/10 text-emerald-400'
                                        : 'bg-rose-500/10 border-rose-500/10 text-rose-400'
                                        }`}
                                    >
                                      {isPresent ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                                      {status}
                                    </button>
                                  </div>
                                );
                              })
                            )}
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
                        <div className="space-y-4 pt-5 border-t border-border-color">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <h5 className="text-xs font-bold text-slate-205 uppercase tracking-wider">
                              Previous Attendance Logs
                            </h5>
                            {attendanceSearchQuery ? (
                              <div className="text-[10px] text-indigo-400 font-semibold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                                Filtering log records for "{attendanceSearchQuery}"
                              </div>
                            ) : (
                              <div className="text-[10px] text-muted-foreground font-semibold bg-card border border-border-color px-2 py-0.5 rounded">
                                Showing all logs for {batchDetails.name}
                              </div>
                            )}
                          </div>

                          {/* Line Highlight for selected batch OR student match alert */}
                          {attendanceSearchQuery ? (
                            <div className="p-3 bg-indigo-950/15 border-l-4 border-indigo-500 rounded-r-xl text-[11px] text-foreground flex items-center justify-between">
                              <span>Showing previous logs matching student: <strong className="text-indigo-400">"{attendanceSearchQuery}"</strong></span>
                              <button
                                onClick={() => setAttendanceSearchQuery('')}
                                className="text-[10px] font-bold text-indigo-450 hover:underline cursor-pointer"
                              >
                                Show All Batch Logs
                              </button>
                            </div>
                          ) : (
                            <div className="p-3 bg-card border-l-4 border-indigo-500 rounded-r-xl text-[11px] text-foreground">
                              Active Batch Logs: <span className="font-extrabold text-indigo-400">{batchDetails.name}</span> ({batchDetails.level})
                            </div>
                          )}

                          {filteredAttendanceLogs.length === 0 ? (
                            <div className="py-8 text-center border border-dashed border-border-color rounded-xl text-muted-foreground text-xs bg-card">
                              {attendanceSearchQuery
                                ? `No attendance records found matching student "${attendanceSearchQuery}".`
                                : "No attendance records logged yet for this batch."
                              }
                            </div>
                          ) : (
                            <div className="overflow-hidden border border-border-color rounded-xl bg-card">
                              <div className="max-h-60 overflow-y-auto pr-1">
                                <table className="w-full border-collapse text-left text-[11px] font-semibold text-slate-305">
                                  <thead className="glass-card font-bold border-b border-border-color text-foreground">
                                    <tr>
                                      <th className="px-4 py-2.5">Date</th>
                                      <th className="px-4 py-2.5">Subject</th>
                                      <th className="px-4 py-2.5">Student</th>
                                      <th className="px-4 py-2.5 text-right">Status</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-850/40">
                                    {filteredAttendanceLogs.map((log) => {
                                      const isPres = log.status === 'PRESENT';
                                      return (
                                        <tr key={log.id} className="hover:bg-card transition-colors">
                                          <td className="px-4 py-2">{new Date(log.date).toLocaleDateString()} ({log.day})</td>
                                          <td className="px-4 py-2">{log.subjectName}</td>
                                          <td className="px-4 py-2">{log.studentName}</td>
                                          <td className="px-4 py-2 text-right">
                                            <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider ${isPres
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
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Batch Study Notes</h4>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          Upload lecture handouts, curriculum PDFs, and study guides directly to students assigned to this batch.
                        </p>
                      </div>
                      <button
                        onClick={handleSyncGoogleDrive}
                        disabled={syncingDrive}
                        type="button"
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-card hover:bg-muted disabled:opacity-50 text-white border border-border-color rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer hover:scale-[1.02] active:scale-[0.98] shrink-0"
                      >
                        {syncingDrive ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Syncing Drive...
                          </>
                        ) : (
                          <>
                            <Folder className="w-3.5 h-3.5 text-indigo-400" />
                            Sync Google Drive
                          </>
                        )}
                      </button>
                    </div>

                    {batchDetails.subjects.length === 0 ? (
                      <div className="p-3.5 bg-amber-500/5 border border-amber-500/10 rounded-xl text-xs text-amber-400 flex items-center gap-2.5">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        Please assign at least one active subject in the **Subjects** tab before publishing notes.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">

                        {/* Notes Form (5/12 cols) */}
                        <form onSubmit={handleNoteSubmit} className="md:col-span-5 bg-card p-4 rounded-xl border border-border-color space-y-4 text-xs">
                          <h5 className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                            <UploadCloud className="w-4 h-4 text-indigo-400" /> Publish Study Note
                          </h5>

                          {/* Subject */}
                          <div className="space-y-1">
                            <label className="block text-muted-foreground font-bold text-[10px] uppercase tracking-wider">Subject *</label>
                            <select
                              value={noteSubject}
                              onChange={(e) => setNoteSubject(e.target.value)}
                              className="w-full px-3 py-2 bg-card border border-border-color text-foreground rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 cursor-pointer"
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
                            <label className="block text-muted-foreground font-bold text-[10px] uppercase tracking-wider">Document Title *</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Chapter 2: Trigonometric Ratios"
                              value={noteTitle}
                              onChange={(e) => setNoteTitle(e.target.value)}
                              className="w-full px-3 py-2 bg-card border border-border-color text-foreground placeholder-slate-650 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                            />
                          </div>

                          {/* Description */}
                          <div className="space-y-1">
                            <label className="block text-muted-foreground font-bold text-[10px] uppercase tracking-wider">Brief Description</label>
                            <textarea
                              rows={2}
                              placeholder="Topics covered, revision formulas..."
                              value={noteDescription}
                              onChange={(e) => setNoteDescription(e.target.value)}
                              className="w-full px-3 py-2 bg-card border border-border-color text-foreground placeholder-slate-650 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 resize-none"
                            />
                          </div>

                          {/* File Dropzone */}
                          <div className="space-y-1">
                            <label className="block text-muted-foreground font-bold text-[10px] uppercase tracking-wider">Select PDF Document *</label>
                            <div className="relative border border-dashed border-border-color hover:border-indigo-500 rounded-xl p-4 text-center cursor-pointer bg-background hover:bg-muted transition-colors">
                              <input
                                ref={noteFileInputRef}
                                type="file"
                                accept=".pdf"
                                required
                                onChange={handleNoteFileChange}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                              />
                              <UploadCloud className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
                              <p className="font-bold text-[9px] text-slate-350 truncate px-2">
                                {notePdfFile ? notePdfFile.name : 'Click to select PDF document'}
                              </p>
                              <p className="text-[8px] text-muted-foreground mt-0.5">PDF format only, Max 10MB</p>
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
                          <h5 className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">
                            Uploaded Notes List ({batchNotes.length})
                          </h5>

                          {batchNotes.length === 0 ? (
                            <div className="py-16 text-center border border-dashed border-border-color rounded-xl text-muted-foreground text-xs bg-card">
                              No study notes uploaded yet for this batch.
                            </div>
                          ) : (
                            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                              {batchNotes.map(note => (
                                <div key={note.id} className="bg-background hover:bg-muted border border-border-color p-3.5 rounded-xl flex items-start justify-between gap-4 shadow-sm hover:border-border-color transition-colors">
                                  <div className="min-w-0 flex-1 space-y-1.5">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="px-2 py-0.5 text-[8px] font-extrabold rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase">
                                        {note.subjectName}
                                      </span>
                                      <h4 className="text-xs font-bold text-foreground truncate">
                                        {note.title}
                                      </h4>
                                    </div>
                                    {note.description && (
                                      <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2">
                                        {note.description}
                                      </p>
                                    )}
                                    <div className="flex items-center gap-2 text-[9px] text-muted-foreground font-semibold pt-1 border-t border-border-color mt-1">
                                      <span>By: {note.uploadedByName}</span>
                                      <span>&bull;</span>
                                      <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                                    </div>
                                  </div>

                                  <div className="flex gap-1.5 shrink-0 items-center">
                                    {(user?.role === 'ADMIN' || note.uploadedById === user?.id) && (
                                      <button
                                        onClick={() => { if (confirm('Are you sure you want to delete this study note?')) deleteNoteMutation.mutate(note.id); }}
                                        className="p-1.5 bg-slate-905 border border-border-color text-muted-foreground hover:text-rose-455 hover:bg-rose-955/25 rounded-lg cursor-pointer transition-colors"
                                        title="Delete Note"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                    <a
                                      href={`/dashboard/notes/view/${note.id}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-600 hover:text-white rounded-lg font-bold text-[9px] transition-all cursor-pointer shadow-sm active:scale-95"
                                    >
                                      <ExternalLink className="w-3 h-3" /> View PDF
                                    </a>
                                  </div>
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
                      <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Batch Homework Tasks</h4>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
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
                        <form onSubmit={handleHomeworkSubmit} className="md:col-span-5 bg-card p-4 rounded-xl border border-border-color space-y-4 text-xs">
                          <h5 className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                            <FileText className="w-4 h-4 text-indigo-400" /> Assign Homework
                          </h5>

                          {/* Subject */}
                          <div className="space-y-1">
                            <label className="block text-muted-foreground font-bold text-[10px] uppercase tracking-wider">Subject *</label>
                            <select
                              value={hwSubject}
                              onChange={(e) => setHwSubject(e.target.value)}
                              className="w-full px-3 py-2 bg-card border border-border-color text-foreground rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 cursor-pointer"
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
                            <label className="block text-muted-foreground font-bold text-[10px] uppercase tracking-wider">Task Title *</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Physics Motion Exercise Sheet"
                              value={hwTitle}
                              onChange={(e) => setHwTitle(e.target.value)}
                              className="w-full px-3 py-2 bg-card border border-border-color text-slate-202 placeholder-slate-650 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                            />
                          </div>

                          {/* Description */}
                          <div className="space-y-1">
                            <label className="block text-muted-foreground font-bold text-[10px] uppercase tracking-wider">Instructions & Syllabus *</label>
                            <textarea
                              rows={2}
                              required
                              placeholder="Solve exercises on page 24-25. Show detailed steps..."
                              value={hwDescription}
                              onChange={(e) => setHwDescription(e.target.value)}
                              className="w-full px-3 py-2 bg-card border border-border-color text-slate-202 placeholder-slate-650 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 resize-none"
                            />
                          </div>

                          {/* Due Date */}
                          <div className="space-y-1">
                            <label className="block text-muted-foreground font-bold text-[10px] uppercase tracking-wider">Submission Due Date *</label>
                            <input
                              type="date"
                              required
                              value={hwDueDate}
                              onChange={(e) => setHwDueDate(e.target.value)}
                              className="w-full px-3 py-2 bg-card border border-border-color text-slate-202 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 cursor-pointer"
                            />
                          </div>

                          {/* File Dropzone */}
                          <div className="space-y-1">
                            <label className="block text-muted-foreground font-bold text-[10px] uppercase tracking-wider">Reference Attachment (Optional)</label>
                            <div className="relative border border-dashed border-border-color hover:border-indigo-500 rounded-xl p-3 text-center cursor-pointer bg-card transition-colors">
                              <input
                                ref={hwFileInputRef}
                                type="file"
                                accept=".pdf"
                                onChange={handleHwFileChange}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                              />
                              <UploadCloud className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
                              <p className="font-bold text-[9px] text-foreground truncate px-2">
                                {hwPdfFile ? hwPdfFile.name : 'Attach exercise sheet PDF'}
                              </p>
                              <p className="text-[8px] text-muted-foreground mt-0.5">PDF format only, Max 10MB</p>
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
                          <h5 className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">
                            Assigned Homework Tasks ({batchHomeworks.length})
                          </h5>

                          {batchHomeworks.length === 0 ? (
                            <div className="py-16 text-center border border-dashed border-border-color rounded-xl text-muted-foreground text-xs bg-card">
                              No homework tasks assigned yet for this batch.
                            </div>
                          ) : (
                            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                              {batchHomeworks.map(hw => (
                                <div key={hw.id} className="bg-card border border-border-color p-3.5 rounded-xl flex items-start justify-between gap-4 shadow-sm hover:border-border-color transition-colors">
                                  <div className="min-w-0 flex-1 space-y-1.5">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="px-2 py-0.5 text-[8px] font-extrabold rounded bg-amber-500/10 text-amber-405 border border-amber-500/20 uppercase">
                                        {hw.subjectName}
                                      </span>
                                      <h4 className="text-xs font-bold text-foreground truncate">
                                        {hw.title}
                                      </h4>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2">
                                      {hw.description}
                                    </p>
                                    <div className="flex items-center justify-between gap-2 text-[9px] text-muted-foreground font-semibold pt-1.5 border-t border-border-color mt-1.5">
                                      <span>By: {hw.createdByName}</span>
                                      <span className="flex items-center gap-1 text-indigo-400">
                                        <Calendar className="w-3.5 h-3.5" />
                                        Due: {new Date(hw.dueDate).toLocaleDateString()}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex gap-1.5 shrink-0 items-center">
                                    {(user?.role === 'ADMIN' || hw.createdById === user?.id) && (
                                      <button
                                        onClick={() => { if (confirm('Are you sure you want to delete this homework assignment?')) deleteHomeworkMutation.mutate(hw.id); }}
                                        className="p-1.5 bg-slate-905 border border-border-color text-muted-foreground hover:text-rose-455 hover:bg-rose-955/25 rounded-lg cursor-pointer transition-colors"
                                        title="Delete Homework"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                    {hw.fileUrl && (
                                      <a
                                        href={hw.fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-600 hover:text-white rounded-lg font-bold text-[9px] transition-all shrink-0 cursor-pointer active:scale-95"
                                      >
                                        <ExternalLink className="w-3 h-3" /> Sheets
                                      </a>
                                    )}
                                  </div>
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
                      <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Batch Academic Tests</h4>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        Schedule and coordinate offline unit assessments, quizzes, and term exams for this batch.
                      </p>
                    </div>

                    {batchDetails.subjects.length === 0 ? (
                      <div className="p-3.5 bg-amber-500/5 border border-amber-500/10 rounded-xl text-xs text-amber-400 flex items-center gap-2.5">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        Please assign at least one active subject in the **Subjects** tab before scheduling tests.
                      </div>
                    ) : (
                      <form onSubmit={handleAddTest} className="bg-card p-4 rounded-xl border border-border-color space-y-4 text-xs">
                        <h5 className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">
                          Schedule New Academic Assessment
                        </h5>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="space-y-1">
                            <label className="block text-muted-foreground font-bold text-[10px] uppercase tracking-wider">Test Title *</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Unit Test 1: Calculus"
                              value={testTitle}
                              onChange={(e) => setTestTitle(e.target.value)}
                              className="w-full px-3 py-2 bg-card border border-border-color text-foreground placeholder-slate-650 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="block text-muted-foreground font-bold text-[10px] uppercase tracking-wider">Subject *</label>
                            <select
                              value={testSubject}
                              onChange={(e) => setTestSubject(e.target.value)}
                              className="w-full px-3 py-2 bg-card border border-border-color text-foreground rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 cursor-pointer"
                            >
                              <option value="">Select subject...</option>
                              {batchDetails.subjects.map(s => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="block text-muted-foreground font-bold text-[10px] uppercase tracking-wider">Test Date *</label>
                            <input
                              type="date"
                              required
                              value={testDate}
                              onChange={(e) => setTestDate(e.target.value)}
                              className="w-full px-3 py-2 bg-card border border-border-color text-slate-202 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 cursor-pointer"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="block text-muted-foreground font-bold text-[10px] uppercase tracking-wider">Maximum Marks *</label>
                            <input
                              type="number"
                              required
                              min={1}
                              value={testMaxMarks}
                              onChange={(e) => setTestMaxMarks(parseInt(e.target.value))}
                              className="w-full px-3 py-2 bg-card border border-border-color text-slate-202 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                            />
                          </div>

                          <div className="md:col-span-4 space-y-1">
                            <label className="block text-muted-foreground font-bold text-[10px] uppercase tracking-wider">Syllabus / Details</label>
                            <textarea
                              rows={2}
                              placeholder="Topics, formula requirements, exam rules..."
                              value={testDescription}
                              onChange={(e) => setTestDescription(e.target.value)}
                              className="w-full px-3.5 py-2.5 bg-card border border-border-color text-slate-202 placeholder-slate-650 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 resize-none"
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
                      <div className="flex items-center justify-between">
                        <h5 className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">
                          Scheduled Tests List ({batchTests.length})
                        </h5>
                      </div>

                      {batchTests.length === 0 ? (
                        <div className="py-10 text-center border border-dashed border-border-color rounded-xl text-xs text-muted-foreground bg-card">
                          No exams or tests scheduled yet.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {batchTests.map(test => (
                            <div key={test.id} className="bg-card border border-border-color p-3.5 rounded-xl flex items-start justify-between gap-4 shadow-sm hover:border-border-color transition-colors">
                              <div className="min-w-0 space-y-1.5 flex-1">
                                <div className="flex items-center gap-2">
                                  <Award className="w-4 h-4 text-rose-400 shrink-0" />
                                  <h4 className="text-xs font-bold text-foreground truncate">
                                    {test.title}
                                  </h4>
                                </div>
                                {test.description && (
                                  <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">
                                    {test.description}
                                  </p>
                                )}
                                <div className="flex items-center justify-between gap-2 text-[9px] font-bold text-muted-foreground pt-2 border-t border-border-color mt-1">
                                  <span className="uppercase text-rose-400">{test.subjectName} &bull; {test.maxMarks} Marks</span>
                                  <span className="flex items-center gap-1 text-muted-foreground">
                                    <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                                    Date: {new Date(test.testDate).toLocaleDateString()}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 pt-2 mt-1">
                                  <button
                                    onClick={() => setSelectedTestForMarks(test)}
                                    className="px-2 py-1 text-[9px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 rounded-md transition-colors flex items-center gap-1"
                                  >
                                    <UploadCloud className="w-3 h-3" />
                                    Manage Marks
                                  </button>
                                  <button
                                    onClick={() => sendReportCardsMutation.mutate(test.id)}
                                    disabled={sendReportCardsMutation.isPending}
                                    className="px-2 py-1 text-[9px] font-bold bg-teal-500/10 text-teal-400 border border-teal-500/20 hover:bg-teal-500/20 rounded-md transition-colors flex items-center gap-1"
                                  >
                                    <CheckCircle2 className="w-3 h-3" />
                                    Send Report Cards
                                  </button>
                                </div>
                              </div>

                              <button
                                onClick={() => deleteTestMutation.mutate(test.id)}
                                className="p-1.5 text-muted-foreground hover:text-rose-405 hover:bg-rose-955/20 rounded-lg cursor-pointer transition-colors"
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
                      <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Batch Announcements</h4>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        Broadcast alert notices and academic updates pinned directly to this batch's student dashboard stream.
                      </p>
                    </div>

                    {/* Announcement Form */}
                    <form onSubmit={handleAddAnnouncement} className="bg-card p-4 rounded-xl border border-border-color space-y-4 text-xs">
                      <h5 className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <Megaphone className="w-4 h-4 text-indigo-400" /> Broadcast Batch Notice
                      </h5>

                      <div className="space-y-4">
                        <div className="space-y-1">
                          <label className="block text-muted-foreground font-bold text-[10px] uppercase tracking-wider">Notice Title *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Special Practical Class Scheduled"
                            value={annTitle}
                            onChange={(e) => setAnnTitle(e.target.value)}
                            className="w-full px-3 py-2 bg-card border border-border-color text-foreground placeholder-slate-650 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-muted-foreground font-bold text-[10px] uppercase tracking-wider">Broadcast message details *</label>
                          <textarea
                            rows={3}
                            required
                            placeholder="Type details, rules, or requirements..."
                            value={annMessage}
                            onChange={(e) => setAnnMessage(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-card border border-border-color text-foreground placeholder-slate-650 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
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
                      <h5 className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">
                        Current Batch Notices ({batchAnnouncements.length})
                      </h5>

                      {batchAnnouncements.length === 0 ? (
                        <div className="py-10 text-center border border-dashed border-border-color rounded-xl text-xs text-muted-foreground bg-card">
                          No batch notices broadcasted yet.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {batchAnnouncements.map(ann => (
                            <div key={ann.id} className="bg-card border border-border-color p-4 rounded-xl shadow-sm space-y-2 hover:border-border-color transition-colors">
                              <div className="flex items-center justify-between gap-4">
                                <h4 className="text-xs font-bold text-foreground">
                                  {ann.title}
                                </h4>
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-0.5 text-[8px] font-extrabold bg-amber-500/10 text-amber-400 border border-amber-500/15 rounded-full uppercase tracking-wider shrink-0">
                                    Pinned Alert
                                  </span>
                                  {(user?.role === 'ADMIN' || user?.role === 'INSTRUCTOR') && (
                                    <button
                                      onClick={() => { if (confirm('Delete announcement?')) deleteAnnouncementMutation.mutate(ann.id); }}
                                      className="p-1 bg-slate-905 border border-border-color text-muted-foreground hover:text-rose-455 hover:bg-rose-955/25 rounded-lg cursor-pointer transition-colors"
                                      title="Delete Announcement"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                              <p className="text-xs text-slate-405 leading-relaxed">
                                {ann.message}
                              </p>
                              <div className="text-[9px] font-bold text-muted-foreground pt-2 border-t border-border-color mt-1.5 flex items-center gap-2">
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div
            className="absolute inset-0 bg-[#060e20]/80 backdrop-blur-sm"
            onClick={() => setShowCreateModal(false)}
          />

          <div className="relative bg-[#0b1326] border border-white/10 rounded-2xl p-8 w-full max-w-lg shadow-[0_10px_40px_rgba(0,0,0,0.5),0_0_20px_rgba(99,102,241,0.1)] animate-in zoom-in-95 duration-300 space-y-6">
            
            {/* Header */}
            <div className="space-y-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                  <Plus className="w-4 h-4 text-indigo-400" />
                </div>
                <h3 className="text-xl font-semibold text-white tracking-tight">Create Academic Batch</h3>
              </div>
              <p className="text-[#c7c4d7] text-sm ml-11">
                Configure a new offline cohort and assign primary instructors.
              </p>
            </div>

            <form onSubmit={handleCreateBatch} className="space-y-6">
              {/* Batch Name */}
              <div className="space-y-2">
                <label className="block text-[#c7c4d7] font-medium text-[11px] uppercase tracking-wider ml-1">Batch Name <span className="text-rose-400">*</span></label>
                <div className="relative group">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Class IX Evening Cohort"
                    value={newBatchName}
                    onChange={(e) => setNewBatchName(e.target.value)}
                    className="w-full px-4 py-3 bg-[#131b2e]/50 border border-white/10 text-white placeholder-slate-500 rounded-xl focus:outline-none focus:border-indigo-500/50 focus:bg-[#131b2e] transition-all focus:ring-4 focus:ring-indigo-500/10"
                  />
                </div>
              </div>

              {/* Level */}
              <div className="space-y-2">
                <label className="block text-[#c7c4d7] font-medium text-[11px] uppercase tracking-wider ml-1">Grade Level <span className="text-rose-400">*</span></label>
                <div className="relative group">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Class X"
                    value={newBatchLevel}
                    onChange={(e) => setNewBatchLevel(e.target.value)}
                    className="w-full px-4 py-3 bg-[#131b2e]/50 border border-white/10 text-white placeholder-slate-500 rounded-xl focus:outline-none focus:border-indigo-500/50 focus:bg-[#131b2e] transition-all focus:ring-4 focus:ring-indigo-500/10 font-medium"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mr-1">Presets:</span>
                  {BATCH_LEVELS.map(level => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setNewBatchLevel(level)}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all border cursor-pointer uppercase tracking-wider ${
                        newBatchLevel === level 
                          ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.2)]' 
                          : 'bg-[#131b2e]/30 border-white/5 text-[#c7c4d7] hover:text-white hover:bg-[#131b2e] hover:border-white/10'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* Assign Instructor */}
              <div className="space-y-2">
                <label className="block text-[#c7c4d7] font-medium text-[11px] uppercase tracking-wider ml-1 flex justify-between">
                  <span>Assign Instructors</span>
                  <span className="text-indigo-400 font-bold">{newBatchInstructorIds.length} Selected</span>
                </label>
                
                <div className="bg-[#131b2e]/30 border border-white/10 rounded-xl overflow-hidden max-h-56 overflow-y-auto custom-scrollbar shadow-inner">
                  {allInstructors.map(inst => {
                    const isSelected = newBatchInstructorIds.includes(inst.id);
                    return (
                      <div 
                        key={inst.id}
                        onClick={() => {
                          if (isSelected) {
                            setNewBatchInstructorIds(prev => prev.filter(id => id !== inst.id));
                          } else {
                            setNewBatchInstructorIds(prev => [...prev, inst.id]);
                          }
                        }}
                        className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-white/5 last:border-b-0 transition-all ${isSelected ? 'bg-indigo-500/10' : 'hover:bg-white/5'}`}
                      >
                        <div className={`w-4 h-4 rounded-sm border flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-600 bg-transparent'}`}>
                          {isSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white shadow-sm shrink-0">
                          {inst.name.charAt(0).toUpperCase()}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold truncate transition-colors ${isSelected ? 'text-indigo-300' : 'text-white'}`}>{inst.name}</p>
                          <p className="text-[10px] text-slate-400 uppercase tracking-widest">{inst.role}</p>
                        </div>
                      </div>
                    );
                  })}
                  {allInstructors.length === 0 && (
                    <div className="px-4 py-8 flex flex-col items-center justify-center text-slate-500">
                      <Users className="w-6 h-6 mb-2 opacity-20" />
                      <p className="text-xs">No instructors available.</p>
                    </div>
                  )}
                </div>
              </div>

              {createBatchError && (
                <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400">
                  <Info className="w-4 h-4 shrink-0" />
                  <p className="text-xs font-medium">{createBatchError}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-2.5 bg-transparent hover:bg-white/5 text-[#c7c4d7] hover:text-white rounded-xl text-sm font-semibold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createBatchMutation.isPending}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all cursor-pointer shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] flex items-center gap-2 disabled:opacity-50 active:scale-95"
                >
                  {createBatchMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Create Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {selectedTestForMarks && (
        <UploadMarksModal
          test={selectedTestForMarks}
          students={batchDetails?.students || []}
          onClose={() => setSelectedTestForMarks(null)}
          onSuccess={() => { }}
        />
      )}

    </div>
  );

}
