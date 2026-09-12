import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';

export default function AccountSettings() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const cachedUser = localStorage.getItem('netflix_user');
    if (cachedUser) {
      setUser(JSON.parse(cachedUser));
    }
  }, []);

  const handleCancelSub = async () => {
    if (!window.confirm('Are you sure you want to cancel your subscription? You will lose access at the end of the billing period.')) {
      return;
    }
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const res = await api.post('/billing/cancel');
      if (res.success) {
        const updated = { ...user, subscriptionStatus: 'CANCELED' };
        setUser(updated);
        localStorage.setItem('netflix_user', JSON.stringify(updated));
        setMessage('Subscription cancelled successfully.');
      }
    } catch (err) {
      setError(err.message || 'Error cancelling subscription');
    } finally {
      setLoading(false);
    }
  };

  const handleReactivateSub = async () => {
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const res = await api.post('/billing/reactivate');
      if (res.success) {
        const updated = { ...user, subscriptionStatus: 'ACTIVE' };
        setUser(updated);
        localStorage.setItem('netflix_user', JSON.stringify(updated));
        setMessage('Subscription successfully reactivated!');
      }
    } catch (err) {
      setError(err.message || 'Error reactivating subscription');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div style={{ color: '#fff', textAlign: 'center', marginTop: '100px' }}>Loading settings...</div>;

  return (
    <div style={{ background: '#141414', minHeight: '100vh', color: '#fff', paddingBottom: '60px' }}>
      {/* Mini Nav */}
      <div className="navbar-header scrolled" style={{ position: 'relative' }}>
        <div className="logo" style={{ cursor: 'pointer' }} onClick={() => navigate('/browse')}>
          <img src="/movie-zone-logo.svg" alt="Movie Zone" style={{ height: '38px', width: 'auto' }} />
        </div>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <span style={{ fontSize: '0.9rem', color: '#aaa' }}>{user.email}</span>
          <button className="auth-btn" style={{ background: '#333' }} onClick={() => navigate('/browse')}>Back to Browse</button>
        </div>
      </div>

      <div className="settings-wrapper">
        <h1>Account Settings</h1>
        
        {message && <div style={{ background: '#1c3d1f', border: '1px solid #46d369', color: '#46d369', padding: '12px', borderRadius: '4px', marginBottom: '20px' }}>{message}</div>}
        {error && <div className="error-message" style={{ background: '#3d1c1c', border: '1px solid #e50914', padding: '12px', borderRadius: '4px', marginBottom: '20px' }}>{error}</div>}

        {/* Section 1: Membership Info */}
        <div className="settings-section-row">
          <div className="settings-section-title">Membership & Billing</div>
          <div className="settings-details-col">
            <div className="settings-detail-item">
              <div>
                <strong style={{ display: 'block', marginBottom: '4px' }}>{user.email}</strong>
                <span style={{ color: '#888' }}>Password: *********</span>
              </div>
              <span className="settings-action-link" onClick={() => alert('Change password functionality not implemented in this demo')}>Change password</span>
            </div>

            <div className="settings-detail-item" style={{ borderTop: '1px solid #222', paddingTop: '15px' }}>
              <div>
                <span style={{ color: '#888' }}>Subscription status: </span>
                <span style={{ fontWeight: '600', color: user.subscriptionStatus === 'ACTIVE' ? '#46d369' : '#e50914' }}>
                  {user.subscriptionStatus}
                </span>
              </div>
              {user.subscriptionStatus === 'ACTIVE' ? (
                <span className="settings-action-link" style={{ color: '#e50914' }} onClick={handleCancelSub}>
                  Cancel membership
                </span>
              ) : user.subscriptionStatus === 'CANCELED' ? (
                <span className="settings-action-link" style={{ color: '#46d369' }} onClick={handleReactivateSub}>
                  Reactivate membership
                </span>
              ) : (
                <span className="settings-action-link" onClick={() => navigate('/signup/plans')}>
                  Sign up for a plan
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Plan Info */}
        <div className="settings-section-row">
          <div className="settings-section-title">Plan Details</div>
          <div className="settings-details-col">
            <div className="settings-detail-item">
              <div>
                <strong style={{ textTransform: 'capitalize' }}>{user.plan || 'No Active Plan'}</strong>
                {user.plan === 'BASIC' && <span style={{ display: 'block', color: '#888', fontSize: '0.9rem' }}>Good resolution (720p). Ad-free.</span>}
                {user.plan === 'STANDARD' && <span style={{ display: 'block', color: '#888', fontSize: '0.9rem' }}>Better resolution (1080p). Ad-free.</span>}
                {user.plan === 'PREMIUM' && <span style={{ display: 'block', color: '#888', fontSize: '0.9rem' }}>Best resolution (4K+HDR). Ad-free.</span>}
              </div>
              <span className="settings-action-link" onClick={() => navigate('/signup/plans')}>Change plan</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
