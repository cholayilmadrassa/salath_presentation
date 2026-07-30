import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api.js';
import Card from '../components/Card.jsx';
import { Save, CheckCircle2, History, Plus, Bell, Star, ArrowUpRight, Calendar } from 'lucide-react';

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
    const current = Number(value) || 0;
    setValue(String(current + amount));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);
    try {
      const num = Number(value);
      if (Number.isNaN(num) || num <= 0) throw new Error('Please enter a valid number');
      await api('/counts/me/today', { method: 'POST', token, body: { value: num } });
      setSuccessMsg(`Successfully added +${num.toLocaleString('en-IN')} Salath count for today!`);
      setValue('');
      setSelectedDate(todayKey());
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const totalCountSum = items.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
  const selectedEntry = items.find((it) => it.date === selectedDate);
  const selectedDateSum = selectedEntry ? Number(selectedEntry.value) : 0;
  const isTodaySelected = selectedDate === todayKey();

  return (
    <main className="max-w-xl mx-auto px-4 safe-top pb-20 md:py-6 space-y-5 font-ml min-h-screen" style={{ backgroundColor: '#DDF4E7', color: '#124170' }}>
      
      {/* Mobile Top App Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full text-white flex items-center justify-center font-bold text-base shadow-sm" style={{ backgroundColor: '#67C090' }}>
            ☪
          </div>
          <div>
            <h1 className="font-extrabold text-sm leading-tight" style={{ color: '#124170' }}>
              Welcome, {user?.name}
            </h1>
            <span className="text-[11px] font-medium" style={{ color: '#26667F' }}>
              Date: {selectedDate}
            </span>
          </div>
        </div>

        <button
          className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-xs active:scale-95 transition"
          style={{ border: '1px solid rgba(38, 102, 127, 0.2)', color: '#26667F' }}
          aria-label="Notifications"
        >
          <Bell className="w-4.5 h-4.5" style={{ color: '#67C090' }} />
        </button>
      </div>

      {/* Date Picker Selector Bar */}
      <section className="bg-white rounded-2xl p-3 shadow-sm flex items-center justify-between gap-3" style={{ border: '1px solid rgba(38, 102, 127, 0.15)' }}>
        <div className="flex items-center gap-2" style={{ color: '#124170' }}>
          <Calendar className="w-4 h-4" style={{ color: '#67C090' }} />
          <span className="text-xs font-bold">Select Date:</span>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-xs font-bold px-3 py-1.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#67C090]"
            style={{ backgroundColor: '#DDF4E7', color: '#124170', borderColor: 'rgba(38, 102, 127, 0.2)' }}
          />
          {!isTodaySelected && (
            <button
              onClick={() => setSelectedDate(todayKey())}
              className="text-[10px] font-bold px-2.5 py-1.5 text-white rounded-xl shadow-xs transition active:scale-95"
              style={{ backgroundColor: '#67C090' }}
            >
              Today
            </button>
          )}
        </div>
      </section>

      {/* Featured Summary Card for Selected Date */}
      <section className="text-white rounded-3xl p-5 shadow-lg space-y-4" style={{ background: 'linear-gradient(135deg, #124170, #26667F, #67C090)', boxShadow: '0 12px 30px rgba(38, 102, 127, 0.35)' }}>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold px-3.5 py-1 bg-black/20 backdrop-blur-md rounded-full" style={{ color: '#DDF4E7' }}>
            {isTodaySelected ? "Today's Summary" : `Date: ${selectedDate}`}
          </span>
          <div className="flex items-center gap-1 text-xs font-bold bg-black/20 px-3 py-1 rounded-full" style={{ color: '#67C090' }}>
            <Star className="w-3.5 h-3.5 fill-[#67C090]" />
            <span>{items.length} Days Active</span>
          </div>
        </div>

        {/* Dual Stats Display: Selected Date Count & Overall Total */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="bg-black/20 p-3 rounded-2xl border border-white/10">
            <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: '#DDF4E7' }}>
              {isTodaySelected ? "Today's Count" : 'Selected Date Count'}
            </span>
            <span className="text-xl font-extrabold text-white tracking-tight">
              {selectedDateSum.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="bg-black/20 p-3 rounded-2xl border border-white/10">
            <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: '#DDF4E7' }}>Total Count</span>
            <span className="text-xl font-extrabold tracking-tight" style={{ color: '#67C090' }}>
              {totalCountSum.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </section>

      {/* Quick Add Salath Form */}
      <Card className="p-5 bg-white space-y-4 shadow-sm" style={{ border: '1px solid rgba(38, 102, 127, 0.15)' }}>
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <h2 className="text-sm font-extrabold flex items-center gap-2" style={{ color: '#124170' }}>
            <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#DDF4E7', color: '#26667F' }}>
              <Plus className="w-4 h-4" />
            </div>
            <span>Record Salath Count</span>
          </h2>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#DDF4E7', color: '#26667F' }}>
            Quick Add
          </span>
        </div>

        {error && <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl font-bold">{error}</div>}
        {successMsg && (
          <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" style={{ color: '#67C090' }} />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs font-extrabold block mb-1.5" style={{ color: '#124170' }}>
              Enter Salath Count:
            </label>

            {/* Fast Preset Increment Chips */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              {[10, 50, 100, 500].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => addQuickCount(amt)}
                  className="py-2 rounded-xl text-xs font-bold transition active:scale-95 shadow-2xs"
                  style={{ backgroundColor: 'rgba(38, 102, 127, 0.12)', color: '#26667F', border: '1px solid rgba(38, 102, 127, 0.2)' }}
                >
                  +{amt}
                </button>
              ))}
            </div>

            <div className="relative">
              <input
                type="number"
                min="1"
                placeholder="e.g. 100"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full px-4 py-3.5 rounded-2xl text-lg font-bold transition"
                style={{ backgroundColor: '#DDF4E7', color: '#124170', border: '1.5px solid rgba(38, 102, 127, 0.2)' }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !value}
            className="w-full py-4 text-white text-sm font-extrabold rounded-2xl shadow-md transition active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ backgroundColor: '#67C090' }}
          >
            <Save className="w-4.5 h-4.5" />
            <span>{loading ? 'Saving...' : 'Save Count'}</span>
          </button>
        </form>
      </Card>

      {/* History List for User */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5" style={{ color: '#26667F' }}>
            <History className="w-4 h-4" />
            <span>Salath Count History</span>
          </h2>
          <span className="text-[10px] font-bold" style={{ color: '#26667F' }}>Total {items.length} Entries</span>
        </div>

        {items.length === 0 ? (
          <div className="bg-white p-6 rounded-2xl text-center text-xs font-medium space-y-1 shadow-sm" style={{ border: '1px solid rgba(38, 102, 127, 0.15)', color: '#26667F' }}>
            <p className="font-bold" style={{ color: '#124170' }}>No entries recorded yet.</p>
            <p>Enter your Salath count above and click Save Count.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item._id}
                className="bg-white p-3.5 rounded-2xl flex items-center justify-between shadow-xs transition"
                style={{
                  border: item.date === selectedDate ? '1.5px solid #67C090' : '1px solid rgba(38, 102, 127, 0.15)',
                }}
              >
                <div>
                  <span className="text-xs font-extrabold block" style={{ color: '#124170' }}>{item.date}</span>
                  <span className="text-[10px] font-medium" style={{ color: '#26667F' }}>
                    {item.date === todayKey() ? 'Recorded Today' : 'Entry Recorded'}
                  </span>
                </div>
                <div className="text-right flex items-center gap-2">
                  <span className="text-base font-extrabold" style={{ color: '#67C090' }}>
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
