import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';

export default function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Set email from landing page redirect state if present
  useEffect(() => {
    if (location.state && location.state.email) {
      setEmail(location.state.email);
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (isSignUp && password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const endpoint = isSignUp ? '/auth/register' : '/auth/login';
      const data = await api.post(endpoint, { email, password });
      
      // Store token and user details
      localStorage.setItem('netflix_token', data.token);
      localStorage.setItem('netflix_user', JSON.stringify(data.user));

      // Always allow user login and redirect to profile selection
      navigate('/profiles');
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-bg">
      <div className="auth-header">
        <div className="logo" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
          <img src="/movie-zone-logo.svg" alt="Movie Zone" style={{ height: '42px', width: 'auto' }} />
        </div>
      </div>

      <div className="login-container">
        <div className="login-card">
          <h2>{isSignUp ? 'Sign Up for Movie Zone' : 'Sign In'}</h2>
          
          {error && <span className="error-message" style={{ marginBottom: '15px' }}>{error}</span>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {isSignUp && (
              <div className="form-group">
                <input
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            )}

            <button type="submit" disabled={loading} style={{ background: '#e50914' }}>
              {loading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Sign In'}
            </button>
          </form>

          <div className="login-footer">
            {isSignUp ? (
              <p>
                Already have an account?{' '}
                <a href="#" onClick={(e) => { e.preventDefault(); setIsSignUp(false); setError(''); }}>
                  Sign in now
                </a>
                .
              </p>
            ) : (
              <p>
                New to Movie Zone?{' '}
                <a href="#" onClick={(e) => { e.preventDefault(); setIsSignUp(true); setError(''); }}>
                  Sign up now
                </a>
                .
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
