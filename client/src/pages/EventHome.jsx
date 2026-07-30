import { useEffect, useState } from "react";
import { api } from "../api.js";
import { useTenant } from "../context/TenantContext.jsx";
import { getHijriDate } from "../utils/hijri.js";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import {
  Crown, Sparkles, Bell, ArrowUpRight, Star, Calendar, Award,
  TrendingUp, Plus, Heart, Users, BookOpen, Flame, Moon,
  ChevronRight, Zap, Target
} from "lucide-react";
import Footer from "../components/Footer.jsx";

export default function EventHome() {
  const { activeTenant } = useTenant();
  const { user: authUser } = useAuth();
  const navigate = useNavigate();
  const [leaders, setLeaders] = useState([]);
  const [totalEventCount, setTotalEventCount] = useState(0);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const hijri = getHijriDate();

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) setUser(JSON.parse(savedUser));

    setLoading(true);

    if (activeTenant) {
      api("/counts/leaderboard/today?limit=5")
        .then((res) => setLeaders(res || []))
        .catch((e) => setError(e.message));

      api("/counts/leaderboard/all?limit=100")
        .then((allRows) => {
          if (Array.isArray(allRows)) {
            const sum = allRows.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
            setTotalEventCount(sum);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [activeTenant]);

  const medalEmoji = ['🥇', '🥈', '🥉'];

  if (!activeTenant) return null;

  return (
    <div className="min-h-screen flex flex-col pb-24 md:pb-0" style={{ backgroundColor: '#DDF4E7', color: '#124170' }}>

      {/* ──────── MOBILE APP HEADER ──────── */}
      <header className="sticky top-0 z-30 px-4 pb-3 backdrop-blur-lg md:hidden safe-top safe-bottom" style={{ backgroundColor: 'rgba(221, 244, 231, 0.95)', borderBottom: '1px solid rgba(38, 102, 127, 0.2)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Swalath Portal"
              className="w-11 h-11 rounded-2xl object-cover shadow-md shrink-0"
            />
            <div>
              <h2 className="font-extrabold text-sm leading-tight" style={{ color: '#124170' }}>
                {user ? `${user.name}` : 'Welcome!'}
              </h2>
              <span className="text-[10px] font-semibold flex items-center gap-1" style={{ color: '#26667F' }}>
                <Moon className="w-3 h-3" style={{ color: '#67C090' }} />
                <span>{hijri.formattedMl}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-xs active:scale-95 transition relative"
              style={{ border: '1px solid rgba(38, 102, 127, 0.2)', color: '#124170' }}
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" style={{ color: '#67C090' }} />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2" style={{ backgroundColor: '#67C090', borderColor: '#DDF4E7' }} />
            </button>
          </div>
        </div>
      </header>

      {/* ──────── HERO BANNER CARD ──────── */}
      <section className="px-4 py-2 max-w-xl mx-auto w-full animate-slide-up">
        <div
          className="text-white rounded-[28px] p-5 sm:p-6 shadow-2xl relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #124170, #26667F, #67C090)',
            boxShadow: '0 20px 50px rgba(38, 102, 127, 0.35)',
            border: '1px solid rgba(221, 244, 231, 0.2)'
          }}
        >
          <div className="absolute -top-16 -right-16 w-52 h-52 rounded-full blur-3xl pointer-events-none animate-pulse-glow" style={{ backgroundColor: 'rgba(103, 192, 144, 0.2)' }} />
          <div className="absolute -bottom-16 -left-16 w-52 h-52 rounded-full blur-3xl pointer-events-none animate-pulse-glow" style={{ backgroundColor: 'rgba(221, 244, 231, 0.2)', animationDelay: '1s' }} />
          <div className="absolute top-4 right-6 pointer-events-none" style={{ color: 'rgba(255, 255, 255, 0.15)' }}>
            <Sparkles className="w-24 h-24 animate-float" />
          </div>

          <div className="flex items-center justify-between relative z-10 mb-4">
            <span className="text-[10px] font-extrabold px-3 py-1 bg-white/15 backdrop-blur-md rounded-full border border-white/20 flex items-center gap-1.5 tracking-wide uppercase" style={{ color: '#FFFFFF' }}>
              <Target className="w-3 h-3" style={{ color: '#67C090' }} />
              <span>{activeTenant.name}</span>
            </span>
            <div className="flex items-center gap-1 text-[10px] font-bold bg-black/20 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10" style={{ color: '#DDF4E7' }}>
              <Flame className="w-3 h-3 animate-pulse" style={{ color: '#67C090' }} />
              <span>Live Campaign</span>
            </div>
          </div>

          <div className="space-y-1.5 relative z-10 mb-5">
            <h1 className="text-[22px] sm:text-3xl font-extrabold leading-tight text-white tracking-tight">
              {activeTenant?.branding?.title || 'സ്വലാത്തിലൂടെ ഹബീബിലണയാം'}
            </h1>
            <p className="text-xs font-medium leading-relaxed" style={{ color: '#DDF4E7' }}>
              {activeTenant?.branding?.tagline || 'ദിനേനയുള്ള സ്വലാത്തുകൾ കൃത്യമായി രേഖപ്പെടുത്തൂ'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 relative z-10 mb-4">
            <div className="bg-black/20 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 space-y-1.5">
              <div className="flex items-center gap-1.5">
                <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(103, 192, 144, 0.25)' }}>
                  <Award className="w-4 h-4" style={{ color: '#67C090' }} />
                </div>
                <span className="text-[9px] font-extrabold uppercase tracking-wider leading-tight" style={{ color: '#DDF4E7' }}>
                  Total Salath
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black tracking-tight leading-none animate-count-up" style={{ color: '#FFFFFF' }}>
                {Number(totalEventCount).toLocaleString('en-IN')}
              </div>
              <div className="flex items-center gap-1 text-[9px] font-bold" style={{ color: '#67C090' }}>
                <TrendingUp className="w-3 h-3" />
                <span>Verified Activity</span>
              </div>
            </div>

            <div className="bg-black/20 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 space-y-1.5 flex flex-col justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(103, 192, 144, 0.25)' }}>
                  <Calendar className="w-4 h-4" style={{ color: '#67C090' }} />
                </div>
                <span className="text-[9px] font-extrabold uppercase tracking-wider leading-tight" style={{ color: '#DDF4E7' }}>
                  Hijri Date
                </span>
              </div>
              <div className="text-lg sm:text-xl font-extrabold font-arabic leading-tight" dir="rtl" style={{ color: '#67C090' }}>
                {hijri.formattedAr}
              </div>
              <span className="text-[9px] font-bold" style={{ color: '#DDF4E7' }}>
                {hijri.formattedMl}
              </span>
            </div>
          </div>

          <button
            onClick={() => navigate(user || authUser ? '/counter' : '/signup')}
            className="relative z-10 w-full flex items-center justify-center gap-2 hover:brightness-110 text-sm font-extrabold py-3.5 rounded-2xl shadow-lg transition transform active:scale-[0.97]"
            style={{ backgroundColor: '#67C090', color: '#FFFFFF', border: '1px solid rgba(221, 244, 231, 0.4)', boxShadow: '0 8px 24px rgba(103, 192, 144, 0.4)' }}
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
            <span>Submit Salath</span>
            <ChevronRight className="w-4 h-4 opacity-70" />
          </button>

        </div>
      </section>

      {/* ──────── QUICK ACTION GRID ──────── */}
      <section className="px-4 pt-4 pb-2 max-w-xl mx-auto w-full">
        <div className="grid grid-cols-4 gap-3">
          {[
            { icon: <BookOpen className="w-5 h-5" />, label: 'Dashboard', to: user ? '/dashboard' : '/login' },
            { icon: <Crown className="w-5 h-5" />, label: 'Leaderboard', to: '/dashboard' },
            { icon: <Heart className="w-5 h-5" />, label: 'Counter', to: user ? '/counter' : '/signup' },
            { icon: <Users className="w-5 h-5" />, label: 'Membership', to: '/signup' },
          ].map((item, i) => (
            <Link
              key={i}
              to={item.to}
              className={`flex flex-col items-center gap-2 py-3.5 rounded-2xl bg-white shadow-xs active:scale-95 transition animate-slide-up stagger-${i + 1}`}
              style={{ animationFillMode: 'both', border: '1px solid rgba(38, 102, 127, 0.15)' }}
            >
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm"
                style={{ backgroundColor: '#DDF4E7', color: '#26667F' }}
              >
                {item.icon}
              </div>
              <span className="text-[10px] font-extrabold leading-tight text-center" style={{ color: '#124170' }}>
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ──────── LEADERBOARD SECTION ──────── */}
      <main className="max-w-xl mx-auto px-4 py-3 space-y-5 w-full flex-1">
        <section id="leaderboard" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold flex items-center gap-2" style={{ color: '#124170' }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm" style={{ backgroundColor: '#67C090', color: '#FFFFFF' }}>
                <Crown className="w-4 h-4" />
              </div>
              <span>Today's Top Leaders</span>
            </h2>
            <Link to="/dashboard" className="text-[11px] font-bold flex items-center gap-0.5 hover:underline" style={{ color: '#26667F' }}>
              <span>See All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {error && <div className="p-3 bg-red-50 text-red-700 text-xs rounded-2xl border border-red-200">{error}</div>}

          {loading ? (
            <div className="py-8 text-center space-y-2">
              <div className="w-8 h-8 mx-auto rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#67C090', borderTopColor: 'transparent' }} />
              <p className="text-xs font-medium" style={{ color: '#26667F' }}>Loading...</p>
            </div>
          ) : leaders.length === 0 ? (
            <div className="p-6 bg-white rounded-3xl text-center space-y-2 shadow-xs" style={{ border: '1px solid rgba(38, 102, 127, 0.15)' }}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto" style={{ backgroundColor: '#DDF4E7', color: '#26667F' }}>
                <Zap className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold" style={{ color: '#124170' }}>No entries recorded today yet</p>
              <p className="text-[11px]" style={{ color: '#26667F' }}>Be the first to record your Salath count today!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {leaders.map((row, idx) => (
                <div
                  key={row.userId || idx}
                  className={`bg-white rounded-2xl p-3.5 shadow-xs flex items-center justify-between transition active:scale-[0.98] animate-slide-up stagger-${idx + 1}`}
                  style={{
                    animationFillMode: 'both',
                    border: idx === 0 ? '1.5px solid #67C090' : '1px solid rgba(38, 102, 127, 0.15)',
                    backgroundColor: '#FFFFFF',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center font-extrabold text-sm shrink-0 shadow-xs"
                      style={{
                        backgroundColor: idx === 0 ? '#67C090' : idx < 3 ? '#26667F' : '#DDF4E7',
                        color: idx < 3 ? '#FFFFFF' : '#26667F',
                      }}
                    >
                      {idx < 3 ? medalEmoji[idx] : `#${idx + 1}`}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-xs sm:text-sm leading-tight" style={{ color: '#124170' }}>
                        {row.name}
                      </h3>
                      <div className="flex items-center gap-1 text-[10px] font-semibold mt-0.5" style={{ color: '#26667F' }}>
                        <Star className="w-3 h-3" style={{ color: '#67C090', fill: '#67C090' }} />
                        <span>{idx === 0 ? '🔥 Top Leader' : 'Participant'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="text-right">
                      <span className="font-extrabold text-sm sm:text-base block" style={{ color: '#124170' }}>
                        {Number(row.value).toLocaleString('en-IN')}
                      </span>
                      <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#26667F' }}>Salath</span>
                    </div>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#DDF4E7', color: '#26667F' }}>
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Virtues Section */}
        <section
          className="text-white p-5 sm:p-6 rounded-[28px] space-y-4 shadow-xl relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #124170, #26667F, #67C090)', border: '1px solid rgba(221, 244, 231, 0.2)' }}
        >
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl pointer-events-none" style={{ backgroundColor: 'rgba(103, 192, 144, 0.2)' }} />

          <div className="flex items-center gap-2 relative z-10">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(103, 192, 144, 0.25)' }}>
              <Sparkles className="w-4 h-4" style={{ color: '#67C090' }} />
            </div>
            <span className="text-xs font-extrabold uppercase tracking-wider" style={{ color: '#67C090' }}>സ്വലാത്തിന്റെ വിശുദ്ധി</span>
          </div>

          <div className="space-y-3 pb-4 relative z-10" style={{ borderBottom: '1px solid rgba(221, 244, 231, 0.2)' }}>
            <p className="font-arabic text-right text-lg sm:text-2xl leading-relaxed" dir="rtl" style={{ color: '#67C090' }}>
              إِنَّ اللَّهَ وَمَلَائِكَتَهُ يُصَلُّونَ عَلَى النَّبِيِّ ۚ يَا أَيُّهَا الَّذِينَ آمَنُوا صَلُّوا عَلَيْهِ وَسَلِّمُوا تَسْلِيمًا
            </p>
            <p className="text-[11px] leading-relaxed font-medium" style={{ color: '#DDF4E7' }}>
              "തീർച്ചയായും അല്ലാഹുവും അവന്റെ മലക്കുകളും നബിക്ക് സ്വലാത്ത് ചൊല്ലുന്നു. സത്യവിശ്വാസികളേ, നിങ്ങളും അവിടുത്തേക്ക് സ്വലാത്തും സലാമും ചൊല്ലുക."
            </p>
            <span className="text-[10px] font-bold block" style={{ color: '#67C090' }}>— സൂറത്തുൽ അഹ്‌സാബ് : 56</span>
          </div>

          <ul className="space-y-2.5 text-[11px] font-medium relative z-10" style={{ color: '#DDF4E7' }}>
            <li className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: 'rgba(103, 192, 144, 0.25)' }}>
                <Sparkles className="w-3 h-3" style={{ color: '#67C090' }} />
              </div>
              <span>ഒരു സ്വലാത്ത് ചൊല്ലുമ്പോൾ 10 അനുഗ്രഹങ്ങൾ (റഹ്മത്ത്) ലഭിക്കുന്നു.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: 'rgba(103, 192, 144, 0.25)' }}>
                <Heart className="w-3 h-3" style={{ color: '#67C090' }} />
              </div>
              <span>10 ഉന്നത പദവികൾ ഉയർത്തപ്പെടുകയും 10 പാപങ്ങൾ മായ്ക്കപ്പെടുകയും ചെയ്യുന്നു.</span>
            </li>
          </ul>
        </section>
      </main>

      <Footer />
    </div>
  );
}
