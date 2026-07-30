import { useState, useEffect } from 'react';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useTenant } from '../context/TenantContext.jsx';
import { useNavigate, Link } from 'react-router-dom';
import Card from '../components/Card.jsx';
import { Phone, LogIn, Building2, AlertTriangle } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const { activeTenant } = useTenant();
  const navigate = useNavigate();

  const [approvedEvents, setApprovedEvents] = useState([]);
  const [selectedTenantSlug, setSelectedTenantSlug] = useState('');
  const [form, setForm] = useState({ phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!activeTenant) {
      api('/events/public-approved')
        .then((res) => {
          if (Array.isArray(res)) {
            setApprovedEvents(res);
            if (res.length > 0) {
              setSelectedTenantSlug(res[0].slug);
            }
          }
        })
        .catch(() => {});
    }
  }, [activeTenant]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const targetSlug = activeTenant ? activeTenant.slug : selectedTenantSlug;
      const payload = {
        ...form,
        tenantSlug: targetSlug,
      };

      const data = await api('/auth/login', { method: 'POST', body: payload });
      login(data.token, data.user);
      navigate('/dashboard');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-md mx-auto px-4 safe-top pb-8 sm:py-14 font-ml" style={{ backgroundColor: '#DDF4E7', color: '#124170' }}>
      <div className="text-center mb-6">
        <img
          src="/logo.png"
          alt="Swalath Portal"
          className="w-12 h-12 rounded-2xl object-cover mx-auto mb-3 shadow-md"
        />
        <h1 className="text-2xl sm:text-3xl font-extrabold" style={{ color: '#124170' }}>
          Log In
        </h1>
        <p className="text-xs font-medium mt-1" style={{ color: '#26667F' }}>
          {activeTenant ? `${activeTenant.name} Login` : 'Log into your event account'}
        </p>
      </div>

      <Card className="!p-6 shadow-sm space-y-5" style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(38, 102, 127, 0.15)' }}>
        
        {/* Active Tenant Banner or Event Selector */}
        {activeTenant ? (
          <div className="p-3 rounded-2xl flex items-center justify-between text-xs font-bold" style={{ backgroundColor: '#DDF4E7', color: '#26667F', border: '1px solid rgba(38, 102, 127, 0.2)' }}>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4" style={{ color: '#67C090' }} />
              <span>{activeTenant.name}</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white text-emerald-800 border border-emerald-200">
              {activeTenant.slug}
            </span>
          </div>
        ) : (
          approvedEvents.length > 0 && (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold flex items-center gap-1.5" style={{ color: '#124170' }}>
                <Building2 className="w-4 h-4" style={{ color: '#67C090' }} />
                <span>Select Event</span>
              </label>
              <select
                className="w-full px-4 py-3 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#67C090]"
                style={{ backgroundColor: '#DDF4E7', color: '#124170', border: '1.5px solid rgba(38, 102, 127, 0.2)' }}
                value={selectedTenantSlug}
                onChange={(e) => setSelectedTenantSlug(e.target.value)}
              >
                {approvedEvents.map((ev) => (
                  <option key={ev.slug} value={ev.slug}>
                    {ev.name} ({ev.slug})
                  </option>
                ))}
              </select>
            </div>
          )
        )}

        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl font-bold flex items-center gap-2 leading-relaxed">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold flex items-center gap-1.5" style={{ color: '#124170' }}>
              <Phone className="w-4 h-4" style={{ color: '#67C090' }} />
              <span>Registered Mobile Number</span>
            </label>
            <input
              type="tel"
              required
              maxLength="10"
              placeholder="10-digit mobile number"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-4 py-3 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#67C090]"
              style={{ backgroundColor: '#DDF4E7', color: '#124170', border: '1.5px solid rgba(38, 102, 127, 0.2)' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 text-white font-extrabold text-sm rounded-2xl shadow-md transition active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ backgroundColor: '#67C090' }}
          >
            <LogIn className="w-4.5 h-4.5" />
            <span>{loading ? 'Logging in...' : 'Log In'}</span>
          </button>
        </form>

        <div className="pt-2 text-center text-xs space-y-2 border-t border-stone-100">
          <p className="font-medium" style={{ color: '#26667F' }}>Don't have an account?</p>
          <Link
            to="/signup"
            className="inline-block font-extrabold hover:underline"
            style={{ color: '#67C090' }}
          >
            Register Member
          </Link>
        </div>
      </Card>
    </main>
  );
}
