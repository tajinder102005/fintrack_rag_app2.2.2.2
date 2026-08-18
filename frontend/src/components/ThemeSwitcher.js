import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Zap } from 'lucide-react';
import './ThemeSwitcher.css';

const ThemeSwitcher = () => {
  const { theme, switchTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const themes = [
    { key: 'light', name: 'Light', icon: Sun, color: '#1976d2' },
    { key: 'dark', name: 'Dark', icon: Moon, color: '#00ffe0' },
    { key: 'neon', name: 'Neon', icon: Zap, color: '#ff00ff' }
  ];

  const currentTheme = themes.find(t => t.key === theme);
  const CurrentIcon = currentTheme.icon;

  return (
    <div className="theme-switcher">
      <button 
        className="theme-toggle"
        onClick={() => setIsOpen(!isOpen)}
        title={`Current: ${currentTheme.name}`}
      >
        <CurrentIcon size={20} />
      </button>
      
      {isOpen && (
        <div className="theme-dropdown">
          {themes.map((themeOption) => {
            const Icon = themeOption.icon;
            return (
              <button
                key={themeOption.key}
                className={`theme-option ${theme === themeOption.key ? 'active' : ''}`}
                onClick={() => {
                  switchTheme(themeOption.key);
                  setIsOpen(false);
                }}
              >
                <Icon size={16} />
                <span>{themeOption.name}</span>
                {theme === themeOption.key && <div className="check-mark">✓</div>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ThemeSwitcher;