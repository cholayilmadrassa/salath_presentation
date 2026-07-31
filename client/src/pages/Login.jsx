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
import { Phone, LogIn, Building2 } from 'lucide-react';
import { loginSchema } from '../schemas/validationSchemas.js';

export default function Login() {
  const { login } = useAuth();
  const { activeTenant } = useTenant();
  const navigate = useNavigate();

  const [approvedEvents, setApprovedEvents] = useState([]);
  const [selectedTenantSlug, setSelectedTenantSlug] = useState('');
  const [form, setForm] = useState({ phone: '' });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
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
    setFieldErrors({});

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
      login(data.token, data.user);
      navigate('/dashboard');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
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

  return (
    <main className="max-w-md mx-auto px-4 safe-top pb-8 sm:py-14 font-sans">
      <div className="text-center mb-6">
        <img
          src="/appLogo.svg"
          alt="Swalath Portal"
          className="w-12 h-12 rounded-2xl object-cover mx-auto mb-3 shadow-md"
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
                <span>{activeTenant.name}</span>
              </div>
              <Badge variant="muted" className="font-mono text-[10px]">
                {activeTenant.slug}
              </Badge>
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

          {error && (
            <Alert variant="destructive">{error}</Alert>
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
            <p className="font-normal text-muted-foreground">Don't have an account?</p>
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
