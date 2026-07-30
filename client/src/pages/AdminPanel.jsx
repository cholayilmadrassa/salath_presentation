import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import Card from '../components/Card.jsx';
import { ShieldCheck, Search, History, Settings, Globe, Palette, Users } from 'lucide-react';

export default function AdminPanel() {
  const token = localStorage.getItem('token');
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [counts, setCounts] = useState([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Tenant Customization state
  const [tenant, setTenant] = useState(null);
  const [brandingForm, setBrandingForm] = useState({
    title: '',
    tagline: '',
    logoUrl: '',
    themeColor: '#4f46e5',
  });
  const [domainInput, setDomainInput] = useState('');
  const [domainDnsInfo, setDomainDnsInfo] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState('');

  useEffect(() => {
    fetchTenantDetails();
    fetchUsers();
  }, []);

  const fetchTenantDetails = async () => {
    try {
      const data = await api('/admin/me/tenant', { token });
      setTenant(data);
      if (data.branding) {
        setBrandingForm({
          title: data.branding.title || '',
          tagline: data.branding.tagline || '',
          logoUrl: data.branding.logoUrl || '',
          themeColor: data.branding.themeColor || '#4f46e5',
        });
      }
      if (data.customDomain) {
        setDomainInput(data.customDomain);
      }
    } catch (e) {
      // Ignore if not tenant admin
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api('/admin/registrations', { token });
      setUsers(res.registrations || []);
    } catch (e) {
      setError(e.message || 'Failed to fetch event registrations');
    }
  };

  const handleSaveBranding = async (e) => {
    e.preventDefault();
    setError('');
    setSaveSuccess('');
    try {
      const res = await api('/admin/me/tenant', {
        method: 'PATCH',
        body: { branding: brandingForm },
        token,
      });
      setTenant(res.tenant);
      setSaveSuccess('Tenant branding and title saved successfully!');
    } catch (err) {
      setError(err.message || 'Failed to save branding');
    }
  };

  const handleSubmitDomain = async (e) => {
    e.preventDefault();
    setError('');
    setSaveSuccess('');
    try {
      const res = await api('/admin/me/tenant/domain', {
        method: 'POST',
        body: { customDomain: domainInput },
        token,
      });
      setDomainDnsInfo(res.dnsRecord);
      setSaveSuccess(res.message);
      fetchTenantDetails();
    } catch (err) {
      setError(err.message || 'Domain submission failed');
    }
  };

  const handleVerifyDomain = async () => {
    setError('');
    setSaveSuccess('');
    try {
      const res = await api('/admin/me/tenant/domain/verify', {
        method: 'POST',
        token,
      });
      setSaveSuccess(res.message);
      fetchTenantDetails();
    } catch (err) {
      setError(err.message || 'DNS verification failed');
    }
  };

  const filteredUsers = users.filter((u) => {
    const name = u.userId?.name || u.name || '';
    const phone = u.userId?.phone || u.phone || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase()) || phone.includes(searchQuery);
  });

  return (
    <main className="max-w-4xl mx-auto px-4 py-6 sm:py-10 font-ml space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Event Admin Panel</span>
          </div>
          <h1 className="text-2xl font-bold text-stone-900">
            {tenant ? tenant.name : 'Event Management'}
          </h1>
        </div>
        <Link className="btn-secondary !py-2 !px-3 text-xs self-start sm:self-auto" to="/">
          Return to App
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stone-200 gap-4">
        <button
          onClick={() => setActiveTab('users')}
          className={`py-2 px-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'users'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Members & Registrations</span>
        </button>

        <button
          onClick={() => setActiveTab('customization')}
          className={`py-2 px-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'customization'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Branding & Settings</span>
        </button>

        <button
          onClick={() => setActiveTab('domain')}
          className={`py-2 px-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'domain'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Custom Domain</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
          {saveSuccess}
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 text-red-700 text-xs font-semibold border border-red-200">
          {error}
        </div>
      )}

      {/* Tab 1: Members */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              className="input pl-10 text-xs"
              placeholder="Search member name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Card className="!p-4 border-stone-200 shadow-touch">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-3">
              <h2 className="text-sm font-bold text-stone-900">
                Event Participants ({filteredUsers.length})
              </h2>
            </div>

            <div className="space-y-2">
              {filteredUsers.length === 0 ? (
                <div className="py-6 text-center text-xs text-stone-500">No participants found.</div>
              ) : (
                filteredUsers.map((reg) => {
                  const u = reg.userId || reg;
                  return (
                    <div key={reg._id || u._id} className="rounded-xl border border-stone-200/80 p-3.5 bg-white flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold text-xs shrink-0">
                          {u.name ? u.name.charAt(0) : 'U'}
                        </div>
                        <div>
                          <div className="font-bold text-stone-900 text-sm">{u.name}</div>
                          <div className="text-xs text-stone-500">{u.email || u.phone}</div>
                        </div>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-stone-100 text-stone-700 capitalize border border-stone-200">
                        {reg.status || 'registered'}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Tab 2: Branding Customization */}
      {activeTab === 'customization' && (
        <Card className="!p-6 border-stone-200 space-y-4">
          <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
            <Palette className="w-5 h-5 text-indigo-600" />
            <span>Customize Event Theme & Branding</span>
          </h2>
          <p className="text-xs text-stone-500">
            Customize how your event looks to members on your subdomain or custom domain.
          </p>

          <form onSubmit={handleSaveBranding} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Event Title</label>
              <input
                type="text"
                className="input text-xs"
                value={brandingForm.title}
                onChange={(e) => setBrandingForm({ ...brandingForm, title: e.target.value })}
                placeholder="e.g. Grand Salath Presentation 2026"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Event Tagline</label>
              <input
                type="text"
                className="input text-xs"
                value={brandingForm.tagline}
                onChange={(e) => setBrandingForm({ ...brandingForm, tagline: e.target.value })}
                placeholder="e.g. Join the spiritual journey together"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Logo URL (Optional)</label>
              <input
                type="url"
                className="input text-xs"
                value={brandingForm.logoUrl}
                onChange={(e) => setBrandingForm({ ...brandingForm, logoUrl: e.target.value })}
                placeholder="https://example.com/logo.png"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Theme Color</label>
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  className="w-10 h-10 rounded border border-stone-300 cursor-pointer"
                  value={brandingForm.themeColor}
                  onChange={(e) => setBrandingForm({ ...brandingForm, themeColor: e.target.value })}
                />
                <input
                  type="text"
                  className="input text-xs font-mono w-32"
                  value={brandingForm.themeColor}
                  onChange={(e) => setBrandingForm({ ...brandingForm, themeColor: e.target.value })}
                />
              </div>
            </div>

            <button type="submit" className="btn-primary text-xs !py-2.5 !px-5 mt-2">
              Save Branding Changes
            </button>
          </form>
        </Card>
      )}

      {/* Tab 3: Custom Domain */}
      {activeTab === 'domain' && (
        <Card className="!p-6 border-stone-200 space-y-4">
          <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
            <Globe className="w-5 h-5 text-indigo-600" />
            <span>Custom Domain Setup</span>
          </h2>
          <p className="text-xs text-stone-500">
            Connect your own custom domain (e.g., event.myorganization.org) to your event website. Compatible with Vercel and VPS servers.
          </p>

          <form onSubmit={handleSubmitDomain} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Custom Domain</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="input text-xs font-mono"
                  placeholder="event.myorganization.org"
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                />
                <button type="submit" className="btn-primary text-xs !py-2 shrink-0">
                  Submit Domain
                </button>
              </div>
            </div>
          </form>

          {tenant && tenant.customDomain && (
            <div className="mt-4 p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-700">Domain Status:</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    tenant.customDomainVerified
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {tenant.customDomainVerified ? 'Verified & Active' : 'Pending DNS Verification'}
                </span>
              </div>

              {!tenant.customDomainVerified && (
                <div className="space-y-2 pt-2 border-t border-stone-200">
                  <p className="text-xs text-stone-600">
                    To verify ownership, create the following <strong>TXT DNS Record</strong> with your domain registrar:
                  </p>
                  <div className="bg-stone-900 text-slate-100 p-3 rounded-lg text-xs font-mono space-y-1">
                    <p><span className="text-slate-400">Type:</span> TXT</p>
                    <p><span className="text-slate-400">Name:</span> _verify.{tenant.customDomain}</p>
                    <p><span className="text-slate-400">Value:</span> {tenant.settings?.domainVerificationToken || domainDnsInfo?.value || 'Token Pending'}</p>
                  </div>
                  <button
                    onClick={handleVerifyDomain}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition-colors mt-2"
                  >
                    Verify DNS Record Now
                  </button>
                </div>
              )}
            </div>
          )}
        </Card>
      )}
    </main>
  );
}
