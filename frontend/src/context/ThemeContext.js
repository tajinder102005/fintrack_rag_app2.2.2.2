import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('fintrack-theme') || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('fintrack-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const switchTheme = (newTheme) => {
    setTheme(newTheme);
  };

  const value = {
    theme,
    setTheme,
    switchTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};