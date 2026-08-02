import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ShieldCheck, Search, Globe, Palette, Users, AlertCircle, Copy, Check, BarChart3, Trophy, ArrowUpDown, Bell, Plus } from 'lucide-react';
import { brandingSchema, customDomainSchema } from '../schemas/validationSchemas.js';
import AdminNotificationsTab from '../components/AdminNotificationsTab.jsx';

export default function AdminPanel() {
  const { token, user, authenticating } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [sortBy, setSortBy] = useState('count_desc');

  // Dashboard analytics state
  const [totalAmount, setTotalAmount] = useState(0);
  const [topUsers, setTopUsers] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [allUserCounts, setAllUserCounts] = useState([]);

  // Tenant Customization state
  const [tenant, setTenant] = useState(null);
  const [brandingForm, setBrandingForm] = useState({
    title: '',
    tagline: '',
    logoUrl: '',
    themeColor: '#468B3A',
  });
  const [domainInput, setDomainInput] = useState('');
  const [domainDnsInfo, setDomainDnsInfo] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [copiedField, setCopiedField] = useState('');

  // Authentication & Admin Role Guard
  useEffect(() => {
    if (!authenticating) {
      const storedRole = localStorage.getItem('userRole');
      const userRole = user?.role || storedRole;

      if (!token || (userRole !== 'tenant_admin' && userRole !== 'super_admin')) {
        navigate('/admin', { replace: true });
        return;
      }

      fetchTenantDetails();
      fetchUsers();
      fetchDashboard();
    }
  }, [authenticating, token, user, navigate]);

  const copyToClipboard = async (text, fieldName) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(''), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const fetchDashboard = async () => {
    try {
      const data = await api('/legacy-admin/dashboard', { method: 'GET', token });
      setTotalAmount(data.totalAmount || 0);
      setTopUsers(data.topUsers || []);
      setAllUserCounts(data.allUsers || []);
      const formattedChartData = (data.graphData || []).map((item) => ({
        date: item._id,
        value: item.total,
      }));
      setChartData(formattedChartData);
    } catch (err) {
      console.error('Error fetching dashboard:', err);
    }
  };

  const fetchTenantDetails = async () => {
    try {
      const data = await api('/admin/me/tenant', { token });
      setTenant(data);
      if (data.branding) {
        setBrandingForm({
          title: data.branding.title || '',
          tagline: data.branding.tagline || '',
          logoUrl: data.branding.logoUrl || '',
          themeColor: data.branding.themeColor || '#0E7443',
        });
      }
      if (data.customDomain) {
        setDomainInput(data.customDomain);
      }
    } catch (e) {
      console.error('Error fetching tenant details:', e);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await api('/admin/users', { token });
      setUsers(data || []);
    } catch (e) {
      console.error('Error fetching users:', e);
    }
  };

  const handleUpdateBranding = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setSaveSuccess('');

    const validationResult = brandingSchema.safeParse(brandingForm);
    if (!validationResult.success) {
      const errMap = {};
      validationResult.error.errors.forEach((err) => {
        if (err.path[0]) errMap[err.path[0]] = err.message;
      });
      setFieldErrors(errMap);
      return;
    }

    try {
      const updated = await api('/admin/me/tenant/branding', {
        method: 'PUT',
        token,
        body: brandingForm,
      });
      setTenant(updated);
      setSaveSuccess('Event branding and theme updated successfully!');
      setTimeout(() => setSaveSuccess(''), 4000);
    } catch (e) {
      setError(e.message);
    }
  };

  const handleRequestCustomDomain = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setSaveSuccess('');

    const validationResult = customDomainSchema.safeParse({ domain: domainInput });
    if (!validationResult.success) {
      const errMap = {};
      validationResult.error.errors.forEach((err) => {
        if (err.path[0]) errMap[err.path[0]] = err.message;
      });
      setFieldErrors(errMap);
      return;
    }

    try {
      const res = await api('/admin/me/tenant/domain', {
        method: 'POST',
        token,
        body: { domain: domainInput },
      });
      setDomainDnsInfo(res.dnsInfo);
      setSaveSuccess('Custom domain added! Please add the DNS record below to complete verification.');
      fetchTenantDetails();
    } catch (e) {
      setError(e.message);
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
      setSaveSuccess(res.message || 'Custom domain verified and active!');
      fetchTenantDetails();
    } catch (e) {
      setError(e.message || 'Domain DNS verification failed. Please ensure TXT record is propagated.');
    }
  };

  if (authenticating) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 mx-auto rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-xs font-bold text-muted-foreground">Authenticating admin access...</p>
        </div>
      </div>
    );
  }

  const role = user?.role || localStorage.getItem('userRole');
  if (!token || (role !== 'tenant_admin' && role !== 'super_admin')) {
    return null;
  }

  // Calculate total counts per user based on API response
  const userTotalMap = new Map();
  if (Array.isArray(allUserCounts)) {
    allUserCounts.forEach((item) => {
      const uid = String(item.userId || item._id || item.id);
      const val = Number(item.total || item.totalCount || item.amount) || 0;
      userTotalMap.set(uid, val);
    });
  }

  const filteredUsers = users
    .map((u) => {
      const uid = String(u._id || u.id);
      const backendCount = Number(u.totalCount ?? u.amount);
      const countSum = !isNaN(backendCount) && backendCount > 0
        ? backendCount
        : (userTotalMap.get(uid) || 0);
      return { ...u, totalCount: countSum };
    })
    .filter((u) =>
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.place?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.phone?.includes(searchQuery)
    )
    .sort((a, b) => {
      if (sortBy === 'count_desc') return b.totalCount - a.totalCount;
      if (sortBy === 'count_asc') return a.totalCount - b.totalCount;
      if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
      if (sortBy === 'name_desc') return b.name.localeCompare(a.name);
      return 0;
    });

  return (
    <main className="max-w-5xl mx-auto px-4 safe-top pb-20 md:py-6 font-ml space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl shadow-md shrink-0">
            🛡️
          </div>
          <div>
            <h1 className="font-extrabold text-xl sm:text-2xl text-foreground tracking-tight">
              {tenant ? tenant.name : 'Event Admin Panel'}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="muted" className="font-mono text-[10px]">
                Subdomain: {tenant?.slug || 'loading...'}
              </Badge>
              {tenant && (
                <Badge variant={tenant.status === 'approved' ? 'success' : 'warning'} className="text-[10px]">
                  Status: {tenant.status.toUpperCase()}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/">View Event Portal</Link>
          </Button>
        </div>
      </div>

      {/* Tabs Component for Admin Views */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="w-full justify-start overflow-x-auto no-scrollbar">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            <span>Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <span>Members ({users.length})</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            <span>Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="branding" className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-primary" />
            <span>Branding</span>
          </TabsTrigger>
          <TabsTrigger value="domain" className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary" />
            <span>Custom Domain</span>
          </TabsTrigger>
        </TabsList>

        {/* ──────── TAB 1: DASHBOARD ANALYTICS ──────── */}
        <TabsContent value="dashboard" className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Total SwalathCollected</h2>
              <p className="text-4xl font-extrabold text-primary mt-1">
                {Number(totalAmount).toLocaleString('en-IN')}
              </p>
            </CardContent>
          </Card>

          {/* Top 4 Participants */}
          <div className="space-y-3">
            <h2 className="text-base font-extrabold text-foreground flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[#D4AF37]" />
              <span>Top Event Participants</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {topUsers.map((u, idx) => (
                <Card key={idx}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-muted-foreground">Rank #{idx + 1}</span>
                      <Badge variant="success" className="text-[10px]">
                        {Number(u.total).toLocaleString('en-IN')}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-primary/15 text-primary font-extrabold text-sm flex items-center justify-center shrink-0">
                        {u.name ? u.name.charAt(0) : '?'}
                      </div>
                      <h3 className="text-xs font-extrabold text-foreground truncate">{u.name}</h3>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Analytics Chart */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="text-sm font-extrabold text-foreground">Swalath Submission Graph</h2>
              <div className="h-64 w-full">
                {chartData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                    No graph data available yet.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          borderColor: 'hsl(var(--border))',
                          borderRadius: '12px',
                          fontSize: '12px',
                        }}
                      />
                      <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ──────── TAB 2: MEMBERS LIST & SORTING ──────── */}
        <TabsContent value="members" className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                type="text"
                placeholder="Search member by name, phone, place..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <ArrowUpDown className="w-4 h-4 text-primary shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-xs font-extrabold px-3 py-2 rounded-xl border border-input bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring w-full sm:w-auto"
              >
                <option value="count_desc">Sort: Count (High to Low)</option>
                <option value="count_asc">Sort: Count (Low to High)</option>
                <option value="name_asc">Sort: Name (A to Z)</option>
                <option value="name_desc">Sort: Name (Z to A)</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            {filteredUsers.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-xs font-medium text-muted-foreground">
                  No members match your search criteria.
                </CardContent>
              </Card>
            ) : (
              filteredUsers.map((u) => (
                <Card key={u._id} className="hover:border-primary">
                  <CardContent className="p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                        {u.name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-foreground">{u.name}</h4>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          <span>{u.phone || u.email}</span>
                          {u.place && <span>• {u.place}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <Badge variant="success" className="text-xs font-extrabold">
                        {u.totalCount.toLocaleString('en-IN')} Salath
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* ──────── TAB 3: BRANDING CUSTOMIZATION ──────── */}
        <TabsContent value="branding" className="space-y-4">
          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="text-base font-extrabold text-foreground">Customize Event Branding</h2>
              {saveSuccess && <Alert variant="success">{saveSuccess}</Alert>}
              {error && <Alert variant="destructive">{error}</Alert>}

              <form onSubmit={handleUpdateBranding} className="space-y-4" noValidate>
                <div className="space-y-1.5">
                  <Label>Event Title</Label>
                  <Input
                    type="text"
                    value={brandingForm.title}
                    onChange={(e) => setBrandingForm({ ...brandingForm, title: e.target.value })}
                    className={fieldErrors.title ? 'border-destructive' : ''}
                  />
                  {fieldErrors.title && <p className="text-xs text-destructive">{fieldErrors.title}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label>Tagline / Description</Label>
                  <Input
                    type="text"
                    value={brandingForm.tagline}
                    onChange={(e) => setBrandingForm({ ...brandingForm, tagline: e.target.value })}
                    className={fieldErrors.tagline ? 'border-destructive' : ''}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Primary Theme Color</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={brandingForm.themeColor}
                      onChange={(e) => setBrandingForm({ ...brandingForm, themeColor: e.target.value })}
                      className="w-12 h-10 rounded-xl cursor-pointer border border-input"
                    />
                    <Input
                      type="text"
                      value={brandingForm.themeColor}
                      onChange={(e) => setBrandingForm({ ...brandingForm, themeColor: e.target.value })}
                      className="font-mono text-xs max-w-xs"
                    />
                  </div>
                </div>

                <Button type="submit">Save Branding</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ──────── TAB 4: CUSTOM DOMAIN & DNS ──────── */}
        <TabsContent value="domain" className="space-y-4">
          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="text-base font-extrabold text-foreground">Connect Custom Domain</h2>
              <p className="text-xs text-muted-foreground">
                Connect your own domain (e.g. <code>example.com</code>) to this event portal.
              </p>

              {saveSuccess && <Alert variant="success">{saveSuccess}</Alert>}
              {error && <Alert variant="destructive">{error}</Alert>}

              <form onSubmit={handleRequestCustomDomain} className="space-y-4" noValidate>
                <div className="space-y-1.5">
                  <Label>Custom Domain Name</Label>
                  <Input
                    type="text"
                    placeholder="example.com"
                    value={domainInput}
                    onChange={(e) => setDomainInput(e.target.value)}
                    className={fieldErrors.domain ? 'border-destructive' : ''}
                  />
                  {fieldErrors.domain && <p className="text-xs text-destructive">{fieldErrors.domain}</p>}
                </div>

                <Button type="submit">Add Domain</Button>
              </form>

              {/* DNS Verification Details */}
              {(domainDnsInfo || tenant?.customDomain) && (
                <div className="pt-4 border-t border-border space-y-3">
                  <h3 className="text-sm font-extrabold text-foreground">Required DNS Record (Hostinger / Registrar)</h3>
                  <div className="bg-muted/10 p-4 rounded-2xl border border-border space-y-2 text-xs font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">TXT Record Name:</span>
                      <span className="font-bold text-foreground">{domainDnsInfo?.txtRecordName || `_verify.${tenant?.customDomain}`}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">TXT Record Value:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-primary truncate max-w-xs">{domainDnsInfo?.txtRecordValue || tenant?.customDomainVerificationToken}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => copyToClipboard(domainDnsInfo?.txtRecordValue || tenant?.customDomainVerificationToken, 'txtValue')}
                          className="h-6 w-6"
                        >
                          {copiedField === 'txtValue' ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Button onClick={handleVerifyDomain} variant="outline" className="w-full">
                    Verify DNS Record Now
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ──────── TAB 5: NOTIFICATION MANAGEMENT ──────── */}
        <TabsContent value="notifications">
          <AdminNotificationsTab token={token} tenant={tenant} />
        </TabsContent>
      </Tabs>
    </main>
  );
}
