import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Home, Plus, History, Settings, Disc } from 'lucide-react';
import SettingsModal from './SettingsModal.jsx';

export default function BottomNav() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Hide mobile bottom navigation bar on Landing page ("/")
  if (location.pathname === '/') {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden pointer-events-none select-none">
        
        {/* Bottom Bar Container with Extra Comfort Touch Height */}
        <div className="relative backdrop-blur-xl shadow-2xl px-2 py-2.5 pointer-events-auto flex items-center justify-around safe-bottom" style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderTop: '1px solid #E8EDE2' }}>
          
          {/* 1. Home Tab */}
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-1 px-2.5 transition active:scale-95 font-bold ${
                isActive ? '' : ''
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Home className="w-6 h-6 stroke-[2.2]" style={{ color: isActive ? '#6E9B37' : '#8C8C8C' }} />
                <span className="text-[11px] font-bold tracking-tight" style={{ color: isActive ? '#6E9B37' : '#8C8C8C' }}>Home</span>
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
                <Disc className="w-6 h-6 stroke-[2.2]" style={{ color: isActive ? '#6E9B37' : '#8C8C8C' }} />
                <span className="text-[11px] font-bold tracking-tight" style={{ color: isActive ? '#6E9B37' : '#8C8C8C' }}>Counter</span>
              </>
            )}
          </NavLink>

          {/* 3. Center Floating Plus Button */}
          <div className="relative -top-6 flex flex-col items-center">
            <button
              onClick={() => navigate(user ? '/dashboard' : '/login')}
              className="w-14 h-14 rounded-full text-white flex items-center justify-center shadow-xl border-4 border-white active:scale-90 transition-transform"
              style={{ backgroundColor: '#6E9B37', boxShadow: '0 8px 24px rgba(110, 155, 55, 0.4)' }}
              aria-label="Submit Salath Count"
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
                <History className="w-6 h-6 stroke-[2.2]" style={{ color: isActive ? '#6E9B37' : '#8C8C8C' }} />
                <span className="text-[11px] font-bold tracking-tight" style={{ color: isActive ? '#6E9B37' : '#8C8C8C' }}>History</span>
              </>
            )}
          </NavLink>

          {/* 5. Settings Tab */}
          <button
            onClick={() => setSettingsOpen(true)}
            className="flex flex-col items-center gap-1 py-1 px-2.5 transition active:scale-95"
          >
            <Settings className="w-6 h-6 stroke-[2.2]" style={{ color: settingsOpen ? '#6E9B37' : '#8C8C8C' }} />
            <span className="text-[11px] font-bold tracking-tight" style={{ color: settingsOpen ? '#6E9B37' : '#8C8C8C' }}>Settings</span>
          </button>

        </div>
      </div>

      {/* Settings Modal Drawer */}
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
