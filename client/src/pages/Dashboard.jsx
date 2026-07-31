import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api.js';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Save, CheckCircle2, History, Plus, Bell, Star, Calendar, AlertCircle } from 'lucide-react';
import { salathCountSchema } from '../schemas/validationSchemas.js';

function todayKey() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export default function Dashboard() {
  const { token, user } = useAuth();
  const [value, setValue] = useState('');
  const [items, setItems] = useState([]);
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const load = () =>
    api('/counts/me', { token })
      .then(setItems)
      .catch((e) => setError(e.message));

  useEffect(() => {
    load();
  }, []);

  const addQuickCount = (amount) => {
    if (error) setError('');
    const current = Number(value) || 0;
    const newVal = current + amount;
    if (newVal <= 100000) {
      setValue(String(newVal));
    } else {
      setValue('100000');
      setError('Single entry count cannot exceed 100,000 (1 Lakh)');
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!value || !String(value).trim()) {
      setError('Please enter a Salath count number');
      return;
    }

    const num = Number(value);

    // Zod schema validation
    const validationResult = salathCountSchema.safeParse({ value: num });
    if (!validationResult.success) {
      setError(validationResult.error.errors[0].message);
      return;
    }

    const todayEntry = items.find((it) => it.date === todayKey());
    const currentTodayTotal = todayEntry ? Number(todayEntry.value) || 0 : 0;
    if (currentTodayTotal + num > 100000) {
      const remaining = Math.max(0, 100000 - currentTodayTotal);
      setError(`Daily total limit of 100,000 (1 Lakh) reached! You recorded ${currentTodayTotal.toLocaleString('en-IN')} today (Remaining: ${remaining.toLocaleString('en-IN')}).`);
      return;
    }

    setLoading(true);
    try {
      await api('/counts/me/today', { method: 'POST', token, body: { value: num } });
      setSuccessMsg(`Successfully added +${num.toLocaleString('en-IN')} Salath count for today!`);
      setValue('');
      setSelectedDate(todayKey());
      await load();
    } catch (e) {
      setError(e.message || 'Salath count submission failed.');
    } finally {
      setLoading(false);
    }
  };

  const totalCountSum = items.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
  const selectedEntry = items.find((it) => it.date === selectedDate);
  const selectedDateSum = selectedEntry ? Number(selectedEntry.value) : 0;
  const isTodaySelected = selectedDate === todayKey();

  return (
    <main className="max-w-xl mx-auto px-4 safe-top pb-20 md:py-6 space-y-5 font-ml min-h-screen">
      {/* Mobile Top App Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-base shadow-sm">
            ☪
          </div>
          <div>
            <h1 className="font-extrabold text-sm leading-tight text-foreground">
              Welcome, {user?.name}
            </h1>
            <span className="text-[11px] font-medium text-muted-foreground">
              Date: {selectedDate}
            </span>
          </div>
        </div>

        <Button variant="outline" size="icon" className="rounded-full" aria-label="Notifications">
          <Bell className="w-4.5 h-4.5 text-primary" />
        </Button>
      </div>

      {/* Date Picker Selector Bar */}
      <Card>
        <CardContent className="p-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-foreground">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold">Select Date:</span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs font-bold px-3 py-1.5 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {!isTodaySelected && (
              <Button
                size="sm"
                onClick={() => setSelectedDate(todayKey())}
                className="h-7 text-[10px] px-2.5 rounded-xl"
              >
                Today
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Featured Summary Card for Selected Date (Madinah Palette) */}
      <section className="text-white rounded-3xl p-5 shadow-lg space-y-4 bg-gradient-to-br from-[#07351F] via-[#0E7443] to-[#159C5A] border border-[#D4AF37]/30">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold px-3.5 py-1 bg-black/25 backdrop-blur-md rounded-full text-[#F5E6B3]">
            {isTodaySelected ? "Today's Summary" : `Date: ${selectedDate}`}
          </span>
          <div className="flex items-center gap-1 text-xs font-bold bg-black/25 px-3 py-1 rounded-full text-[#D4AF37]">
            <Star className="w-3.5 h-3.5 fill-[#D4AF37]" />
            <span>{items.length} Days Active</span>
          </div>
        </div>

        {/* Dual Stats Display: Selected Date Count & Overall Total */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="bg-black/25 p-3 rounded-2xl border border-white/15">
            <span className="text-[10px] font-bold uppercase tracking-wider block text-[#E6F4ED]">
              {isTodaySelected ? "Today's Count" : 'Selected Date Count'}
            </span>
            <span className="text-xl font-extrabold text-white tracking-tight">
              {selectedDateSum.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="bg-black/25 p-3 rounded-2xl border border-white/15">
            <span className="text-[10px] font-bold uppercase tracking-wider block text-[#E6F4ED]">Total Count</span>
            <span className="text-xl font-extrabold tracking-tight text-[#D4AF37]">
              {totalCountSum.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </section>

      {/* Quick Add Salath Form */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="text-sm font-extrabold flex items-center gap-2 text-foreground">
              <div className="w-7 h-7 rounded-xl flex items-center justify-center bg-primary/15 text-primary">
                <Plus className="w-4 h-4" />
              </div>
              <span>Record Salath Count</span>
            </h2>
            <Badge variant="success">Quick Add</Badge>
          </div>

          {error && (
            <Alert variant="destructive" className="animate-slide-down">{error}</Alert>
          )}
          {successMsg && (
            <Alert variant="success">{successMsg}</Alert>
          )}

          <form onSubmit={submit} className="space-y-4" noValidate>
            <div>
              <label className="text-xs font-extrabold block mb-1.5 text-foreground">
                Enter Salath Count:
              </label>

              {/* Fast Preset Increment Chips */}
              <div className="grid grid-cols-4 gap-2 mb-3">
                {[10, 50, 100, 500].map((amt) => (
                  <Button
                    key={amt}
                    type="button"
                    variant="soft"
                    size="sm"
                    onClick={() => addQuickCount(amt)}
                    className="h-9 font-bold"
                  >
                    +{amt}
                  </Button>
                ))}
              </div>

              <div className="relative space-y-1.5">
                <Input
                  type="number"
                  maxLength="6"
                  placeholder="e.g. 10000"
                  value={value}
                  onInput={(e) => {
                    if (e.target.value.length > 6) {
                      e.target.value = e.target.value.slice(0, 6);
                    }
                  }}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (error) setError('');
                    if (val.length <= 6) {
                      setValue(val);
                    }
                  }}
                  className={`text-xl font-extrabold text-center tracking-wide h-14 ${error ? 'border-destructive ring-2 ring-destructive/20' : ''}`}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full text-sm"
            >
              <Save className="w-4.5 h-4.5 mr-2" />
              <span>{loading ? 'Saving...' : 'Save Count'}</span>
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* History List for User */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 text-muted-foreground">
            <History className="w-4 h-4" />
            <span>Salath Count History</span>
          </h2>
          <span className="text-[10px] font-bold text-muted-foreground">Total {items.length} Entries</span>
        </div>

        {items.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-xs font-medium space-y-1">
              <p className="font-bold text-foreground">No entries recorded yet.</p>
              <p className="text-muted-foreground">Enter your Salath count above and click Save Count.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item._id}
                className={`p-3.5 rounded-2xl flex items-center justify-between bg-card transition border ${
                  item.date === selectedDate ? 'border-primary ring-1 ring-primary/30' : 'border-border'
                }`}
              >
                <div>
                  <span className="text-xs font-extrabold block text-foreground">{item.date}</span>
                  <span className="text-[10px] font-medium text-muted-foreground">
                    {item.date === todayKey() ? 'Recorded Today' : 'Entry Recorded'}
                  </span>
                </div>
                <div className="text-right flex items-center gap-2">
                  <span className="text-base font-extrabold text-primary">
                    +{Number(item.value).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
