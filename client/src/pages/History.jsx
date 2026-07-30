import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api.js';
import Card from '../components/Card.jsx';
import { Calendar, Trash2, Plus, ArrowLeft, Star, Clock, AlertTriangle, X, History as HistoryIcon } from 'lucide-react';
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
  const [deleteTarget, setDeleteTarget] = useState(null); // Entry to delete
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
    <main className="max-w-xl mx-auto px-4 pt-8 pb-24 md:py-6 space-y-5 font-ml bg-stone-50 min-h-screen">
      
      {/* Top Mobile Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="w-10 h-10 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-700 shadow-xs active:scale-95 transition"
          >
            <ArrowLeft className="w-5 h-5 text-stone-800" />
          </Link>
          <div>
            <h1 className="font-extrabold text-base text-stone-900 leading-tight">
              സമർപ്പണ ചരിത്രം (History)
            </h1>
            <span className="text-[11px] text-stone-500 font-medium">
              തീയതി തിരഞ്ഞെടുത്ത് ദിവസേനയുള്ള എണ്ണം പരിശോധിക്കൂ
            </span>
          </div>
        </div>

        <Link
          to="/dashboard"
          className="w-10 h-10 rounded-full bg-[#00703c] text-white flex items-center justify-center font-bold text-sm shadow-sm active:scale-95 transition"
        >
          <Plus className="w-5 h-5" />
        </Link>
      </div>

      {/* Horizontal Scrollable Calendar Date Bar */}
      <section className="bg-white rounded-3xl p-3 border border-stone-200/90 shadow-sm space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-extrabold text-stone-900 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-[#00703c]" />
            <span>ക്യാലണ്ടർ (Date Selector)</span>
          </span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-[11px] font-bold bg-stone-100 text-stone-900 px-2.5 py-1 rounded-xl border border-stone-200 focus:outline-none"
          />
        </div>

        {/* Scrollable Date Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {calendarDays.map((d) => {
            const isSelected = d.fullDate === selectedDate;
            return (
              <button
                key={d.fullDate}
                onClick={() => setSelectedDate(d.fullDate)}
                className={`flex flex-col items-center justify-center min-w-[44px] h-12 rounded-2xl transition shrink-0 active:scale-95 ${
                  isSelected
                    ? 'bg-[#00703c] text-white font-extrabold shadow-sm'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200 font-bold border border-stone-200/60'
                }`}
              >
                <span className="text-[9px] uppercase opacity-80">{d.dayName}</span>
                <span className="text-xs font-extrabold">{d.dateNum}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Selected Day's Summary Card */}
      <section className="bg-[#00703c] text-white rounded-3xl p-5 shadow-lg shadow-[#00703c]/20 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold px-3.5 py-1 bg-[#157a4a]/80 backdrop-blur-md rounded-full text-[#85e2b4]">
            {selectedDate === todayKey() ? 'ഇന്നത്തെ സംഗ്രഹം' : `${selectedDate} തീയതിയിലെ സംഗ്രഹം`}
          </span>
          <div className="flex items-center gap-1 text-gold-300 text-xs font-bold bg-[#004826] px-3 py-1 rounded-full">
            <Star className="w-3.5 h-3.5 fill-gold-300 text-gold-300" />
            <span>{dayData.entries?.length || 0} രേഖപ്പെടുത്തലുകൾ</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="bg-[#0e8048]/60 p-3 rounded-2xl border border-emerald-600/40">
            <span className="text-[10px] text-[#a3e0bf] font-bold uppercase block">ഈ ദിവസത്തെ ആകെ</span>
            <span className="text-xl font-extrabold text-white tracking-tight">
              {dayData.dayTotal.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="bg-[#0e8048]/60 p-3 rounded-2xl border border-emerald-600/40">
            <span className="text-[10px] text-[#a3e0bf] font-bold uppercase block">ആകെ തുക</span>
            <span className="text-xl font-extrabold text-gold-300 tracking-tight">
              {overallTotal.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </section>

      {/* List of Entries for Selected Date */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs sm:text-sm font-extrabold text-stone-900 flex items-center gap-2">
            <HistoryIcon className="w-4 h-4 text-[#00703c]" />
            <span>{selectedDate} ലെ സ്വലാത്ത് വിവരങ്ങൾ (Entries)</span>
          </h2>
          <span className="text-xs text-stone-500 font-bold">
            {dayData.entries?.length || 0} എണ്ണം
          </span>
        </div>

        {error && <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl">{error}</div>}

        {loading ? (
          <div className="py-6 text-center text-xs text-stone-400">വിവരങ്ങൾ പരിശോധിക്കുന്നു...</div>
        ) : dayData.entries?.length === 0 ? (
          <Card className="!p-6 text-center space-y-2 rounded-3xl border-stone-200">
            <Calendar className="w-8 h-8 text-stone-300 mx-auto" />
            <p className="text-xs font-bold text-stone-700">ഈ ദിവസത്തിൽ സ്വലാത്ത് വിവരങ്ങൾ ഒന്നും ലഭ്യമല്ല.</p>
            <p className="text-[11px] text-stone-500">ഡാഷ്‌ബോർഡിൽ പോയി പുതിയ സ്വലാത്ത് സംഖ്യ ചേർക്കൂ!</p>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 btn-primary py-2 px-4 text-xs font-bold rounded-xl mt-2"
            >
              <Plus className="w-4 h-4" />
              <span>സ്വലാത്ത് ചേർക്കൂ</span>
            </Link>
          </Card>
        ) : (
          <div className="space-y-2.5">
            {dayData.entries.map((item, idx) => {
              const createdTime = new Date(item.createdAt).toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
              });
              return (
                <div
                  key={item._id || idx}
                  className="bg-white rounded-3xl p-4 border border-stone-200/90 shadow-sm flex items-center justify-between hover:border-[#00703c] transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-emerald-50 text-[#00703c] flex items-center justify-center font-bold text-xs border border-emerald-200">
                      <Clock className="w-4 h-4 text-[#00703c]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-stone-900">
                          +{Number(item.value).toLocaleString('en-IN')}
                        </span>
                        {item.note && (
                          <span className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full font-medium">
                            {item.note}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-stone-400 font-medium block mt-0.5">
                        സമയ മുദ്ര: {createdTime}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setDeleteTarget(item)}
                    disabled={deletingId === item._id}
                    className="p-2 text-stone-400 hover:text-red-600 rounded-full hover:bg-red-50 transition"
                    title="നീക്കം ചെയ്യൂ"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Mobile Custom Deletion Confirmation Drawer Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-end justify-center select-none font-ml">
          <div
            className="absolute inset-0 bg-stone-950/60 backdrop-blur-xs animate-fadeIn"
            onClick={() => setDeleteTarget(null)}
          />

          <div className="relative z-10 w-full max-w-lg bg-white rounded-t-3xl p-6 shadow-2xl space-y-4 animate-slide-down border-t border-stone-200">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2 text-red-600">
                <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="font-extrabold text-base text-stone-900">സ്വലാത്ത് എണ്ണം നീക്കം ചെയ്യണോ?</h3>
              </div>
              <button
                onClick={() => setDeleteTarget(null)}
                className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 hover:text-stone-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-600 font-medium leading-relaxed">
              തിരഞ്ഞെടുത്ത <strong className="text-stone-900 font-extrabold">(+{Number(deleteTarget.value).toLocaleString('en-IN')})</strong> സ്വലാത്ത് വിവരങ്ങൾ പോർട്ടലിൽ നിന്ന് നീക്കം ചെയ്യപ്പെടും.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="py-3 px-4 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition border border-stone-200"
              >
                റദ്ദാക്കുക (Cancel)
              </button>

              <button
                onClick={confirmDelete}
                className="py-3 px-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold transition shadow-sm active:scale-95"
              >
                അതെ, നീക്കം ചെയ്യൂ
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
