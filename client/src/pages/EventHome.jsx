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
  Crown, Sparkles, Settings, ArrowUpRight, Star, Calendar, Award,
  TrendingUp, Plus, Heart, Users, BookOpen, Flame, Moon,
  ChevronRight, Zap, Target, LogIn
} from "lucide-react";
import Footer from "../components/Footer.jsx";
import SettingsModal from "../components/SettingsModal.jsx";
import SwalathCard from "../components/SwalathCard.jsx";
import QuickActionGrid from "../components/QuickActionGrid.jsx";
import LeaderboardSection from "../components/LeaderboardSection.jsx";

function formatTitleCase(str) {
  if (!str) return '';
  return String(str).toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function DigitCountTicker({ value, isLoading }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      const target = Number(value) || 0;
      if (target === 0) {
        setDisplayValue(0);
        return;
      }
      const duration = 1200;
      const startTime = performance.now();

      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        setDisplayValue(Math.floor(easeProgress * target));

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    }
  }, [value, isLoading]);

  if (isLoading) {
    return (
      <div className="py-1 font-mono flex items-center justify-center">
        <span className="text-3xl sm:text-5xl font-black text-white/30 animate-pulse tracking-wider select-none font-mono">
          00,000,000
        </span>
      </div>
    );
  }

  return (
    <div className="text-3xl sm:text-5xl font-black tracking-tight leading-none text-white py-1 font-mono">
      {displayValue.toLocaleString('en-IN')}
    </div>
  );
}

export default function EventHome() {
  const { activeTenant } = useTenant();
  const { user: authUser } = useAuth();
  const navigate = useNavigate();
  const [leaders, setLeaders] = useState([]);
  const [totalEventCount, setTotalEventCount] = useState(0);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);

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
    <div className="min-h-screen flex flex-col">
      {/* ──────── MOBILE APP HEADER ──────── */}
      <header className="sticky top-0 z-30 px-4 py-2.5 backdrop-blur-lg md:hidden safe-top bg-background/95 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/appLogo.png"
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
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSettingsOpen(true)}
              className="rounded-2xl border-primary/30 active:scale-95 transition-transform"
              aria-label="Settings"
            >
              <Settings className="w-5 h-5 text-primary" />
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
          {/* Top Bar Tagline */}
          <div className="flex w-fit relative z-10 mb-4 bg-black/25 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/15 text-center">
            <span className="text-xs font-bold text-[#E6F4ED] tracking-wide">ഖൽബിലുണ്ട് എന്റെ നബി</span>
          </div>

          <div className="space-y-1.5 relative z-10 mb-4 text-center">
            <h1 className="text-[22px] sm:text-3xl font-extrabold leading-tight text-white tracking-tight">
              {formatTitleCase(activeTenant?.branding?.title || activeTenant?.name) || 'സ്വലാത്തിലൂടെ ഹബീബിലണയാം'}
            </h1>
            <p className="text-xs font-medium leading-relaxed text-[#E6F4ED]">
              {activeTenant?.branding?.tagline || 'ദിനേനയുള്ള സ്വലാത്തുകൾ കൃത്യമായി രേഖപ്പെടുത്തൂ'}
            </p>
          </div>

          {/* Full Width Total Salath Count Card */}
          <div className="bg-black/25 backdrop-blur-md rounded-2xl p-4 border border-white/15 space-y-1.5 relative z-10 mb-4 text-center">
            <div className="flex items-center justify-center gap-1.5">
              <div className="w-7 h-7 rounded-xl flex items-center justify-center bg-[#D4AF37]/25">
                <Award className="w-4 h-4 text-[#D4AF37]" />
              </div>
              <span className="text-xs font-extrabold tracking-wider text-[#E6F4ED]">
                Total Swalath
              </span>
            </div>

            <DigitCountTicker value={totalEventCount} isLoading={loading} />

            <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-[#D4AF37]">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Verified Activity</span>
            </div>
          </div>

          <Button
            onClick={() => navigate(user || authUser ? '/counter' : '/login')}
            className="relative z-10 w-full text-sm font-extrabold py-3.5 px-6 rounded-2xl shadow-xl border border-[#F5E6B3]/60 bg-[#F5E6B3] text-[#07351F] hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 h-auto"
          >
            {user || authUser ? (
              <>
                <div className="w-7 h-7 rounded-full bg-[#07351F]/15 flex items-center justify-center shrink-0">
                  <Plus className="w-4 h-4 stroke-[3] text-[#07351F]" />
                </div>
                <span className="tracking-wide text-base">Submit Swalath</span>
              </>
            ) : (
              <>
                <div className="w-7 h-7 rounded-full bg-[#07351F]/15 flex items-center justify-center shrink-0">
                  <LogIn className="w-4 h-4 stroke-[2.5] text-[#07351F]" />
                </div>
                <span className="tracking-wide text-base">Login</span>
              </>
            )}
          </Button>
        </div>
      </section>

      {/* ──────── ARABIC SWALATH DISPLAY CARD ──────── */}
      {activeTenant?.settings?.showSwalath !== false && (
        <section className="px-4 pt-3 max-w-xl mx-auto w-full animate-slide-up">
          <SwalathCard swalath={activeTenant?.swalath} />
        </section>
      )}

      {/* ──────── QUICK ACTION GRID ──────── */}
      {activeTenant?.settings?.showQuickActions !== false && (
        <QuickActionGrid user={user} />
      )}

      {/* ──────── LEADERBOARD & VIRTUES MAIN CONTAINER ──────── */}
      <main className="max-w-xl mx-auto px-4 py-3 space-y-5 w-full flex-1">
        {activeTenant?.settings?.showLeaderboard !== false && (
          <LeaderboardSection leaders={leaders} loading={loading} error={error} />
        )}

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
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
