import { useEffect, useState } from "react";
import { api } from "../api.js";
import { useTenant } from "../context/TenantContext.jsx";
import { getHijriDate } from "../utils/hijri.js";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
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
        .catch(() => { })
        .finally(() => setLoading(false));
    }
  }, [activeTenant]);

  const medalEmoji = ['🥇', '🥈', '🥉'];

  if (!activeTenant) return null;

  return (
    <div className="min-h-screen flex flex-col pb-16 md:pb-0">
      {/* ──────── MOBILE APP HEADER ──────── */}
      <header className="sticky top-0 z-30 px-4 py-2.5 backdrop-blur-lg md:hidden safe-top bg-background/95 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/appLogo.svg"
              alt="Swalath Portal"
              className="w-11 h-11 rounded-2xl object-cover shadow-md shrink-0 border border-primary/20"
            />
            <div>
              <h2 className="font-extrabold text-sm leading-tight text-foreground">
                {user ? `${user.name}` : 'Welcome!'}
              </h2>
              <span className="text-[10px] font-semibold flex items-center gap-1 text-muted-foreground">
                <Moon className="w-3 h-3 text-primary" />
                <span>{hijri.formattedMl}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="rounded-2xl relative border-primary/30" aria-label="Notifications">
              <Bell className="w-5 h-5 text-primary" />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-background bg-[#D4AF37]" />
            </Button>
          </div>
        </div>
      </header>

      {/* ──────── MADINAH HERO BANNER CARD ──────── */}
      <section className="px-4 py-2 max-w-xl mx-auto w-full animate-slide-up">
        <div
          className="text-white rounded-[28px] p-5 sm:p-6 shadow-2xl relative overflow-hidden bg-gradient-to-br from-[#296E37] via-[#468B3A] to-[#7EC242] border border-white/20"
        >
          <div className="absolute -top-16 -right-16 w-52 h-52 rounded-full blur-3xl pointer-events-none animate-pulse-glow bg-[#D4AF37]/20" />
          <div className="absolute -bottom-16 -left-16 w-52 h-52 rounded-full blur-3xl pointer-events-none animate-pulse-glow bg-primary/20" style={{ animationDelay: '1s' }} />
          <div className="absolute top-4 right-6 pointer-events-none text-white/15">
            <Sparkles className="w-24 h-24 animate-float text-[#D4AF37]" />
          </div>

          <div className="flex items-center justify-between relative z-10 mb-4">
            <Badge variant="muted" className="bg-black/25 backdrop-blur-md border-[#D4AF37]/40 text-[#F5E6B3] flex items-center gap-1.5 uppercase tracking-wide">
              <Target className="w-3 h-3 text-[#D4AF37]" />
              <span>{activeTenant.name}</span>
            </Badge>
            <div className="flex items-center gap-1 text-[10px] font-bold bg-black/30 backdrop-blur-md px-2.5 py-1 rounded-full border border-[#D4AF37]/30 text-[#F5E6B3]">
              <Flame className="w-3 h-3 animate-pulse text-[#D4AF37]" />
              <span>Live Campaign</span>
            </div>
          </div>

          <div className="space-y-1.5 relative z-10 mb-5">
            <h1 className="text-[22px] sm:text-3xl font-extrabold leading-tight text-white tracking-tight">
              {activeTenant?.branding?.title || 'സ്വലാത്തിലൂടെ ഹബീബിലണയാം'}
            </h1>
            <p className="text-xs font-medium leading-relaxed text-[#E6F4ED]">
              {activeTenant?.branding?.tagline || 'ദിനേനയുള്ള സ്വലാത്തുകൾ കൃത്യമായി രേഖപ്പെടുത്തൂ'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 relative z-10 mb-4">
            <div className="bg-black/25 backdrop-blur-md rounded-2xl p-3.5 border border-white/15 space-y-1.5">
              <div className="flex items-center gap-1.5">
                <div className="w-7 h-7 rounded-xl flex items-center justify-center bg-[#D4AF37]/25">
                  <Award className="w-4 h-4 text-[#D4AF37]" />
                </div>
                <span className="text-[9px] font-extrabold uppercase tracking-wider leading-tight text-[#E6F4ED]">
                  Total Salath
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black tracking-tight leading-none animate-count-up text-white">
                {Number(totalEventCount).toLocaleString('en-IN')}
              </div>
              <div className="flex items-center gap-1 text-[9px] font-bold text-[#D4AF37]">
                <TrendingUp className="w-3 h-3" />
                <span>Verified Activity</span>
              </div>
            </div>

            <div className="bg-black/25 backdrop-blur-md rounded-2xl p-3.5 border border-white/15 space-y-1.5 flex flex-col justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-7 h-7 rounded-xl flex items-center justify-center bg-[#D4AF37]/25">
                  <Calendar className="w-4 h-4 text-[#D4AF37]" />
                </div>
                <span className="text-[9px] font-extrabold uppercase tracking-wider leading-tight text-[#E6F4ED]">
                  Hijri Date
                </span>
              </div>
              <div className="text-lg sm:text-xl font-extrabold font-arabic leading-tight text-[#F5E6B3]" dir="rtl">
                {hijri.formattedAr}
              </div>
              <span className="text-[9px] font-bold text-[#E6F4ED]">
                {hijri.formattedMl}
              </span>
            </div>
          </div>

          <Button
            onClick={() => navigate(user || authUser ? '/counter' : '/signup')}
            className="relative z-10 w-full text-sm font-extrabold py-3.5 shadow-lg border border-[#D4AF37]/50 h-auto bg-[#D4AF37] text-[#07351F] hover:bg-[#E2BE46]"
          >
            <Plus className="w-5 h-5 stroke-[2.8] mr-1 text-[#07351F]" />
            <span>Submit Salath</span>
            <ChevronRight className="w-4 h-4 opacity-80 ml-auto" />
          </Button>
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
              className={`flex flex-col items-center gap-2 py-3.5 rounded-2xl bg-card shadow-xs active:scale-95 transition border border-border animate-slide-up stagger-${i + 1}`}
              style={{ animationFillMode: 'both' }}
            >
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm bg-primary/15 text-primary">
                {item.icon}
              </div>
              <span className="text-[10px] font-extrabold leading-tight text-center text-foreground">
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
            <h2 className="text-sm font-extrabold flex items-center gap-2 text-foreground">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm bg-primary text-primary-foreground">
                <Crown className="w-4 h-4 text-[#D4AF37]" />
              </div>
              <span>Today's Top Leaders</span>
            </h2>
            <Link to="/dashboard" className="text-[11px] font-bold flex items-center gap-0.5 hover:underline text-muted-foreground">
              <span>See All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {error && <Alert variant="destructive">{error}</Alert>}

          {loading ? (
            <div className="py-8 text-center space-y-2">
              <div className="w-8 h-8 mx-auto rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <p className="text-xs font-medium text-muted-foreground">Loading...</p>
            </div>
          ) : leaders.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto bg-primary/15 text-primary">
                  <Zap className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-foreground">No entries recorded today yet</p>
                <p className="text-[11px] text-muted-foreground">Be the first to record your Swalath count today!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {leaders.map((row, idx) => (
                <div
                  key={row.userId || idx}
                  className={`bg-card rounded-2xl p-3.5 shadow-xs flex items-center justify-between transition active:scale-[0.98] animate-slide-up stagger-${idx + 1} border ${idx === 0 ? 'border-primary ring-1 ring-primary/30' : 'border-border'
                    }`}
                  style={{ animationFillMode: 'both' }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center font-extrabold text-sm shrink-0 shadow-xs ${idx === 0 ? 'bg-primary text-primary-foreground' : idx < 3 ? 'bg-secondary text-secondary-foreground' : 'bg-primary/15 text-primary'
                        }`}
                    >
                      {idx < 3 ? medalEmoji[idx] : `#${idx + 1}`}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-xs sm:text-sm leading-tight text-foreground">
                        {row.name}
                      </h3>
                      <div className="flex items-center gap-1 text-[10px] font-semibold mt-0.5 text-muted-foreground">
                        <Star className="w-3 h-3 text-[#D4AF37] fill-[#D4AF37]" />
                        <span>{idx === 0 ? '🔥 Top Leader' : 'Participant'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="text-right">
                      <span className="font-extrabold text-sm sm:text-base block text-primary">
                        {Number(row.value).toLocaleString('en-IN')}
                      </span>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Salath</span>
                    </div>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-primary/15 text-primary">
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
          className="text-white p-5 sm:p-6 rounded-[28px] space-y-4 shadow-xl relative overflow-hidden bg-gradient-to-br from-[#296E37] via-[#468B3A] to-[#7EC242] border border-white/20"
        >
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl pointer-events-none bg-[#D4AF37]/20" />

          <div className="flex items-center gap-2 relative z-10">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-[#D4AF37]/25">
              <Sparkles className="w-4 h-4 text-[#D4AF37]" />
            </div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#F5E6B3]">സ്വലാത്തിന്റെ വിശുദ്ധി</span>
          </div>

          <div className="space-y-3 pb-4 relative z-10 border-b border-white/20">
            <p className="font-arabic text-right text-lg sm:text-2xl leading-relaxed text-[#F5E6B3]" dir="rtl">
              إِنَّ اللَّهَ وَمَلَائِكَتَهُ يُصَلُّونَ عَلَى النَّبِيِّ ۚ يَا أَيُّهَا الَّذِينَ آمَنُوا صَلُّوا عَلَيْهِ وَسَلِّمُوا تَسْلِيمًا
            </p>
            <p className="text-[11px] leading-relaxed font-medium text-[#E6F4ED]">
              "തീർച്ചയായും അല്ലാഹുവും അവന്റെ മലക്കുകളും നബിക്ക് സ്വലാത്ത് ചൊല്ലുന്നു. സത്യവിശ്വാസികളേ, നിങ്ങളും അവിടുത്തേക്ക് സ്വലാത്തും സലാമും ചൊല്ലുക."
            </p>
            <span className="text-[10px] font-bold block text-[#D4AF37]">— സൂറത്തുൽ അഹ്‌സാബ് : 56</span>
          </div>

          <ul className="space-y-2.5 text-[11px] font-medium relative z-10 text-[#E6F4ED]">
            <li className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-lg flex items-center justify-center shrink-0 mt-0.5 bg-[#D4AF37]/25">
                <Sparkles className="w-3 h-3 text-[#D4AF37]" />
              </div>
              <span>ഒരു സ്വലാത്ത് ചൊല്ലുമ്പോൾ 10 അനുഗ്രഹങ്ങൾ (റഹ്മത്ത്) ലഭിക്കുന്നു.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-lg flex items-center justify-center shrink-0 mt-0.5 bg-[#D4AF37]/25">
                <Heart className="w-3 h-3 text-[#D4AF37]" />
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
