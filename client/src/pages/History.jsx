import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useTenant } from '../context/TenantContext.jsx';
import { api } from '../api.js';
import { incrementCachedTotalSwalath } from '../utils/swalathCache.js';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Calendar, Trash2, Plus, ArrowLeft, Star, Clock, AlertTriangle, History as HistoryIcon, Bell } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

function todayKey() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function getCalendarDays() {
  const days = [];
  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    days.push({
      fullDate: `${yyyy}-${mm}-${dd}`,
      dayName: dayNames[d.getDay()],
      dateNum: d.getDate(),
      isToday: i === 0,
    });
  }
  return days;
}

export default function HistoryPage() {
  const { token, user } = useAuth();
  const { activeTenant } = useTenant();
  const navigate = useNavigate();
  const [calendarDays] = useState(getCalendarDays());
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [dayData, setDayData] = useState({ date: todayKey(), dayTotal: 0, entries: [] });
  const [allEntries, setAllEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const activeDateRef = useRef(null);

  useEffect(() => {
    if (token) {
      api('/notifications/inbox', { token })
        .then((res) => {
          if (res && typeof res.unreadCount === 'number') {
            setUnreadCount(res.unreadCount);
          }
        })
        .catch(() => {});
    }
  }, [token]);

  const loadDayData = (dateStr) => {
    setLoading(true);
    setError('');
    api(`/counts/day?date=${dateStr}`, { token })
      .then((data) => setDayData(data || { date: dateStr, dayTotal: 0, entries: [] }))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  const loadAllHistory = () => {
    api('/counts/me', { token })
      .then(setAllEntries)
      .catch(() => { });
  };

  useEffect(() => {
    loadDayData(selectedDate);
    loadAllHistory();
  }, [selectedDate]);

  useEffect(() => {
    if (activeDateRef.current) {
      activeDateRef.current.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  }, [selectedDate]);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget._id);
    const targetValue = Number(deleteTarget.value) || 0;
    try {
      await api(`/counts/entry/${deleteTarget._id}`, { method: 'DELETE', token });
      incrementCachedTotalSwalath(activeTenant, -targetValue);
      setDeleteTarget(null);
      loadDayData(selectedDate);
      loadAllHistory();
    } catch (e) {
      setError(e.message);
    } finally {
      setDeletingId(null);
    }
  };

  const overallTotal = allEntries.reduce((sum, item) => sum + (Number(item.value) || 0), 0);

  return (
    <main className="max-w-xl mx-auto px-4 safe-top pt-4 pb-8 md:py-6 space-y-5 font-sans min-h-screen">
      {/* Top Mobile Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" asChild className="rounded-full border-primary/30">
            <Link to="/dashboard">
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </Link>
          </Button>
          <div>
            <h1 className="font-extrabold text-base text-foreground leading-tight">
              Swalath History
            </h1>
            <span className="text-[11px] text-muted-foreground font-medium">
              Select date to review daily submissions
            </span>
          </div>
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate(user ? '/notifications' : '/login')}
          className="rounded-2xl border-primary/30 active:scale-95 transition-transform relative"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5 text-primary" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[9px] font-extrabold min-w-[16px] h-4 rounded-full flex items-center justify-center px-1 border-2 border-card shadow-sm animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </div>

      {/* Horizontal Scrollable Calendar Date Bar */}
      <Card>
        <CardContent className="p-3 space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-extrabold text-foreground flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-primary" />
              <span>Date Selector</span>
            </span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-[11px] font-bold bg-muted/10 text-foreground px-2.5 py-1 rounded-xl border border-input focus:outline-none"
            />
          </div>

          {/* Scrollable Date Pills */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
            {calendarDays.map((d) => {
              const isSelected = d.fullDate === selectedDate;
              return (
                <button
                  key={d.fullDate}
                  ref={isSelected ? activeDateRef : null}
                  onClick={() => setSelectedDate(d.fullDate)}
                  className={`flex flex-col items-center justify-center min-w-[44px] h-12 rounded-xl transition shrink-0 active:scale-95 ${isSelected
                      ? 'bg-primary text-primary-foreground font-extrabold shadow-sm'
                      : 'bg-muted/10 text-muted-foreground hover:bg-muted/20 font-bold border border-border'
                    }`}
                >
                  <span className="text-[9px] uppercase opacity-80">{d.dayName}</span>
                  <span className="text-xs font-extrabold">{d.dateNum}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected Day's Summary Card */}
      <section className="text-white rounded-2xl p-5 shadow-lg space-y-4 bg-gradient-to-br from-[#296E37] via-[#468B3A] to-[#7EC242] border border-white/20">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold px-3.5 py-1 bg-black/25 backdrop-blur-md rounded-full text-[#F5E6B3]">
            {selectedDate === todayKey() ? "Today's Summary" : `Date: ${selectedDate}`}
          </span>
          <div className="flex items-center gap-1 text-xs font-bold bg-black/25 px-3 py-1 rounded-full text-[#D4AF37]">
            <Star className="w-3.5 h-3.5 fill-[#D4AF37]" />
            <span>{dayData.entries?.length || 0} Entries</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="bg-black/25 p-3 rounded-xl border border-white/15">
            <span className="text-[10px] text-[#E6F4ED] font-bold uppercase block">Day Total</span>
            <span className="text-xl font-extrabold text-white tracking-tight">
              {dayData.dayTotal.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="bg-black/25 p-3 rounded-xl border border-white/15">
            <span className="text-[10px] text-[#E6F4ED] font-bold uppercase block">Overall Total</span>
            <span className="text-xl font-extrabold text-[#D4AF37] tracking-tight">
              {overallTotal.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </section>

      {/* List of Entries for Selected Date */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs sm:text-sm font-extrabold text-foreground flex items-center gap-2">
            <HistoryIcon className="w-4 h-4 text-primary" />
            <span>Entries for {selectedDate}</span>
          </h2>
          <span className="text-xs text-muted-foreground font-bold">
            {dayData.entries?.length || 0} Total
          </span>
        </div>

        {error && <Alert variant="destructive">{error}</Alert>}

        {loading ? (
          <div className="py-6 text-center text-xs text-muted-foreground">Loading history entries...</div>
        ) : dayData.entries?.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center space-y-2">
              <Calendar className="w-8 h-8 text-muted-foreground/40 mx-auto" />
              <p className="text-xs font-bold text-foreground">No entries recorded for this date.</p>
              <p className="text-[11px] text-muted-foreground">Go to dashboard to record new Swalathcount!</p>
              <Button asChild size="sm" className="mt-2">
                <Link to="/dashboard">
                  <Plus className="w-4 h-4 mr-1.5" />
                  <span>Add Swalath Count</span>
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2.5">
            {dayData.entries.map((item, idx) => {
              const createdTime = new Date(item.createdAt).toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
              });
              return (
                <Card key={item._id || idx} className="hover:border-primary">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-xs">
                        <Clock className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-foreground">
                            +{Number(item.value).toLocaleString('en-IN')}
                          </span>
                          {item.note && (
                            <Badge variant="muted" className="text-[10px]">
                              {item.note}
                            </Badge>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground font-medium block mt-0.5">
                          Time: {createdTime}
                        </span>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteTarget(item)}
                      disabled={deletingId === item._id}
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                      title="Delete Entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Deletion Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-md font-sans">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              <span>Delete Swalath Entry?</span>
            </DialogTitle>
            <DialogDescription>
              Selected entry of <strong>(+{Number(deleteTarget?.value || 0).toLocaleString('en-IN')})</strong> will be removed. Are you sure?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="soft" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Yes, Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
