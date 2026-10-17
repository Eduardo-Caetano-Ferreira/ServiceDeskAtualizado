import { useState, useEffect } from 'react';
import { ThemeContext } from './themeCore';

export function ThemeProvider({ children }) {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem('serviceDesk_theme');
      if (saved) return saved === 'dark';
      return false;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      const root = document.documentElement;
      if (isDarkMode) {
        root.classList.add('dark');
        root.setAttribute('data-theme', 'dark');
        localStorage.setItem('serviceDesk_theme', 'dark');
      } else {
        root.classList.remove('dark');
        root.setAttribute('data-theme', 'light');
        localStorage.setItem('serviceDesk_theme', 'light');
      }
    } catch (e) {
      console.warn('Erro ao persistir preferência de tema:', e);
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  const setDarkMode = (value) => {
    setIsDarkMode(Boolean(value));
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode, setDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}
