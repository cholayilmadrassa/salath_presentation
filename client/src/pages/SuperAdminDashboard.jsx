import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { PlusCircle, ShieldCheck, CheckCircle, XCircle, AlertTriangle, ExternalLink, Clock, Building2 } from 'lucide-react';

export default function SuperAdminDashboard({ token, onLogout }) {
  const [tenants, setTenants] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Tenant Form state
  const [newForm, setNewForm] = useState({
    name: '',
    slug: '',
    adminName: '',
    email: '',
    password: '',
  });

  const fetchTenants = async (status = statusFilter) => {
    setLoading(true);
    setError('');
    try {
      const path = status ? `/super-admin/tenants?status=${status}` : '/super-admin/tenants';
      const data = await api(path, { token });
      setTenants(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch tenants');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, [statusFilter]);

  const handleApprove = async (id) => {
    setActionMessage('');
    try {
      const res = await api(`/super-admin/tenants/${id}/approve`, {
        method: 'POST',
        token,
      });
      setActionMessage(res.message);
      fetchTenants();
    } catch (err) {
      setError(err.message || 'Approval failed');
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Enter rejection reason:');
    if (reason === null) return;

    setActionMessage('');
    try {
      const res = await api(`/super-admin/tenants/${id}/reject`, {
        method: 'POST',
        body: { rejectionReason: reason },
        token,
      });
      setActionMessage(res.message);
      fetchTenants();
    } catch (err) {
      setError(err.message || 'Rejection failed');
    }
  };

  const handleSuspend = async (id) => {
    if (!window.confirm('Are you sure you want to suspend this tenant?')) return;
    setActionMessage('');
    try {
      const res = await api(`/super-admin/tenants/${id}/suspend`, {
        method: 'POST',
        token,
      });
      setActionMessage(res.message);
      fetchTenants();
    } catch (err) {
      setError(err.message || 'Suspension failed');
    }
  };

  const handleCreateTenant = async (e) => {
    e.preventDefault();
    setError('');
    setActionMessage('');
    try {
      const res = await api('/super-admin/tenants', {
        method: 'POST',
        body: newForm,
        token,
      });
      setActionMessage(res.message);
      setShowCreateModal(false);
      setNewForm({ name: '', slug: '', adminName: '', email: '', password: '' });
      fetchTenants();
    } catch (err) {
      setError(err.message || 'Failed to create pre-approved event subdomain');
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-8 font-ml" style={{ backgroundColor: '#F7F5EC', color: '#1A1A1A' }}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b" style={{ borderColor: '#E8EDE2' }}>
          <div>
            <span className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full mb-2" style={{ backgroundColor: '#FFC107', color: '#1A1A1A' }}>
              Platform Master Control
            </span>
            <h1 className="text-3xl font-extrabold flex items-center gap-2" style={{ color: '#1A1A1A' }}>
              <ShieldCheck className="w-8 h-8" style={{ color: '#6E9B37' }} />
              <span>Super Admin Dashboard</span>
            </h1>
            <p className="text-xs font-medium mt-1" style={{ color: '#8C8C8C' }}>
              Approve pending event applications or create pre-approved subdomains
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md active:scale-95"
              style={{ backgroundColor: '#6E9B37' }}
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Event Subdomain</span>
            </button>

            <button
              onClick={onLogout}
              className="px-4 py-2 bg-white text-stone-700 rounded-xl text-xs font-bold transition border"
              style={{ borderColor: '#E8EDE2' }}
            >
              Logout
            </button>
          </div>
        </div>

        {actionMessage && (
          <div className="p-4 rounded-xl text-xs font-bold flex items-center justify-between border" style={{ backgroundColor: '#FFFFFF', borderColor: '#6E9B37', color: '#6E9B37' }}>
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
            <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border" style={{ borderColor: '#E8EDE2' }}>
              <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: '#E8EDE2' }}>
                <h2 className="text-lg font-bold" style={{ color: '#1A1A1A' }}>Create Pre-Approved Subdomain</h2>
                <button onClick={() => setShowCreateModal(false)} className="text-stone-400 hover:text-stone-700 text-xl font-bold">&times;</button>
              </div>

              <form onSubmit={handleCreateTenant} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold mb-1" style={{ color: '#1A1A1A' }}>Event Team Name</label>
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
                  <label className="block text-xs font-bold mb-1" style={{ color: '#1A1A1A' }}>Subdomain Slug</label>
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
                  <label className="block text-xs font-bold mb-1" style={{ color: '#1A1A1A' }}>Tenant Admin Name</label>
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
                  <label className="block text-xs font-bold mb-1" style={{ color: '#1A1A1A' }}>Admin Email</label>
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
                  <label className="block text-xs font-bold mb-1" style={{ color: '#1A1A1A' }}>Password</label>
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
                    style={{ backgroundColor: '#E8EDE2', color: '#1A1A1A' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-white text-xs font-bold rounded-xl shadow-md"
                    style={{ backgroundColor: '#6E9B37' }}
                  >
                    Create & Approve Subdomain
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-xs border" style={{ borderColor: '#E8EDE2' }}>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase" style={{ color: '#8C8C8C' }}>Filter Status:</span>
            {['', 'pending', 'approved', 'rejected', 'suspended'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition"
                style={{
                  backgroundColor: statusFilter === st ? '#6E9B37' : '#E8EDE2',
                  color: statusFilter === st ? '#FFFFFF' : '#1A1A1A',
                }}
              >
                {st === '' ? 'All Subdomains' : st}
              </button>
            ))}
          </div>
          <div className="text-xs font-semibold" style={{ color: '#8C8C8C' }}>
            Total Event Subdomains: <strong style={{ color: '#1A1A1A' }}>{tenants.length}</strong>
          </div>
        </div>

        {/* Tenants List */}
        {loading ? (
          <div className="text-center py-16" style={{ color: '#8C8C8C' }}>Loading event subdomains...</div>
        ) : tenants.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border text-xs font-semibold shadow-xs" style={{ borderColor: '#E8EDE2', color: '#8C8C8C' }}>
            No event subdomains found matching criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {tenants.map((t) => (
              <div
                key={t._id}
                className="bg-white border rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs hover:border-[#6E9B37] transition"
                style={{ borderColor: t.status === 'pending' ? '#FFC107' : '#E8EDE2' }}
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-extrabold" style={{ color: '#1A1A1A' }}>{t.name}</h2>
                    <a
                      href={`http://${t.slug}.salath.vercel.app`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1 hover:underline"
                      style={{ backgroundColor: '#E8EDE2', color: '#6E9B37' }}
                    >
                      <span>{t.slug}.salath.vercel.app</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <span
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border"
                      style={{
                        backgroundColor: t.status === 'approved' ? '#E8EDE2' : t.status === 'pending' ? '#FFFBEB' : '#FEF2F2',
                        color: t.status === 'approved' ? '#6E9B37' : t.status === 'pending' ? '#D97706' : '#DC2626',
                        borderColor: t.status === 'approved' ? '#6E9B37' : t.status === 'pending' ? '#FFC107' : '#FCA5A5',
                      }}
                    >
                      {t.status === 'pending' ? '⏳ Pending Approval' : t.status}
                    </span>
                  </div>

                  <div className="text-xs space-x-4 pt-1 font-medium" style={{ color: '#8C8C8C' }}>
                    <span>
                      Admin: <strong style={{ color: '#1A1A1A' }}>{t.ownerId?.name || 'N/A'}</strong> ({t.ownerId?.email || 'N/A'})
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
                        style={{ backgroundColor: '#6E9B37' }}
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
                      style={{ backgroundColor: '#FFC107', color: '#1A1A1A' }}
                    >
                      Suspend Subdomain
                    </button>
                  )}

                  {t.status === 'suspended' && (
                    <button
                      onClick={() => handleApprove(t._id)}
                      className="px-3.5 py-2 text-white text-xs font-bold rounded-xl transition"
                      style={{ backgroundColor: '#6E9B37' }}
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
