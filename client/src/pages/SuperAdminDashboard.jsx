import { useState, useEffect } from 'react';
import { api } from '../api.js';
import { ShieldCheck, CheckCircle, PlusCircle, ExternalLink, RefreshCw, XCircle } from 'lucide-react';

export default function SuperAdminDashboard({ token, onLogout }) {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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
    try {
      setError('');
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

  return (
    <div className="min-h-screen p-4 sm:p-8 font-ml" style={{ backgroundColor: '#DDF4E7', color: '#124170' }}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b" style={{ borderColor: 'rgba(38, 102, 127, 0.2)' }}>
          <div>
            <span className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full mb-2" style={{ backgroundColor: 'rgba(38, 102, 127, 0.12)', color: '#26667F' }}>
              Platform Master Control
            </span>
            <h1 className="text-3xl font-extrabold flex items-center gap-2" style={{ color: '#124170' }}>
              <ShieldCheck className="w-8 h-8" style={{ color: '#67C090' }} />
              <span>Super Admin Dashboard</span>
            </h1>
            <p className="text-xs font-medium mt-1" style={{ color: '#26667F' }}>
              Approve pending event applications or create pre-approved subdomains
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md active:scale-95"
              style={{ backgroundColor: '#67C090' }}
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Event Subdomain</span>
            </button>

            <button
              onClick={onLogout}
              className="px-4 py-2 bg-white text-stone-700 rounded-xl text-xs font-bold transition border"
              style={{ borderColor: 'rgba(38, 102, 127, 0.2)' }}
            >
              Logout
            </button>
          </div>
        </div>

        {actionMessage && (
          <div className="p-4 rounded-xl text-xs font-bold flex items-center justify-between border" style={{ backgroundColor: '#FFFFFF', borderColor: '#67C090', color: '#67C090' }}>
            <span>{actionMessage}</span>
            <button onClick={() => setActionMessage('')} className="font-bold text-base">&times;</button>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-bold">
            {error}
          </div>
        )}

        {/* Modal for Direct Creation */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border" style={{ borderColor: 'rgba(38, 102, 127, 0.2)' }}>
              <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'rgba(38, 102, 127, 0.2)' }}>
                <h2 className="text-lg font-bold" style={{ color: '#124170' }}>Create Pre-Approved Subdomain</h2>
                <button onClick={() => setShowCreateModal(false)} className="text-stone-400 hover:text-stone-700 text-xl font-bold">&times;</button>
              </div>

              <form onSubmit={handleCreateTenant} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold mb-1" style={{ color: '#124170' }}>Event Team Name</label>
                  <input
                    type="text"
                    required
                    value={newForm.name}
                    onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
                    placeholder="e.g. Noorul Islam Salath Event"
                    className="input font-semibold text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1" style={{ color: '#124170' }}>Subdomain Slug</label>
                  <input
                    type="text"
                    required
                    value={newForm.slug}
                    onChange={(e) => setNewForm({ ...newForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    placeholder="noorulislam"
                    className="input font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1" style={{ color: '#124170' }}>Tenant Admin Name</label>
                  <input
                    type="text"
                    required
                    value={newForm.adminName}
                    onChange={(e) => setNewForm({ ...newForm, adminName: e.target.value })}
                    placeholder="Admin Full Name"
                    className="input font-semibold text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1" style={{ color: '#124170' }}>Admin Email</label>
                  <input
                    type="email"
                    required
                    value={newForm.email}
                    onChange={(e) => setNewForm({ ...newForm, email: e.target.value })}
                    placeholder="admin@noorulislam.org"
                    className="input font-semibold text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1" style={{ color: '#124170' }}>Password</label>
                  <input
                    type="password"
                    required
                    value={newForm.password}
                    onChange={(e) => setNewForm({ ...newForm, password: e.target.value })}
                    placeholder="••••••••"
                    className="input font-semibold text-xs"
                  />
                </div>

                <div className="pt-2 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold"
                    style={{ backgroundColor: 'rgba(38, 102, 127, 0.12)', color: '#124170' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-white text-xs font-bold rounded-xl shadow-md"
                    style={{ backgroundColor: '#67C090' }}
                  >
                    Create & Approve Subdomain
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-xs border" style={{ borderColor: 'rgba(38, 102, 127, 0.15)' }}>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase" style={{ color: '#26667F' }}>Filter Status:</span>
            {['', 'pending', 'approved', 'rejected', 'suspended'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition"
                style={{
                  backgroundColor: statusFilter === st ? '#67C090' : 'rgba(38, 102, 127, 0.12)',
                  color: statusFilter === st ? '#FFFFFF' : '#124170',
                }}
              >
                {st === '' ? 'All Subdomains' : st}
              </button>
            ))}
          </div>
          <div className="text-xs font-semibold" style={{ color: '#26667F' }}>
            Total Event Subdomains: <strong style={{ color: '#124170' }}>{tenants.length}</strong>
          </div>
        </div>

        {/* Tenants List */}
        {loading ? (
          <div className="text-center py-16" style={{ color: '#26667F' }}>Loading event subdomains...</div>
        ) : tenants.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border text-xs font-semibold shadow-xs" style={{ borderColor: 'rgba(38, 102, 127, 0.15)', color: '#26667F' }}>
            No event subdomains found matching criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {tenants.map((t) => (
              <div
                key={t._id}
                className="bg-white border rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs transition"
                style={{ borderColor: 'rgba(38, 102, 127, 0.15)' }}
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-extrabold" style={{ color: '#124170' }}>{t.name}</h2>
                    <a
                      href={`http://${t.slug}.salath.vercel.app`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1 hover:underline"
                      style={{ backgroundColor: 'rgba(38, 102, 127, 0.12)', color: '#26667F' }}
                    >
                      <span>{t.slug}.salath.vercel.app</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <span
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border"
                      style={{
                        backgroundColor: t.status === 'approved' ? 'rgba(38, 102, 127, 0.12)' : t.status === 'pending' ? '#FFFBEB' : '#FEF2F2',
                        color: t.status === 'approved' ? '#67C090' : t.status === 'pending' ? '#D97706' : '#DC2626',
                        borderColor: t.status === 'approved' ? '#67C090' : t.status === 'pending' ? '#67C090' : '#FCA5A5',
                      }}
                    >
                      {t.status === 'pending' ? '⏳ Pending Approval' : t.status}
                    </span>
                  </div>

                  <div className="text-xs space-x-4 pt-1 font-medium" style={{ color: '#26667F' }}>
                    <span>
                      Admin: <strong style={{ color: '#124170' }}>{t.ownerId?.name || 'N/A'}</strong> ({t.ownerId?.email || 'N/A'})
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
                      <button
                        onClick={() => handleApprove(t._id)}
                        className="px-4 py-2 text-white text-xs font-extrabold rounded-xl transition shadow-md active:scale-95 flex items-center gap-1"
                        style={{ backgroundColor: '#67C090' }}
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Approve Subdomain</span>
                      </button>
                      <button
                        onClick={() => handleReject(t._id)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
                      >
                        Reject
                      </button>
                    </>
                  )}

                  {t.status === 'approved' && (
                    <button
                      onClick={() => handleSuspend(t._id)}
                      className="px-3.5 py-2 text-xs font-bold rounded-xl transition"
                      style={{ backgroundColor: 'rgba(38, 102, 127, 0.12)', color: '#124170' }}
                    >
                      Suspend Subdomain
                    </button>
                  )}

                  {t.status === 'suspended' && (
                    <button
                      onClick={() => handleApprove(t._id)}
                      className="px-3.5 py-2 text-white text-xs font-bold rounded-xl transition"
                      style={{ backgroundColor: '#67C090' }}
                    >
                      Re-Approve Subdomain
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
