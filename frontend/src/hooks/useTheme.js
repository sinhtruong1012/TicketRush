import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'ticketrush_theme';

/**
 * useTheme — Dark/Light mode toggle with localStorage persistence.
 * Auto-detects system preference on first visit.
 * Synchronizes state across multiple components using custom events.
 * Returns { theme: 'light'|'dark', toggleTheme }
 */
export const useTheme = () => {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  // Sync theme changes across multiple instances of useTheme in the same tab
  useEffect(() => {
    const handleThemeChange = (e) => setTheme(e.detail);
    window.addEventListener('themeChange', handleThemeChange);
    return () => window.removeEventListener('themeChange', handleThemeChange);
  }, []);

  const toggleTheme = useCallback(() => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    window.dispatchEvent(new CustomEvent('themeChange', { detail: nextTheme }));
  }, [theme]);

  return { theme, toggleTheme };
};
