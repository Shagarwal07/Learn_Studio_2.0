'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import ProfileDropdown from '@/components/ProfileDropdown';
import { 
  Grid, 
  PlayCircle, 
  Compass, 
  Bot, 
  Award, 
  Settings, 
  Menu, 
  X, 
  Loader2,
  BookOpen,
  FileText,
  ClipboardList,
  Megaphone,
  ChevronLeft,
  ChevronRight,
  Calendar,
  ClipboardCheck
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!loading && !user) {
      router.push('/login');
    }
    // Load collapsed state from localStorage
    const saved = localStorage.getItem('sidebarCollapsed');
    if (saved === 'true') {
      setCollapsed(true);
    }
  }, [user, loading, router]);

  const toggleCollapse = () => {
    const newVal = !collapsed;
    setCollapsed(newVal);
    localStorage.setItem('sidebarCollapsed', String(newVal));
  };

  if (loading || !user || !mounted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white">
        <div className="relative">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
          <div className="absolute inset-0 blur-md bg-indigo-500/20 rounded-full animate-pulse" />
        </div>
        <p className="mt-4 text-slate-400 font-medium text-sm">Verifying session...</p>
      </div>
    );
  }

  const scheduleHref = user?.role === 'INSTRUCTOR' ? '/dashboard/instructor/schedules' : '/dashboard/schedule';
  const attendanceHref = user?.role === 'INSTRUCTOR' ? '/dashboard/instructor/attendance' : '/dashboard/attendance';

  let menuItems = [];

  if (user?.role === 'INSTRUCTOR') {
    menuItems = [
      { name: 'Dashboard Overview', href: '/dashboard', icon: Grid },
      { name: 'Batch Management', href: '/dashboard/instructor/batches', icon: BookOpen },
      { name: 'Auto-TA Generator', href: '/dashboard/instructor/auto-ta', icon: Bot },
      { name: 'Announcements', href: '/dashboard/instructor/announcements', icon: Megaphone },
      { name: 'Profile / Settings', href: '/dashboard/settings', icon: Settings },
    ];
  } else if (user?.role === 'ADMIN') {
    menuItems = [
      { name: 'Dashboard', href: '/dashboard', icon: Grid },
      { name: 'Batches', href: '/dashboard/instructor/batches', icon: BookOpen },
      { name: 'Auto-TA Generator', href: '/dashboard/instructor/auto-ta', icon: Bot },
      { name: 'Schedule', href: scheduleHref, icon: Calendar },
      { name: 'Attendance', href: attendanceHref, icon: ClipboardCheck },
      { name: 'Notes', href: '/dashboard/notes', icon: FileText },
      { name: 'Homework', href: '/dashboard/homework', icon: ClipboardList },
      { name: 'Announcements', href: '/dashboard/announcements', icon: Megaphone },
      { name: 'Settings', href: '/dashboard/settings', icon: Settings },
    ];
  } else {
    menuItems = [
      { name: 'Dashboard', href: '/dashboard', icon: Grid },
      { name: 'My Courses', href: '/dashboard/my-courses', icon: PlayCircle },
      { name: 'Explore Courses', href: '/courses', icon: Compass },
      { name: 'Schedule', href: '/dashboard/schedule', icon: Calendar },
      { name: 'Attendance', href: '/dashboard/attendance', icon: ClipboardCheck },
      { name: 'Notes', href: '/dashboard/notes', icon: FileText },
      { name: 'Homework', href: '/dashboard/homework', icon: ClipboardList },
      { name: 'Announcements', href: '/dashboard/announcements', icon: Megaphone },
      { name: 'Certificates', href: '/dashboard/certificates', icon: Award },
      { name: 'AI Assistant', href: '/dashboard/ai', icon: Bot },
      { name: 'Settings', href: '/dashboard/settings', icon: Settings },
    ];
  }

  // Map pathname to display title
  const getPageTitle = () => {
    if (pathname === '/dashboard') return 'Dashboard Overview';
    if (pathname.startsWith('/dashboard/my-courses')) return 'My Courses';
    if (pathname.startsWith('/courses')) return 'Explore Courses';
    if (pathname.startsWith('/dashboard/schedule') || pathname.startsWith('/dashboard/instructor/schedules')) return 'Schedule & Calendar';
    if (pathname.startsWith('/dashboard/attendance') || pathname.startsWith('/dashboard/instructor/attendance')) return 'Attendance Dashboard';
    if (pathname.startsWith('/dashboard/instructor/auto-ta')) return 'Auto-TA Exam Generator';
    if (pathname.startsWith('/dashboard/instructor/batches')) return 'Batch Management';
    if (pathname.startsWith('/dashboard/instructor/notes')) return 'Notes & PDF Upload Center';
    if (pathname.startsWith('/dashboard/instructor/homework')) return 'Homework Assignments Workspace';
    if (pathname.startsWith('/dashboard/instructor/announcements')) return 'Announcements Hub';
    if (pathname.startsWith('/dashboard/notes')) return 'Notes Module';
    if (pathname.startsWith('/dashboard/homework')) return 'Homework Assignments';
    if (pathname.startsWith('/dashboard/announcements')) return 'Announcements & Updates';
    if (pathname.startsWith('/dashboard/certificates')) return 'My Certificates';
    if (pathname.startsWith('/dashboard/ai')) return 'AI Assistant';
    if (pathname.startsWith('/dashboard/settings')) return 'Profile & Settings';
    return 'LearnStudio';
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-955/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Drawer */}
      <aside className={`fixed inset-y-0 left-0 z-50 ${
        collapsed ? 'lg:w-20' : 'lg:w-60'
      } bg-slate-900 border-r border-slate-800 text-white transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:flex lg:flex-col ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Brand */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-slate-800">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-base overflow-hidden">
            <div className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center text-white shrink-0">
              <BookOpen className="w-3.5 h-3.5" />
            </div>
            {!collapsed && (
              <span className="animate-in fade-in duration-300 tracking-tight">Learn<span className="text-violet-400">Studio</span></span>
            )}
          </Link>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2.5 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center ${
                  collapsed ? 'justify-center px-2' : 'px-3'
                } py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive 
                    ? 'bg-violet-600 text-slate-100 shadow-sm shadow-violet-500/10' 
                    : 'text-slate-400 hover:bg-slate-850/60 hover:text-slate-200'
                }`}
                title={collapsed ? item.name : undefined}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!collapsed && (
                  <span className="ml-2.5 truncate animate-in fade-in duration-200">{item.name}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Toggle Collapse Panel (Desktop) */}
        <div className="hidden lg:block p-3 border-t border-slate-800">
          <button
            onClick={toggleCollapse}
            className="w-full flex items-center justify-center p-2 bg-slate-850/40 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header */}
        <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-150 dark:border-slate-800/80 flex items-center justify-between px-6 lg:px-8 transition-colors duration-200">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-slate-105 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              {getPageTitle()}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <ProfileDropdown />
          </div>
        </header>

        {/* Dynamic Content */}
        <main className="flex-1 overflow-y-auto p-5 lg:p-6 bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
          {children}
        </main>

      </div>
    </div>
  );
}
