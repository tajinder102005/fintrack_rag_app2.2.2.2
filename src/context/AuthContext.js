import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user info is in URL (OAuth redirect)
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const userJson = urlParams.get('user');

    if (token && userJson) {
      try {
        const parsedUser = JSON.parse(decodeURIComponent(userJson));
        localStorage.setItem('fintrack_token', token);
        localStorage.setItem('fintrack_user', JSON.stringify(parsedUser));
        setUser(parsedUser);
        setIsAuthenticated(true);
        // Clear query parameters
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (error) {
        console.error('Failed to parse user from OAuth redirect:', error);
      }
    } else {
      // Standard local storage check
      const savedToken = localStorage.getItem('fintrack_token');
      const savedUser = localStorage.getItem('fintrack_user');

      if (savedToken && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Failed to parse saved user:', error);
          localStorage.removeItem('fintrack_token');
          localStorage.removeItem('fintrack_user');
        }
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.login({ email, password });

      if (response && response.token && response.user) {
        setUser(response.user);
        setIsAuthenticated(true);
        localStorage.setItem('fintrack_token', response.token);
        localStorage.setItem('fintrack_user', JSON.stringify(response.user));

        return { success: true };
      } else {
        return { success: false, message: 'Server did not return a valid session' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error.message || 'Login failed. Please check your credentials.'
      };
    }
  };

  const register = async (name, email, password) => {
    try {
      const response = await api.register({ name, email, password });

      if (response && response.token && response.user) {
        setUser(response.user);
        setIsAuthenticated(true);
        localStorage.setItem('fintrack_token', response.token);
        localStorage.setItem('fintrack_user', JSON.stringify(response.user));

        return { success: true };
      } else {
        return { success: false, message: 'Server did not return a valid session' };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: error.message || 'Registration failed. Please try again.'
      };
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('fintrack_token');
    localStorage.removeItem('fintrack_user');
  };

  const value = {
    isAuthenticated,
    user,
    login,
    register,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
