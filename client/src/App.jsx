import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { TenantProvider } from './context/TenantContext.jsx';
import Navbar from './components/Navbar.jsx';
import BottomNav from './components/BottomNav.jsx';
import InstallPrompt from './components/InstallPrompt.jsx';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Dashboard from './pages/Dashboard.jsx';
import HistoryPage from './pages/History.jsx';
import Counter from './pages/Counter.jsx';
import AdminLogin from './pages/AdminLogin.jsx';
import AdminPanel from './pages/AdminPanel.jsx';
import EventTeamRegister from './pages/EventTeamRegister.jsx';
import SuperAdminDashboard from './pages/SuperAdminDashboard.jsx';
import NotificationsPage from './pages/NotificationsPage.jsx';

import './styles.css';

// Protected Route Component for Admin Pages (Tenant Admin & Super Admin)
function AdminProtectedRoute({ children }) {
  const { token, user, authenticating } = useAuth();
  const storedRole = localStorage.getItem('userRole');
  const role = user?.role || storedRole;

  if (authenticating) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 font-ml">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 mx-auto rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-xs font-extrabold text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!token || (role !== 'tenant_admin' && role !== 'super_admin')) {
    return <Navigate to="/admin" replace />;
  }

  return children;
}

// Protected Route Component for Super Admin Page
function SuperAdminProtectedRoute({ children }) {
  const { token, user, authenticating } = useAuth();
  const storedRole = localStorage.getItem('userRole');
  const role = user?.role || storedRole;

  if (authenticating) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 font-ml">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 mx-auto rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-xs font-extrabold text-muted-foreground">Verifying super admin access...</p>
        </div>
      </div>
    );
  }

  if (!token || role !== 'super_admin') {
    return <Navigate to="/admin" replace />;
  }

  return children;
}

// Protected Route Component for Member Pages
function MemberProtectedRoute({ children }) {
  const { token, user, authenticating } = useAuth();

  if (authenticating) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 font-ml">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 mx-auto rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-xs font-extrabold text-muted-foreground">Loading session...</p>
        </div>
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function SuperAdminWrapper() {
  const { token, logout } = useAuth();

  return (
    <SuperAdminDashboard
      token={token}
      onLogout={() => {
        logout();
      }}
    />
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <TenantProvider>
        <AuthProvider>
          <div className="min-h-screen pb-16 md:pb-0 bg-background text-foreground font-ml">
            <Navbar />
            <InstallPrompt />
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              {/* Protected Member Routes */}
              <Route
                path="/dashboard"
                element={
                  <MemberProtectedRoute>
                    <Dashboard />
                  </MemberProtectedRoute>
                }
              />
              <Route
                path="/history"
                element={
                  <MemberProtectedRoute>
                    <HistoryPage />
                  </MemberProtectedRoute>
                }
              />
              <Route
                path="/counter"
                element={
                  <MemberProtectedRoute>
                    <Counter />
                  </MemberProtectedRoute>
                }
              />
              <Route
                path="/notifications"
                element={
                  <MemberProtectedRoute>
                    <NotificationsPage />
                  </MemberProtectedRoute>
                }
              />

              {/* Admin Routes */}
              <Route path="/admin" element={<AdminLogin />} />
              <Route
                path="/admin/panel"
                element={
                  <AdminProtectedRoute>
                    <AdminPanel />
                  </AdminProtectedRoute>
                }
              />

              <Route path="/register-team" element={<EventTeamRegister />} />
              <Route
                path="/super-admin"
                element={
                  <SuperAdminProtectedRoute>
                    <SuperAdminWrapper />
                  </SuperAdminProtectedRoute>
                }
              />
            </Routes>
            <BottomNav />
          </div>
        </AuthProvider>
      </TenantProvider>
    </BrowserRouter>
  );
}
