import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const AuthCallback = () => {
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithToken } = useAuth();

  useEffect(() => {
    const processToken = async () => {
      const urlParams = new URLSearchParams(location.search);
      const token = urlParams.get('token');
      const errParam = urlParams.get('error');

      if (errParam) {
        setError('Authentication failed. Please try again.');
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      if (!token) {
        setError('No token provided.');
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      try {
        const result = await loginWithToken(token);
        if (result.success) {
          navigate('/dashboard', { replace: true });
        } else {
          setError(result.message || 'Login failed.');
          setTimeout(() => navigate('/login'), 3000);
        }
      } catch (err) {
        setError('An error occurred during authentication.');
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    processToken();
  }, [location, navigate, loginWithToken]);

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div className="auth-header">
          <div className="auth-logo">
            <span className="auth-logo-mark">FT</span>
            <h1>Fin<span>Track</span></h1>
          </div>
          {error ? (
            <>
              <h2 style={{ color: 'red' }}>Error</h2>
              <p>{error}</p>
              <p>Redirecting back to login...</p>
            </>
          ) : (
            <>
              <h2>Authenticating...</h2>
              <p>Please wait while we complete your login.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;
