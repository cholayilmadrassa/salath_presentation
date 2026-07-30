import React, { useState } from 'react';
import { api } from '../api';
import { Building2, ShieldCheck, CheckCircle2, Clock, ArrowRight, Sparkles } from 'lucide-react';

export default function EventTeamRegister({ onDone }) {
  const [form, setForm] = useState({
    name: '',
    slug: '',
    adminName: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'slug') {
      const formatted = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
      setForm((prev) => ({ ...prev, [name]: formatted }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api('/auth/register-tenant', {
        method: 'POST',
        body: form,
      });

      setSuccess(res);
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#F7F5EC', color: '#1A1A1A' }}>
      <div className="max-w-md w-full rounded-2xl p-6 sm:p-8 shadow-2xl space-y-5" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8EDE2' }}>
        
        <div className="text-center mb-6 space-y-2">
          <div className="w-12 h-12 rounded-2xl text-white flex items-center justify-center text-xl mx-auto shadow-md" style={{ backgroundColor: '#6E9B37' }}>
            ☪
          </div>
          <h1 className="text-2xl font-extrabold" style={{ color: '#1A1A1A' }}>
            ഈവന്റ് ടീം റജിസ്ട്രേഷൻ
          </h1>
          <p className="text-xs font-medium" style={{ color: '#8C8C8C' }}>
            നിങ്ങളുടെ സംഘടന / സമിതിക്കായി സബ് ഡൊമൈൻ പോർട്ടൽ ആരംഭിക്കൂ
          </p>
        </div>

        {success ? (
          <div className="rounded-2xl p-5 text-center space-y-4" style={{ backgroundColor: '#F7F5EC', border: '1px solid #6E9B37' }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: '#FFC107', color: '#1A1A1A' }}>
              <Clock className="w-6 h-6 animate-pulse" />
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-extrabold" style={{ color: '#1A1A1A' }}>റജിസ്ട്രേഷൻ സമർപ്പിച്ചു!</h2>
              <p className="text-xs font-medium" style={{ color: '#8C8C8C' }}>
                <strong style={{ color: '#6E9B37' }}>{success.tenant.name}</strong> ({success.tenant.slug}) അപേക്ഷ ലഭിച്ചു. Super Admin അംഗീകാരത്തിനായി (Approval) കാത്തിരിക്കുന്നു.
              </p>
            </div>

            <div className="p-3.5 rounded-xl text-left text-xs space-y-1.5 font-mono" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8EDE2' }}>
              <p><span style={{ color: '#8C8C8C' }}>അനുവദിക്കപ്പെടുന്ന URL:</span> <strong style={{ color: '#6E9B37' }}>{success.tenant.slug}.swalath.app</strong></p>
              <p><span style={{ color: '#8C8C8C' }}>Admin Email:</span> <span style={{ color: '#1A1A1A' }}>{success.user.email}</span></p>
              <p><span style={{ color: '#8C8C8C' }}>Status:</span> <span className="font-extrabold uppercase px-2 py-0.5 rounded text-[10px]" style={{ backgroundColor: '#FFC107', color: '#1A1A1A' }}>{success.tenant.status}</span></p>
            </div>

            <div className="text-[11px] font-medium p-3 rounded-xl bg-amber-50 text-amber-900 border border-amber-200">
              💡 Super Admin അക്കൗണ്ടിൽ (Super Admin Dashboard) ലോഗിൻ ചെയ്തു അപ്പ്രൂവ് ചെയ്ത ശേഷം മാത്രമേ ഈ ഈവന്റ് പോർട്ടലിൽ അംഗങ്ങൾക്ക് പ്രവേശിക്കാൻ സാധിക്കൂ.
            </div>

            <button
              onClick={() => (onDone ? onDone() : (window.location.href = '/super-admin'))}
              className="w-full py-3 px-4 text-xs font-bold rounded-xl text-white transition active:scale-95 shadow-md flex items-center justify-center gap-1.5"
              style={{ backgroundColor: '#6E9B37' }}
            >
              <span>Super Admin ലോഗിനിലേക്ക് (Approve Request)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-semibold">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold mb-1" style={{ color: '#1A1A1A' }}>
                ഈവന്റ് / സംഘടനയുടെ പേര് (Event Name) *
              </label>
              <input
                type="text"
                name="name"
                required
                value={form.name}
                onChange={handleChange}
                placeholder="ഉദാ: നൂറുൽ ഇസ്‌ലാം സ്വലാത്ത് സമിതി"
                className="input font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1" style={{ color: '#1A1A1A' }}>
                ആവശ്യമുള്ള സബ്ഡൊമൈൻ (Subdomain Slug) *
              </label>
              <div className="flex items-center">
                <input
                  type="text"
                  name="slug"
                  required
                  value={form.slug}
                  onChange={handleChange}
                  placeholder="noorulislam"
                  className="input font-mono text-sm rounded-r-none"
                />
                <span className="px-3 py-3 text-xs font-mono font-bold rounded-r-2xl border border-l-0 min-h-[48px] flex items-center shrink-0" style={{ backgroundColor: '#E8EDE2', borderColor: '#E8EDE2', color: '#6E9B37' }}>
                  .swalath.app
                </span>
              </div>
              <span className="text-[10px] block mt-1" style={{ color: '#8C8C8C' }}>
                ഉദാഹരണം: noorulislam.swalath.app (ലഭ്യമായ ഇംഗ്ലീഷ് വാക്കുകളും നമ്പറുകളും മാത്രം)
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1" style={{ color: '#1A1A1A' }}>
                അഡ്മിൻ പേര് (Admin Name) *
              </label>
              <input
                type="text"
                name="adminName"
                required
                value={form.adminName}
                onChange={handleChange}
                placeholder="ഭാരവാഹിയുടെ പേര്"
                className="input font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1" style={{ color: '#1A1A1A' }}>
                അഡ്മിൻ ഇമെയിൽ (Admin Email) *
              </label>
              <input
                type="email"
                name="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="admin@noorulislam.org"
                className="input font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1" style={{ color: '#1A1A1A' }}>
                പാസ്‌വേഡ് (Password) *
              </label>
              <input
                type="password"
                name="password"
                required
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="input font-semibold"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-4 px-4 text-white text-xs font-bold rounded-xl shadow-md transition active:scale-95 flex items-center justify-center gap-2"
              style={{ backgroundColor: '#6E9B37' }}
            >
              <Building2 className="w-4 h-4 text-white" />
              <span>{loading ? 'സമർപ്പിക്കുന്നു...' : 'ഈവന്റ് പോർട്ടൽ സമർപ്പിക്കൂ (Register)'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
