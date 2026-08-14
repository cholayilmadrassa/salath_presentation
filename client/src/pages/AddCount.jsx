import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api.js';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { Save, History, Plus, Star, Calendar, Bell } from 'lucide-react';
import { salathCountSchema } from '../schemas/validationSchemas.js';

function todayKey() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getCalendarDays() {
    const days = [];
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

export default function AddCount() {
    const { token, user } = useAuth();
    const navigate = useNavigate();
    const [value, setValue] = useState('');
    const [items, setItems] = useState([]);
    const [calendarDays] = useState(getCalendarDays());
    const [selectedDate, setSelectedDate] = useState(todayKey());
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [loading, setLoading] = useState(false);
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

    useEffect(() => {
        if (activeDateRef.current) {
            activeDateRef.current.scrollIntoView({
                behavior: 'smooth',
                inline: 'center',
                block: 'nearest',
            });
        }
    }, [selectedDate]);

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
            await api('/counts/me/today', { method: 'POST', token, body: { value: num } });
            setSuccessMsg(`Successfully added +${num.toLocaleString('en-IN')} Swalath count for today!`);
            setValue('');
            setSelectedDate(todayKey());
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
    const uniqueDaysCount = new Set(items.map((it) => it.date)).size;
    const isTodaySelected = selectedDate === todayKey();

    return (
        <main className="max-w-xl mx-auto px-4 safe-top pb-16 md:py-6 space-y-5 font-sans min-h-screen">
            {/* Mobile Top App Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <img
                        src="/appLogo.png"
                        alt="Swalath Portal"
                        className="w-10 h-10 rounded-full object-cover shadow-sm shrink-0 border border-primary/20"
                    />
                    <div>
                        <h1 className="font-extrabold text-sm leading-tight text-foreground">
                            Welcome, {user?.name}
                        </h1>
                        <span className="text-[11px] font-medium text-muted-foreground">
                            Date: {selectedDate}
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

            {/* Date Picker Selector Bar */}
            <Card>
                <CardContent className="p-3 space-y-2">
                    <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2 text-foreground">
                            <Calendar className="w-4 h-4 text-primary" />
                            <span className="text-xs font-extrabold">Date Selector</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="text-[11px] font-bold px-2.5 py-1 rounded-xl border border-input bg-muted/10 text-foreground focus:outline-none"
                            />
                            {!isTodaySelected && (
                                <Button
                                    size="sm"
                                    onClick={() => setSelectedDate(todayKey())}
                                    className="h-7 text-[10px] px-2.5 rounded-lg font-bold"
                                >
                                    Today
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Scrollable Date Pills with Auto-centered Active Date */}
                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
                        {calendarDays.map((d) => {
                            const isSelected = d.fullDate === selectedDate;
                            return (
                                <button
                                    key={d.fullDate}
                                    ref={isSelected ? activeDateRef : null}
                                    onClick={() => setSelectedDate(d.fullDate)}
                                    className={`flex flex-col items-center justify-center min-w-[44px] h-11 rounded-xl transition shrink-0 active:scale-95 ${isSelected
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

            {/* Featured Summary Card for Selected Date */}
            <section className="text-white rounded-2xl p-5 shadow-lg space-y-4 bg-gradient-to-br from-[#296E37] via-[#468B3A] to-[#7EC242] border border-white/20">
                <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold px-3.5 py-1 bg-black/25 backdrop-blur-md rounded-full text-[#F5E6B3]">
                        {isTodaySelected ? "Today's Summary" : `Date: ${selectedDate}`}
                    </span>
                    <div className="flex items-center gap-1 text-xs font-bold bg-black/25 px-3 py-1 rounded-full text-[#D4AF37]">
                        <Star className="w-3.5 h-3.5 fill-[#D4AF37]" />
                        <span>{uniqueDaysCount} Days Active</span>
                    </div>
                </div>

                {/* Dual Stats Display: Selected Date Count & Overall Total */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="bg-black/25 p-3 rounded-xl border border-white/15">
                        <span className="text-[10px] font-bold uppercase tracking-wider block text-[#E6F4ED]">
                            {isTodaySelected ? "Today's Count" : 'Selected Date Count'}
                        </span>
                        <span className="text-xl font-extrabold text-white tracking-tight">
                            {selectedDateSum.toLocaleString('en-IN')}
                        </span>
                    </div>

                    <div className="bg-black/25 p-3 rounded-xl border border-white/15">
                        <span className="text-[10px] font-bold uppercase tracking-wider block text-[#E6F4ED]">Total Count</span>
                        <span className="text-xl font-extrabold tracking-tight text-[#D4AF37]">
                            {totalCountSum.toLocaleString('en-IN')}
                        </span>
                    </div>
                </div>
            </section>

            {/* Quick Add SwalathForm */}
            <Card>
                <CardContent className="p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                        <h2 className="text-sm font-extrabold flex items-center gap-2 text-foreground">
                            <div className="w-7 h-7 rounded-xl flex items-center justify-center bg-primary/15 text-primary">
                                <Plus className="w-4 h-4" />
                            </div>
                            <span>Record Swalath Count</span>
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
                                Enter Swalath Count:
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
                                        className="h-9 font-extrabold"
                                    >
                                        +{amt}
                                    </Button>
                                ))}
                            </div>

                            <div className="relative space-y-1.5">
                                <Input
                                    type="number"
                                    maxLength="6"
                                    placeholder="e.g. 1000"
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
                                    className={`text-xl font-extrabold text-center tracking-wide h-14 ${error ? 'border-2 border-red-500 bg-red-50/20' : ''}`}
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full text-sm font-black"
                        >
                            <Save className="w-4.5 h-4.5 mr-2" />
                            <span>{loading ? 'Saving...' : 'Save Count'}</span>
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* History List for User */}
            {/* History List for User - Selected Date Only */}
            <section className="space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 text-muted-foreground">
                        <History className="w-4 h-4" />
                        <span>Swalath Count History ({selectedDate})</span>
                    </h2>
                    <span className="text-[10px] font-bold text-muted-foreground">
                        {selectedDateItems.length} {selectedDateItems.length === 1 ? 'Entry' : 'Entries'}
                    </span>
                </div>

                {selectedDateItems.length === 0 ? (
                    <Card>
                        <CardContent className="p-6 text-center text-xs font-medium space-y-1">
                            <p className="font-bold text-foreground">No entries recorded for {selectedDate}.</p>
                            <p className="text-muted-foreground">Select another date or enter your Swalath count above to record.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-2">
                        {selectedDateItems.map((item) => (
                            <div
                                key={item._id}
                                className="p-3.5 rounded-xl flex items-center justify-between bg-card transition border border-primary ring-1 ring-primary/30"
                            >
                                <div>
                                    <span className="text-xs font-extrabold block text-foreground">{item.date}</span>
                                    <span className="text-[10px] font-medium text-muted-foreground">
                                        {item.date === todayKey() ? 'Recorded Today' : 'Recorded Count'}
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
