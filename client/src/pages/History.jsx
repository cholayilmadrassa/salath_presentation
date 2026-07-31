import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api.js';
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
import { Calendar, Trash2, Plus, ArrowLeft, Star, Clock, AlertTriangle, History as HistoryIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

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
  const { token } = useAuth();
  const [calendarDays] = useState(getCalendarDays());
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [dayData, setDayData] = useState({ date: todayKey(), dayTotal: 0, entries: [] });
  const [allEntries, setAllEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

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
      .catch(() => {});
  };

  useEffect(() => {
    loadDayData(selectedDate);
    loadAllHistory();
  }, [selectedDate]);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget._id);
    try {
      await api(`/counts/entry/${deleteTarget._id}`, { method: 'DELETE', token });
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
    <main className="max-w-xl mx-auto px-4 pt-8 pb-24 md:py-6 space-y-5 font-ml min-h-screen">
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
              സമർപ്പണ ചരിത്രം (History)
            </h1>
            <span className="text-[11px] text-muted-foreground font-medium">
              തീയതി തിരഞ്ഞെടുത്ത് ദിവസേനയുള്ള എണ്ണം പരിശോധിക്കൂ
            </span>
          </div>
        </div>

        <Button size="icon" asChild className="rounded-full">
          <Link to="/dashboard">
            <Plus className="w-5 h-5" />
          </Link>
        </Button>
      </div>

      {/* Horizontal Scrollable Calendar Date Bar */}
      <Card>
        <CardContent className="p-3 space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-extrabold text-foreground flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-primary" />
              <span>ക്യാലണ്ടർ (Date Selector)</span>
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
                  onClick={() => setSelectedDate(d.fullDate)}
                  className={`flex flex-col items-center justify-center min-w-[44px] h-12 rounded-2xl transition shrink-0 active:scale-95 ${
                    isSelected
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

      {/* Selected Day's Summary Card (Madinah Palette) */}
      <section className="text-white rounded-3xl p-5 shadow-lg space-y-4 bg-gradient-to-br from-[#07351F] via-[#0E7443] to-[#159C5A] border border-[#D4AF37]/30">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold px-3.5 py-1 bg-black/25 backdrop-blur-md rounded-full text-[#F5E6B3]">
            {selectedDate === todayKey() ? 'ഇന്നത്തെ സംഗ്രഹം' : `${selectedDate} തീയതിയിലെ സംഗ്രഹം`}
          </span>
          <div className="flex items-center gap-1 text-xs font-bold bg-black/25 px-3 py-1 rounded-full text-[#D4AF37]">
            <Star className="w-3.5 h-3.5 fill-[#D4AF37]" />
            <span>{dayData.entries?.length || 0} രേഖപ്പെടുത്തലുകൾ</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="bg-black/25 p-3 rounded-2xl border border-white/15">
            <span className="text-[10px] text-[#E6F4ED] font-bold uppercase block">ഈ ദിവസത്തെ ആകെ</span>
            <span className="text-xl font-extrabold text-white tracking-tight">
              {dayData.dayTotal.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="bg-black/25 p-3 rounded-2xl border border-white/15">
            <span className="text-[10px] text-[#E6F4ED] font-bold uppercase block">ആകെ തുക</span>
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
            <span>{selectedDate} ലെ സ്വലാത്ത് വിവരങ്ങൾ (Entries)</span>
          </h2>
          <span className="text-xs text-muted-foreground font-bold">
            {dayData.entries?.length || 0} എണ്ണം
          </span>
        </div>

        {error && <Alert variant="destructive">{error}</Alert>}

        {loading ? (
          <div className="py-6 text-center text-xs text-muted-foreground">വിവരങ്ങൾ പരിശോധിക്കുന്നു...</div>
        ) : dayData.entries?.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center space-y-2">
              <Calendar className="w-8 h-8 text-muted-foreground/40 mx-auto" />
              <p className="text-xs font-bold text-foreground">ഈ ദിവസത്തിൽ സ്വലാത്ത് വിവരങ്ങൾ ഒന്നും ലഭ്യമല്ല.</p>
              <p className="text-[11px] text-muted-foreground">ഡാഷ്‌ബോർഡിൽ പോയി പുതിയ സ്വലാത്ത് സംഖ്യ ചേർക്കൂ!</p>
              <Button asChild size="sm" className="mt-2">
                <Link to="/dashboard">
                  <Plus className="w-4 h-4 mr-1.5" />
                  <span>സ്വലാത്ത് ചേർക്കൂ</span>
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
                          സമയ മുദ്ര: {createdTime}
                        </span>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteTarget(item)}
                      disabled={deletingId === item._id}
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                      title="നീക്കം ചെയ്യൂ"
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              <span>സ്വലാത്ത് എണ്ണം നീക്കം ചെയ്യണോ?</span>
            </DialogTitle>
            <DialogDescription>
              തിരഞ്ഞെടുത്ത <strong>(+{Number(deleteTarget?.value || 0).toLocaleString('en-IN')})</strong> സ്വലാത്ത് വിവരങ്ങൾ പോർട്ടലിൽ നിന്ന് നീക്കം ചെയ്യപ്പെടും.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="soft" onClick={() => setDeleteTarget(null)}>
              റദ്ദാക്കുക (Cancel)
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              അതെ, നീക്കം ചെയ്യൂ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
