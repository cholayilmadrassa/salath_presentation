import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { TenantProvider, useTenant } from './context/TenantContext.jsx';
import Navbar from './components/Navbar.jsx';
import BottomNav from './components/BottomNav.jsx';
import InstallPrompt from './components/InstallPrompt.jsx';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import AddCount from './pages/AddCount.jsx';
import HistoryPage from './pages/History.jsx';
import Counter from './pages/Counter.jsx';
import AdminLogin from './pages/AdminLogin.jsx';
import AdminPanel from './pages/AdminPanel.jsx';
import EventTeamRegister from './pages/EventTeamRegister.jsx';
import SuperAdminDashboard from './pages/SuperAdminDashboard.jsx';
import NotificationsPage from './pages/NotificationsPage.jsx';
import AdminChangePassword from './pages/AdminChangePassword.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import NotFound from './pages/NotFound.jsx';
import { WifiOff } from 'lucide-react';

import './styles.css';

// Automatically scroll to the top of the view on every route change
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}

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

  if (user?.mustChangePassword) {
    return <Navigate to="/admin/change-password" replace />;
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

  if (user?.mustChangePassword) {
    return <Navigate to="/admin/change-password" replace />;
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

// Protected Route Component for Guest Pages (Prevents logged-in users from seeing Login / Signup)
function GuestOnlyRoute({ children }) {
  const { token, user, authenticating } = useAuth();

  if (authenticating) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 font-ml">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 mx-auto rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-xs font-extrabold text-muted-foreground">Checking session...</p>
        </div>
      </div>
    );
  }

  if (token && user) {
    return <Navigate to="/" replace />;
  }

  return children;
}

// Protected Route Component for Admin Login Page (Prevents logged-in admins from seeing Admin Login)
function AdminGuestOnlyRoute({ children }) {
  const { token, user, authenticating } = useAuth();
  const storedRole = localStorage.getItem('userRole');
  const role = user?.role || storedRole;

  if (authenticating) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 font-ml">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 mx-auto rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-xs font-extrabold text-muted-foreground">Checking admin session...</p>
        </div>
      </div>
    );
  }

  if (token && (role === 'tenant_admin' || role === 'super_admin')) {
    if (role === 'super_admin') {
      return <Navigate to="/super-admin" replace />;
    }
    return <Navigate to="/admin/panel" replace />;
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

function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="bg-destructive text-destructive-foreground px-4 py-2 text-xs font-extrabold text-center flex items-center justify-center gap-2 sticky top-0 z-50 shadow-md animate-slide-down">
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>No internet connection. Please check your network.</span>
    </div>
  );
}

function AppContent() {
  const { activeTenant } = useTenant();
  const location = useLocation();

  const isPlatformLanding = location.pathname === '/' && !activeTenant;
  const isAdminRoute = location.pathname.startsWith('/admin') || location.pathname.startsWith('/super-admin');
  const needsBottomPadding = !isPlatformLanding && !isAdminRoute;

  return (
    <div className={`min-h-screen ${needsBottomPadding ? 'pb-16 md:pb-0' : ''} bg-background text-foreground font-ml`}>
      <OfflineBanner />
      <Navbar />
      <InstallPrompt />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route
          path="/login"
          element={
            <GuestOnlyRoute>
              <Login />
            </GuestOnlyRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <GuestOnlyRoute>
              <Signup />
            </GuestOnlyRoute>
          }
        />

        {/* Protected Member Routes */}
        <Route
          path="/addcount"
          element={
            <MemberProtectedRoute>
              <AddCount />
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
        <Route
          path="/settings"
          element={
            <MemberProtectedRoute>
              <SettingsPage />
            </MemberProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <AdminGuestOnlyRoute>
              <AdminLogin />
            </AdminGuestOnlyRoute>
          }
        />
        <Route
          path="/admin/panel"
          element={
            <AdminProtectedRoute>
              <AdminPanel />
            </AdminProtectedRoute>
          }
        />
        <Route path="/admin/change-password" element={<AdminChangePassword />} />

        <Route path="/register-team" element={<EventTeamRegister />} />
        <Route
          path="/super-admin"
          element={
            <SuperAdminProtectedRoute>
              <SuperAdminWrapper />
            </SuperAdminProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <TenantProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </TenantProvider>
    </BrowserRouter>
  );
}
