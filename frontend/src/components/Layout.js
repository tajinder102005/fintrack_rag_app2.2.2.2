import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import AIAdvisor from './AIAdvisor';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  LayoutDashboard,
  Plus,
  List,
  Target,
  FileText,
  Bell,
  Menu,
  X,
  Sun,
  Moon,
  Zap
} from 'lucide-react';
import './Layout.css';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
    setProfileOpen(false);
  }, [location]);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleProfile = () => setProfileOpen(!profileOpen);

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/add-transaction', icon: Plus, label: 'Add Transaction' },
    { path: '/transactions', icon: List, label: 'Transactions' },
    { path: '/budget', icon: Target, label: 'Budget' },
    { path: '/reports', icon: FileText, label: 'Reports' },
    { path: '/notifications', icon: Bell, label: 'Notifications' },
  ];

  const getPageTitle = () => {
    const item = navItems.find(item => item.path === location.pathname);
    return item ? item.label : 'Dashboard';
  };

  const getInitials = (name) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U';
  };

  return (
    <div className="layout app-theme">
      <div className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <Link to="/dashboard" className="logo">
            <div className="logo-mark">FT</div>
            <div className="logo-text">
              fintrack<span className="logo-dot">.ai</span>
            </div>
          </Link>
          <button className="sidebar-close" onClick={toggleSidebar}>
            <X size={20} />
          </button>
        </div>
        
        

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive ? 'nav-item-active' : ''}`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="trust-line">
            <Zap size={12} />
            <span>AI-powered insights</span>
          </div>
        </div>
      </div>

      <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={toggleSidebar}></div>

      <div className="main-content">
        <header className="header">
          <div className="header-left">
            <button className="menu-toggle" onClick={toggleSidebar}>
              <Menu size={20} />
            </button>
            <div>
              <h1 className="page-title">{getPageTitle()}</h1>
            </div>
          </div>

          <div className="header-right">
            <div className="theme-switcher">
              <button
                className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
                onClick={() => setTheme('light')}
              >
                <Sun size={14} />
                <span>Light</span>
              </button>
              <button
                className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
                onClick={() => setTheme('dark')}
              >
                <Moon size={14} />
                <span>Dark</span>
              </button>
              <button
                className={`theme-btn ${theme === 'neon' ? 'active' : ''}`}
                onClick={() => setTheme('neon')}
              >
                <Zap size={14} />
                <span>Neon</span>
              </button>
            </div>

            <div className="user-info">
              <button
                className="profile-trigger"
                onClick={toggleProfile}
              >
                <div className="user-avatar">
                  <span className="user-avatar-fallback">{getInitials(user?.name)}</span>
                </div>
                <span className="user-name">{user?.name || 'User'}</span>
                <span className={`profile-chevron ${profileOpen ? 'open' : ''}`}>
                  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </span>
              </button>

              {profileOpen && (
                <div className="profile-dropdown">
                  <div className="profile-dropdown-header">
                    <div className="profile-dropdown-avatar fallback">
                      {getInitials(user?.name)}
                    </div>
                    <div>
                      <strong>{user?.name || 'User'}</strong>
                      <div className="profile-email">
                        <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                          <path d="M22 6l-10 7L2 6" />
                        </svg>
                        <span>{user?.email || 'user@example.com'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="profile-dropdown-body">
                    <Link to="/profile" className="profile-link-btn" onClick={() => setProfileOpen(false)}>
                      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      Settings & Profile
                    </Link>
                  </div>
                  <div className="profile-dropdown-footer">
                    <button className="profile-logout-btn" onClick={logout}>
                      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="page-content">
          {children}
        </main>
      </div>
      <AIAdvisor />
    </div>
  );
};

export default Layout;
