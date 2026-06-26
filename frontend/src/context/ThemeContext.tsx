'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system'); // Default to system preference for initial load

  useEffect(() => {
    // Load theme from localStorage on mount
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) {
      setThemeState(savedTheme);
    } else {
      setThemeState('system');
    }
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;

    const applyTheme = (targetTheme: Theme) => {
      root.classList.remove('light', 'dark');
      if (targetTheme === 'system') {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.classList.add(isDark ? 'dark' : 'light');
      } else {
        root.classList.add(targetTheme);
      }
    };

    applyTheme(theme);
    localStorage.setItem('theme', theme);

    // If active theme is 'system', listen to OS theme changes dynamically
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleSystemChange = () => {
        applyTheme('system');
      };

      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleSystemChange);
      } else {
        mediaQuery.addListener(handleSystemChange);
      }

      return () => {
        if (mediaQuery.removeEventListener) {
          mediaQuery.removeEventListener('change', handleSystemChange);
        } else {
          mediaQuery.removeListener(handleSystemChange);
        }
      };
    }
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
