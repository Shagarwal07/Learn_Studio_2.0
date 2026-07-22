'use client';

import React, { useState, useEffect } from 'react';

import { useTheme } from '@/context/ThemeContext';
import { Settings, Shield, User, Bell, Palette, Key, Plus, Trash2, CheckCircle2, Play, Loader2 } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'appearance' | 'keys' | 'accounts'>('appearance');

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
  const [linkedEmail, setLinkedEmail] = useState<string | null>(primaryEmail || secondaryEmail || null);
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
        // Refresh the page to get updated user object or just set state
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
        // dynamically load google script if not present
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
      alert("Google Login is not available at the moment. Please refresh.");
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
        alert('Key securely encrypted and saved!');
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

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-in fade-in duration-200">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-100">Settings</h2>
        <p className="text-xs text-slate-400 mt-1">
          Customize your dashboard preferences, theme configurations, and account security.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Left Side: Category Menu */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 h-fit space-y-1">
          <button 
            onClick={() => setActiveTab('appearance')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-left transition-all ${
              activeTab === 'appearance' 
                ? 'bg-violet-600 text-slate-100' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/50'
            }`}
          >
            <Palette className="w-4 h-4" />
            Appearance & Theme
          </button>

          <button 
            onClick={() => setActiveTab('keys')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-left transition-all ${
              activeTab === 'keys' 
                ? 'bg-violet-600 text-slate-100' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/50'
            }`}
          >
            <Key className="w-4 h-4" />
            Switch API (BYOK)
          </button>

          <button 
            onClick={() => setActiveTab('accounts')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-left transition-all ${
              activeTab === 'accounts' 
                ? 'bg-violet-600 text-slate-100' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/50'
            }`}
          >
            <User className="w-4 h-4" />
            Account & Linked Logistics
          </button>
          <button className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-400 hover:text-slate-200 hover:bg-slate-850/50 rounded-lg text-xs font-medium text-left transition-all">
            <Shield className="w-4 h-4" />
            Security & Privacy
          </button>
          <button className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-400 hover:text-slate-200 hover:bg-slate-850/50 rounded-lg text-xs font-medium text-left transition-all">
            <Bell className="w-4 h-4" />
            Notifications
          </button>
        </div>

        {/* Right Side: Settings Cards */}
        <div className="md:col-span-2 space-y-5">
          
          {activeTab === 'appearance' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                    <Palette className="w-4 h-4 text-violet-400" />
                    Global Appearance Theme
                  </h3>
                  <p className="text-xs text-slate-400 max-w-md leading-normal">
                    Locked to default system preference. Your dashboard theme dynamically synchronizes with your operating system settings.
                  </p>
                </div>
                <div className="shrink-0">
                  <ThemeToggle />
                </div>
              </div>
              
              <div className="border-t border-slate-800 my-4" />
              
              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></span>
                Active configuration: <span className="font-semibold text-teal-400 capitalize">System Default (Locked)</span>. All layouts are automatically aligned with your OS preference.
              </div>
            </div>
          )}

          {activeTab === 'accounts' && (
            <div className="space-y-5">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-4 h-4 text-violet-400" />
                  <h3 className="text-sm font-semibold text-slate-200">Linked Accounts</h3>
                </div>
                <p className="text-xs text-slate-400 mb-6 max-w-lg leading-relaxed">
                  Link your personal Google account to instantly log in via the "Sign in with Google" button on the login page without needing a password.
                </p>

                <div className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-200">Google Account</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {googleLinked ? (
                          <div className="flex flex-col gap-1">
                            {primaryEmail && <span className="text-teal-400 font-medium">Primary: {primaryEmail}</span>}
                            {secondaryEmail && <span className="text-teal-400 font-medium">Secondary: {secondaryEmail}</span>}
                          </div>
                        ) : (
                          "Not linked"
                        )}
                      </p>
                    </div>
                  </div>
                  
                  {selfLinkEnabled && (
                    <button
                      onClick={triggerGoogleLink}
                      disabled={loading}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                        googleLinked 
                          ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' 
                          : 'bg-white text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                      {googleLinked ? 'Change Link' : 'Link Google Account'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'keys' && (
            <div className="space-y-5">
              
              {/* Add Key Form */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Key className="w-4 h-4 text-violet-400" />
                  <h3 className="text-sm font-semibold text-slate-200">Bring Your Own Key (BYOK)</h3>
                </div>
                <p className="text-xs text-slate-400 mb-4">
                  Provide your own AI API keys to bypass LearnStudio shared quotas. Your keys are <strong>AES-256 encrypted</strong> and never stored in plain text.
                </p>
                
                <form onSubmit={handleAddKey} className="flex flex-col gap-3">
                  <div className="grid grid-cols-3 gap-3">
                    <select 
                      value={provider}
                      onChange={(e) => setProvider(e.target.value)}
                      className="col-span-1 bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-lg px-3 py-2 outline-none focus:border-violet-500"
                    >
                      <option value="OPENROUTER">OpenRouter</option>
                      <option value="GEMINI">Google Gemini</option>
                    </select>
                    <input 
                      type="password" 
                      placeholder="sk-or-v1-..."
                      value={rawKey}
                      onChange={(e) => setRawKey(e.target.value)}
                      required
                      className="col-span-2 bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-lg px-3 py-2 outline-none focus:border-violet-500"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button 
                      type="submit" 
                      disabled={loading || !rawKey.trim()}
                      className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      Encrypt & Save Key
                    </button>
                  </div>
                </form>
              </div>

              {/* Active Keys List */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-200 mb-4">Active Platform Routing</h3>
                
                {fetching ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
                  </div>
                ) : keys.length === 0 ? (
                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 text-center">
                    <p className="text-xs text-slate-400">You are currently using the LearnStudio Platform shared quota.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {keys.map((k) => (
                      <div key={k.id} className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-lg p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center">
                            <Shield className="w-4 h-4 text-teal-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-200">{k.provider}</p>
                            <div className="flex items-center gap-2 text-xs font-mono text-slate-500 mt-0.5">
                              {k.maskedKey}
                              <span className="flex items-center gap-1 text-[10px] text-teal-400 bg-teal-400/10 px-1.5 py-0.5 rounded-full border border-teal-400/20">
                                <CheckCircle2 className="w-3 h-3" /> Encrypted (AES-256)
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleDeleteKey(k.id)}
                            className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                            title="Delete Key"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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
    </div>
  );
}
