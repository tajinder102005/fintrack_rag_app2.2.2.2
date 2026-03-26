import React, { createContext, useContext, useState, useEffect } from 'react';

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
    // Check if user is logged in from localStorage
    const savedUser = localStorage.getItem('fintrack_user');
    const savedAuth = localStorage.getItem('fintrack_auth');
    
    if (savedUser && savedAuth === 'true') {
      setUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const login = (email, password) => {
    // Simulate login - in real app, this would be an API call
    const userData = {
      id: 1,
      name: 'John Doe',
      email: email,
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face&auto=format'
    };
    
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('fintrack_user', JSON.stringify(userData));
    localStorage.setItem('fintrack_auth', 'true');
    
    return { success: true };
  };

  const register = (name, email, password) => {
    // Simulate registration - in real app, this would be an API call
    const userData = {
      id: 1,
      name: name,
      email: email,
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face&auto=format'
    };
    
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('fintrack_user', JSON.stringify(userData));
    localStorage.setItem('fintrack_auth', 'true');
    
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('fintrack_user');
    localStorage.removeItem('fintrack_auth');
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
