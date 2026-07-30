import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Home, Plus, History, Settings, Disc } from 'lucide-react';
import SettingsModal from './SettingsModal.jsx';

export default function BottomNav() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden pointer-events-none select-none">

        {/* Bottom Bar Container with Extra Comfort Touch Height */}
        <div className="relative bg-white/95 backdrop-blur-xl border-t border-stone-200/90 shadow-2xl px-2 py-2.5 pointer-events-auto flex items-center justify-around">

          {/* 1. Home Tab */}
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-1 px-2.5 transition active:scale-95 ${isActive ? 'text-[#00703c] font-extrabold' : 'text-stone-400 hover:text-stone-700'
              }`
            }
          >
            <Home className="w-6.5 h-6.5 stroke-[2.2]" />
            <span className="text-[11px] font-bold tracking-tight">Home</span>
          </NavLink>

          {/* 2. Counter Tab */}
          <NavLink
            to="/counter"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-1 px-2.5 transition active:scale-95 ${isActive ? 'text-[#00703c] font-extrabold' : 'text-stone-400 hover:text-stone-700'
              }`
            }
          >
            <Disc className="w-6.5 h-6.5 stroke-[2.2]" />
            <span className="text-[11px] font-bold tracking-tight">Counter</span>
          </NavLink>

          {/* 3. Center Floating Plus Button */}
          <div className="relative -top-6 flex flex-col items-center">
            <button
              onClick={() => navigate(user ? '/dashboard' : '/login')}
              className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#00703c] via-[#008a48] to-[#00572e] text-white flex items-center justify-center shadow-xl shadow-[#00703c]/40 border-4 border-white active:scale-90 transition-transform"
              aria-label="Submit Salath Count"
            >
              <Plus className="w-8 h-8 stroke-[2.8]" />
            </button>
          </div>

          {/* 4. History Tab */}
          <NavLink
            to={user ? "/history" : "/login"}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-1 px-2.5 transition active:scale-95 ${isActive ? 'text-[#00703c] font-extrabold' : 'text-stone-400 hover:text-stone-700'
              }`
            }
          >
            <History className="w-6.5 h-6.5 stroke-[2.2]" />
            <span className="text-[11px] font-bold tracking-tight">History</span>
          </NavLink>

          {/* 5. Settings Tab */}
          <button
            onClick={() => setSettingsOpen(true)}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 transition active:scale-95 ${settingsOpen ? 'text-[#00703c] font-extrabold' : 'text-stone-400 hover:text-stone-700'
              }`}
          >
            <Settings className="w-6.5 h-6.5 stroke-[2.2]" />
            <span className="text-[11px] font-bold tracking-tight">Settings</span>
          </button>

        </div>
      </div>

      {/* Settings Modal Drawer */}
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
