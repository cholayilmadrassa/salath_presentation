import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTenant } from '../context/TenantContext.jsx';
import { LogOut, Building2, ShieldCheck, Tag } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { activeTenant } = useTenant();
  const navigate = useNavigate();
  const location = useLocation();

  // Hide Navbar on the landing page ("/")
  if (location.pathname === '/') {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const title = activeTenant?.branding?.title || activeTenant?.name || 'സ്വലാത്ത് സമർപ്പണം';
  const tagline = activeTenant?.branding?.tagline || (activeTenant ? `Subdomain: ${activeTenant.slug}` : 'Multi-Tenant Event Platform');

  return (
    <header className="hidden md:block sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200/80 text-stone-900 select-none">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">

        {/* Logo & Identity */}
        <Link to="/" className="flex items-center gap-2.5">
          {activeTenant?.branding?.logoUrl ? (
            <img
              src={activeTenant.branding.logoUrl}
              alt={title}
              className="w-9 h-9 rounded-xl object-cover shadow-sm shrink-0"
              style={{ border: '1px solid rgba(38, 102, 127, 0.2)' }}
            />
          ) : (
            <img
              src="/logo.png"
              alt="Swalath Portal"
              className="w-9 h-9 rounded-xl object-cover shadow-sm shrink-0"
            />
          )}
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-stone-900 leading-none">
                {title}
              </span>
              {activeTenant && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {activeTenant.slug}
                </span>
              )}
            </div>
            <span className="text-[10px] text-stone-500 font-medium tracking-wide">
              {tagline}
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="flex items-center gap-5 text-xs font-bold text-stone-700">
          <NavLink
            to="/"
            className={({ isActive }) =>
              isActive ? 'text-emerald-800 font-extrabold border-b-2 border-emerald-700 pb-0.5' : 'hover:text-emerald-800 transition'
            }
          >
            Home
          </NavLink>

          <NavLink
            to="/register-team"
            className={({ isActive }) =>
              isActive ? 'text-indigo-700 font-extrabold flex items-center gap-1' : 'text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition'
            }
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Register Event Team</span>
          </NavLink>

          <NavLink
            to="/super-admin"
            className={({ isActive }) =>
              isActive ? 'text-amber-700 font-extrabold flex items-center gap-1' : 'text-amber-600 hover:text-amber-800 flex items-center gap-1 transition'
            }
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Super Admin</span>
          </NavLink>

          {user ? (
            <>
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  isActive ? 'text-emerald-800 font-extrabold border-b-2 border-emerald-700 pb-0.5' : 'hover:text-emerald-800 transition'
                }
              >
                Dashboard
              </NavLink>
              <div className="flex items-center gap-3 pl-3 border-l border-stone-200">
                <span className="text-xs font-bold text-stone-900 bg-stone-100 px-3 py-1 rounded-full border border-stone-200">
                  {user.name}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-xs text-red-600 hover:text-red-800 font-bold transition flex items-center gap-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Logout
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <NavLink to="/login" className="text-stone-700 hover:text-stone-900 font-semibold px-3 py-1.5 rounded-xl">
                Login
              </NavLink>
              <NavLink to="/signup" className="btn-primary !py-2 !px-4 text-xs font-bold rounded-xl shadow-sm">
                Register Member
              </NavLink>
            </div>
          )}
        </nav>

      </div>
    </header>
  );
}
