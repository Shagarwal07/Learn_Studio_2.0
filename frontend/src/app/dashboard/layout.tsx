'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import ProfileDropdown from '@/components/ProfileDropdown';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Grid,
  Home,
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
  ClipboardCheck,
  Lock,
  Users
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground transition-colors duration-300">
        <div className="relative">
          <Loader2 className="w-12 h-12 animate-spin text-accent-grape" />
          <div className="absolute inset-0 blur-md bg-accent-grape/20 rounded-full animate-pulse" />
        </div>
        <p className="mt-4 text-text-secondary font-medium text-sm">Verifying session.</p>
      </div>
    );
  }

  const scheduleHref = user?.role === 'INSTRUCTOR' ? '/dashboard/instructor/schedules' : '/dashboard/schedule';
  const attendanceHref = user?.role === 'INSTRUCTOR' ? '/dashboard/instructor/attendance' : '/dashboard/attendance';

  let menuItems: { name: string; href: string; icon: any; locked?: boolean }[] = [];

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
      // { name: 'Attendance', href: attendanceHref, icon: ClipboardCheck },
      { name: 'Notes', href: '/dashboard/notes', icon: FileText },
      { name: 'Homework', href: '/dashboard/homework', icon: ClipboardList },
      { name: 'Announcements', href: '/dashboard/announcements', icon: Megaphone },
      { name: 'Users', href: '/dashboard/admin/users', icon: Users },
      { name: 'Settings', href: '/dashboard/settings', icon: Settings },
    ];
  } else {
    menuItems = [
      { name: 'Home', href: '/', icon: Home },
      { name: 'Dashboard', href: '/dashboard', icon: Grid },
      // { name: 'My Courses', href: '/dashboard/my-courses', icon: PlayCircle },
      { name: 'Explore Courses', href: '/courses', icon: Compass, locked: true },
      { name: 'Schedule', href: '/dashboard/schedule', icon: Calendar },
      // { name: 'Attendance', href: '/dashboard/attendance', icon: ClipboardCheck },
      { name: 'Notes', href: '/dashboard/notes', icon: FileText },
      { name: 'Homework', href: '/dashboard/homework', icon: ClipboardList },
      { name: 'Announcements', href: '/dashboard/announcements', icon: Megaphone },
      // { name: 'Certificates', href: '/dashboard/certificates', icon: Award },
      { name: 'AI Assistant', href: '/dashboard/ai', icon: Bot },
      { name: 'Settings', href: '/dashboard/settings', icon: Settings },
    ];
  }

  // Map pathname to display title
  const getPageTitle = () => {
    if (pathname === '/dashboard') return 'Dashboard Overview';
    if (pathname.startsWith('/dashboard/admin/users')) return 'User Administration';
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

  const activeGrad = 'bg-accent-grape/10 text-accent-grape border-l-[3px] border-accent-grape dark:bg-gradient-to-r dark:from-accent-grape/15 dark:to-primary-blue/5 dark:text-white shadow-[inset_0_0_8px_rgba(150,52,132,0.08)]';
  const inactiveGrad = 'text-text-secondary hover:text-foreground hover:bg-card border-l-[3px] border-transparent';

  return (
    <div className="min-h-screen flex bg-background text-foreground transition-colors duration-300">
      
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-card backdrop-blur-md lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar Drawer (Mobile & Tablet) */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside 
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 z-50 w-64 bg-bg-secondary border-r border-border-color text-foreground flex flex-col lg:hidden"
          >
            {/* Mobile Brand Area */}
            <div className="h-16 flex items-center justify-between px-5 border-b border-border-color">
              <Link href="/dashboard" className="flex items-center gap-2.5 font-bold text-base">
                <div className="w-8 h-8 bg-gradient-to-br from-accent-grape to-primary-blue rounded-xl flex items-center justify-center text-white shadow-lg shadow-accent-grape/30">
                  <BookOpen className="w-4 h-4" />
                </div>
                <span className="tracking-tight text-white font-extrabold">Learn<span className="text-accent-grape">Studio</span></span>
              </Link>
              <button 
                onClick={() => setSidebarOpen(false)}
                className="p-2 hover:bg-card rounded-xl text-text-secondary hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Mobile Navigation */}
            <nav className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto">
              {menuItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.locked ? '#' : item.href}
                    onClick={(e) => {
                      if (item.locked) {
                        e.preventDefault();
                        alert('Explore Courses catalog is currently locked.');
                      } else {
                        setSidebarOpen(false);
                      }
                    }}
                    className={`flex items-center px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
isActive ? activeGrad : inactiveGrad
}`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 mr-3 ${isActive ? 'text-accent-grape' : ''}`} />
                    <span>{item.name}</span>
                    {item.locked && (
                      <Lock className="w-3.5 h-3.5 text-text-muted/50 shrink-0 ml-auto" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar (Persistent with Framer Motion Width Animation) */}
      <motion.aside 
        animate={{ width: collapsed ? 80 : 260 }}
        transition={{ type: 'spring', damping: 24, stiffness: 180 }}
        className="hidden lg:flex lg:flex-col lg:static z-35 bg-bg-secondary border-r border-border-color shrink-0 overflow-hidden"
      >
        {/* Brand Logo */}
        <div className="h-16 flex items-center px-5 border-b border-border-color overflow-hidden">
          <Link href="/dashboard" className="flex items-center gap-3 font-bold text-base w-full shrink-0">
            <div className="w-8 h-8 bg-gradient-to-br from-accent-grape to-primary-blue rounded-xl flex items-center justify-center text-white shadow-lg shadow-accent-grape/30">
              <BookOpen className="w-4 h-4" />
            </div>
            {!collapsed && (
              <motion.span 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="tracking-tight text-white font-black text-lg"
              >
                Learn<span className="text-accent-grape">Studio</span>
              </motion.span>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto overflow-x-hidden scrollbar-thin">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.locked ? '#' : item.href}
                onClick={(e) => {
                  if (item.locked) {
                    e.preventDefault();
                    alert('Explore Courses catalog is currently locked.');
                  }
                }}
                className={`flex items-center py-2.5 rounded-xl text-[13px] font-semibold transition-all group ${
collapsed ? 'justify-center px-0' : 'px-4'
} ${isActive ? activeGrad : inactiveGrad}`}
                title={collapsed ? (item.locked ? `${item.name} (Locked)` : item.name) : undefined}
              >
                <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-105 ${
isActive ? 'text-accent-grape' : 'text-text-muted group-hover:text-foreground'
}`} />
                {!collapsed && (
                  <motion.span 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="ml-3 truncate animate-fade-in"
                  >
                    {item.name}
                  </motion.span>
                )}
                {item.locked && !collapsed && (
                  <Lock className="w-3.5 h-3.5 text-text-muted/50 shrink-0 ml-auto group-hover:text-foreground/80 transition-colors" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Toggle Collapse Panel */}
        <div className="p-4 border-t border-border-color">
          <button
            onClick={toggleCollapse}
            className="w-full flex items-center justify-center p-2.5 bg-background hover:bg-card border border-border-color rounded-xl text-text-secondary hover:text-foreground transition-all cursor-pointer shadow-sm"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </motion.aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header */}
        <header className="h-16 bg-bg-secondary/70 backdrop-blur-md border-b border-border-color flex items-center justify-between px-6 lg:px-8 z-30 transition-colors duration-200">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-black/5 dark:hover:bg-card rounded-xl text-text-secondary hover:text-foreground transition-colors cursor-pointer shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-sm sm:text-base font-bold tracking-tight text-foreground uppercase truncate min-w-0">
              {getPageTitle()}
            </h1>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <ProfileDropdown />
          </div>
        </header>

        {/* Dynamic Content */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 bg-background transition-colors duration-200 scrollbar-thin">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="min-h-full w-full max-w-7xl mx-auto"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

      </div>
    </div>
  );
}
