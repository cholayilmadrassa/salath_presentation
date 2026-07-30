import { useEffect, useState } from "react";
import { api } from "../api.js";
import { useTenant } from "../context/TenantContext.jsx";
import { getHijriDate } from "../utils/hijri.js";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import {
  Crown, Sparkles, Bell, ArrowUpRight, Star, Calendar, Award,
  TrendingUp, Plus, Heart, Users, BookOpen, Flame, Moon,
  ChevronRight, Zap, Target, Globe, ShieldCheck, CheckCircle2, ArrowRight, Building2
} from "lucide-react";
import Footer from "../components/Footer.jsx";

export default function Landing() {
  const { activeTenant } = useTenant();
  const { user: authUser } = useAuth();
  const navigate = useNavigate();
  const [leaders, setLeaders] = useState([]);
  const [totalEventCount, setTotalEventCount] = useState(0);
  const [totalMembers, setTotalMembers] = useState(0);
  const [approvedEvents, setApprovedEvents] = useState([]);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const hijri = getHijriDate();

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) setUser(JSON.parse(savedUser));

    setLoading(true);

    if (activeTenant) {
      // Event-specific data fetch
      api("/counts/leaderboard/today?limit=5")
        .then((res) => setLeaders(res || []))
        .catch((e) => setError(e.message));

      api("/counts/leaderboard/all?limit=100")
        .then((allRows) => {
          if (Array.isArray(allRows)) {
            const sum = allRows.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
            setTotalEventCount(sum);
            setTotalMembers(allRows.length);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      // Platform marketing page data fetch (Approved Events & Platform-wide counts)
      api('/events/public-approved')
        .then((res) => {
          if (Array.isArray(res)) setApprovedEvents(res);
        })
        .catch(() => {});

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

  // ----------------------------------------------------
  // 1. EVENT HOME PAGE (When accessing an event subdomain)
  // ----------------------------------------------------
  if (activeTenant) {
    return (
      <div className="min-h-screen flex flex-col pb-24 md:pb-0" style={{ backgroundColor: '#F7F5EC', color: '#1A1A1A' }}>

        {/* ──────── MOBILE APP HEADER ──────── */}
        <header className="sticky top-0 z-30 px-4 pt-6 pb-3 backdrop-blur-lg md:hidden safe-bottom" style={{ backgroundColor: 'rgba(247, 245, 236, 0.95)', borderBottom: '1px solid #E8EDE2' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl text-white flex items-center justify-center text-lg shadow-md shrink-0 font-bold" style={{ backgroundColor: '#6E9B37' }}>
                ☪
              </div>
              <div>
                <h2 className="font-extrabold text-sm leading-tight font-sora" style={{ color: '#1A1A1A' }}>
                  {user ? `${user.name}` : 'അസ്സലാമു അലൈകും!'}
                </h2>
                <span className="text-[10px] font-semibold flex items-center gap-1" style={{ color: '#8C8C8C' }}>
                  <Moon className="w-3 h-3" style={{ color: '#FFC107' }} />
                  <span>{hijri.formattedMl}</span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-xs active:scale-95 transition relative"
                style={{ border: '1px solid #E8EDE2', color: '#1A1A1A' }}
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" style={{ color: '#6E9B37' }} />
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2" style={{ backgroundColor: '#FFC107', borderColor: '#F7F5EC' }} />
              </button>
            </div>
          </div>
        </header>

        {/* ──────── HERO BANNER CARD ──────── */}
        <section className="px-4 py-2 max-w-xl mx-auto w-full animate-slide-up">
          <div
            className="text-white rounded-[28px] p-5 sm:p-6 shadow-2xl relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #5c852e, #6E9B37, #4e7225)',
              boxShadow: '0 20px 50px rgba(110, 155, 55, 0.28)',
              border: '1px solid rgba(232, 237, 226, 0.2)'
            }}
          >
            <div className="absolute -top-16 -right-16 w-52 h-52 rounded-full blur-3xl pointer-events-none animate-pulse-glow" style={{ backgroundColor: 'rgba(255, 193, 7, 0.12)' }} />
            <div className="absolute -bottom-16 -left-16 w-52 h-52 rounded-full blur-3xl pointer-events-none animate-pulse-glow" style={{ backgroundColor: 'rgba(232, 237, 226, 0.15)', animationDelay: '1s' }} />
            <div className="absolute top-4 right-6 pointer-events-none" style={{ color: 'rgba(255, 193, 7, 0.15)' }}>
              <Sparkles className="w-24 h-24 animate-float" />
            </div>

            <div className="flex items-center justify-between relative z-10 mb-4">
              <span className="text-[10px] font-extrabold px-3 py-1 bg-white/15 backdrop-blur-md rounded-full border border-white/20 flex items-center gap-1.5 tracking-wide uppercase" style={{ color: '#FFFFFF' }}>
                <Target className="w-3 h-3" style={{ color: '#FFC107' }} />
                <span>{activeTenant.name}</span>
              </span>
              <div className="flex items-center gap-1 text-[10px] font-bold bg-black/20 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10" style={{ color: '#E8EDE2' }}>
                <Flame className="w-3 h-3 animate-pulse" style={{ color: '#FFC107' }} />
                <span>Live Campaign</span>
              </div>
            </div>

            <div className="space-y-1.5 relative z-10 mb-5">
              <h1 className="text-[22px] sm:text-3xl font-extrabold leading-tight text-white tracking-tight">
                {activeTenant?.branding?.title || 'സ്വലാത്തിലൂടെ ഹബീബിലണയാം'}
              </h1>
              <p className="text-xs font-medium leading-relaxed" style={{ color: '#E8EDE2' }}>
                {activeTenant?.branding?.tagline || 'ദിനേനയുള്ള സ്വലാത്തുകൾ കൃത്യമായി രേഖപ്പെടുത്തൂ'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 relative z-10 mb-4">
              <div className="bg-black/20 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(255, 193, 7, 0.2)' }}>
                    <Award className="w-4 h-4" style={{ color: '#FFC107' }} />
                  </div>
                  <span className="text-[9px] font-extrabold uppercase tracking-wider leading-tight" style={{ color: '#E8EDE2' }}>
                    ആകെ സ്വലാത്ത്
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-black font-sora tracking-tight leading-none animate-count-up" style={{ color: '#FFC107' }}>
                  {Number(totalEventCount).toLocaleString('en-IN')}
                </div>
                <div className="flex items-center gap-1 text-[9px] font-bold" style={{ color: '#E8EDE2' }}>
                  <TrendingUp className="w-3 h-3 text-emerald-300" />
                  <span>Verified Activity</span>
                </div>
              </div>

              <div className="bg-black/20 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 space-y-1.5 flex flex-col justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(255, 193, 7, 0.2)' }}>
                    <Calendar className="w-4 h-4" style={{ color: '#FFC107' }} />
                  </div>
                  <span className="text-[9px] font-extrabold uppercase tracking-wider leading-tight" style={{ color: '#E8EDE2' }}>
                    ഹിജ്‌രി തീയതി
                  </span>
                </div>
                <div className="text-lg sm:text-xl font-extrabold font-arabic leading-tight" dir="rtl" style={{ color: '#FFC107' }}>
                  {hijri.formattedAr}
                </div>
                <span className="text-[9px] font-bold" style={{ color: '#E8EDE2' }}>
                  {hijri.formattedMl}
                </span>
              </div>
            </div>

            <button
              onClick={() => navigate(user || authUser ? '/counter' : '/signup')}
              className="relative z-10 w-full flex items-center justify-center gap-2 hover:brightness-110 text-sm font-extrabold py-3.5 rounded-2xl shadow-lg transition transform active:scale-[0.97]"
              style={{ backgroundColor: '#6E9B37', color: '#FFFFFF', border: '1px solid #E8EDE2', boxShadow: '0 8px 24px rgba(110, 155, 55, 0.4)' }}
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
              <span>സ്വലാത്ത് സമർപ്പിക്കൂ</span>
              <ChevronRight className="w-4 h-4 opacity-70" />
            </button>

          </div>
        </section>

        {/* ──────── QUICK ACTION GRID ──────── */}
        <section className="px-4 pt-4 pb-2 max-w-xl mx-auto w-full">
          <div className="grid grid-cols-4 gap-3">
            {[
              { icon: <BookOpen className="w-5 h-5" />, label: 'ഡാഷ്‌ബോർഡ്', to: user ? '/dashboard' : '/login' },
              { icon: <Crown className="w-5 h-5" />, label: 'ലീഡർബോർഡ്', to: '/dashboard' },
              { icon: <Heart className="w-5 h-5" />, label: 'സ്വലാത്ത്', to: user ? '/counter' : '/signup' },
              { icon: <Users className="w-5 h-5" />, label: 'അംഗത്വം', to: '/signup' },
            ].map((item, i) => (
              <Link
                key={i}
                to={item.to}
                className={`flex flex-col items-center gap-2 py-3.5 rounded-2xl bg-white shadow-xs active:scale-95 transition animate-slide-up stagger-${i + 1}`}
                style={{ animationFillMode: 'both', border: '1px solid #E8EDE2' }}
              >
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm"
                  style={{ backgroundColor: '#E8EDE2', color: '#6E9B37' }}
                >
                  {item.icon}
                </div>
                <span className="text-[10px] font-extrabold leading-tight text-center" style={{ color: '#1A1A1A' }}>
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
              <h2 className="text-sm font-extrabold flex items-center gap-2" style={{ color: '#1A1A1A' }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm" style={{ backgroundColor: '#6E9B37', color: '#FFFFFF' }}>
                  <Crown className="w-4 h-4" />
                </div>
                <span>ഇന്ന് മുൻപന്തിയിൽ</span>
              </h2>
              <Link to="/dashboard" className="text-[11px] font-bold flex items-center gap-0.5 hover:underline" style={{ color: '#6E9B37' }}>
                <span>See All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {error && <div className="p-3 bg-red-50 text-red-700 text-xs rounded-2xl border border-red-200">{error}</div>}

            {loading ? (
              <div className="py-8 text-center space-y-2">
                <div className="w-8 h-8 mx-auto rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#6E9B37', borderTopColor: 'transparent' }} />
                <p className="text-xs font-medium" style={{ color: '#8C8C8C' }}>ലോഡ് ചെയ്യുന്നു...</p>
              </div>
            ) : leaders.length === 0 ? (
              <div className="p-6 bg-white rounded-3xl text-center space-y-2 shadow-xs" style={{ border: '1px solid #E8EDE2' }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto" style={{ backgroundColor: '#E8EDE2', color: '#8C8C8C' }}>
                  <Zap className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold" style={{ color: '#1A1A1A' }}>ഇന്ന് ഇതുവരെ രേഖപ്പെടുത്തിയിട്ടില്ല</p>
                <p className="text-[11px]" style={{ color: '#8C8C8C' }}>ആദ്യം സ്വലാത്ത് സംഖ്യ ചേർത്തു തുടക്കം കുറിക്കൂ!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {leaders.map((row, idx) => (
                  <div
                    key={row.userId || idx}
                    className={`bg-white rounded-2xl p-3.5 shadow-xs flex items-center justify-between transition active:scale-[0.98] animate-slide-up stagger-${idx + 1}`}
                    style={{
                      animationFillMode: 'both',
                      border: idx === 0 ? '1.5px solid #FFC107' : '1px solid #E8EDE2',
                      backgroundColor: '#FFFFFF',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-2xl flex items-center justify-center font-extrabold text-sm shrink-0 shadow-xs"
                        style={{
                          backgroundColor: idx === 0 ? '#FFC107' : idx < 3 ? '#6E9B37' : '#E8EDE2',
                          color: idx < 3 ? '#FFFFFF' : '#6E9B37',
                        }}
                      >
                        {idx < 3 ? medalEmoji[idx] : `#${idx + 1}`}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-xs sm:text-sm leading-tight" style={{ color: '#1A1A1A' }}>
                          {row.name}
                        </h3>
                        <div className="flex items-center gap-1 text-[10px] font-semibold mt-0.5" style={{ color: '#8C8C8C' }}>
                          <Star className="w-3 h-3" style={{ color: '#FFC107', fill: '#FFC107' }} />
                          <span>{idx === 0 ? '🔥 Top Leader' : 'Participant'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div className="text-right">
                        <span className="font-extrabold text-sm sm:text-base block font-sora" style={{ color: '#1A1A1A' }}>
                          {Number(row.value).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#8C8C8C' }}>സ്വലാത്ത്</span>
                      </div>
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#E8EDE2', color: '#6E9B37' }}>
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
            style={{ background: 'linear-gradient(135deg, #5c852e, #6E9B37, #4e7225)', border: '1px solid rgba(232, 237, 226, 0.2)' }}
          >
            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl pointer-events-none" style={{ backgroundColor: 'rgba(255, 193, 7, 0.12)' }} />

            <div className="flex items-center gap-2 relative z-10">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(255, 193, 7, 0.2)' }}>
                <Sparkles className="w-4 h-4" style={{ color: '#FFC107' }} />
              </div>
              <span className="text-xs font-extrabold uppercase tracking-wider" style={{ color: '#FFC107' }}>സ്വലാത്തിന്റെ വിശുദ്ധി</span>
            </div>

            <div className="space-y-3 pb-4 relative z-10" style={{ borderBottom: '1px solid rgba(232, 237, 226, 0.2)' }}>
              <p className="font-arabic text-right text-lg sm:text-2xl leading-relaxed" dir="rtl" style={{ color: '#FFC107' }}>
                إِنَّ اللَّهَ وَمَلَائِكَتَهُ يُصَلُّونَ عَلَى النَّبِيِّ ۚ يَا أَيُّهَا الَّذِينَ آمَنُوا صَلُّوا عَلَيْهِ وَسَلِّمُوا تَسْلِيمًا
              </p>
              <p className="text-[11px] leading-relaxed font-medium" style={{ color: '#E8EDE2' }}>
                "തീർച്ചയായും അല്ലാഹുവും അവന്റെ മലക്കുകളും നബിക്ക് സ്വലാത്ത് ചൊല്ലുന്നു. സത്യവിശ്വാസികളേ, നിങ്ങളും അവിടുത്തേക്ക് സ്വലാത്തും സലാമും ചൊല്ലുക."
              </p>
              <span className="text-[10px] font-bold block" style={{ color: '#FFC107' }}>— സൂറത്തുൽ അഹ്‌സാബ് : 56</span>
            </div>

            <ul className="space-y-2.5 text-[11px] font-medium relative z-10" style={{ color: '#E8EDE2' }}>
              <li className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: 'rgba(255, 193, 7, 0.2)' }}>
                  <Sparkles className="w-3 h-3" style={{ color: '#FFC107' }} />
                </div>
                <span>ഒരു സ്വലാത്ത് ചൊല്ലുമ്പോൾ 10 അനുഗ്രഹങ്ങൾ (റഹ്മത്ത്) ലഭിക്കുന്നു.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: 'rgba(255, 193, 7, 0.2)' }}>
                  <Heart className="w-3 h-3" style={{ color: '#FFC107' }} />
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

  // ----------------------------------------------------
  // 2. PLATFORM MARKETING LANDING PAGE (Main Root / Domain)
  // ----------------------------------------------------
  return (
    <div className="min-h-screen flex flex-col pb-24 md:pb-0" style={{ backgroundColor: '#F7F5EC', color: '#1A1A1A' }}>
      
      {/* Platform Top Bar */}
      <header className="sticky top-0 z-30 px-4 py-4 backdrop-blur-lg border-b" style={{ backgroundColor: 'rgba(247, 245, 236, 0.95)', borderColor: '#E8EDE2' }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl text-white flex items-center justify-center text-xl font-bold shadow-md" style={{ backgroundColor: '#6E9B37' }}>
              ☪
            </div>
            <div>
              <h1 className="font-extrabold text-base leading-none" style={{ color: '#1A1A1A' }}>
                സ്വലാത്ത് സമർപ്പണ പോർട്ടൽ
              </h1>
              <span className="text-[10px] font-semibold" style={{ color: '#8C8C8C' }}>
                Multi-Tenant Event Platform
              </span>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <Link
              to="/login"
              className="px-3.5 py-2 rounded-xl text-xs font-bold transition"
              style={{ backgroundColor: '#E8EDE2', color: '#1A1A1A' }}
            >
              ലോഗിൻ
            </Link>
            <Link
              to="/register-team"
              className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md transition active:scale-95 flex items-center gap-1"
              style={{ backgroundColor: '#6E9B37' }}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Event Register</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Marketing Hero Banner */}
      <section className="px-4 pt-8 pb-6 max-w-5xl mx-auto w-full">
        <div
          className="text-white rounded-[32px] p-6 sm:p-10 shadow-2xl relative overflow-hidden text-center space-y-6"
          style={{
            background: 'linear-gradient(135deg, #5c852e, #6E9B37, #4e7225)',
            boxShadow: '0 25px 60px rgba(110, 155, 55, 0.3)',
            border: '1px solid rgba(232, 237, 226, 0.2)'
          }}
        >
          {/* Decorative glows */}
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl pointer-events-none" style={{ backgroundColor: 'rgba(255, 193, 7, 0.15)' }} />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full blur-3xl pointer-events-none" style={{ backgroundColor: 'rgba(232, 237, 226, 0.15)' }} />

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-extrabold bg-white/15 backdrop-blur-md border border-white/20 uppercase tracking-wider mx-auto" style={{ color: '#FFC107' }}>
            <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
            <span>ഡിജിറ്റൽ സ്വലാത്ത് ഏകോപന പ്രസ്ഥാനം</span>
          </div>

          <div className="max-w-2xl mx-auto space-y-3">
            <h1 className="text-3xl sm:text-5xl font-bold leading-tight tracking-tight text-white font-ml">
              നിങ്ങളുടെ ഈവന്റിനായി സ്വന്തം സബ്ഡൊമൈൻ പോർട്ടൽ ആരംഭിക്കൂ
            </h1>
            <p className="text-sm sm:text-base  font-medium leading-relaxed" style={{ color: '#E8EDE2' }}>
              സംഘടനകൾ, മഹല്ല് സമിതികൾ, കാമ്പയിൻ ടീമുകൾ എന്നിവർക്ക് തത്സമയ കൗണ്ടർ, ലീഡർബോർഡ്, വ്യക്തിഗത വിവരശേഖരണം എന്നിവയോടെ സൗജന്യമായി പോർട്ടൽ സ്വന്തമാക്കാം.
            </p>
          </div>

          {/* Total Counter Summary */}
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 bg-black/25 backdrop-blur-md p-4 rounded-2xl border border-white/15 mx-auto max-w-lg w-full justify-around">
            <div className="text-center">
              <span className="text-[10px] uppercase tracking-wider font-extrabold block" style={{ color: '#E8EDE2' }}>
                ആകെ സമർപ്പിച്ച സ്വലാത്തുകൾ
              </span>
              <span className="text-2xl sm:text-3xl font-black font-sora" style={{ color: '#FFC107' }}>
                {Number(totalEventCount).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="w-px h-8 bg-white/20 hidden sm:block" />
            <div className="text-center">
              <span className="text-[10px] uppercase tracking-wider font-extrabold block" style={{ color: '#E8EDE2' }}>
                ഇന്നത്തെ ഹിജ്‌രി തീയതി
              </span>
              <span className="text-lg sm:text-xl font-extrabold font-arabic" dir="rtl" style={{ color: '#FFC107' }}>
                {hijri.formattedAr}
              </span>
            </div>
          </div>

          {/* Marketing Hero CTA Grid */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 max-w-md mx-auto">
            <Link
              to="/register-team"
              className="w-full sm:w-auto px-6 py-4 rounded-2xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 shadow-xl transition transform active:scale-95"
              style={{ backgroundColor: '#FFC107', color: '#1A1A1A' }}
            >
              <Building2 className="w-4 h-4" />
              <span>പുതിയ ഈവന്റ് റജിസ്റ്റർ ചെയ്യൂ</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/signup"
              className="w-full sm:w-auto px-6 py-4 rounded-2xl text-xs sm:text-sm font-bold bg-white/15 hover:bg-white/25 border border-white/20 text-white flex items-center justify-center gap-2 transition active:scale-95"
            >
              <Users className="w-4 h-4" />
              <span>അംഗമായി റജിസ്റ്റർ ചെയ്യൂ</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="px-4 py-8 max-w-5xl mx-auto w-full space-y-6">
        <div className="text-center space-y-1">
          <span className="text-xs font-extrabold uppercase tracking-wider" style={{ color: '#6E9B37' }}>
            പ്രധാന സവിശേഷതകൾ
          </span>
          <h2 className="text-xl sm:text-2xl font-black" style={{ color: '#1A1A1A' }}>
            ഡിജിറ്റൽ സ്വലാത്ത് പ്ലാറ്റ്‌ഫോം നൽകുന്ന സൗകര്യങ്ങൾ
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              icon: <Globe className="w-6 h-6" />,
              title: 'സ്വന്തം സബ്ഡൊമൈൻ URL',
              desc: 'നിങ്ങളുടെ സംഘടനയുടെ പേരിൽ ഉദാ: noorulislam.swalath.app പോലെ സബ്ഡൊമൈൻ ലഭിക്കുന്നു.',
            },
            {
              icon: <Flame className="w-6 h-6" />,
              title: 'തത്സമയ ലൈവ് കൗണ്ടർ',
              desc: 'മൊബൈൽ ഡിജിറ്റൽ തസ്ബീഹ് കൗണ്ടർ വഴി ഓരോ അംഗത്തിന്റെയും സ്വലാത്തുകൾ തത്സമയം കൂട്ടിച്ചേർക്കാം.',
            },
            {
              icon: <ShieldCheck className="w-6 h-6" />,
              title: 'Super Admin അംഗീകാരം',
              desc: 'സുരക്ഷിതമായ അഡ്മിൻ വേരിഫിക്കേഷന് ശേഷം മാത്രം ഈവന്റ് പ്രവേശനം ഉ ഉറപ്പുവരുത്തുന്നു.',
            },
          ].map((feat, i) => (
            <div
              key={i}
              className="bg-white rounded-3xl p-6 shadow-xs space-y-3 border"
              style={{ borderColor: '#E8EDE2' }}
            >
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-xs" style={{ backgroundColor: '#E8EDE2', color: '#6E9B37' }}>
                {feat.icon}
              </div>
              <h3 className="text-base font-extrabold" style={{ color: '#1A1A1A' }}>{feat.title}</h3>
              <p className="text-xs font-medium leading-relaxed" style={{ color: '#8C8C8C' }}>{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Approved Events Directory */}
      <section className="px-4 py-6 max-w-5xl mx-auto w-full space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold" style={{ color: '#1A1A1A' }}>
              അംഗീകൃത ഈവന്റുകൾ (Active Approved Events)
            </h2>
            <p className="text-xs font-medium" style={{ color: '#8C8C8C' }}>
              പ്രവർത്തിക്കുന്ന പോർട്ടലുകളിൽ പങ്കാളിയാകൂ
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold font-mono" style={{ backgroundColor: '#E8EDE2', color: '#6E9B37' }}>
            {approvedEvents.length} Active Events
          </span>
        </div>

        {approvedEvents.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl text-center space-y-3 border" style={{ borderColor: '#E8EDE2' }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto" style={{ backgroundColor: '#E8EDE2', color: '#8C8C8C' }}>
              <Building2 className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold" style={{ color: '#1A1A1A' }}>നിലവിൽ അംഗീകൃത ഈവന്റുകൾ ലഭ്യമായിട്ടില്ല.</p>
            <p className="text-[11px]" style={{ color: '#8C8C8C' }}>ആദ്യ ഈവന്റ് ടീം റജിസ്ട്രേഷൻ വഴി സ്വന്തം പോർട്ടൽ ആരംഭിക്കൂ!</p>
            <Link
              to="/register-team"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-sm mt-2"
              style={{ backgroundColor: '#6E9B37' }}
            >
              <Plus className="w-4 h-4" />
              <span>ഈവന്റ് റജിസ്റ്റർ ചെയ്യൂ</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {approvedEvents.map((ev) => (
              <div
                key={ev._id || ev.slug}
                className="bg-white rounded-3xl p-5 shadow-xs border flex flex-col justify-between space-y-4 hover:border-[#6E9B37] transition"
                style={{ borderColor: '#E8EDE2' }}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-xl text-white flex items-center justify-center font-bold text-sm" style={{ backgroundColor: '#6E9B37' }}>
                      ☪
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold" style={{ backgroundColor: '#E8EDE2', color: '#6E9B37' }}>
                      {ev.slug}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-sm" style={{ color: '#1A1A1A' }}>{ev.name}</h3>
                  <p className="text-[11px] font-medium leading-relaxed line-clamp-2" style={{ color: '#8C8C8C' }}>
                    {ev.branding?.tagline || 'സ്വലാത്ത് ഏകോപന കാമ്പയിൻ'}
                  </p>
                </div>

                <a
                  href={`http://${ev.slug}.localhost:5173`}
                  className="w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 text-white shadow-sm transition active:scale-95"
                  style={{ backgroundColor: '#6E9B37' }}
                >
                  <span>ഈവന്റിൽ പ്രവേശിക്കൂ</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Super Admin Quick Link Footer Bar */}
      <section className="px-4 py-4 max-w-5xl mx-auto w-full text-center">
        <Link
          to="/super-admin"
          className="inline-flex items-center gap-1.5 text-xs font-bold hover:underline"
          style={{ color: '#8C8C8C' }}
        >
          <ShieldCheck className="w-4 h-4" style={{ color: '#FFC107' }} />
          <span>Platform Master Access (Super Admin Login)</span>
        </Link>
      </section>

      <Footer />
    </div>
  );
}
