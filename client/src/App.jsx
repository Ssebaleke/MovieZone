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
  const userStr = localStorage.getItem('netflix_user');
  const user = userStr ? JSON.parse(userStr) : null;
  if (!user || user.role !== 'ADMIN') {
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
