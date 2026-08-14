import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api';
import { WifiOff, RefreshCw } from 'lucide-react';

const TenantCtx = createContext(null);

export function TenantProvider({ children }) {
  const [activeTenant, setActiveTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const currentPath = window.location.pathname;
  const isPlatformAdminRoute =
    currentPath.startsWith('/super-admin') ||
    currentPath.startsWith('/register-team');

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
      const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
      const isNetworkErr = isOffline || (err.message && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError') || err.message.includes('Load failed') || err.message.includes('No internet')));

      if (isNetworkErr) {
        setError('No internet connection. Please check your network.');
      } else {
        setActiveTenant(null);
        setError(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    resolveCurrentTenant();

    const handleOnline = () => {
      if (error) resolveCurrentTenant();
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [error]);

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
          </div>
        </div>
      ) : error ? (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background text-foreground font-ml">
          <div className="max-w-md w-full bg-card rounded-3xl p-6 text-center space-y-5 shadow-xl border border-border">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto bg-destructive/10 text-destructive border border-destructive/20 shadow-sm">
              <WifiOff className="w-6 h-6" />
            </div>
            <div className="">
              <h1 className="text-xl font-extrabold text-foreground">
                ഇന്റർനെറ്റ് കണക്ഷൻ ലഭ്യമല്ല
              </h1>
              <p className="text-xs text-muted-foreground font-medium  max-w-xs mx-auto">
                ഇന്റർനെറ്റ് കണക്ഷൻ പരിശോധിച്ച ശേഷം വീണ്ടും ശ്രമിക്കുക.
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  resolveCurrentTenant();
                }}
                className="w-full py-3 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-md transition active:scale-95 flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>വീണ്ടും ശ്രമിക്കുക (Retry)</span>
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
