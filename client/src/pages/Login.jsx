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
import { Phone, LogIn, Building2, AlertCircle } from 'lucide-react';
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
        .catch(() => {});
    }
  }, [activeTenant]);

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
      validationResult.error.errors.forEach((err) => {
        if (err.path[0]) {
          errMap[err.path[0]] = err.message;
        }
      });
      setFieldErrors(errMap);
      setError('Please fix the highlighted field errors below.');
      return;
    }

    setLoading(true);

    try {
      const targetSlug = activeTenant ? activeTenant.slug : selectedTenantSlug;
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

  return (
    <main className="max-w-md mx-auto px-4 safe-top pb-8 sm:py-14 font-ml">
      <div className="text-center mb-6">
        <img
          src="/logo.png"
          alt="Swalath Portal"
          className="w-12 h-12 rounded-2xl object-cover mx-auto mb-3 shadow-md"
        />
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">
          Log In
        </h1>
        <p className="text-xs font-medium mt-1 text-muted-foreground">
          {activeTenant ? `${activeTenant.name} Login` : 'Log into your event account'}
        </p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-5">
          {/* Active Tenant Banner or Event Selector */}
          {activeTenant ? (
            <div className="p-3 rounded-2xl flex items-center justify-between text-xs font-bold bg-background text-secondary border border-secondary/20">
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
                <Label className="flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-primary" />
                  <span>Select Event</span>
                </Label>
                <Select value={selectedTenantSlug} onValueChange={setSelectedTenantSlug}>
                  <SelectTrigger className={fieldErrors.tenantSlug ? 'border-destructive ring-2 ring-destructive/20' : ''}>
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
                {fieldErrors.tenantSlug && (
                  <p className="text-xs text-destructive font-bold mt-1 flex items-center gap-1 animate-slide-down">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{fieldErrors.tenantSlug}</span>
                  </p>
                )}
              </div>
            )
          )}

          {error && (
            <Alert variant="destructive">{error}</Alert>
          )}

          <form onSubmit={submit} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-primary" />
                <span>Registered Mobile Number</span>
              </Label>
              <Input
                type="tel"
                maxLength="10"
                placeholder="10-digit mobile number"
                value={form.phone}
                onChange={(e) => {
                  if (fieldErrors.mobile) setFieldErrors((prev) => ({ ...prev, mobile: null }));
                  setForm({ ...form, phone: e.target.value });
                }}
                className={fieldErrors.mobile ? 'border-destructive ring-2 ring-destructive/20' : ''}
              />
              {fieldErrors.mobile && (
                <p className="text-xs text-destructive font-bold mt-1 flex items-center gap-1 animate-slide-down">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldErrors.mobile}</span>
                </p>
              )}
            </div>

            <Button type="submit" disabled={loading} className="w-full mt-2">
              <LogIn className="w-4.5 h-4.5 mr-2" />
              <span>{loading ? 'Logging in...' : 'Log In'}</span>
            </Button>
          </form>

          <Separator />

          <div className="text-center text-xs space-y-2">
            <p className="font-medium text-muted-foreground">Don't have an account?</p>
            <Link
              to="/signup"
              className="inline-block font-extrabold text-primary hover:underline"
            >
              Register Member
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
