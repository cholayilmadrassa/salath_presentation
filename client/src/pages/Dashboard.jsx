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
      if (Number.isNaN(num) || num <= 0) throw new Error('ദയവായി സാധുവായ ഒരു സംഖ്യ രേഖപ്പെടുത്തുക');
      await api('/counts/me/today', { method: 'POST', token, body: { value: num } });
      setSuccessMsg(`ഇന്നത്തെ കണക്കിലേക്ക് +${num.toLocaleString('en-IN')} സ്വലാത്ത് വിജയകരമായി കൂട്ടിച്ചേർത്തു!`);
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
    <main className="max-w-xl mx-auto px-4 safe-top pb-20 md:py-6 space-y-5 font-ml bg-stone-50 min-h-screen">
      
      {/* Mobile Top App Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#00703c] text-white flex items-center justify-center font-bold text-base shadow-sm border border-emerald-600">
            ☪
          </div>
          <div>
            <h1 className="font-extrabold text-sm text-stone-900 leading-tight">
              അസ്സലാമു അലൈകും, {user?.name}
            </h1>
            <span className="text-[11px] text-stone-500 font-medium">
              തീയതി: {selectedDate}
            </span>
          </div>
        </div>

        <button
          className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-[#00703c] shadow-xs active:scale-95 transition"
          aria-label="Notifications"
        >
          <Bell className="w-4.5 h-4.5" />
        </button>
      </div>

      {/* Date Picker Selector Bar */}
      <section className="bg-white rounded-2xl p-3 border border-stone-200/90 shadow-sm flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-stone-700">
          <Calendar className="w-4 h-4 text-[#00703c]" />
          <span className="text-xs font-bold">തീയതി തിരഞ്ഞെടുക്കൂ:</span>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-xs font-bold bg-stone-100 text-stone-900 px-3 py-1.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#00703c]"
          />
          {!isTodaySelected && (
            <button
              onClick={() => setSelectedDate(todayKey())}
              className="text-[10px] font-bold px-2.5 py-1.5 bg-emerald-50 text-[#00703c] rounded-xl border border-emerald-200 hover:bg-emerald-100 transition"
            >
              ഇന്ന്
            </button>
          )}
        </div>
      </section>

      {/* Featured Green Summary Card for Selected Date */}
      <section className="bg-[#00703c] text-white rounded-3xl p-5 shadow-lg shadow-[#00703c]/20 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold px-3.5 py-1 bg-[#157a4a]/80 backdrop-blur-md rounded-full text-[#85e2b4]">
            {isTodaySelected ? 'ഇന്നത്തെ സംഗ്രഹം' : `${selectedDate} ലെ വിവരങ്ങൾ`}
          </span>
          <div className="flex items-center gap-1 text-gold-300 text-xs font-bold bg-[#004826] px-3 py-1 rounded-full">
            <Star className="w-3.5 h-3.5 fill-gold-300 text-gold-300" />
            <span>{items.length} ദിനങ്ങൾ</span>
          </div>
        </div>

        {/* Dual Stats Display: Selected Date Count & Overall Total */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="bg-[#0e8048]/60 p-3 rounded-2xl border border-emerald-600/40">
            <span className="text-[10px] text-[#a3e0bf] font-bold uppercase tracking-wider block">
              {isTodaySelected ? 'ഇന്നത്തെ എണ്ണം' : 'ആ ദിവസത്തെ എണ്ണം'}
            </span>
            <span className="text-xl font-extrabold text-white tracking-tight">
              {selectedDateSum.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="bg-[#0e8048]/60 p-3 rounded-2xl border border-emerald-600/40">
            <span className="text-[10px] text-[#a3e0bf] font-bold uppercase tracking-wider block">ആകെ തുക</span>
            <span className="text-xl font-extrabold text-gold-300 tracking-tight">
              {totalCountSum.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </section>

      {/* Count Entry Form Card (Multiple Submissions Allowed Daily) */}
      <Card className="!p-5 border-stone-200/90 shadow-touch space-y-4 rounded-3xl">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div>
            <h2 className="text-xs sm:text-sm font-extrabold text-stone-900 flex items-center gap-2">
              <Save className="w-4 h-4 text-[#00703c]" />
              <span>ഇന്നത്തെ സ്വലാത്ത് ചേർക്കൂ</span>
            </h2>
            <p className="text-[10px] text-stone-500 font-medium mt-0.5">
              ഒരു ദിവസം എത്ര തവണ വേണമെങ്കിലും കൂടുതൽ സംഖ്യ കൂട്ടിച്ചേർക്കാം.
            </p>
          </div>
          {selectedDateSum > 0 && (
            <span className="text-[10px] font-bold px-2.5 py-1 bg-emerald-50 text-[#00703c] border border-emerald-200 rounded-full flex items-center gap-1 shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#00703c]" />
              <span>{selectedDateSum.toLocaleString('en-IN')}</span>
            </span>
          )}
        </div>

        {error && <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-semibold">{error}</div>}
        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 text-[#00703c] text-xs font-semibold flex items-center gap-2 border border-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-[#00703c] shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-600 mb-1.5">
              വേഗത്തിൽ സംഖ്യ കൂട്ടിച്ചേർക്കാൻ:
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[100, 500, 1000, 5000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => addQuickCount(amt)}
                  className="py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 text-xs font-bold text-[#00703c] flex items-center justify-center gap-0.5 active:scale-95 transition"
                >
                  <Plus className="w-3 h-3 text-[#00703c]" />
                  <span>{amt}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-800">
              ചേർക്കേണ്ട എണ്ണം (Count to Add):
            </label>
            <div className="flex gap-2">
              <input
                className="input text-base font-bold rounded-2xl"
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                min="1"
                placeholder="എണ്ണം നൽകുക"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                required
              />
              <button
                className="btn-gold py-3 px-6 text-xs font-bold shrink-0 rounded-2xl"
                disabled={loading}
              >
                {loading ? '...' : 'കൂട്ടിച്ചേർക്കൂ'}
              </button>
            </div>
          </div>
        </form>
      </Card>

      {/* Interactive Daily History List Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-stone-900 flex items-center gap-2">
            <History className="w-4 h-4 text-[#00703c]" />
            <span>ദിവസേനയുള്ള സമർപ്പണ ചരിത്രം (Daily History)</span>
          </h2>
          <span className="text-xs text-stone-500 font-bold">{items.length} ദിനങ്ങൾ</span>
        </div>

        <div className="space-y-2">
          {items.length === 0 ? (
            <div className="p-5 bg-white rounded-3xl border border-stone-200 text-center text-xs text-stone-400">
              ഇതുവരെ സമർപ്പണം നടത്തിയിട്ടില്ല.
            </div>
          ) : (
            items.map((it) => {
              const isSelected = it.date === selectedDate;
              return (
                <div
                  key={it._id || it.date}
                  onClick={() => setSelectedDate(it.date)}
                  className={`rounded-3xl p-3.5 border transition cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-[#f0f9f4] border-[#00703c] shadow-sm'
                      : 'bg-white border-stone-200/90 hover:border-emerald-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs border ${
                      isSelected
                        ? 'bg-[#00703c] text-white border-[#00703c]'
                        : 'bg-emerald-50 text-[#00703c] border-emerald-200/80'
                    }`}>
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-extrabold text-stone-900 block">{it.date}</span>
                      <span className="text-[10px] text-stone-500 font-medium">
                        {it.date === todayKey() ? 'ഇന്നത്തെ ദിനം' : 'മുൻ ദിനം'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="font-extrabold text-base text-[#00703c] block">
                        {Number(it.value).toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-stone-400 font-medium">സ്വലാത്ത് എണ്ണം</span>
                    </div>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                      isSelected ? 'bg-[#00703c] text-[#ffffff]' : 'bg-stone-100 text-stone-500'
                    }`}>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

    </main>
  );
}
