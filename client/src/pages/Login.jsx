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
    <main className="max-w-md mx-auto px-4 safe-top pb-8 sm:py-14 font-ml" style={{ color: '#1A1A1A' }}>
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-2xl text-white flex items-center justify-center font-bold text-xl mx-auto mb-3 shadow-md" style={{ backgroundColor: '#6E9B37' }}>
          ☪
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold">
          ലോഗിൻ ചെയ്യൂ (Login)
        </h1>
        <p className="text-xs font-medium mt-1" style={{ color: '#8C8C8C' }}>
          {activeTenant ? `${activeTenant.name} ലോഗിൻ` : 'ഈവന്റ് അക്കൗണ്ടിലേക്ക് പ്രവേശിക്കൂ'}
        </p>
      </div>

      <Card className="!p-6 shadow-touch space-y-5" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8EDE2' }}>
        
        {/* Active Tenant Banner or Event Selector */}
        {activeTenant ? (
          <div className="p-3 rounded-2xl flex items-center justify-between text-xs font-bold" style={{ backgroundColor: '#E8EDE2', color: '#6E9B37', border: '1px solid #6E9B37' }}>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              <span>{activeTenant.name}</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white text-emerald-800 border border-emerald-200">
              {activeTenant.slug}
            </span>
          </div>
        ) : (
          approvedEvents.length > 0 && (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold flex items-center gap-1.5" style={{ color: '#1A1A1A' }}>
                <Building2 className="w-4 h-4" style={{ color: '#6E9B37' }} />
                <span>ഈവന്റ് തിരഞ്ഞെടുക്കുക (Select Event)</span>
              </label>
              <select
                className="input font-semibold text-xs"
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
          <div className="p-3.5 rounded-xl bg-red-50 text-red-700 text-xs font-semibold border border-red-200 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold mb-1.5 flex items-center gap-1.5" style={{ color: '#1A1A1A' }}>
              <Phone className="w-3.5 h-3.5" style={{ color: '#6E9B37' }} />
              <span>ഫോൺ നമ്പർ (Phone Number)</span>
            </label>
            <div className="relative flex items-center">
              <input
                className="input font-semibold"
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={10}
                placeholder="10 അക്ക ഫോൺ നമ്പർ"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
              />
            </div>
          </div>

          <button
            className="w-full py-4 text-xs sm:text-sm font-bold shadow-md flex items-center justify-center gap-2 rounded-xl text-white transition active:scale-95"
            style={{ backgroundColor: '#6E9B37' }}
            disabled={loading}
          >
            <LogIn className="w-4 h-4 text-white" />
            <span>{loading ? 'പ്രവേശിക്കുന്നു...' : 'ലോഗിൻ ചെയ്യൂ'}</span>
          </button>
        </form>

        <div className="pt-4 border-t text-center space-y-3" style={{ borderColor: '#E8EDE2' }}>
          <p className="text-xs font-medium" style={{ color: '#8C8C8C' }}>
            അക്കൗണ്ട് ഇല്ലേ?{' '}
            <Link to="/signup" className="font-bold hover:underline inline-flex items-center gap-1" style={{ color: '#6E9B37' }}>
              <span>ഇവിടെ റജിസ്റ്റർ ചെയ്യൂ</span>
            </Link>
          </p>
        </div>
      </Card>
    </main>
  );
}
