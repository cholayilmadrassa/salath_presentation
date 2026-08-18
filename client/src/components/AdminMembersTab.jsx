import { useState } from 'react';
import { api } from '../api.js';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FaWhatsapp } from 'react-icons/fa';
import {
  Search, ArrowUpDown, ChevronRight, ArrowLeft,
  Clock, Calendar, Star, History, Award, TrendingUp,
  FileSpreadsheet, FileText, Download, Pencil,
} from 'lucide-react';
import {
  exportMembersToExcel,
  exportMembersToPdf,
  exportMemberHistoryToExcel,
  exportMemberHistoryToPdf,
} from '../utils/exportUtils.js';

export default function AdminMembersTab({
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
  filteredUsers = [],
  token,
  tenant,
  fetchUsers,
}) {
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberHistory, setMemberHistory] = useState([]);
  const [memberTotal, setMemberTotal] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');

  // Member edit state
  const [editingMember, setEditingMember] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', phone: '', address: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  const handleOpenEditMember = (e, member) => {
    e?.stopPropagation?.();
    setEditingMember(member);
    setEditForm({
      name: member.name || '',
      phone: member.phone || '',
      address: member.address || member.place || '',
    });
    setEditError('');
    setEditSuccess('');
  };

  const handleSaveMemberEdit = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim()) {
      setEditError('Member name is required');
      return;
    }
    setEditLoading(true);
    setEditError('');
    setEditSuccess('');

    try {
      const memberId = editingMember._id || editingMember.id;
      const res = await api(`/admin/users/${memberId}`, {
        method: 'PUT',
        token,
        body: {
          name: editForm.name.trim(),
          phone: editForm.phone.trim(),
          address: editForm.address.trim(),
          place: editForm.address.trim(),
        },
      });

      setEditSuccess('Member details updated successfully!');
      if (fetchUsers) await fetchUsers();
      if (selectedMember && ((selectedMember._id || selectedMember.id) === memberId)) {
        setSelectedMember((prev) => ({
          ...prev,
          name: res.user.name,
          phone: res.user.phone,
          address: res.user.address,
          place: res.user.place,
        }));
      }

      setTimeout(() => {
        setEditingMember(null);
        setEditSuccess('');
      }, 1000);
    } catch (err) {
      setEditError(err.message || 'Failed to update member');
    } finally {
      setEditLoading(false);
    }
  };


  const eventName = tenant?.branding?.title || tenant?.name || 'Salath Presentation';
  const totalAllSwalath = filteredUsers.reduce((sum, u) => sum + (Number(u.totalCount) || 0), 0);

  const handleSelectMember = async (user) => {
    const memberId = user._id || user.id;
    if (!memberId) return;

    if ((selectedMember?._id || selectedMember?.id) === memberId) {
      setSelectedMember(null);
      setMemberHistory([]);
      return;
    }

    setSelectedMember(user);
    setHistoryLoading(true);
    setHistoryError('');

    try {
      const data = await api(`/admin/users/${memberId}/counts`, { token });
      setMemberTotal(data?.totalCount || 0);
      setMemberHistory(data?.items || []);
    } catch (e) {
      setHistoryError(e.message || 'Failed to load member history');
      setMemberHistory([]);
      setMemberTotal(0);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleBackToList = () => {
    setSelectedMember(null);
    setMemberHistory([]);
    setHistoryError('');
  };

  const logoUrl = tenant?.branding?.logoUrl || '/appLogo.png';

  // Export handlers for all members summary
  const handleExportMembersExcel = () => {
    exportMembersToExcel({ members: filteredUsers, eventName });
  };

  const handleExportMembersPdf = async () => {
    await exportMembersToPdf({ members: filteredUsers, eventName, logoUrl });
  };

  // Export handlers for individual selected member history
  const handleExportMemberHistoryExcel = () => {
    if (!selectedMember) return;
    exportMemberHistoryToExcel({
      member: selectedMember,
      historyItems: memberHistory,
      eventName,
      memberTotal,
    });
  };

  const handleExportMemberHistoryPdf = async () => {
    if (!selectedMember) return;
    await exportMemberHistoryToPdf({
      member: selectedMember,
      historyItems: memberHistory,
      eventName,
      memberTotal,
      logoUrl,
    });
  };

  // Group entries by date for the history view
  const groupedByDate = {};
  memberHistory.forEach((entry) => {
    const dateKey = entry.date || 'Unknown';
    if (!groupedByDate[dateKey]) {
      groupedByDate[dateKey] = { entries: [], dayTotal: 0 };
    }
    groupedByDate[dateKey].entries.push(entry);
    groupedByDate[dateKey].dayTotal += Number(entry.value) || 0;
  });

  const sortedDates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));

  // ─── MEMBER HISTORY DETAIL VIEW ───
  if (selectedMember) {
    return (
      <div className="space-y-4 animate-slide-up">
        {/* Back Button & Member Info Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/40">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={handleBackToList}
              className="rounded-full border-primary/30 shrink-0"
            >
              <ArrowLeft className="w-4 h-4 text-foreground" />
            </Button>
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-11 h-11 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-base shrink-0">
                {selectedMember.name?.charAt(0) || 'U'}
              </div>
              <div className="min-w-0">
                <h3 className="font-extrabold text-sm text-foreground truncate">
                  {selectedMember.name}
                </h3>
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                  <span>{selectedMember.phone || selectedMember.email}</span>
                  {selectedMember.phone && (
                    <a
                      href={`https://wa.me/91${selectedMember.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                        `അസ്സലാമു അലൈക്കും ${selectedMember.name}, സ്വലാത്ത് ക്യാമ്പയിനുമായി ബന്ധപ്പെട്ട് ബന്ധപ്പെടുന്നു.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline font-bold"
                      title="WhatsApp Contact"
                    >
                      <FaWhatsapp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>WhatsApp</span>
                    </a>
                  )}
                  {selectedMember.place && <span>• {selectedMember.place}</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Export & Edit Buttons for Member Details */}
          <div className="flex flex-wrap items-center gap-2 self-end sm:self-center shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => handleOpenEditMember(e, selectedMember)}
              className="text-xs font-bold gap-1.5 rounded-xl border-primary/30 text-primary hover:bg-primary/10"
              title="Edit Member Details"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit Member</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportMemberHistoryExcel}
              className="text-xs font-bold gap-1.5 rounded-xl border-emerald-600/30 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
              title="Export Member History to Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export Excel</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportMemberHistoryPdf}
              className="text-xs font-bold gap-1.5 rounded-xl border-rose-600/30 text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
              title="Export Member History to PDF"
            >
              <FileText className="w-3.5 h-3.5 text-rose-600" />
              <span>Export PDF</span>
            </Button>
          </div>

        </div>

        {/* Summary Stats Banner */}
        <div className="text-white rounded-2xl p-5 shadow-lg bg-gradient-to-br from-[#296E37] via-[#468B3A] to-[#7EC242] border border-white/20 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl pointer-events-none bg-[#D4AF37]/20" />
          <div className="flex items-center gap-2 mb-3 relative z-10">
            <div className="w-7 h-7 rounded-xl bg-[#D4AF37]/25 flex items-center justify-center">
              <Award className="w-4 h-4 text-[#D4AF37]" />
            </div>
            <span className="text-xs font-extrabold tracking-wider text-[#E6F4ED] uppercase">
              {selectedMember.name}'s Summary
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 relative z-10">
            <div className="bg-black/25 backdrop-blur-md p-3 rounded-xl border border-white/15">
              <span className="text-[10px] text-[#E6F4ED] font-bold uppercase block">Total Swalath</span>
              <span className="text-xl font-extrabold text-[#D4AF37] tracking-tight">
                {memberTotal.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="bg-black/25 backdrop-blur-md p-3 rounded-xl border border-white/15">
              <span className="text-[10px] text-[#E6F4ED] font-bold uppercase block">Active Days</span>
              <span className="text-xl font-extrabold text-white tracking-tight">
                {sortedDates.length}
              </span>
            </div>
          </div>
        </div>

        {/* History Entries */}
        {historyError && (
          <Card className="border-destructive/50">
            <CardContent className="p-4 text-center text-xs font-bold text-destructive">
              {historyError}
            </CardContent>
          </Card>
        )}

        {historyLoading ? (
          <div className="py-8 text-center space-y-2">
            <div className="w-7 h-7 mx-auto rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-xs font-bold text-muted-foreground">Loading history...</p>
          </div>
        ) : memberHistory.length === 0 && !historyError ? (
          <Card>
            <CardContent className="p-8 text-center space-y-2">
              <History className="w-8 h-8 text-muted-foreground/40 mx-auto" />
              <p className="text-xs font-bold text-foreground">No swalath entries found for this member.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-foreground flex items-center gap-2">
                <History className="w-4 h-4 text-primary" />
                <span>Submission History</span>
              </h4>
              <span className="text-[11px] text-muted-foreground font-bold">
                {memberHistory.length} Entries
              </span>
            </div>

            {sortedDates.map((dateKey) => {
              const group = groupedByDate[dateKey];
              return (
                <div key={dateKey} className="space-y-2">
                  {/* Date Header */}
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-primary" />
                      <span className="text-[11px] font-extrabold text-foreground">{dateKey}</span>
                    </div>
                    <Badge variant="success" className="text-[10px] font-extrabold">
                      {group.dayTotal.toLocaleString('en-IN')} Swalath
                    </Badge>
                  </div>

                  {/* Entries for this date */}
                  {group.entries.map((entry, idx) => {
                    const createdTime = entry.createdAt
                      ? new Date(entry.createdAt).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '--:--';

                    return (
                      <Card key={entry._id || idx} className="border-border/60">
                        <CardContent className="p-3 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                              <Clock className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-sm text-foreground">
                                  +{Number(entry.value).toLocaleString('en-IN')}
                                </span>
                                {entry.note && (
                                  <Badge variant="muted" className="text-[9px]">
                                    {entry.note}
                                  </Badge>
                                )}
                              </div>
                              <span className="text-[10px] text-muted-foreground font-medium block mt-0.5">
                                Time: {createdTime}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ─── MEMBERS LIST VIEW (default) ───
  return (
    <div className="space-y-4">
      {/* Top Banner with Stats & Export Buttons */}
      <Card className="bg-card border-border/80 shadow-xs">
        <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
              <span>Member List & All Counts</span>
              <Badge variant="muted" className="font-mono text-[10px]">
                {filteredUsers.length} Members
              </Badge>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Total Combined Swalath: <strong className="text-primary font-extrabold">{totalAllSwalath.toLocaleString('en-IN')}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportMembersExcel}
              className="text-xs font-extrabold gap-1.5 rounded-xl border-emerald-600/30 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30 flex-1 sm:flex-none justify-center"
              title="Export All Members Details & Total Count to Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export Excel</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportMembersPdf}
              className="text-xs font-extrabold gap-1.5 rounded-xl border-rose-600/30 text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30 flex-1 sm:flex-none justify-center"
              title="Export All Members Details & Total Count to PDF"
            >
              <FileText className="w-4 h-4 text-rose-600" />
              <span>Export PDF</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filter and Sort Toolbar */}
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

      {/* Members List */}
      <div className="space-y-2">
        {filteredUsers.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-xs font-medium text-muted-foreground">
              No members match your search criteria.
            </CardContent>
          </Card>
        ) : (
          filteredUsers.map((u) => (
            <Card
              key={u._id}
              className="hover:border-primary cursor-pointer active:scale-[0.99] transition-all"
              onClick={() => handleSelectMember(u)}
            >
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

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleOpenEditMember(e, u)}
                    className="h-8 px-2 text-[11px] font-bold gap-1 text-primary hover:bg-primary/15 rounded-xl"
                    title="Edit Member Details"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </Button>
                  <Badge variant="success" className="text-xs font-extrabold">
                    {u.totalCount.toLocaleString('en-IN')} Salath
                  </Badge>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* ── Admin Edit Member Modal ── */}
      <Dialog open={Boolean(editingMember)} onOpenChange={(open) => !open && setEditingMember(null)}>
        <DialogContent className="max-w-sm font-sans">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                <Pencil className="w-4 h-4 text-primary" />
              </div>
              <span>Edit Member Details</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveMemberEdit} className="space-y-3.5 pt-1">
            {editError && <Alert variant="destructive" className="text-xs py-2">{editError}</Alert>}
            {editSuccess && <Alert variant="success" className="text-xs py-2">{editSuccess}</Alert>}

            <div className="space-y-1">
              <Label className="text-xs font-bold">Member Name *</Label>
              <Input
                type="text"
                placeholder="e.g. Muhammed"
                value={editForm.name}
                onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                className="text-xs"
                disabled={editLoading}
                autoFocus
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold">Phone Number</Label>
              <Input
                type="text"
                placeholder="e.g. 9876543210"
                value={editForm.phone}
                onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))}
                className="text-xs"
                disabled={editLoading}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold">Address / Place</Label>
              <Input
                type="text"
                placeholder="e.g. Kozhikode"
                value={editForm.address}
                onChange={(e) => setEditForm((prev) => ({ ...prev, address: e.target.value }))}
                className="text-xs"
                disabled={editLoading}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditingMember(null)}
                className="text-xs font-bold rounded-xl"
                disabled={editLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={editLoading}
                className="text-xs font-bold px-4 rounded-xl"
              >
                {editLoading ? 'Saving...' : 'Save Member'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
