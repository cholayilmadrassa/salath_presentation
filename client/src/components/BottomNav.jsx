import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTenant } from '../context/TenantContext.jsx';
import { api } from '../api.js';
import { Home, Plus, History, Bell, Disc, Settings } from 'lucide-react';

export default function BottomNav() {
  const { user, token } = useAuth();
  const { activeTenant } = useTenant();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  const isNotificationsOpen = location.pathname === '/notifications';

  useEffect(() => {
    if (!token || !user) return;
    if (isNotificationsOpen) {
      setUnreadCount(0);
      return;
    }
    api('/notifications/inbox', { token })
      .then((res) => {
        if (res && typeof res.unreadCount === 'number') {
          setUnreadCount(res.unreadCount);
        }
      })
      .catch(() => {});
  }, [token, user, location.pathname, isNotificationsOpen]);

  if (
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/super-admin') ||
    (location.pathname === '/' && !activeTenant)
  ) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden pointer-events-none select-none">
      <div className="relative backdrop-blur-xl shadow-2xl px-2 pt-2 pointer-events-auto flex items-center justify-around safe-bottom bg-card/95 border-t border-border">
        {/* 1. Home Tab */}
        <NavLink
          to="/"
          className="flex flex-col items-center gap-1 py-1 px-2.5 transition active:scale-95 font-bold"
        >
          {({ isActive }) => (
            <>
              <Home className={`w-6 h-6 stroke-[2.2] ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`text-[11px] font-bold tracking-tight ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>Home</span>
            </>
          )}
        </NavLink>

        {/* 2. Counter Tab */}
        <NavLink
          to="/counter"
          className="flex flex-col items-center gap-1 py-1 px-2.5 transition active:scale-95"
        >
          {({ isActive }) => (
            <>
              <Disc className={`w-6 h-6 stroke-[2.2] ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`text-[11px] font-bold tracking-tight ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>Counter</span>
            </>
          )}
        </NavLink>

        {/* 3. Center Floating Plus Button */}
        <div className="relative -top-6 flex flex-col items-center">
          <button
            onClick={() => navigate(user ? '/addcount' : '/login')}
            className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xl border-4 border-card active:scale-90 transition-transform"
            aria-label="Submit Swalath Count"
          >
            <Plus className="w-8 h-8 stroke-[2.8]" />
          </button>
        </div>

        {/* 4. History Tab */}
        <NavLink
          to={user ? "/history" : "/login"}
          className="flex flex-col items-center gap-1 py-1 px-2.5 transition active:scale-95"
        >
          {({ isActive }) => (
            <>
              <History className={`w-6 h-6 stroke-[2.2] ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`text-[11px] font-bold tracking-tight ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>History</span>
            </>
          )}
        </NavLink>

        {/* 5. Settings Tab */}
        <NavLink
          to={user ? "/settings" : "/login"}
          className="flex flex-col items-center gap-1 py-1 px-2.5 transition active:scale-95"
        >
          {({ isActive }) => (
            <>
              <Settings className={`w-6 h-6 stroke-[2.2] ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`text-[11px] font-bold tracking-tight ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>Settings</span>
            </>
          )}
        </NavLink>
      </div>
    </div>
  );
}
