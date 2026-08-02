import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api.js';
import { syncPushSubscription } from '../utils/pushManager.js';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || 'null'));
  const [authenticating, setAuthenticating] = useState(true);

  // Validate JWT Token and refresh profile on mount
  useEffect(() => {
    async function verifyAuth() {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        setToken(null);
        setUser(null);
        setAuthenticating(false);
        return;
      }

      try {
        const data = await api('/auth/me', { token: storedToken });
        if (data && data.user) {
          setToken(storedToken);
          setUser(data.user);
          localStorage.setItem('user', JSON.stringify(data.user));
          if (data.user.role) {
            localStorage.setItem('userRole', data.user.role);
          }
          // Silently synchronize active Web Push subscription in background
          syncPushSubscription(storedToken);
        }
      } catch (err) {
        console.warn('JWT Token verification failed or expired:', err.message);
        logout();
      } finally {
        setAuthenticating(false);
      }
    }

    verifyAuth();
  }, []);

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
      if (user.role) {
        localStorage.setItem('userRole', user.role);
      }
    } else {
      localStorage.removeItem('user');
      localStorage.removeItem('userRole');
    }
  }, [user]);

  function login(nextToken, nextUser) {
    setToken(nextToken);
    setUser(nextUser);
    localStorage.setItem('token', nextToken);
    localStorage.setItem('user', JSON.stringify(nextUser));
    if (nextUser && nextUser.role) {
      localStorage.setItem('userRole', nextUser.role);
    }
  }

  function logout() {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
  }

  return (
    <AuthCtx.Provider value={{ token, user, authenticating, login, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  return useContext(AuthCtx);
}
