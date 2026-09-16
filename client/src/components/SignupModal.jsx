import React, { useState } from 'react';
import { X, Mail, Lock, User, Zap, Eye, EyeOff } from 'lucide-react';
import { api } from '../utils/api';
import { useNavigate } from 'react-router-dom';

export default function SignupModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState('signup'); // 'signup' | 'login'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const reset = () => { setName(''); setEmail(''); setPassword(''); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      if (mode === 'signup') {
        const data = await api.post('/auth/register', { name, email, password });
        localStorage.setItem('netflix_token', data.token);
        localStorage.setItem('netflix_user', JSON.stringify(data.user));
        onClose();
        navigate('/profiles');
      } else {
        const data = await api.post('/auth/login', { email, password });
        localStorage.setItem('netflix_token', data.token);
        localStorage.setItem('netflix_user', JSON.stringify(data.user));
        onClose();
        navigate('/profiles');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="su-overlay" onClick={onClose}>
      <div className="su-sheet" onClick={e => e.stopPropagation()}>
        {/* Handle bar */}
        <div className="su-handle" />

        {/* Close */}
        <button className="su-close" onClick={onClose}><X size={20} /></button>

        {/* Logo + headline */}
        <div className="su-top">
          <img src="/movie-zone-logo.svg" alt="MovieZone" className="su-logo" />
          <h2 className="su-title">
            {mode === 'signup' ? 'Create your free account' : 'Welcome back'}
          </h2>
          <p className="su-sub">
            {mode === 'signup'
              ? 'Sign up to start watching. Subscribe after to unlock all content.'
              : 'Sign in to continue watching.'}
          </p>
        </div>

        {error && <div className="su-error">{error}</div>}

        <form className="su-form" onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div className="su-field">
              <User size={16} color="#666" />
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                autoFocus
              />
            </div>
          )}
          <div className="su-field">
            <Mail size={16} color="#666" />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="su-field">
            <Lock size={16} color="#666" />
            <input
              type={showPass ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
            />
            <button type="button" className="su-eye" onClick={() => setShowPass(!showPass)}>
              {showPass ? <EyeOff size={15} color="#666" /> : <Eye size={15} color="#666" />}
            </button>
          </div>

          <button type="submit" className="su-submit" disabled={loading}>
            {loading ? 'Please wait...' : (
              <><Zap size={16} fill="#fff" /> {mode === 'signup' ? 'Create Account' : 'Sign In'}</>
            )}
          </button>
        </form>

        <div className="su-switch">
          {mode === 'signup' ? (
            <>Already have an account? <button onClick={() => { setMode('login'); reset(); }}>Sign in</button></>
          ) : (
            <>New here? <button onClick={() => { setMode('signup'); reset(); }}>Create account</button></>
          )}
        </div>
      </div>
    </div>
  );
}
