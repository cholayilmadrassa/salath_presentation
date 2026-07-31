import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTenant } from '../context/TenantContext.jsx';
import { Home, Plus, History, Settings, Disc } from 'lucide-react';
import SettingsModal from './SettingsModal.jsx';

export default function BottomNav() {
  const { user } = useAuth();
  const { activeTenant } = useTenant();
  const navigate = useNavigate();
  const location = useLocation();
  const [settingsOpen, setSettingsOpen] = useState(false);

  if (location.pathname === '/' && !activeTenant) {
    return null;
  }

  return (
    <>
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-card/95 backdrop-blur-xl border-t border-border shadow-2xl select-none"
        style={{
          paddingBottom: 'max(0.35rem, env(safe-area-inset-bottom))',
          paddingTop: '0.4rem',
        }}
      >
        <div className="px-2 flex items-center justify-around">
          {/* 1. Home Tab */}
          <NavLink
            to="/"
            className="flex flex-col items-center gap-0.5 py-0.5 px-2 transition active:scale-95 font-bold"
          >
            {({ isActive }) => (
              <>
                <Home className={`w-5 h-5 stroke-[2.2] ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className={`text-[10px] font-bold tracking-tight ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>Home</span>
              </>
            )}
          </NavLink>

          {/* 2. Counter Tab */}
          <NavLink
            to="/counter"
            className="flex flex-col items-center gap-0.5 py-0.5 px-2 transition active:scale-95"
          >
            {({ isActive }) => (
              <>
                <Disc className={`w-5 h-5 stroke-[2.2] ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className={`text-[10px] font-bold tracking-tight ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>Counter</span>
              </>
            )}
          </NavLink>

          {/* 3. Center Floating Plus Button */}
          <div className="relative -top-4 flex flex-col items-center shrink-0">
            <button
              onClick={() => navigate(user ? '/dashboard' : '/login')}
              className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg border-4 border-card active:scale-90 transition-transform"
              aria-label="Submit Swalath Count"
            >
              <Plus className="w-7 h-7 stroke-[2.8]" />
            </button>
          </div>

          {/* 4. History Tab */}
          <NavLink
            to={user ? "/history" : "/login"}
            className="flex flex-col items-center gap-0.5 py-0.5 px-2 transition active:scale-95"
          >
            {({ isActive }) => (
              <>
                <History className={`w-5 h-5 stroke-[2.2] ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className={`text-[10px] font-bold tracking-tight ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>History</span>
              </>
            )}
          </NavLink>

          {/* 5. Settings Tab */}
          <button
            onClick={() => setSettingsOpen(true)}
            className="flex flex-col items-center gap-0.5 py-0.5 px-2 transition active:scale-95"
          >
            <Settings className={`w-5 h-5 stroke-[2.2] ${settingsOpen ? 'text-primary' : 'text-muted-foreground'}`} />
            <span className={`text-[10px] font-bold tracking-tight ${settingsOpen ? 'text-primary' : 'text-muted-foreground'}`}>Settings</span>
          </button>
        </div>
      </nav>

      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
