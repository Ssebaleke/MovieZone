import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import PlanSelector from './pages/PlanSelector';
import ProfileSelector from './pages/ProfileSelector';
import Browse from './pages/Browse';
import WatchlistPage from './pages/WatchlistPage';
import AccountSettings from './pages/AccountSettings';
import AdminDashboard from './pages/AdminDashboard';

// Route protector for Authenticated users
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('netflix_token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// Route protector for Active Profiles
function ProfileGate({ children }) {
  const profile = localStorage.getItem('netflix_profile');
  if (!profile) {
    return <Navigate to="/profiles" replace />;
  }
  return children;
}

// Route protector for Admin Role
function AdminGate({ children }) {
  const [checking, setChecking] = React.useState(true);
  const [isAdmin, setIsAdmin] = React.useState(false);

  React.useEffect(() => {
    const cachedStr = localStorage.getItem('netflix_user');
    const cachedUser = cachedStr ? JSON.parse(cachedStr) : null;
    if (cachedUser && cachedUser.role === 'ADMIN') {
      setIsAdmin(true);
      setChecking(false);
    }

    // Verify live role from server
    api.get('/auth/me')
      .then(res => {
        if (res && res.user) {
          localStorage.setItem('netflix_user', JSON.stringify(res.user));
          if (res.user.role === 'ADMIN') {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
        }
      })
      .catch(err => {
        console.error('AdminGate check failed:', err);
      })
      .finally(() => {
        setChecking(false);
      });
  }, []);

  if (checking) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0c', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
        <div>Loading Admin Console...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/browse" replace />;
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Payment Subscription flow */}
        <Route path="/signup/plans" element={
          <ProtectedRoute>
            <PlanSelector />
          </ProtectedRoute>
        } />

        {/* Profile Selector */}
        <Route path="/profiles" element={
          <ProtectedRoute>
            <ProfileSelector />
          </ProtectedRoute>
        } />

        {/* Core client browse dashboard */}
        <Route path="/browse" element={
          <ProtectedRoute>
            <ProfileGate>
              <Browse />
            </ProfileGate>
          </ProtectedRoute>
        } />

        {/* Watchlist */}
        <Route path="/mylist" element={
          <ProtectedRoute>
            <ProfileGate>
              <WatchlistPage />
            </ProfileGate>
          </ProtectedRoute>
        } />

        {/* User Account Settings */}
        <Route path="/account" element={
          <ProtectedRoute>
            <AccountSettings />
          </ProtectedRoute>
        } />

        {/* Standalone Admin Console */}
        <Route path="/admin" element={
          <ProtectedRoute>
            <AdminGate>
              <AdminDashboard />
            </AdminGate>
          </ProtectedRoute>
        } />

        <Route path="/admin/dashboard" element={
          <ProtectedRoute>
            <AdminGate>
              <AdminDashboard />
            </AdminGate>
          </ProtectedRoute>
        } />

        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
