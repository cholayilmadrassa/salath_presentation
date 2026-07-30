import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api';
import { ShieldCheck, Building2, Lock, Mail, ExternalLink } from 'lucide-react';

export default function AdminLogin({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusNotice, setStatusNotice] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setStatusNotice(null);
    setLoading(true);

    try {
      const data = await api('/auth/login', {
        method: 'POST',
        body: { email, password },
      });

      // Save token and user details
      localStorage.setItem('token', data.token);
      localStorage.setItem('userRole', data.user.role);

      if (data.tenant) {
        localStorage.setItem('activeTenantSlug', data.tenant.slug);
      }

      if (onLoginSuccess) {
        onLoginSuccess(data.token, data.user.role);
      }

      if (data.user.role === 'super_admin') {
        navigate('/super-admin');
        return;
      }

      if (data.user.role === 'tenant_admin') {
        const tenantStatus = data.tenant ? data.tenant.status : 'pending';
        const slug = data.tenant ? data.tenant.slug : '';

        if (tenantStatus === 'pending') {
          setStatusNotice({
            type: 'pending',
            message: `Your event team application "${data.tenant?.name || ''}" (${slug}) is PENDING approval by Super Admin.`,
          });
          return;
        }

        if (tenantStatus === 'rejected') {
          setStatusNotice({
            type: 'rejected',
            message: `Your event team application "${data.tenant?.name || ''}" was REJECTED by Super Admin.`,
          });
          return;
        }

        if (tenantStatus === 'suspended') {
          setStatusNotice({
            type: 'suspended',
            message: `Your event team access has been SUSPENDED by Super Admin.`,
          });
          return;
        }

        // Approved tenant admin -> set activeTenantSlug & navigate to panel
        if (slug) {
          localStorage.setItem('activeTenantSlug', slug);
        }
        navigate('/admin/panel');
        return;
      }

      setError('This account is a member account. Please log in through the member login page.');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-full bg-emerald-100 text-emerald-800 mb-1">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-stone-900">Subdomain Admin Login</h1>
          <p className="text-xs text-stone-500">
            Sign in to manage your event team subdomain & event settings
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl space-y-1">
            <div>{error}</div>
          </div>
        )}

        {statusNotice && (
          <div
            className={`p-4 rounded-xl text-xs font-medium border space-y-2 ${
              statusNotice.type === 'pending'
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-red-50 border-red-200 text-red-900'
            }`}
          >
            <div className="font-bold text-sm">Event Subdomain Status</div>
            <p>{statusNotice.message}</p>
            {statusNotice.type === 'pending' && (
              <p className="text-[11px] text-amber-700">
                Super Admin approval is required before you can log in and customize your event subdomain.
              </p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-1">
              Admin Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="input pl-9 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input pl-9 text-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full !py-3 text-xs font-bold rounded-xl shadow-sm flex items-center justify-center space-x-2"
          >
            {loading ? <span>Authenticating Subdomain...</span> : <span>Sign In to Admin Portal</span>}
          </button>
        </form>

        <div className="pt-4 border-t border-stone-100 flex flex-col space-y-2 text-center text-xs">
          <Link to="/register-team" className="text-emerald-700 hover:underline font-bold flex items-center justify-center gap-1">
            <Building2 className="w-3.5 h-3.5" />
            <span>Register New Event Subdomain Team</span>
          </Link>
          <span className="text-stone-400 text-[11px]">
            Super Admin Login: <code className="bg-stone-100 px-1 py-0.5 rounded text-stone-700">superadmin@salath.org</code> / <code className="bg-stone-100 px-1 py-0.5 rounded text-stone-700">admin123</code>
          </span>
        </div>
      </div>
    </div>
  );
}
