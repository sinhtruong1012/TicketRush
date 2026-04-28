import { useState, useEffect } from 'react';

const STORAGE_KEY = 'ticketrush_theme';

/**
 * useTheme — Dark/Light mode toggle with localStorage persistence.
 * Auto-detects system preference on first visit.
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

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');

  return { theme, toggleTheme };
};
