'use client';

import React, { useState, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Search, 
  Edit2, 
  Trash2, 
  Plus, 
  X, 
  Loader2, 
  ShieldAlert, 
  Key, 
  Eye, 
  EyeOff, 
  FileSpreadsheet, 
  RefreshCw,
  GraduationCap,
  School,
  Lock
} from 'lucide-react';

interface UserDTO {
  id: number;
  name: string;
  email: string;
  role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
  batchId: number | null;
  batchName: string | null;
}

interface BatchDTO {
  id: number;
  name: string;
  level: string;
}

export default function UserManagementPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<'ALL' | 'STUDENT' | 'INSTRUCTOR' | 'ADMIN'>('ALL');
  
  // Expose student credentials on click state
  const [revealedStudentIds, setRevealedStudentIds] = useState<number[]>([]);

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserDTO | null>(null);

  // Form inputs
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<'STUDENT' | 'INSTRUCTOR' | 'ADMIN'>('STUDENT');
  const [formBatchId, setFormBatchId] = useState<string>('');
  
  const [isSyncing, setIsSyncing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    createdCount: number;
    updatedCount: number;
    unfoundCount: number;
    unfoundUsers: UserDTO[];
  } | null>(null);
  const [syncFile, setSyncFile] = useState<File | null>(null);

  // 1. Fetch all users
  const { data: users = [], isLoading: isUsersLoading } = useQuery<UserDTO[]>({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const response = await api.get('/admin/users');
      return response.data.success ? response.data.data : [];
    }
  });

  // 2. Fetch all batches for assignment dropdown
  const { data: batches = [] } = useQuery<BatchDTO[]>({
    queryKey: ['admin-batches-list'],
    queryFn: async () => {
      const response = await api.get('/instructor/batches');
      return response.data.success ? response.data.data : [];
    }
  });

  // Create User Mutation
  const createUserMutation = useMutation({
    mutationFn: async (payload: any) => {
      const response = await api.post('/admin/users', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setShowCreateModal(false);
      resetForm();
      alert('User created successfully!');
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to create user');
    }
  });

  // Update User Mutation
  const updateUserMutation = useMutation({
    mutationFn: async (payload: { id: number; data: any }) => {
      const response = await api.put(`/admin/users/${payload.id}`, payload.data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setShowEditModal(false);
      setSelectedUser(null);
      resetForm();
      alert('User updated successfully!');
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to update user');
    }
  });

  // Delete User Mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/admin/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      alert('User account deleted successfully.');
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to delete user.');
    }
  });

  const resetForm = () => {
    setFormName('');
    setFormEmail('');
    setFormPassword('');
    setFormRole('STUDENT');
    setFormBatchId('');
  };

  const handleOpenEdit = (user: UserDTO) => {
    setSelectedUser(user);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormPassword('[ENCRYPTED]');
    setFormRole(user.role);
    setFormBatchId(user.batchId ? String(user.batchId) : '');
    setShowEditModal(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formEmail || !formRole) return;
    
    createUserMutation.mutate({
      name: formName,
      email: formEmail,
      role: formRole,
      password: formPassword,
      batchId: formRole === 'STUDENT' && formBatchId ? parseInt(formBatchId) : null
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    updateUserMutation.mutate({
      id: selectedUser.id,
      data: {
        name: formName,
        email: formEmail,
        role: formRole,
        password: formPassword === '[ENCRYPTED]' ? '' : formPassword,
        batchId: formRole === 'STUDENT' && formBatchId ? parseInt(formBatchId) : null
      }
    });
  };

  const handleDeleteUser = (id: number, name: string) => {
    if (confirm(`CAUTION: Deleting ${name} will permanently remove all logs, enrollments, and submissions. Proceed?`)) {
      deleteUserMutation.mutate(id);
    }
  };

  const handleExportCSV = async () => {
    setIsSyncing(true);
    try {
      const response = await api.get('/admin/users/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'users.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Export failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSyncFile(file);
    setIsSyncing(true);
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await api.post('/admin/users/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (response.data.success) {
        setSyncResult(response.data.data);
        setShowSyncModal(true);
        queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      } else {
        alert('Import failed: ' + response.data.message);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to import CSV file.');
    } finally {
      setIsSyncing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteAllUnfound = async () => {
    if (!syncFile) return;
    if (!confirm('Are you absolutely sure you want to delete all unfound users? This will permanently remove their records.')) return;
    
    setIsSyncing(true);
    const formData = new FormData();
    formData.append('file', syncFile);
    formData.append('deleteUnfound', 'true');
    
    try {
      const response = await api.post('/admin/users/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (response.data.success) {
        alert('Successfully synchronized and deleted unfound users!');
        setShowSyncModal(false);
        setSyncResult(null);
        setSyncFile(null);
        queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      } else {
        alert('Sync delete failed: ' + response.data.message);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to synchronize with delete.');
    } finally {
      setIsSyncing(false);
    }
  };

  const toggleStudentReveal = (id: number) => {
    if (revealedStudentIds.includes(id)) {
      setRevealedStudentIds(revealedStudentIds.filter(x => x !== id));
    } else {
      setRevealedStudentIds([...revealedStudentIds, id]);
    }
  };

  // Filter & Search users
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            u.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = selectedRoleFilter === 'ALL' ? true : u.role === selectedRoleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, selectedRoleFilter]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto text-foreground">
      
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-accent-grape" />
            User Management Console
          </h2>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Provision student and instructor accounts, set credentials, map class batches, and sync database with CSV excel compilation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".csv" 
            className="hidden" 
          />
          
          <button
            onClick={handleExportCSV}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-205 border border-slate-700 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
            title="Export database into users.csv"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            Export to CSV
          </button>
          
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-205 border border-slate-700 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
            title="Import and sync database from local CSV file"
          >
            {isSyncing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 text-indigo-400" />
            )}
            Sync from CSV
          </button>

          <button
            onClick={() => { resetForm(); setShowCreateModal(true); }}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-accent-grape to-primary-blue text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-accent-grape/10 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-4.5 h-4.5" />
            New Account
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative max-w-md w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-text-muted" />
          <input
            type="text"
            placeholder="Search accounts name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-white/5 border border-border-color rounded-2xl text-sm text-white placeholder-text-muted focus:outline-none focus:border-accent-grape focus:ring-1 focus:ring-accent-grape transition-all"
          />
        </div>

        {/* Role Tabs */}
        <div className="flex bg-slate-900 border border-border-color p-1 rounded-xl shrink-0 overflow-x-auto">
          {(['ALL', 'STUDENT', 'INSTRUCTOR', 'ADMIN'] as const).map(role => (
            <button
              key={role}
              onClick={() => setSelectedRoleFilter(role)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                selectedRoleFilter === role
                  ? 'bg-accent-grape text-white shadow-sm'
                  : 'text-text-secondary hover:text-white'
              }`}
            >
              {role}s
            </button>
          ))}
        </div>
      </div>

      {/* Users Grid */}
      {isUsersLoading ? (
        <div className="h-[40vh] flex flex-col items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-accent-grape" />
          <p className="mt-3 text-xs text-text-secondary font-medium">Syncing account registry...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="py-20 text-center glass-card rounded-3xl border border-border-color max-w-md mx-auto space-y-4">
          <Users className="w-12 h-12 text-text-muted mx-auto" />
          <div>
            <h4 className="font-bold text-white text-sm">No accounts found</h4>
            <p className="text-xs text-text-secondary mt-1">No user database record matched your filters.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredUsers.map(u => {
            const isStudent = u.role === 'STUDENT';
            const isInstructor = u.role === 'INSTRUCTOR';
            const isAdmin = u.role === 'ADMIN';
            const isRevealed = revealedStudentIds.includes(u.id);

            return (
              <motion.div
                key={u.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card hover-lift border border-border-color rounded-3xl p-5 flex flex-col justify-between gap-5 relative overflow-hidden"
              >
                {/* Accent Role Tag */}
                <div className="absolute top-4 right-4">
                  <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold tracking-wider uppercase border ${
                    isAdmin 
                      ? 'bg-rose-500/10 text-rose-455 border-rose-500/20'
                      : isInstructor
                      ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                      : 'bg-emerald-500/10 text-emerald-450 border-emerald-500/20'
                  }`}>
                    {u.role}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${
                      isAdmin
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        : isInstructor
                        ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}>
                      {isStudent ? <GraduationCap className="w-5 h-5" /> : <School className="w-5 h-5" />}
                    </div>
                    
                    <div className="min-w-0">
                      <h4 className="text-sm font-black text-white truncate pr-16">{u.name}</h4>
                      {isStudent && (
                        <p className="text-[10px] text-text-secondary mt-0.5">
                          Batch: <span className="font-bold text-emerald-400">{u.batchName || 'Unassigned'}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Account detail visibility logic */}
                  <div className="bg-slate-950/40 border border-slate-900 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">Username</span>
                      {isStudent ? (
                        <button
                          onClick={() => toggleStudentReveal(u.id)}
                          className="flex items-center gap-1 text-[10px] font-extrabold text-accent-grape hover:text-accent-blue transition-colors cursor-pointer"
                        >
                          {isRevealed ? (
                            <>
                              <EyeOff className="w-3.5 h-3.5" />
                              Hide
                            </>
                          ) : (
                            <>
                              <Eye className="w-3.5 h-3.5" />
                              Reveal Email
                            </>
                          )}
                        </button>
                      ) : (
                        <span className="text-[10.5px] font-bold text-slate-300 select-all truncate">{u.email}</span>
                      )}
                    </div>
                    
                    {isStudent && isRevealed && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="text-[10.5px] font-bold text-slate-205 select-all break-all pt-1.5 border-t border-slate-900 mt-1"
                      >
                        {u.email}
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Card footer CRUD actions */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-border-color">
                  <button
                    onClick={() => handleOpenEdit(u)}
                    className="p-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer"
                    title="Edit Credentials & Details"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteUser(u.id, u.name)}
                    className="p-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-455 hover:bg-rose-950/20 rounded-xl transition-all cursor-pointer"
                    title="Delete Account permanently"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* CREATE MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative z-10 text-xs"
            >
              <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-accent-grape" />
                  Create User Account
                </h3>
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 text-slate-500 hover:text-white rounded-lg cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="p-5 space-y-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Account Role *</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-slate-205 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="STUDENT">Student</option>
                    <option value="INSTRUCTOR">Instructor</option>
                    <option value="ADMIN">System Administrator</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-855 rounded-xl text-slate-205 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email (Username) *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. johndoe@gmail.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-855 rounded-xl text-slate-205 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Password (Credential) *</label>
                  <input
                    type="password"
                    required
                    placeholder="Enter account password"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-855 rounded-xl text-slate-205 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {formRole === 'STUDENT' && (
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assign Batch</label>
                    <select
                      value={formBatchId}
                      onChange={(e) => setFormBatchId(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-855 rounded-xl text-slate-205 focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="">No batch assigned</option>
                      {batches.map(b => (
                        <option key={b.id} value={b.id}>{b.name} ({b.level})</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-800 mt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createUserMutation.isPending}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {createUserMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Save Account
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT MODAL */}
      <AnimatePresence>
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEditModal(false)}
              className="absolute inset-0 bg-slate-955/65 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative z-10 text-xs"
            >
              <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-accent-grape" />
                  Modify User Credentials
                </h3>
                <button 
                  onClick={() => setShowEditModal(false)}
                  className="p-1 text-slate-500 hover:text-white rounded-lg cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="p-5 space-y-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Account Role *</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-955 border border-slate-850 rounded-xl text-slate-205 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="STUDENT">Student</option>
                    <option value="INSTRUCTOR">Instructor</option>
                    <option value="ADMIN">System Administrator</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-855 rounded-xl text-slate-205 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email (Username) *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. johndoe@gmail.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-855 rounded-xl text-slate-205 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reset Password (Leave as is to keep existing)</label>
                  <input
                    type="password"
                    placeholder="Modify account password"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-855 rounded-xl text-slate-205 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {formRole === 'STUDENT' && (
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assign Batch</label>
                    <select
                      value={formBatchId}
                      onChange={(e) => setFormBatchId(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-955 border border-slate-855 rounded-xl text-slate-205 focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="">No batch assigned</option>
                      {batches.map(b => (
                        <option key={b.id} value={b.id}>{b.name} ({b.level})</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-800 mt-2">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateUserMutation.isPending}
                    className="px-5 py-2 bg-indigo-650 hover:bg-indigo-600 text-white font-bold rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {updateUserMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Save Modifications
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SYNC REPORT MODAL */}
      <AnimatePresence>
        {showSyncModal && syncResult && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setShowSyncModal(false); setSyncResult(null); setSyncFile(null); }}
              className="absolute inset-0 bg-slate-950/65 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative z-10 text-xs text-white"
            >
              <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                <h3 className="text-sm font-black text-white flex items-center gap-1.5 font-bold uppercase tracking-wide">
                  <ShieldAlert className="w-5 h-5 text-indigo-400" />
                  CSV Sync Report
                </h3>
                <button 
                  onClick={() => { setShowSyncModal(false); setSyncResult(null); setSyncFile(null); }}
                  className="p-1 text-slate-500 hover:text-white rounded-lg cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl text-center space-y-1">
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Created</p>
                    <h4 className="text-2xl font-black text-emerald-400">{syncResult.createdCount}</h4>
                  </div>
                  <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl text-center space-y-1">
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Updated</p>
                    <h4 className="text-2xl font-black text-indigo-400">{syncResult.updatedCount}</h4>
                  </div>
                  <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl text-center space-y-1">
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Unfound (Not in CSV)</p>
                    <h4 className="text-2xl font-black text-rose-450">{syncResult.unfoundCount}</h4>
                  </div>
                </div>

                {syncResult.unfoundUsers && syncResult.unfoundUsers.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        Flagged Users (Missing from Uploaded CSV)
                      </h4>
                      <button
                        onClick={handleDeleteAllUnfound}
                        className="px-3 py-1.5 bg-rose-900/35 hover:bg-rose-900/60 border border-rose-800 text-rose-200 font-bold rounded-lg text-[10px] uppercase tracking-wider transition-all cursor-pointer"
                      >
                        Delete All {syncResult.unfoundUsers.length} Unfound
                      </button>
                    </div>

                    <div className="border border-slate-850 rounded-2xl overflow-hidden max-h-60 overflow-y-auto bg-slate-950/40">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-950 border-b border-slate-850 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <th className="p-3">Name</th>
                            <th className="p-3">Email</th>
                            <th className="p-3">Role</th>
                            <th className="p-3">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850">
                          {syncResult.unfoundUsers.map(u => (
                            <tr key={u.id} className="hover:bg-white/5 transition-all text-xs">
                              <td className="p-3 font-semibold text-white">{u.name}</td>
                              <td className="p-3 text-slate-350 font-mono">{u.email}</td>
                              <td className="p-3">
                                <span className={`inline-block text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                  u.role === 'ADMIN' ? 'bg-indigo-900/20 text-indigo-300 border border-indigo-850/30' :
                                  u.role === 'INSTRUCTOR' ? 'bg-amber-900/20 text-amber-300 border border-amber-850/30' :
                                  'bg-emerald-900/20 text-emerald-300 border border-emerald-850/30'
                                }`}>
                                  {u.role}
                                </span>
                              </td>
                              <td className="p-3">
                                <button
                                  onClick={() => {
                                    if (confirm(`CAUTION: Delete ${u.name}? This will permanently remove all logs, enrollments, and submissions.`)) {
                                      deleteUserMutation.mutate(u.id);
                                      setSyncResult({
                                        ...syncResult,
                                        unfoundCount: syncResult.unfoundCount - 1,
                                        unfoundUsers: syncResult.unfoundUsers.filter(x => x.id !== u.id)
                                      });
                                    }
                                  }}
                                  className="p-1.5 text-rose-450 hover:text-white bg-rose-500/10 hover:bg-rose-500 rounded-lg transition-all cursor-pointer"
                                  title="Delete Account"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-950/40 border border-slate-850 p-6 rounded-2xl text-center text-slate-400 space-y-2">
                    <p className="font-bold text-emerald-450">Perfect Sync! 🎉</p>
                    <p className="text-[11px] leading-relaxed">
                      All users in the uploaded CSV match the current database records. No missing accounts were flagged.
                    </p>
                  </div>
                )}
              </div>

              <div className="p-5 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => { setShowSyncModal(false); setSyncResult(null); setSyncFile(null); }}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl cursor-pointer"
                >
                  Close Report
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
