'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, refreshToken: string, userDetails: User) => void;
  logout: () => Promise<void>;
  updateUser: (userDetails: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/users/me');
        const { success, data } = response.data;
        if (success && data) {
          setUser(data);
        } else {
          localStorage.clear();
        }
      } catch (error: any) {
        console.warn('Failed to load user profile:', error.message || error);
        localStorage.clear();
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = (token: string, refreshToken: string, userDetails: User) => {
    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshToken);
    setUser(userDetails);
    
    // Redirect based on role
    if (userDetails.role === 'ADMIN') {
      router.push('/dashboard/instructor/batches');
    } else if (userDetails.role === 'INSTRUCTOR') {
      router.push('/dashboard/instructor/batches');
    } else {
      router.push('/dashboard');
    }
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    try {
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch (e: any) {
      console.warn('Logout request failed on backend:', e.message || e);
    } finally {
      localStorage.clear();
      setUser(null);
      router.push('/login');
    }
  };

  const updateUser = (userDetails: User) => {
    setUser(userDetails);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
