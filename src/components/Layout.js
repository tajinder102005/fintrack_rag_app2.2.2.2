import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import AIAdvisor from './AIAdvisor';
import { TAGLINE } from '../utils/format';
import {
  LayoutDashboard,
  Plus,
  List,
  Target,
  FileText,
  Bell,
  LogOut,
  Menu,
  X,
  ChevronDown,
  User,
  Mail,
  Shield
} from 'lucide-react';
import './Layout.css';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const { notifications } = useData();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const unreadNotifications = notifications.filter(n => !n.read).length;

  const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/add-transaction', icon: Plus, label: 'Add Transaction' },
    { path: '/transactions', icon: List, label: 'Transactions' },
    { path: '/budget', icon: Target, label: 'Budget' },
    { path: '/reports', icon: FileText, label: 'Reports' },
    { path: '/notifications', icon: Bell, label: 'Notifications', badge: unreadNotifications }
  ];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setProfileOpen(false);
    logout();
    navigate('/', { replace: true });
  };

  const userInitials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  const pageLabel = menuItems.find(item => item.path === location.pathname)?.label || 'Dashboard';

  return (
    <div className="layout app-theme">
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <Link to="/dashboard" className="logo">
            <span className="logo-mark">FT</span>
            <span className="logo-text">Fin<span className="logo-dot">Track</span></span>
          </Link>
          <button
            type="button"
            className="sidebar-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <p className="sidebar-tagline">{TAGLINE}</p>

        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive ? 'nav-item-active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={20} />
                <span>{item.label}</span>
                {item.badge > 0 && <span className="nav-badge">{item.badge}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <p className="trust-line">
            <Shield size={14} /> Bank-grade encryption · Your data stays yours
          </p>
          <button type="button" className="nav-item" onClick={handleLogout}>
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <div className="main-content">
        <header className="header">
          <div className="header-left">
            <button
              type="button"
              className="menu-toggle"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <div>
              <h1 className="page-title">{pageLabel}</h1>
              <p className="page-subtitle">{TAGLINE}</p>
            </div>
          </div>

          <div className="header-right" ref={profileRef}>
            <button
              type="button"
              className="profile-trigger"
              onClick={() => setProfileOpen(!profileOpen)}
              aria-expanded={profileOpen}
            >
              {user?.avatar ? (
                <img src={user.avatar} alt={user?.name} className="user-avatar" />
              ) : (
                <div className="user-avatar user-avatar-fallback">{userInitials}</div>
              )}
              <span className="user-name">{user?.name}</span>
              <ChevronDown size={16} className={`profile-chevron ${profileOpen ? 'open' : ''}`} />
            </button>

            {profileOpen && (
              <div className="profile-dropdown">
                <div className="profile-dropdown-header">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="" className="profile-dropdown-avatar" />
                  ) : (
                    <div className="profile-dropdown-avatar fallback">{userInitials}</div>
                  )}
                  <div>
                    <strong>{user?.name}</strong>
                    <span className="profile-email">
                      <Mail size={12} /> {user?.email}
                    </span>
                  </div>
                </div>
                <div className="profile-dropdown-body">
                  <div className="profile-detail">
                    <User size={16} />
                    <div>
                      <span className="label">Account</span>
                      <span className="value">FinTrack member</span>
                    </div>
                  </div>
                  <div className="profile-detail">
                    <Shield size={16} />
                    <div>
                      <span className="label">Security</span>
                      <span className="value">Password protected</span>
                    </div>
                  </div>
                </div>
                <div className="profile-dropdown-footer">
                  <button type="button" className="profile-logout-btn" onClick={handleLogout}>
                    <LogOut size={16} /> Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="page-content">{children}</main>
      </div>

      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} role="presentation" />
      )}

      <AIAdvisor />
    </div>
  );
};

export default Layout;
