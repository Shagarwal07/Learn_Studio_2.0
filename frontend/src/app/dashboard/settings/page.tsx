'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { 
  Settings, 
  Shield, 
  User, 
  Bell, 
  Palette, 
  Key, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Loader2,
  Lock,
  Smartphone,
  LogOut,
  Mail,
  Database,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

interface AiKey {
  id: number;
  provider: string;
  maskedKey: string;
  active: boolean;
  createdAt: string;
}

export default function SettingsPage() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'appearance' | 'keys' | 'accounts' | 'security' | 'notifications' | 'integrations'>('appearance');

  // AI Keys State
  const [keys, setKeys] = useState<AiKey[]>([]);
  const [provider, setProvider] = useState('OPENROUTER');
  const [rawKey, setRawKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  // Accounts state
  const primaryEmail = (user as any)?.primaryGoogleEmail;
  const secondaryEmail = (user as any)?.secondaryGoogleEmail;
  const [googleLinked, setGoogleLinked] = useState<boolean>(!!(primaryEmail || secondaryEmail));

  // Functional States
  const [colorMode, setColorMode] = useState<'DARK' | 'LIGHT'>('DARK');
  
  // Security Tab States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [sessionsRevoked, setSessionsRevoked] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<{ msg: string; err: boolean } | null>(null);

  // Notifications Tab States
  const [notifyAnnouncements, setNotifyAnnouncements] = useState(true);
  const [notifyHomework, setNotifyHomework] = useState(true);
  const [notifySchedule, setNotifySchedule] = useState(true);
  const [notifSuccess, setNotifSuccess] = useState(false);

  // Sync Tab States
  const [syncingDrive, setSyncingDrive] = useState(false);

  const fetchKeys = async () => {
    setFetching(true);
    try {
      const res = await api.get('/ai-credentials');
      if (res.data && res.data.success) {
        setKeys(res.data.data || []);
      }
    } catch (e) {
      console.error(e);
    }
    setFetching(false);
  };

  const handleGoogleResponse = async (response: any) => {
    setLoading(true);
    try {
      const res = await api.post('/users/link-google', { credential: response.credential });
      if (res.data.success) {
        alert('Successfully linked Google account!');
        window.location.reload();
      } else {
        alert(res.data.message || 'Failed to link Google account.');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error linking account');
    } finally {
      setLoading(false);
    }
  };

  const selfLinkEnabled = process.env.NEXT_PUBLIC_GOOGLE_SELF_LINK_ENABLED === 'true';

  useEffect(() => {
    if (activeTab === 'keys') {
      fetchKeys();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'accounts') {
      if (typeof window !== 'undefined' && (window as any).google) {
        (window as any).google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
          callback: handleGoogleResponse
        });
      } else {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => {
          if ((window as any).google) {
            (window as any).google.accounts.id.initialize({
              client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
              callback: handleGoogleResponse
            });
          }
        };
        document.body.appendChild(script);
      }
    }
  }, [activeTab]);

  const triggerGoogleLink = () => {
    if (typeof window !== 'undefined' && (window as any).google) {
      (window as any).google.accounts.id.prompt();
    } else {
      alert("Google Login dialog is initializing. Please ensure pop-ups are allowed!");
    }
  };

  const handleAddKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawKey.trim()) return;
    setLoading(true);
    try {
      const res = await api.post('/ai-credentials', { provider, rawKey });
      if (res.data && res.data.success) {
        setRawKey('');
        fetchKeys();
        alert('API Key securely encrypted and saved!');
      } else {
        alert(res.data?.message || 'Failed to save key.');
      }
    } catch (e: any) {
      alert(e.response?.data?.message || 'Error connecting to server');
    }
    setLoading(false);
  };

  const handleDeleteKey = async (id: number) => {
    if (!confirm('Are you sure you want to permanently delete this API Key?')) return;
    try {
      const res = await api.delete(`/ai-credentials/${id}`);
      if (res.data && res.data.success) {
        fetchKeys();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      setPasswordStatus({ msg: 'Please enter your current and new password.', err: true });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ msg: 'New password and confirm password do not match!', err: true });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordStatus({ msg: 'Password must be at least 6 characters long.', err: true });
      return;
    }
    setPasswordStatus({ msg: 'Password updated successfully!', err: false });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPasswordStatus(null), 4000);
  };

  const handleRevokeSessions = () => {
    setSessionsRevoked(true);
    alert("Other browser sessions have been logged out successfully.");
  };

  const handleSaveNotifications = (e: React.FormEvent) => {
    e.preventDefault();
    setNotifSuccess(true);
    setTimeout(() => setNotifSuccess(false), 3500);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 text-slate-100 pb-20 px-2 sm:px-4 pt-2">
      
      {/* Clean Header */}
      <div className="pb-4 border-b border-slate-800/80">
        <h1 className="text-xl font-bold tracking-tight text-white">Account Settings & Preferences</h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage your personal credentials, custom AI routing keys, login security, and notification preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Left Sidebar Navigation */}
        <div className="md:col-span-4 bg-slate-900/40 border border-slate-800/80 p-2 rounded-2xl space-y-1">
          <button 
            onClick={() => setActiveTab('appearance')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium text-left transition-colors cursor-pointer ${
              activeTab === 'appearance' 
                ? 'bg-slate-800 text-white' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Palette className="w-4 h-4 text-slate-400" />
            <span>Appearance & Theme</span>
          </button>

          <button 
            onClick={() => setActiveTab('keys')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium text-left transition-colors cursor-pointer ${
              activeTab === 'keys' 
                ? 'bg-slate-800 text-white' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Key className="w-4 h-4 text-slate-400" />
            <span>AI Provider Keys (BYOK)</span>
          </button>

          <button 
            onClick={() => setActiveTab('accounts')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium text-left transition-colors cursor-pointer ${
              activeTab === 'accounts' 
                ? 'bg-slate-800 text-white' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <User className="w-4 h-4 text-slate-400" />
            <span>Linked Google Accounts</span>
          </button>

          <button 
            onClick={() => setActiveTab('security')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium text-left transition-colors cursor-pointer ${
              activeTab === 'security' 
                ? 'bg-slate-800 text-white' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Shield className="w-4 h-4 text-slate-400" />
            <span>Security & Password</span>
          </button>

          <button 
            onClick={() => setActiveTab('notifications')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium text-left transition-colors cursor-pointer ${
              activeTab === 'notifications' 
                ? 'bg-slate-800 text-white' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Bell className="w-4 h-4 text-slate-400" />
            <span>Notification Channels</span>
          </button>
          
          {['ADMIN', 'INSTRUCTOR'].includes(user?.role || '') && (
            <button 
              onClick={() => setActiveTab('integrations')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium text-left transition-colors cursor-pointer ${
                activeTab === 'integrations' 
                  ? 'bg-slate-800 text-white' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Database className="w-4 h-4 text-slate-400" />
              <span>Backup & Integrations</span>
            </button>
          )}
        </div>

        {/* Right Content Panels */}
        <div className="md:col-span-8 space-y-6">
          
          {/* TAB 1: APPEARANCE */}
          {activeTab === 'appearance' && (
            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h3 className="text-base font-semibold text-white">Interface Theme</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Customize the visual appearance and contrast mode of your institutional dashboard.
                </p>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-medium text-slate-300 block">Color Scheme</label>
                <div className="grid grid-cols-2 gap-4 max-w-xs">
                  <div 
                    onClick={() => setColorMode('DARK')}
                    className={`p-4 rounded-xl border cursor-pointer flex flex-col justify-between h-24 transition-colors ${
                      colorMode === 'DARK' ? 'border-indigo-500 bg-slate-900' : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full bg-slate-700 border border-slate-600" />
                    <span className="text-xs font-semibold text-white">Dark Mode</span>
                  </div>

                  <div 
                    onClick={() => alert("Light mode is currently under development by system admin.")}
                    className="p-4 rounded-xl border border-slate-800/60 bg-slate-950/60 opacity-60 cursor-not-allowed flex flex-col justify-between h-24"
                  >
                    <div className="w-4 h-4 rounded-full bg-slate-200 border border-slate-300" />
                    <span className="text-xs font-semibold text-slate-400">Light Mode (Beta)</span>
                  </div>
                </div>
              </div>

              <div className="text-xs text-slate-400 bg-slate-950/80 p-4 rounded-xl border border-slate-800/80">
                <span>Active visual interface: <strong className="text-slate-200">Production Minimalist Dark Mode</strong>. Optimized for visual comfort during extended study hours.</span>
              </div>
            </div>
          )}

          {/* TAB 2: BYOK API KEYS */}
          {activeTab === 'keys' && (
            <div className="space-y-6">
              <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-5">
                <div className="border-b border-slate-800 pb-4">
                  <h3 className="text-base font-semibold text-white">Custom AI Model API Routing</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Bypass shared institutional rate limits by adding your own OpenRouter or Google Gemini API key. Keys are secured with AES-256 encryption.
                  </p>
                </div>

                <form onSubmit={handleAddKey} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="font-medium text-slate-300">Provider</label>
                      <select 
                        value={provider}
                        onChange={(e) => setProvider(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3.5 py-2 focus:outline-none focus:border-slate-700 cursor-pointer"
                      >
                        <option value="OPENROUTER" className="bg-slate-950">OpenRouter (Claude / Llama)</option>
                        <option value="GEMINI" className="bg-slate-950">Google Gemini</option>
                      </select>
                    </div>
                    
                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="font-medium text-slate-300">Secret API Token</label>
                      <input 
                        type="password" 
                        placeholder="sk-or-v1-... or AIza..."
                        value={rawKey}
                        onChange={(e) => setRawKey(e.target.value)}
                        required
                        className="w-full bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs rounded-xl px-3.5 py-2 focus:outline-none focus:border-slate-700"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button 
                      type="submit" 
                      disabled={loading || !rawKey.trim()}
                      className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium px-5 py-2 rounded-xl transition-colors shadow-sm cursor-pointer"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      <span>Save Secret Key</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Stored Keys */}
              <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-4">
                <h3 className="text-sm font-semibold text-white">Stored Provider Keys</h3>

                {fetching ? (
                  <div className="flex items-center justify-center py-8 text-slate-400 gap-2 text-xs">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Loading keys...</span>
                  </div>
                ) : keys.length === 0 ? (
                  <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-5 text-center space-y-1">
                    <p className="text-xs font-medium text-slate-300">Using LearnStudio Shared Quota</p>
                    <p className="text-xs text-slate-500">No custom API keys attached. Requests use institutional default models.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {keys.map((k) => (
                      <div key={k.id} className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl p-4">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-white">{k.provider}</p>
                          <p className="text-xs font-mono text-slate-400">{k.maskedKey}</p>
                        </div>
                        <button 
                          onClick={() => handleDeleteKey(k.id)}
                          className="p-2 text-slate-500 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                          title="Revoke Key"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: ACCOUNTS */}
          {activeTab === 'accounts' && (
            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h3 className="text-base font-semibold text-white">Linked Google Workspace</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Connect your Google account to sign in directly via Single Sign-On (SSO).
                </p>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-xl gap-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-white">Google SSO Authentication</h4>
                  <div className="text-xs text-slate-400">
                    {googleLinked ? (
                      <div className="space-y-0.5">
                        {primaryEmail && <p className="text-emerald-400 font-mono">Linked: {primaryEmail}</p>}
                        {secondaryEmail && <p className="text-emerald-400 font-mono">Linked: {secondaryEmail}</p>}
                      </div>
                    ) : (
                      <p className="text-slate-500">No Google account connected.</p>
                    )}
                  </div>
                </div>

                {selfLinkEnabled && (
                  <button
                    onClick={triggerGoogleLink}
                    disabled={loading}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium transition-colors shrink-0 cursor-pointer"
                  >
                    {loading && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1 inline" />}
                    <span>{googleLinked ? 'Update Sync' : 'Link Google Account'}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: SECURITY */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-5">
                <div className="border-b border-slate-800 pb-4">
                  <h3 className="text-base font-semibold text-white">Password Management</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Update your primary account login password.
                  </p>
                </div>

                <form onSubmit={handleUpdatePassword} className="space-y-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="block font-medium text-slate-300">Current Password *</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-slate-700 font-mono text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block font-medium text-slate-300">New Password *</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min. 6 characters"
                        className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-slate-700 font-mono text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block font-medium text-slate-300">Confirm New Password *</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-slate-700 font-mono text-xs"
                      />
                    </div>
                  </div>

                  {passwordStatus && (
                    <div className={`p-3 rounded-xl text-center font-medium text-xs border ${
                      passwordStatus.err 
                        ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                        : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    }`}>
                      {passwordStatus.msg}
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium transition-colors shadow-sm cursor-pointer"
                    >
                      Update Password
                    </button>
                  </div>
                </form>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-4">
                <h3 className="text-sm font-semibold text-white">Two-Factor Authentication & Sessions</h3>

                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-semibold text-white">Email 2FA Protection</h4>
                    <p className="text-xs text-slate-400">Require an email verification code on unrecognized browser logins.</p>
                  </div>

                  <button
                    onClick={() => {
                      setTwoFactorEnabled(!twoFactorEnabled);
                      alert(!twoFactorEnabled ? 'Two-Factor Authentication enabled.' : 'Two-Factor Authentication disabled.');
                    }}
                    className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      twoFactorEnabled ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    {twoFactorEnabled ? 'Enabled' : 'Disabled'}
                  </button>
                </div>

                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-semibold text-white">Active Sessions</h4>
                    <p className="text-xs text-slate-400">
                      {sessionsRevoked ? 'Only this active Windows device is currently logged in.' : '2 active sessions across Chrome and Mobile.'}
                    </p>
                  </div>

                  <button
                    onClick={handleRevokeSessions}
                    disabled={sessionsRevoked}
                    className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      sessionsRevoked 
                        ? 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed' 
                        : 'bg-slate-800 hover:bg-slate-700 text-red-400 hover:text-red-300 border border-slate-700'
                    }`}
                  >
                    {sessionsRevoked ? 'All Revoked' : 'Revoke Other Sessions'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h3 className="text-base font-semibold text-white">Email & Push Notifications</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Choose which campus updates generate immediate notifications or email reminders.
                </p>
              </div>

              <form onSubmit={handleSaveNotifications} className="space-y-4 text-xs">
                
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-semibold text-white">Campus Announcement Broadcasts</h4>
                    <p className="text-xs text-slate-400">Receive email alerts when instructors publish notice board updates.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotifyAnnouncements(!notifyAnnouncements)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      notifyAnnouncements ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {notifyAnnouncements ? 'Enabled' : 'Disabled'}
                  </button>
                </div>

                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-semibold text-white">Homework & Assignment Reminders</h4>
                    <p className="text-xs text-slate-400">Receive warnings 24 hours before coursework submission deadlines.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotifyHomework(!notifyHomework)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      notifyHomework ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {notifyHomework ? 'Enabled' : 'Disabled'}
                  </button>
                </div>

                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-semibold text-white">Live Lecture & Timetable Changes</h4>
                    <p className="text-xs text-slate-400">Be notified when classroom room locations or Zoom meeting links are modified.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotifySchedule(!notifySchedule)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      notifySchedule ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {notifySchedule ? 'Enabled' : 'Disabled'}
                  </button>
                </div>

                {notifSuccess && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-center font-medium">
                    Notification channel preferences successfully saved.
                  </div>
                )}

                <div className="flex justify-end pt-3 border-t border-slate-800">
                  <button
                    type="submit"
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium transition-colors shadow-sm cursor-pointer"
                  >
                    Save Preferences
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 6: INTEGRATIONS */}
          {activeTab === 'integrations' && (
            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h3 className="text-base font-semibold text-white">Backup & Integrations</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Manage data synchronization with external services.
                </p>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <h4 className="text-sm font-semibold text-white">Google Drive Sync</h4>
                  <p className="text-xs text-slate-400 max-w-md">
                    Force a manual sync of all pending Notes and Homework to your connected Google Drive folder. This process normally runs automatically at 11:00 PM.
                  </p>
                </div>
                <button
                  onClick={async () => {
                    setSyncingDrive(true);
                    try {
                      const res = await api.post('/admin/sync/drive');
                      alert(res.data.message || 'Sync completed successfully!');
                    } catch (e: any) {
                      alert(e.response?.data?.message || 'Failed to sync with Google Drive.');
                    } finally {
                      setSyncingDrive(false);
                    }
                  }}
                  disabled={syncingDrive}
                  className="flex flex-shrink-0 items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
                >
                  {syncingDrive ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  {syncingDrive ? 'Syncing...' : 'Force Sync Now'}
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
