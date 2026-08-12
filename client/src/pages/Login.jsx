import { useState, useEffect } from 'react';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useTenant } from '../context/TenantContext.jsx';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Phone, LogIn, Building2, AlertTriangle, UserPlus, Users, ChevronRight } from 'lucide-react';
import { loginSchema } from '../schemas/validationSchemas.js';

export default function Login() {
  const { login } = useAuth();
  const { activeTenant } = useTenant();
  const navigate = useNavigate();

  const [approvedEvents, setApprovedEvents] = useState([]);
  const [selectedTenantSlug, setSelectedTenantSlug] = useState('');
  const [form, setForm] = useState({ phone: '' });
  const [error, setError] = useState('');
  const [notRegisteredError, setNotRegisteredError] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Account selection state
  const [accountSelectionData, setAccountSelectionData] = useState(null); // { accounts, phone, tenantSlug }
  const [selectLoading, setSelectLoading] = useState(false);
  const [selectError, setSelectError] = useState('');

  const getSlugFromUrl = () => {
    if (typeof window === 'undefined') return '';
    const params = new URLSearchParams(window.location.search);
    return (params.get('tenant') || params.get('slug') || params.get('tenantSlug') || '').toLowerCase().trim();
  };

  useEffect(() => {
    const urlSlug = getSlugFromUrl();
    if (urlSlug) {
      setSelectedTenantSlug(urlSlug);
    }
    if (!activeTenant) {
      api('/events/public-approved')
        .then((res) => {
          if (Array.isArray(res)) {
            setApprovedEvents(res);
            if (!urlSlug && res.length > 0) {
              setSelectedTenantSlug(res[0].slug);
            }
          }
        })
        .catch(() => { });
    }
  }, [activeTenant]);

  const validateField = (fieldName, value) => {
    const targetSlug = activeTenant ? activeTenant.slug : selectedTenantSlug;
    const sanitizedPhone = (fieldName === 'phone' ? value : form.phone).replace(/\D/g, '');

    const result = loginSchema.safeParse({
      mobile: sanitizedPhone,
      tenantSlug: targetSlug,
    });

    if (!result.success) {
      const issues = result.error?.issues || result.error?.errors || [];
      const issue = issues.find((err) => err.path && err.path[0] === (fieldName === 'phone' ? 'mobile' : fieldName));
      if (issue) {
        setFieldErrors((prev) => ({ ...prev, [fieldName === 'phone' ? 'mobile' : fieldName]: issue.message }));
      }
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setNotRegisteredError(false);
    setFieldErrors({});
    setAccountSelectionData(null);

    const targetSlug = activeTenant ? activeTenant.slug : selectedTenantSlug;
    const sanitizedPhone = form.phone.replace(/\D/g, '');

    const validationResult = loginSchema.safeParse({
      mobile: sanitizedPhone,
      tenantSlug: targetSlug,
    });

    if (!validationResult.success) {
      const errMap = {};
      const issues = validationResult.error?.issues || validationResult.error?.errors || [];
      issues.forEach((err) => {
        if (err.path && err.path[0]) {
          errMap[err.path[0]] = err.message;
        }
      });
      setFieldErrors(errMap);
      setError('Please fix the highlighted field errors below before logging in.');
      return;
    }

    setLoading(true);

    try {
      if (!targetSlug) {
        setError('Please select an event portal to log in');
        return;
      }
      const payload = {
        phone: sanitizedPhone,
        mobile: sanitizedPhone,
        tenantSlug: targetSlug,
      };

      const data = await api('/auth/login', { method: 'POST', body: payload });

      // Multiple accounts: show account selection
      if (data.requiresAccountSelection) {
        setAccountSelectionData({
          accounts: data.accounts,
          phone: sanitizedPhone,
          tenantSlug: targetSlug,
          tenant: data.tenant,
        });
        return;
      }

      login(data.token, data.user);
      navigate('/dashboard');
    } catch (e) {
      setError(e.message);
      if (e.code === 'NOT_REGISTERED_IN_TENANT' || e.message?.toLowerCase().includes('not registered in event')) {
        setNotRegisteredError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAccount = async (account) => {
    setSelectLoading(true);
    setSelectError('');
    try {
      const data = await api('/auth/login-select', {
        method: 'POST',
        body: {
          userId: account.id,
          phone: accountSelectionData.phone,
          tenantSlug: accountSelectionData.tenantSlug,
        },
      });
      login(data.token, data.user);
      navigate('/dashboard');
    } catch (e) {
      setSelectError(e.message || 'Failed to select account. Please try again.');
    } finally {
      setSelectLoading(false);
    }
  };

  const FieldError = ({ error }) => {
    if (!error) return null;
    return (
      <p className="text-[11px] font-normal text-red-500 mt-1 animate-slide-down">
        {error}
      </p>
    );
  };

  // ── Account Selection Screen ──
  if (accountSelectionData) {
    return (
      <main className="max-w-md mx-auto px-4 safe-top pb-8 sm:py-14 font-sans">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-3">
            <Users className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Select Account</h1>
          <p className="text-xs font-normal mt-1 text-muted-foreground">
            Multiple accounts found for this phone number
          </p>
        </div>

        <Card>
          <CardContent className="p-5 space-y-3">
            {selectError && <Alert variant="destructive">{selectError}</Alert>}

            <p className="text-xs text-muted-foreground font-medium text-center pb-1">
              Choose which account to log into:
            </p>

            <div className="space-y-2">
              {accountSelectionData.accounts.map((account) => (
                <button
                  key={account.id}
                  disabled={selectLoading}
                  onClick={() => handleSelectAccount(account)}
                  className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-border bg-card hover:bg-primary/5 hover:border-primary/40 active:scale-[0.98] transition-all text-left disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-base shrink-0 shadow-sm">
                    {account.initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-extrabold text-sm text-foreground truncate">{account.name}</p>
                    {account.address && (
                      <p className="text-[11px] text-muted-foreground truncate">{account.address}</p>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>

            {selectLoading && (
              <p className="text-center text-xs text-muted-foreground animate-pulse pt-1">Logging in...</p>
            )}

            <Separator />

            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs font-bold"
              onClick={() => setAccountSelectionData(null)}
            >
              ← Back to Login
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="max-w-md mx-auto px-4 safe-top pb-8 sm:py-14 font-sans">
      <div className="text-center mb-6">
        <img
          src="/appLogo.png"
          alt="Swalath Portal"
          className="w-14 h-14 rounded-2xl object-cover mx-auto mb-3 shadow-md border border-primary/20"
        />
        <h1 className="text-2xl font-bold text-foreground">
          Log In
        </h1>
        <p className="text-xs font-normal mt-1 text-muted-foreground">
          {activeTenant ? `${activeTenant.name} Login` : 'Log into your event account'}
        </p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-5">
          {/* Active Tenant Banner or Event Selector */}
          {activeTenant ? (
            <div className="p-3 rounded-xl flex items-center justify-between text-xs font-medium bg-background text-secondary border border-secondary/20">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                <span className="font-extrabold text-foreground">{activeTenant.name}</span>
              </div>
            </div>
          ) : (
            approvedEvents.length > 0 && (
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 font-medium">
                  <Building2 className="w-4 h-4 text-primary" />
                  <span>Select Event</span>
                </Label>
                <Select
                  value={selectedTenantSlug}
                  onValueChange={(val) => {
                    setSelectedTenantSlug(val);
                    setNotRegisteredError(false);
                    if (fieldErrors.tenantSlug) setFieldErrors((prev) => ({ ...prev, tenantSlug: null }));
                  }}
                >
                  <SelectTrigger className={fieldErrors.tenantSlug ? 'border-2 border-red-500 bg-red-50/20 ring-4 ring-red-500/15' : ''}>
                    <SelectValue placeholder="Select an event" />
                  </SelectTrigger>
                  <SelectContent>
                    {approvedEvents.map((ev) => (
                      <SelectItem key={ev.slug} value={ev.slug}>
                        {ev.name} ({ev.slug})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError error={fieldErrors.tenantSlug} />
              </div>
            )
          )}

          {error && !notRegisteredError && (
            <Alert variant="destructive">{error}</Alert>
          )}

          {notRegisteredError && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 text-xs space-y-2.5">
              <div className="flex items-center gap-1.5 font-extrabold text-amber-700">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Event Registration Required</span>
              </div>
              <p className="text-muted-foreground leading-relaxed">{error}</p>
              <Button asChild size="sm" className="w-full mt-1">
                <Link to="/signup">
                  <UserPlus className="w-4 h-4 mr-1.5" />
                  <span>Register for this Event Portal</span>
                </Link>
              </Button>
            </div>
          )}

          <form onSubmit={submit} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 font-medium">
                <Phone className="w-4 h-4 text-primary" />
                <span>Registered Mobile Number</span>
              </Label>
              <Input
                type="tel"
                maxLength="10"
                placeholder="10-digit mobile number (e.g. 9876543210)"
                value={form.phone}
                onBlur={() => validateField('phone', form.phone)}
                onChange={(e) => {
                  if (fieldErrors.mobile) setFieldErrors((prev) => ({ ...prev, mobile: null }));
                  setForm({ ...form, phone: e.target.value });
                }}
                className={fieldErrors.mobile ? 'border-2 border-red-500 bg-red-50/20 ring-4 ring-red-500/15' : ''}
              />
              <FieldError error={fieldErrors.mobile} />
            </div>

            <Button type="submit" disabled={loading} className="w-full mt-2">
              <LogIn className="w-4.5 h-4.5 mr-2" />
              <span>{loading ? 'Logging in...' : 'Log In'}</span>
            </Button>
          </form>

          <Separator />

          <div className="text-center text-xs space-y-2">
            <p className="font-normal text-muted-foreground">Don't have an account for this event?</p>
            <Link
              to="/signup"
              className="inline-block font-semibold text-primary hover:underline"
            >
              Register Member
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
