import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useTenant } from '../context/TenantContext.jsx';
import { api } from '../api.js';
import { incrementCachedTotalSwalath } from '../utils/swalathCache.js';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { useNavigate } from 'react-router-dom';
import { Save, History, Calendar, Bell, ArrowLeft, CheckCircle2, AlertCircle, Sparkles, X } from 'lucide-react';
import { salathCountSchema } from '../schemas/validationSchemas.js';

function todayKey() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

export default function AddCount() {
    const { token, user } = useAuth();
    const { activeTenant } = useTenant();
    const navigate = useNavigate();
    const [value, setValue] = useState('');
    const [items, setItems] = useState([]);
    const [selectedDate, setSelectedDate] = useState(todayKey());
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [loading, setLoading] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

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

    const load = () =>
        api('/counts/me', { token })
            .then(setItems)
            .catch((e) => setError(e.message));

    useEffect(() => {
        load();
    }, []);

    useEffect(() => {
        if (!successMsg) return;
        const timer = setTimeout(() => {
            setSuccessMsg('');
        }, 1800);
        return () => clearTimeout(timer);
    }, [successMsg]);

    const submit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');

        if (!value || !String(value).trim()) {
            setError('Please enter a Swalath count number');
            return;
        }

        const num = Number(value);

        // Zod schema validation
        const validationResult = salathCountSchema.safeParse({ value: num });
        if (!validationResult.success) {
            setError(validationResult.error.errors[0].message);
            return;
        }

        const todayEntries = items.filter((it) => it.date === todayKey());
        const currentTodayTotal = todayEntries.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
        if (currentTodayTotal + num > 100000) {
            const remaining = Math.max(0, 100000 - currentTodayTotal);
            setError(`Daily total limit of 100,000 (1 Lakh) reached! You recorded ${currentTodayTotal.toLocaleString('en-IN')} today (Remaining: ${remaining.toLocaleString('en-IN')}).`);
            return;
        }

        setLoading(true);
        try {
            await api('/counts/me/today', { method: 'POST', token, body: { value: num, date: selectedDate } });
            incrementCachedTotalSwalath(activeTenant, num);
            setSuccessMsg(`+${num.toLocaleString('en-IN')} Swalath recorded successfully!`);
            setValue('');
            await load();
        } catch (e) {
            setError(e.message || 'Swalath count submission failed.');
        } finally {
            setLoading(false);
        }
    };

    const totalCountSum = items.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
    const selectedDateItems = items.filter((it) => it.date === selectedDate);
    const selectedDateSum = selectedDateItems.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
    const isTodaySelected = selectedDate === todayKey();

    return (
        <main className="max-w-xl mx-auto px-4 safe-top pb-16 md:py-6 space-y-4 font-sans min-h-screen animate-slide-up">
            {/* Top Navigation Header */}
            <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => navigate(-1)}
                        className="rounded-full border-primary/30"
                    >
                        <ArrowLeft className="w-5 h-5 text-foreground" />
                    </Button>
                    <div>
                        <h1 className="font-extrabold text-base leading-tight text-foreground">
                            Record Swalath
                        </h1>
                        <span className="text-[11px] font-medium text-muted-foreground">
                            {user?.name || 'Campaign Member'}
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

            {/* ──────── HERO HIGHLIGHT: Main Record Swalath Card ──────── */}
            <section className="text-white rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden bg-gradient-to-br from-[#296E37] via-[#468B3A] to-[#7EC242] border border-white/20 space-y-3.5">
                {/* Ambient Blur Glows */}
                <div className="absolute -top-16 -right-16 w-52 h-52 rounded-full blur-3xl pointer-events-none bg-[#D4AF37]/20" />
                <div className="absolute -bottom-16 -left-16 w-52 h-52 rounded-full blur-3xl pointer-events-none bg-primary/20" />

                {/* Top Row: Mode Badge & Simplified Date Selector */}
                <div className="flex items-center justify-between relative z-10 gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 bg-black/25 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-extrabold text-[#F5E6B3] border border-white/15">
                        <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>സ്വലാത്ത് രേഖപ്പെടുത്തുക</span>
                    </div>

                    {/* Integrated Simple Date Picker */}
                    <div className="flex items-center gap-1.5 bg-black/25 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/15">
                        <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer [color-scheme:dark]"
                        />
                        {!isTodaySelected && (
                            <button
                                type="button"
                                onClick={() => setSelectedDate(todayKey())}
                                className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-[#FFF449] text-[#07351F] hover:brightness-105 transition"
                            >
                                Today
                            </button>
                        )}
                    </div>
                </div>

                {/* Main Form Area */}
                <form onSubmit={submit} className="space-y-3 relative z-10" noValidate>
                    {error && (
                        <div className="bg-white/95 backdrop-blur-md text-red-700 border border-white/60 rounded-xl px-3 py-2 shadow-xs flex items-center gap-2 animate-slide-down">
                            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                            <span className="text-xs font-bold leading-snug">{error}</span>
                        </div>
                    )}
                    {successMsg && (
                        <div className="bg-white/95 backdrop-blur-md text-[#0B3D19] border border-white/60 rounded-xl px-3 py-2 shadow-xs flex items-center gap-2 animate-slide-down">
                            <CheckCircle2 className="w-4 h-4 text-[#296E37] shrink-0" />
                            <span className="text-xs font-bold">{successMsg}</span>
                        </div>
                    )}

                    {/* Highlighted Large Count Input Container (Light) */}
                    <div className="bg-white/95 backdrop-blur-md rounded-xl p-3.5 sm:p-4 border border-white/80 text-center space-y-1.5 shadow-lg">
                        <label className="text-xs font-extrabold tracking-wider uppercase text-[#1B5E20] flex items-center justify-center gap-1.5">
                            <span>Enter Swalath Count (എണ്ണം)</span>
                        </label>
                        <Input
                            type="number"
                            maxLength={6}
                            placeholder="0"
                            value={value}
                            onInput={(e) => {
                                if (e.target.value.length > 6) {
                                    e.target.value = e.target.value.slice(0, 6);
                                }
                            }}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (error) setError('');
                                if (val.length <= 6) setValue(val);
                            }}
                            autoFocus
                            className="text-4xl sm:text-5xl font-black text-center tracking-tight h-15 bg-white text-[#0B3D19] placeholder:text-[#296E37]/25 rounded-xl border-0 focus-visible:ring-1 focus-visible:ring-[#296E37]/40 focus-visible:outline-none font-mono shadow-inner"
                        />
                    </div>

                    {/* Prominent Golden Action Button */}
                    <Button
                        type="submit"
                        disabled={loading || !value}
                        className="w-full text-sm font-extrabold h-11 sm:h-12 rounded-xl shadow-lg border border-[#F5E6B3]/60 bg-[#FFF449] text-[#07351F] hover:bg-[#FFDE42] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                        <Save className="w-4.5 h-4.5 stroke-[2.5]" />
                        <span>{loading ? 'Saving...' : 'Save Swalath Count'}</span>
                    </Button>
                </form>

                {/* Dual Stats Row: Clean White Text Only */}
                <div className="grid grid-cols-2 gap-3 pt-2.5 border-t border-white/15 relative z-10">
                    <div className="text-center">
                        <span className="text-[10px] sm:text-[11px] uppercase font-bold text-white/80 block tracking-wider mb-0.5">
                            {isTodaySelected ? "Today's Count" : "Selected Date"}
                        </span>
                        <span className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight block">
                            {selectedDateSum.toLocaleString('en-IN')}
                        </span>
                    </div>

                    <div className="text-center border-l border-white/15">
                        <span className="text-[10px] sm:text-[11px] uppercase font-bold text-white/80 block tracking-wider mb-0.5">
                            Total Count
                        </span>
                        <span className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight block">
                            {totalCountSum.toLocaleString('en-IN')}
                        </span>
                    </div>
                </div>
            </section>

            {/* ──────── HISTORY LIST: Selected Date Entries ──────── */}
            <section className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                    <h2 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 text-muted-foreground">
                        <History className="w-4 h-4 text-primary" />
                        <span>Swalath History ({selectedDate})</span>
                    </h2>
                    <span className="text-[10px] font-bold text-muted-foreground">
                        {selectedDateItems.length} {selectedDateItems.length === 1 ? 'Entry' : 'Entries'}
                    </span>
                </div>

                {selectedDateItems.length === 0 ? (
                    <Card className="rounded-xl">
                        <CardContent className="p-6 text-center text-xs font-medium space-y-1">
                            <p className="font-bold text-foreground">No entries recorded for {selectedDate}.</p>
                            <p className="text-muted-foreground">Enter your count above and press Save.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-2">
                        {selectedDateItems.map((item) => (
                            <div
                                key={item._id}
                                className="p-3.5 rounded-xl flex items-center justify-between bg-card transition border border-border shadow-xs"
                            >
                                <div>
                                    <span className="text-xs font-extrabold block text-foreground">{item.date}</span>
                                    <span className="text-[10px] font-medium text-muted-foreground">
                                        {item.date === todayKey() ? 'Recorded Today' : 'Recorded Count'}
                                    </span>
                                </div>
                                <div className="text-right flex items-center gap-2">
                                    <span className="text-base font-black text-primary font-mono">
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
