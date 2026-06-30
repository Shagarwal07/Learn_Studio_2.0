'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { UserPlus, Mail, Lock, User, Eye, EyeOff, Loader2, GraduationCap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function RegisterPage() {
  const { login } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('STUDENT');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !role) {
      setError('Please fill in all fields.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/register', { name, email, password, role });
      const { success, data, message } = response.data;

      if (success && data) {
        const { token, refreshToken, userId, name: userName, email: userEmail, role: userRole } = data;
        login(token, refreshToken, { id: userId, name: userName, email: userEmail, role: userRole });
      } else {
        setError(message || 'Registration failed.');
      }
    } catch (err: any) {
      console.warn('Registration failed:', err.message || err);
      setError(
        err.response?.data?.message || 'Failed to connect to backend. Is the server running?'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#070B16] text-white relative overflow-hidden select-none">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent-grape/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[500px] h-[500px] bg-primary-blue/5 rounded-full blur-3xl pointer-events-none" />
      
      {/* Grid line pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="w-full max-w-md p-8 md:p-10 glass-card rounded-3xl relative z-10 shadow-2xl"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-accent-grape/10 text-accent-grape rounded-2xl mb-4 border border-accent-grape/20 shadow-[0_0_15px_rgba(150,52,132,0.15)]">
            <UserPlus className="w-5 h-5" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Join Learn<span className="text-accent-grape">Studio</span>
          </h2>
          <p className="text-text-secondary mt-2 text-xs sm:text-sm leading-relaxed">
            Create an account to start your learning journey.
          </p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 mb-6 bg-error/5 border border-error/15 text-error rounded-2xl text-xs text-center"
          >
            {error}
          </motion.div>
        )}

        <div className="p-4 mb-6 bg-amber-500/10 border border-amber-500/25 text-amber-400 rounded-2xl text-xs text-center flex items-center justify-center gap-2">
          <Lock className="w-4 h-4 text-amber-400 shrink-0" />
          <span><strong>Registration Locked:</strong> Account creation is temporarily closed by the administrator.</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2 opacity-50">
            <label className="block text-text-secondary text-[10px] font-extrabold uppercase tracking-wider" htmlFor="name">
              Full Name
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-text-muted">
                <User className="w-4 h-4" />
              </span>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                disabled={true}
                className="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-border-color rounded-xl focus:outline-none focus:border-accent-grape focus:ring-1 focus:ring-accent-grape text-white placeholder-text-muted transition-all text-xs sm:text-sm cursor-not-allowed"
                required
              />
            </div>
          </div>

          <div className="space-y-2 opacity-50">
            <label className="block text-text-secondary text-[10px] font-extrabold uppercase tracking-wider" htmlFor="email">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-text-muted">
                <Mail className="w-4 h-4" />
              </span>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={true}
                className="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-border-color rounded-xl focus:outline-none focus:border-accent-grape focus:ring-1 focus:ring-accent-grape text-white placeholder-text-muted transition-all text-xs sm:text-sm cursor-not-allowed"
                required
              />
            </div>
          </div>

          <div className="space-y-2 opacity-50">
            <label className="block text-text-secondary text-[10px] font-extrabold uppercase tracking-wider" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-text-muted">
                <Lock className="w-4 h-4" />
              </span>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={true}
                className="w-full pl-11 pr-11 py-3.5 bg-white/5 border border-border-color rounded-xl focus:outline-none focus:border-accent-grape focus:ring-1 focus:ring-accent-grape text-white placeholder-text-muted transition-all text-xs sm:text-sm cursor-not-allowed"
                required
              />
              <button
                type="button"
                disabled={true}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-text-muted cursor-not-allowed"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2 opacity-50">
            <label className="block text-text-secondary text-[10px] font-extrabold uppercase tracking-wider">
              Select Your Role
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={true}
                onClick={() => setRole('STUDENT')}
                className={`py-3.5 px-4 border rounded-xl flex items-center justify-center gap-2 transition-all text-xs font-bold uppercase tracking-wider cursor-not-allowed ${
                  role === 'STUDENT'
                    ? 'bg-white/5 border-accent-grape/40 text-slate-400'
                    : 'bg-white/5 border-border-color text-text-secondary'
                }`}
              >
                <GraduationCap className="w-4.5 h-4.5" />
                Student
              </button>
              <button
                type="button"
                disabled={true}
                onClick={() => setRole('INSTRUCTOR')}
                className={`py-3.5 px-4 border rounded-xl flex items-center justify-center gap-2 transition-all text-xs font-bold uppercase tracking-wider cursor-not-allowed ${
                  role === 'INSTRUCTOR'
                    ? 'bg-white/5 border-accent-grape/40 text-slate-400'
                    : 'bg-white/5 border-border-color text-text-secondary'
                }`}
              >
                <User className="w-4.5 h-4.5" />
                Instructor
              </button>
            </div>
          </div>

          <button
            type="button"
            disabled={true}
            className="w-full py-3.5 mt-4 bg-slate-800 border border-slate-700/60 text-slate-500 font-bold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-not-allowed opacity-60"
          >
            <Lock className="w-4 h-4 text-slate-500" />
            Registration Locked
          </button>
        </form>

        <p className="text-text-muted mt-8 text-center text-xs sm:text-sm font-semibold">
          Already have an account?{' '}
          <Link href="/login" className="text-accent-grape hover:text-accent-blue font-bold transition-colors">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
