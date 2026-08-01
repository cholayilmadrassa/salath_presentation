import { useState, useEffect } from 'react';
import { api } from '../api.js';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ShieldCheck, CheckCircle, PlusCircle, ExternalLink, AlertCircle } from 'lucide-react';
import { superAdminTenantSchema } from '../schemas/validationSchemas.js';
  const rootDomain = import.meta.env.VITE_PLATFORM_ROOT_DOMAIN

export default function SuperAdminDashboard({ token, onLogout }) {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [actionMessage, setActionMessage] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  const [newForm, setNewForm] = useState({
    name: '',
    slug: '',
    adminName: '',
    email: '',
    password: '',
  });

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const url = statusFilter ? `/super-admin/tenants?status=${statusFilter}` : '/super-admin/tenants';
      const data = await api(url, { token });
      setTenants(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to fetch event subdomains');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, [token, statusFilter]);

  const handleApprove = async (id) => {
    try {
      setActionMessage('');
      await api(`/super-admin/tenants/${id}/approve`, { method: 'POST', token });
      setActionMessage('Subdomain successfully approved!');
      fetchTenants();
    } catch (err) {
      setError(err.message || 'Approval failed');
    }
  };

  const handleReject = async (id) => {
    try {
      setActionMessage('');
      await api(`/super-admin/tenants/${id}/reject`, { method: 'POST', token });
      setActionMessage('Subdomain request rejected');
      fetchTenants();
    } catch (err) {
      setError(err.message || 'Rejection failed');
    }
  };

  const handleSuspend = async (id) => {
    try {
      setActionMessage('');
      await api(`/super-admin/tenants/${id}/suspend`, { method: 'POST', token });
      setActionMessage('Subdomain suspended');
      fetchTenants();
    } catch (err) {
      setError(err.message || 'Suspension failed');
    }
  };

  const handleCreateTenant = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    const validationResult = superAdminTenantSchema.safeParse(newForm);
    if (!validationResult.success) {
      const errMap = {};
      validationResult.error.errors.forEach((err) => {
        if (err.path[0]) {
          errMap[err.path[0]] = err.message;
        }
      });
      setFieldErrors(errMap);
      setError('Please fix the highlighted field errors below');
      return;
    }

    try {
      await api('/super-admin/tenants/create-approved', {
        method: 'POST',
        token,
        body: newForm,
      });
      setActionMessage(`Pre-approved subdomain "${newForm.slug}" created successfully!`);
      setShowCreateModal(false);
      setNewForm({ name: '', slug: '', adminName: '', email: '', password: '' });
      fetchTenants();
    } catch (err) {
      setError(err.message || 'Failed to create pre-approved event subdomain');
    }
  };

  const FieldError = ({ error }) => error ? (
    <p className="text-[11px] font-bold mt-1 text-destructive flex items-center gap-1 animate-slide-down">
      <AlertCircle className="w-3 h-3 shrink-0" />
      <span>{error}</span>
    </p>
  ) : null;

  return (
    <div className="min-h-screen p-4 sm:p-8 font-ml">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border">
          <div>
            <Badge variant="muted" className="mb-2 tracking-wider uppercase">
              Platform Master Control
            </Badge>
            <h1 className="text-3xl font-extrabold flex items-center gap-2 text-foreground">
              <ShieldCheck className="w-8 h-8 text-primary" />
              <span>Super Admin Dashboard</span>
            </h1>
            <p className="text-xs font-medium mt-1 text-muted-foreground">
              Approve pending event applications or create pre-approved subdomains
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={() => setShowCreateModal(true)} size="sm">
              <PlusCircle className="w-4 h-4 mr-1.5" />
              <span>Create Event Subdomain</span>
            </Button>

            <Button onClick={onLogout} variant="soft" size="sm">
              Logout
            </Button>
          </div>
        </div>

        {actionMessage && (
          <Alert variant="success" className="flex items-center justify-between">
            <span>{actionMessage}</span>
            <button onClick={() => setActionMessage('')} className="font-bold text-base ml-2">&times;</button>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">{error}</Alert>
        )}

        {/* Modal for Direct Creation */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Pre-Approved Subdomain</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleCreateTenant} className="space-y-3" noValidate>
              <div className="space-y-1">
                <Label>Event Team Name</Label>
                <Input
                  type="text"
                  value={newForm.name}
                  onChange={(e) => {
                    if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: null }));
                    setNewForm({ ...newForm, name: e.target.value });
                  }}
                  placeholder="e.g. Noorul Islam Swalath Event"
                  className={fieldErrors.name ? 'border-destructive ring-2 ring-destructive/20' : ''}
                />
                <FieldError error={fieldErrors.name} />
              </div>

              <div className="space-y-1">
                <Label>Subdomain Slug</Label>
                <Input
                  type="text"
                  value={newForm.slug}
                  onChange={(e) => {
                    if (fieldErrors.slug) setFieldErrors((prev) => ({ ...prev, slug: null }));
                    setNewForm({ ...newForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') });
                  }}
                  placeholder="noorulislam"
                  className={`font-mono ${fieldErrors.slug ? 'border-destructive ring-2 ring-destructive/20' : ''}`}
                />
                <FieldError error={fieldErrors.slug} />
              </div>

              <div className="space-y-1">
                <Label>Tenant Admin Name</Label>
                <Input
                  type="text"
                  value={newForm.adminName}
                  onChange={(e) => {
                    if (fieldErrors.adminName) setFieldErrors((prev) => ({ ...prev, adminName: null }));
                    setNewForm({ ...newForm, adminName: e.target.value });
                  }}
                  placeholder="Admin Full Name"
                  className={fieldErrors.adminName ? 'border-destructive ring-2 ring-destructive/20' : ''}
                />
                <FieldError error={fieldErrors.adminName} />
              </div>

              <div className="space-y-1">
                <Label>Admin Email</Label>
                <Input
                  type="email"
                  value={newForm.email}
                  onChange={(e) => {
                    if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: null }));
                    setNewForm({ ...newForm, email: e.target.value });
                  }}
                  placeholder="admin@noorulislam.org"
                  className={fieldErrors.email ? 'border-destructive ring-2 ring-destructive/20' : ''}
                />
                <FieldError error={fieldErrors.email} />
              </div>

              <div className="space-y-1">
                <Label>Password</Label>
                <Input
                  type="password"
                  value={newForm.password}
                  onChange={(e) => {
                    if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: null }));
                    setNewForm({ ...newForm, password: e.target.value });
                  }}
                  placeholder="••••••••"
                  className={fieldErrors.password ? 'border-destructive ring-2 ring-destructive/20' : ''}
                />
                <FieldError error={fieldErrors.password} />
              </div>

              <DialogFooter className="pt-2 flex gap-2">
                <Button
                  type="button"
                  variant="soft"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  Create & Approve Subdomain
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Filter Controls */}
        <Card>
          <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-medium uppercase text-muted-foreground">Filter Status:</span>
              {['', 'pending', 'approved', 'rejected', 'suspended'].map((st) => (
                <Button
                  key={st}
                  type="button"
                  variant={statusFilter === st ? "default" : "soft"}
                  size="sm"
                  onClick={() => setStatusFilter(st)}
                  className="capitalize h-8 text-xs px-3"
                >
                  {st === '' ? 'All Subdomains' : st}
                </Button>
              ))}
            </div>
            <div className="text-xs font-medium text-muted-foreground">
              Total Event Subdomains: <strong className="text-foreground font-semibold">{tenants.length}</strong>
            </div>
          </CardContent>
        </Card>

        {/* Tenants List */}
        {loading ? (
          <div className="text-center py-16 text-muted-foreground font-normal">Loading event subdomains...</div>
        ) : tenants.length === 0 ? (
          <Card>
            <CardContent className="text-center py-16 text-xs font-normal text-muted-foreground">
              No event subdomains found matching criteria.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {tenants.map((t) => (
              <Card key={t._id}>
                <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-bold text-foreground">{t.name}</h2>
                      <a
                        href={`http://${t.slug}.${rootDomain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1 hover:underline bg-muted/10 text-secondary"
                      >
                        <span>{t.slug}.{import.meta.env}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <Badge
                        variant={t.status === 'approved' ? 'success' : t.status === 'pending' ? 'warning' : 'destructive'}
                        className="uppercase"
                      >
                        {t.status === 'pending' ? '⏳ Pending Approval' : t.status}
                      </Badge>
                    </div>

                    <div className="text-xs space-x-4 pt-1 font-medium text-muted-foreground">
                      <span>
                        Admin: <strong className="text-foreground">{t.ownerId?.name || 'N/A'}</strong> ({t.ownerId?.email || 'N/A'})
                      </span>
                      <span>
                        Registered: {new Date(t.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 self-start md:self-auto">
                    {t.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(t._id)}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          <span>Approve Subdomain</span>
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleReject(t._id)}
                        >
                          Reject
                        </Button>
                      </>
                    )}

                    {t.status === 'approved' && (
                      <Button
                        variant="soft"
                        size="sm"
                        onClick={() => handleSuspend(t._id)}
                      >
                        Suspend Subdomain
                      </Button>
                    )}

                    {t.status === 'suspended' && (
                      <Button
                        size="sm"
                        onClick={() => handleApprove(t._id)}
                      >
                        Re-Approve Subdomain
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
