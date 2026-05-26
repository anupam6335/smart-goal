'use client';

import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const stored = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const initial = stored || 'light';
    setTheme(initial);
    document.documentElement.className = initial;
  }, []);

  const toggle = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.className = newTheme;
    localStorage.setItem('theme', newTheme);
  };

  return (
    <button
      onClick={toggle}
      style={{
        position: 'fixed',
        bottom: '1rem',
        right: '1rem',
        background: 'var(--accent-moss)',
        color: 'white',
        border: 'none',
        padding: '0.5rem 1rem',
        borderRadius: 'var(--radius)',
        cursor: 'pointer',
        zIndex: 1000,
        fontWeight: 'bold',
      }}
    >
      {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
    </button>
  );
}