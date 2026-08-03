import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api';

const TenantCtx = createContext(null);

export function TenantProvider({ children }) {
  const [activeTenant, setActiveTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const currentPath = window.location.pathname;
  const isPlatformAdminRoute =
    currentPath.startsWith('/super-admin') ||
    currentPath.startsWith('/admin') ||
    currentPath.startsWith('/register-team') ||
    currentPath.startsWith('/login') ||
    currentPath === '/';

  const resolveCurrentTenant = async () => {
    setLoading(true);
    setError(null);

    try {
      const host = window.location.hostname.toLowerCase();
      const searchParams = new URLSearchParams(window.location.search);
      const queryTenant = searchParams.get('tenant');

      let slug = null;

      // Extract subdomain ONLY if host is on platform root domain (e.g. *.swalath.online) or multi-level localhost (e.g. team1.localhost)
      const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');
      const isPlatformSubdomain = host.endsWith('.swalath.online') || (isLocalhost && host.split('.').length > 1 && !host.startsWith('localhost'));

      if (isPlatformSubdomain && host.includes('.')) {
        const parts = host.split('.');
        if (parts.length > 1 && parts[0] !== 'www' && parts[0] !== 'localhost' && parts[0] !== '127') {
          slug = parts[0];
        }
      }

      // Explicit URL query parameter fallback (e.g. localhost:5173/?tenant=noorulislam)
      if (!slug && queryTenant) {
        slug = queryTenant;
        localStorage.setItem('activeTenantSlug', slug);
      }

      // Query active tenant by slug or host domain
      let queryParam = slug
        ? `slug=${encodeURIComponent(slug)}&host=${encodeURIComponent(host)}`
        : `host=${encodeURIComponent(host)}`;

      const data = await api(`/events/active-tenant?${queryParam}`).catch((err) => {
        // If query by plain host failed on root domain, return null
        if (!slug && (host === 'localhost' || host === '127.0.0.1' || host === 'swalath.online' || host === 'www.swalath.online')) {
          return null;
        }
        throw err;
      });

      if (data) {
        setActiveTenant(data);
        localStorage.setItem('activeTenantSlug', data.slug);
        if (data.branding?.themeColor) {
          document.documentElement.style.setProperty('--primary-theme', data.branding.themeColor);
        }
      } else {
        setActiveTenant(null);
      }
    } catch (err) {
      const host = window.location.hostname.toLowerCase();
      setError(err.message || `Event domain "${host}" is invalid or pending approval.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    resolveCurrentTenant();
  }, []);

  const switchTenantSlug = (newSlug) => {
    if (newSlug) {
      localStorage.setItem('activeTenantSlug', newSlug);
      window.location.href = `/?tenant=${newSlug}`;
    } else {
      localStorage.removeItem('activeTenantSlug');
      window.location.href = '/';
    }
  };

  return (
    <TenantCtx.Provider value={{ activeTenant, loading, error, switchTenantSlug, reloadTenant: resolveCurrentTenant }}>
      {loading ? (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background text-foreground font-ml">
          <div className="flex flex-col items-center space-y-4 animate-fade-in">
            <div className="relative flex items-center justify-center">
              <img
                src="/appLogo.png"
                alt="Swalath Portal"
                className="w-14 h-14 rounded-2xl object-cover shadow-lg border border-primary/20 shrink-0"
              />
              <div className="absolute inset-0 rounded-2xl border-2 border-primary border-t-transparent animate-spin" />
            </div>
            {/* <div className="text-center space-y-1">
              <h2 className="text-sm font-extrabold text-foreground">സ്വലാത്ത് ക്യാമ്പയിൻ</h2>
              <p className="text-xs text-muted-foreground font-medium animate-pulse">Checking event subdomain status...</p>
            </div> */}
          </div>
        </div>
      ) : error && !isPlatformAdminRoute ? (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background text-foreground font-ml">
          <div className="max-w-md w-full bg-card rounded-3xl p-8 text-center space-y-5 shadow-2xl border border-border">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold bg-destructive/10 text-destructive border border-destructive/20">
              ✕
            </div>
            <h1 className="text-xl font-extrabold text-foreground">Invalid or Pending Subdomain</h1>
            <p className="text-xs p-3 rounded-xl font-mono leading-relaxed bg-muted/10 text-muted-foreground border border-border">
              {error}
            </p>
            <p className="text-xs font-medium text-muted-foreground">
              If you just registered this event team, a Super Admin must approve it before member access is activated.
            </p>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  window.location.href = '/super-admin';
                }}
                className="w-full py-3 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-md transition active:scale-95"
              >
                Log In as Super Admin (Approve Subdomain)
              </button>

              <button
                onClick={() => {
                  localStorage.removeItem('activeTenantSlug');
                  window.location.href = '/';
                }}
                className="w-full py-3 font-bold text-xs rounded-xl border border-border bg-muted/10 text-foreground transition"
              >
                Return to Platform Home
              </button>
            </div>
          </div>
        </div>
      ) : (
        children
      )}
    </TenantCtx.Provider>
  );
}

export function useTenant() {
  return useContext(TenantCtx);
}
