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
import { ShieldCheck, Search, Globe, Palette, Users, AlertCircle, Copy, Check, BarChart3, Trophy, ArrowUpDown, Bell, Plus, BookOpen, Upload, Sparkles, FileText, Eye, EyeOff, Sliders, LayoutGrid, Crown, Heart, LogOut, ExternalLink, ChevronDown } from 'lucide-react';
import { brandingSchema, customDomainSchema } from '../schemas/validationSchemas.js';
import AdminNotificationsTab from '../components/AdminNotificationsTab.jsx';
import AdminDashboardTab from '../components/AdminDashboardTab.jsx';
import AdminMembersTab from '../components/AdminMembersTab.jsx';
import AdminSwalathTab from '../components/AdminSwalathTab.jsx';
import AdminDisplayControlsTab from '../components/AdminDisplayControlsTab.jsx';
import AdminBrandingTab from '../components/AdminBrandingTab.jsx';
import AdminDomainTab from '../components/AdminDomainTab.jsx';

export default function AdminPanel() {
  const { token, user, authenticating, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin', { replace: true });
  };

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
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
  const [swalathForm, setSwalathForm] = useState({
    title: 'സ്വലാത്ത്',
    arabicText: 'اللَّهُمَّ صَلِّ عَلَى سَيِّدِنَا مُحَمَّدٍ وَعَلَى آلِ سَيِّدِنَا مُحَمَّدٍ وَبَارِكْ وَسَلِّمْ',
    translation: '',
    imageUrl: '',
  });
  const [displaySettings, setDisplaySettings] = useState({
    showLeaderboard: true,
    showSwalath: true,
    showQuickActions: true,
  });
  const [domainInput, setDomainInput] = useState('');
  const [domainDnsInfo, setDomainDnsInfo] = useState(null);
  const [copiedField, setCopiedField] = useState('');

  const copyToClipboard = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(''), 2000);
  };
  const [saveSuccess, setSaveSuccess] = useState('');

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
      if (data.swalath) {
        setSwalathForm({
          title: data.swalath.title || 'സ്വലാത്ത്',
          arabicText: data.swalath.arabicText || 'اللَّهُمَّ صَلِّ عَلَى سَيِّدِنَا مُحَمَّدٍ وَعَلَى آلِ سَيِّدِنَا مُحَمَّدٍ وَبَارِكْ وَسَلِّمْ',
          translation: data.swalath.translation || '',
          imageUrl: data.swalath.imageUrl || '',
        });
      }
      if (data.settings) {
        setDisplaySettings({
          showLeaderboard: data.settings.showLeaderboard !== false,
          showSwalath: data.settings.showSwalath !== false,
          showQuickActions: data.settings.showQuickActions !== false,
        });
      }
      if (data.customDomain) {
        setDomainInput(data.customDomain);
      }
    } catch (e) {
      console.error('Error fetching tenant details:', e);
    }
  };

  const handleToggleDisplaySetting = async (key) => {
    setError('');
    setSaveSuccess('');
    const updatedSettings = {
      ...displaySettings,
      [key]: !displaySettings[key],
    };
    setDisplaySettings(updatedSettings);

    try {
      const res = await api('/admin/me/tenant', {
        method: 'PATCH',
        token,
        body: { settings: updatedSettings },
      });
      if (res && res.tenant) setTenant(res.tenant);
      setSaveSuccess('Home page section visibility updated!');
      setTimeout(() => setSaveSuccess(''), 3000);
    } catch (err) {
      // Revert if API failed
      setDisplaySettings(displaySettings);
      setError(err.message || 'Failed to update section visibility');
    }
  };

  const handleToggleMultipleAccounts = async (value) => {
    setError('');
    setSaveSuccess('');
    try {
      const currentSettings = tenant?.settings || {};
      const res = await api('/admin/me/tenant', {
        method: 'PATCH',
        token,
        body: { settings: { ...currentSettings, allowMultipleAccounts: value } },
      });
      if (res && res.tenant) setTenant(res.tenant);
      setSaveSuccess(value ? 'Multiple accounts enabled!' : 'Multiple accounts disabled.');
      setTimeout(() => setSaveSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update setting');
    }
  };

  const handleUpdateSwalath = async (e) => {
    e.preventDefault();
    setError('');
    setSaveSuccess('');

    if (!swalathForm.arabicText.trim()) {
      setError('Arabic Swalath text is required.');
      return;
    }

    try {
      const updated = await api('/admin/me/tenant/swalath', {
        method: 'PUT',
        token,
        body: swalathForm,
      });
      setTenant(updated);
      setSaveSuccess('Arabic Swalath updated successfully! It is now live on your Home page.');
      setTimeout(() => setSaveSuccess(''), 4000);
    } catch (e) {
      setError(e.message || 'Failed to update Swalath');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      setError('Selected image file size must be smaller than 3MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setSwalathForm((prev) => ({ ...prev, imageUrl: reader.result }));
    };
    reader.readAsDataURL(file);
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
      setSaveSuccess(res.message || 'Ownership verified! Next, point your domain traffic.');
      fetchTenantDetails();
    } catch (e) {
      setError(e.message || 'Domain ownership verification failed. Please ensure TXT record is propagated.');
    }
  };

  const handleCheckDnsConnection = async () => {
    setError('');
    setSaveSuccess('');
    try {
      const res = await api('/admin/me/tenant/domain/check-connection', {
        method: 'POST',
        token,
      });
      setSaveSuccess(res.message || 'Domain connected and active!');
      fetchTenantDetails();
    } catch (e) {
      setError(e.message || 'DNS connection check failed. Please ensure A record points to target IP.');
    }
  };

  const handleCancelCustomDomain = async () => {
    setError('');
    setSaveSuccess('');
    try {
      const res = await api('/admin/me/tenant/domain', {
        method: 'DELETE',
        token,
      });
      setDomainInput('');
      setDomainDnsInfo(null);
      setSaveSuccess(res.message || 'Custom domain cancelled and removed successfully.');
      fetchTenantDetails();
    } catch (e) {
      setError(e.message || 'Failed to cancel custom domain.');
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
    <main className="max-w-5xl mx-auto px-4 safe-top py-6 font-ml space-y-6">
      {/* Top Header */}
      <div className="relative flex items-center justify-between gap-4 pb-3 border-b border-border">
        <div className="flex items-center gap-3">
          {/* Static Left Side Admin Icon */}
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg sm:text-xl shadow-md shrink-0">
            🛡️
          </div>

          <div>
            <h1 className="font-extrabold text-lg sm:text-2xl text-foreground tracking-tight leading-tight">
              {tenant?.branding?.title || 'Event Admin Panel'}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-0.5">
              <Badge variant="muted" className="font-mono text-[10px]">
                Subdomain: {tenant?.slug || 'loading...'}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Quick Admin Profile Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setProfileMenuOpen((prev) => !prev)}
            className="rounded-xl border border-border font-bold text-xs gap-1.5"
          >
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span className="hidden sm:inline">Admin</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`} />
          </Button>
        </div>

        {/* ──────── ADMIN AVATAR DROPDOWN MENU ──────── */}
        {profileMenuOpen && (
          <>
            {/* Backdrop click handler to close menu */}
            <div
              className="fixed inset-0 z-40 bg-black/10"
              onClick={() => setProfileMenuOpen(false)}
            />

            <div className="absolute top-full right-0 mt-2 z-50 w-72 max-w-[calc(100vw-2rem)] bg-card border border-border rounded-2xl shadow-2xl p-4 space-y-3.5 animate-slide-down">
              <div className="flex items-center gap-3 pb-3 border-b border-border">
                <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center font-extrabold text-base shrink-0">
                  {user?.name?.charAt(0) || 'A'}
                </div>
                <div className="overflow-hidden">
                  <h3 className="font-extrabold text-sm text-foreground truncate">{user?.name || 'Administrator'}</h3>
                  <p className="text-xs text-muted-foreground truncate">{user?.phone || user?.email || 'Admin Account'}</p>
                  <Badge variant="success" className="text-[9px] mt-1 font-mono">
                    {user?.role?.toUpperCase() || 'TENANT_ADMIN'}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                {/* Event Status Display on Top of Logout Button */}
                {tenant && (
                  <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-muted/40 border border-border text-xs">
                    <span className="font-bold text-muted-foreground text-[11px]">Event Status:</span>
                    <Badge variant={tenant.status === 'approved' ? 'success' : 'warning'} className="text-[10px] font-extrabold uppercase">
                      ● {tenant.status}
                    </Badge>
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="w-full justify-start rounded-xl font-bold text-xs gap-2"
                  onClick={() => setProfileMenuOpen(false)}
                >
                  <Link to="/">
                    <ExternalLink className="w-4 h-4 text-primary" />
                    <span>View Event Portal</span>
                  </Link>
                </Button>


                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full justify-start rounded-xl font-bold text-xs gap-2 shadow-xs cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout (ലോഗ് ഔട്ട്)</span>
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Tabs Component for Admin Views */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
        <TabsList className="w-full justify-start overflow-x-auto no-scrollbar flex-nowrap shrink-0 p-1 border border-border/60 bg-card rounded-2xl shadow-xs gap-1">
          <TabsTrigger value="dashboard" className="flex items-center gap-1.5 shrink-0 text-xs px-3 py-2 font-extrabold rounded-xl">
            <BarChart3 className="w-4 h-4 text-primary" />
            <span>Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="members" className="flex items-center gap-1.5 shrink-0 text-xs px-3 py-2 font-extrabold rounded-xl">
            <Users className="w-4 h-4 text-primary" />
            <span>Members ({users.length})</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-1.5 shrink-0 text-xs px-3 py-2 font-extrabold rounded-xl">
            <Bell className="w-4 h-4 text-primary" />
            <span>Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="swalath" className="flex items-center gap-1.5 shrink-0 text-xs px-3 py-2 font-extrabold rounded-xl">
            <BookOpen className="w-4 h-4 text-primary" />
            <span>Swalath</span>
          </TabsTrigger>
          <TabsTrigger value="display" className="flex items-center gap-1.5 shrink-0 text-xs px-3 py-2 font-extrabold rounded-xl">
            <Sliders className="w-4 h-4 text-primary" />
            <span>Display</span>
          </TabsTrigger>
          <TabsTrigger value="branding" className="flex items-center gap-1.5 shrink-0 text-xs px-3 py-2 font-extrabold rounded-xl">
            <Palette className="w-4 h-4 text-primary" />
            <span>Settings</span>
          </TabsTrigger>
          <TabsTrigger value="domain" className="flex items-center gap-1.5 shrink-0 text-xs px-3 py-2 font-extrabold rounded-xl">
            <Globe className="w-4 h-4 text-primary" />
            <span>Domain</span>
          </TabsTrigger>
        </TabsList>

        {/* ──────── TAB 1: DASHBOARD ANALYTICS ──────── */}
        <TabsContent value="dashboard">
          <AdminDashboardTab
            totalAmount={totalAmount}
            topUsers={topUsers}
            chartData={chartData}
          />
        </TabsContent>

        {/* ──────── TAB 2: MEMBERS LIST & SORTING ──────── */}
        <TabsContent value="members">
          <AdminMembersTab
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            sortBy={sortBy}
            setSortBy={setSortBy}
            filteredUsers={filteredUsers}
            token={token}
            tenant={tenant}
            fetchUsers={fetchUsers}
          />
        </TabsContent>


        {/* ──────── TAB: ARABIC SWALATH MANAGEMENT ──────── */}
        <TabsContent value="swalath">
          <AdminSwalathTab
            swalathForm={swalathForm}
            setSwalathForm={setSwalathForm}
            handleUpdateSwalath={handleUpdateSwalath}
            handleFileUpload={handleFileUpload}
            saveSuccess={saveSuccess}
            error={error}
          />
        </TabsContent>

        {/* ──────── TAB: DISPLAY SECTION CONTROLLERS ──────── */}
        <TabsContent value="display">
          <AdminDisplayControlsTab
            displaySettings={displaySettings}
            handleToggleDisplaySetting={handleToggleDisplaySetting}
            saveSuccess={saveSuccess}
            error={error}
          />
        </TabsContent>

        {/* ──────── TAB 3: SETTINGS (Branding + Event Settings) ──────── */}
        <TabsContent value="branding">
          <AdminBrandingTab
            brandingForm={brandingForm}
            setBrandingForm={setBrandingForm}
            handleUpdateBranding={handleUpdateBranding}
            fieldErrors={fieldErrors}
            saveSuccess={saveSuccess}
            error={error}
            tenant={tenant}
            onToggleMultipleAccounts={handleToggleMultipleAccounts}
          />
        </TabsContent>

        {/* ──────── TAB 4: CUSTOM DOMAIN & DNS ──────── */}
        <TabsContent value="domain">
          <AdminDomainTab
            domainInput={domainInput}
            setDomainInput={setDomainInput}
            handleRequestCustomDomain={handleRequestCustomDomain}
            handleVerifyDomain={handleVerifyDomain}
            handleCheckDnsConnection={handleCheckDnsConnection}
            handleCancelCustomDomain={handleCancelCustomDomain}
            domainDnsInfo={domainDnsInfo}
            tenant={tenant}
            copiedField={copiedField}
            copyToClipboard={copyToClipboard}
            fieldErrors={fieldErrors}
            saveSuccess={saveSuccess}
            error={error}
          />
        </TabsContent>

        {/* ──────── TAB 5: NOTIFICATION MANAGEMENT ──────── */}
        <TabsContent value="notifications">
          <AdminNotificationsTab token={token} tenant={tenant} />
        </TabsContent>
      </Tabs>
    </main>
  );
}
