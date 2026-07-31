import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext.jsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ShieldCheck, Building2, Lock, Mail, AlertCircle } from 'lucide-react';
import { adminLoginSchema } from '../schemas/validationSchemas.js';

export default function AdminLogin({ onLoginSuccess }) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [statusNotice, setStatusNotice] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setStatusNotice(null);

    const validationResult = adminLoginSchema.safeParse({ email, password });
    if (!validationResult.success) {
      const errMap = {};
      validationResult.error.errors.forEach((err) => {
        if (err.path[0]) errMap[err.path[0]] = err.message;
      });
      setFieldErrors(errMap);
      return;
    }

    setLoading(true);

    try {
      const data = await api('/auth/login', {
        method: 'POST',
        body: { email, password },
      });

      // Save token and user in AuthContext
      login(data.token, data.user);

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

  const FieldError = ({ error }) => error ? (
    <p className="text-[11px] font-bold mt-1.5 flex items-center gap-1 text-destructive animate-slide-down">
      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
      <span>{error}</span>
    </p>
  ) : null;

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-xl">
        <CardHeader className="text-center pb-2">
          <div className="inline-flex p-3 rounded-full bg-primary/15 text-primary mx-auto mb-1">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <CardTitle className="text-2xl">Admin Login</CardTitle>
          <CardDescription>
            Sign in to manage your event team subdomain & event settings
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {error && (
            <Alert variant="destructive">{error}</Alert>
          )}

          {statusNotice && (
            <Alert variant={statusNotice.type === 'pending' ? 'warning' : 'destructive'}>
              <div className="space-y-1">
                <div className="font-bold text-sm">Event  Status</div>
                <p>{statusNotice.message}</p>
                {statusNotice.type === 'pending' && (
                  <p className="text-[11px] opacity-80">
                    Super Admin approval is required before you can log in and customize your event subdomain.
                  </p>
                )}
              </div>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label className="uppercase tracking-wide">Admin Email</Label>
              <div className="relative">
                <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: null }));
                    setEmail(e.target.value);
                  }}
                  placeholder="admin@example.com"
                  className={`pl-9 ${fieldErrors.email ? 'border-destructive ring-2 ring-destructive/20' : ''}`}
                />
              </div>
              <FieldError error={fieldErrors.email} />
            </div>

            <div className="space-y-1.5">
              <Label className="uppercase tracking-wide">Password</Label>
              <div className="relative">
                <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: null }));
                    setPassword(e.target.value);
                  }}
                  placeholder="••••••••"
                  className={`pl-9 ${fieldErrors.password ? 'border-destructive ring-2 ring-destructive/20' : ''}`}
                />
              </div>
              <FieldError error={fieldErrors.password} />
            </div>

            <Button type="submit" disabled={loading} className="w-full" size="default">
              {loading ? <span>Authenticating Subdomain...</span> : <span>Sign In to Admin Portal</span>}
            </Button>
          </form>

          <Separator />

          <div className="flex flex-col space-y-2 text-center text-xs">
            <Link to="/register-team" className="text-primary hover:underline font-bold flex items-center justify-center gap-1">
              <Building2 className="w-3.5 h-3.5" />
              <span>Register New Event</span>
            </Link>
        
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
