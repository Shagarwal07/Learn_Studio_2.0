'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { LogIn, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleResponse = async (response: any) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/google', { credential: response.credential });
      const { success, data, message } = res.data;
      if (success && data) {
        const { token, refreshToken, userId, name, email: userEmail, role } = data;
        login(token, refreshToken, { id: userId, name, email: userEmail, role });
      } else {
        setError(message || 'Google login failed.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Google login failed.');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).google) {
      (window as any).google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        callback: handleGoogleResponse
      });

      // Render the official Google sign-in button
      const googleBtn = document.getElementById('google-btn-container');
      if (googleBtn) {
        (window as any).google.accounts.id.renderButton(googleBtn, {
          theme: 'filled_black',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          width: 320
        });
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      const { success, data, message } = response.data;

      if (success && data) {
        const { token, refreshToken, userId, name, email: userEmail, role } = data;
        login(token, refreshToken, { id: userId, name, email: userEmail, role });
      } else {
        setError(message || 'Login failed. Please check your credentials.');
      }
    } catch (err: any) {
      console.warn('Login failed:', err.message || err);
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
        initial={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="w-full max-w-md p-8 md:p-10 glass-card rounded-3xl relative z-10 shadow-2xl"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-accent-grape/10 text-accent-grape rounded-2xl mb-4 border border-accent-grape/20 shadow-[0_0_15px_rgba(150,52,132,0.15)]">
            <LogIn className="w-5 h-5" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Learn<span className="text-accent-grape">Studio</span> 2.0
          </h2>
          <p className="text-text-secondary mt-2 text-xs sm:text-sm leading-relaxed">
            Sign in to access your dashboard and resume learning.
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

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
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
                className="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-border-color rounded-xl focus:outline-none focus:border-accent-grape focus:ring-1 focus:ring-accent-grape text-white placeholder-text-muted transition-all text-xs sm:text-sm"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-text-secondary text-[10px] font-extrabold uppercase tracking-wider" htmlFor="password">
                Password
              </label>
              <a href="#" className="text-[10px] font-bold uppercase tracking-wider text-accent-grape hover:text-accent-blue transition-colors">
                Forgot?
              </a>
            </div>
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
                className="w-full pl-11 pr-11 py-3.5 bg-white/5 border border-border-color rounded-xl focus:outline-none focus:border-accent-grape focus:ring-1 focus:ring-accent-grape text-white placeholder-text-muted transition-all text-xs sm:text-sm"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-text-muted hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 mt-2 bg-gradient-to-r from-accent-grape to-primary-blue hover:from-accent-grape/90 hover:to-primary-blue/90 disabled:from-slate-800 disabled:to-slate-800 text-white font-bold rounded-xl shadow-lg shadow-accent-grape/15 transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border-color" />
          </div>
          <div className="relative flex justify-center text-[9px] font-bold uppercase tracking-wider">
            <span className="bg-[#101827] border border-border-color px-3.5 py-0.5 rounded-full text-text-muted select-none">Or continue with</span>
          </div>
        </div>

        <div className="w-full flex justify-center mt-4">
          <div id="google-btn-container"></div>
        </div>

        <p className="text-text-muted mt-8 text-center text-xs sm:text-sm font-semibold">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-accent-grape hover:text-accent-blue font-bold transition-colors">
            Sign up
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
