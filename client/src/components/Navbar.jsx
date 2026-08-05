import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTenant } from '../context/TenantContext.jsx';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut, Building2, ShieldCheck } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { activeTenant } = useTenant();
  const navigate = useNavigate();
  const location = useLocation();

  if (location.pathname === '/') {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const title = activeTenant?.branding?.title || activeTenant?.name || 'സ്വലാത്ത് ക്യാമ്പയിൻ';
  const tagline = activeTenant?.branding?.tagline || (activeTenant ? `Subdomain: ${activeTenant.slug}` : 'Multi-Tenant Event Platform');

  return (
    <header className="hidden md:block sticky top-0 z-30 bg-card/95 backdrop-blur-md border-b border-border text-foreground select-none">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo & Identity */}
        <Link to="/" className="flex items-center gap-2.5">
          {activeTenant?.branding?.logoUrl ? (
            <img
              src={activeTenant.branding.logoUrl}
              alt={title}
              className="w-9 h-9 rounded-xl object-cover shadow-sm shrink-0 border border-border"
            />
          ) : (
            <img
              src="/appLogo.png"
              alt="Swalath Portal"
              className="w-9 h-9 rounded-xl object-cover shadow-sm shrink-0 border border-white/30"
            />
          )}
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-foreground leading-none">
                {title}
              </span>
              {activeTenant && (
                <Badge variant="muted" className="font-mono text-[10px]">
                  {activeTenant.slug}
                </Badge>
              )}
            </div>
            <span className="text-[10px] text-muted-foreground font-medium tracking-wide">
              {tagline}
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="flex items-center gap-5 text-xs font-bold text-muted-foreground">
          <NavLink
            to="/"
            className={({ isActive }) =>
              isActive ? 'text-primary font-extrabold border-b-2 border-primary pb-0.5' : 'hover:text-foreground transition'
            }
          >
            Home
          </NavLink>

          <NavLink
            to="/register-team"
            className={({ isActive }) =>
              isActive ? 'text-secondary font-extrabold flex items-center gap-1' : 'text-muted-foreground hover:text-foreground flex items-center gap-1 transition'
            }
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Register Swalath Campain</span>
          </NavLink>

          <NavLink
            to="/super-admin"
            className={({ isActive }) =>
              isActive ? 'text-amber-700 font-extrabold flex items-center gap-1' : 'text-muted-foreground hover:text-foreground flex items-center gap-1 transition'
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
                  isActive ? 'text-primary font-extrabold border-b-2 border-primary pb-0.5' : 'hover:text-foreground transition'
                }
              >
                Dashboard
              </NavLink>
              <div className="flex items-center gap-3 pl-3 border-l border-border">
                <Badge variant="muted" className="text-xs px-3 py-1">
                  {user.name}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-xs text-destructive hover:text-destructive hover:bg-destructive/10 h-8 px-2"
                >
                  <LogOut className="w-3.5 h-3.5 mr-1" />
                  Logout
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <NavLink to="/login">Login</NavLink>
              </Button>
              <Button size="sm" asChild>
                <NavLink to="/signup">Register Member</NavLink>
              </Button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
