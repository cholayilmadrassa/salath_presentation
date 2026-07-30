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

      // Extract subdomain if present (e.g. noorulislam.swalath.app or noorulislam.localhost:5173)
      if (host.includes('.')) {
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

      if (slug) {
        const data = await api(`/events/active-tenant?slug=${slug}`).catch((err) => {
          throw err;
        });

        if (data) {
          setActiveTenant(data);
          localStorage.setItem('activeTenantSlug', data.slug);
          if (data.branding?.themeColor) {
            document.documentElement.style.setProperty('--primary-theme', data.branding.themeColor);
          }
        }
      } else {
        // Plain root domain -> platform marketing view
        setActiveTenant(null);
      }
    } catch (err) {
      const host = window.location.hostname.toLowerCase();
      const searchParams = new URLSearchParams(window.location.search);
      const slug = searchParams.get('tenant') || (host.includes('.') ? host.split('.')[0] : '');

      if (slug) {
        setError(err.message || `Event subdomain "${slug}" is invalid or pending approval.`);
      }
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

  // Allow platform & admin routes to render without blocking error modal
  if (error && isPlatformAdminRoute) {
    return (
      <TenantCtx.Provider value={{ activeTenant: null, loading, error, switchTenantSlug, reloadTenant: resolveCurrentTenant }}>
        {children}
      </TenantCtx.Provider>
    );
  }

  return (
    <TenantCtx.Provider value={{ activeTenant, loading, error, switchTenantSlug, reloadTenant: resolveCurrentTenant }}>
      {error ? (
        <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#F7F5EC', color: '#1A1A1A' }}>
          <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center space-y-5 shadow-2xl border" style={{ borderColor: '#E8EDE2' }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold" style={{ backgroundColor: '#FEF2F2', color: '#DC2626' }}>
              ✕
            </div>
            <h1 className="text-xl font-extrabold" style={{ color: '#1A1A1A' }}>Invalid or Pending Subdomain</h1>
            <p className="text-xs p-3 rounded-xl font-mono leading-relaxed" style={{ backgroundColor: '#F7F5EC', color: '#8C8C8C', border: '1px solid #E8EDE2' }}>
              {error}
            </p>
            <p className="text-xs font-medium" style={{ color: '#8C8C8C' }}>
              If you just registered this event team, a Super Admin must approve it before member access is activated.
            </p>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  window.location.href = '/super-admin';
                }}
                className="w-full py-3 text-white font-bold text-xs rounded-xl shadow-md transition active:scale-95"
                style={{ backgroundColor: '#FFC107', color: '#1A1A1A' }}
              >
                Log In as Super Admin (Approve Subdomain)
              </button>

              <button
                onClick={() => {
                  localStorage.removeItem('activeTenantSlug');
                  window.location.href = '/';
                }}
                className="w-full py-3 font-bold text-xs rounded-xl border transition"
                style={{ backgroundColor: '#E8EDE2', borderColor: '#E8EDE2', color: '#1A1A1A' }}
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
