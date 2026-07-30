import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
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
import AdminDashboard from './pages/AdminDashBoard.jsx';
import EventTeamRegister from './pages/EventTeamRegister.jsx';
import SuperAdminDashboard from './pages/SuperAdminDashboard.jsx';

import './styles.css';

function SuperAdminWrapper() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole') || '');

  if (token && userRole === 'super_admin') {
    return (
      <SuperAdminDashboard
        token={token}
        onLogout={() => {
          localStorage.removeItem('token');
          localStorage.removeItem('userRole');
          setToken('');
          setUserRole('');
        }}
      />
    );
  }

  return (
    <AdminLogin
      onLoginSuccess={(tok, role) => {
        setToken(tok);
        setUserRole(role);
      }}
    />
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <TenantProvider>
        <AuthProvider>
          <div className="min-h-screen pb-16 md:pb-0 bg-stone-50 text-slate-800">
            <Navbar />
            <InstallPrompt />
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/counter" element={<Counter />} />
              <Route path="/admin" element={<AdminLogin />} />
              <Route path="/admin/panel" element={<AdminPanel />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/register-team" element={<EventTeamRegister />} />
              <Route path="/super-admin" element={<SuperAdminWrapper />} />
            </Routes>
            <BottomNav />
          </div>
        </AuthProvider>
      </TenantProvider>
    </BrowserRouter>
  );
}
