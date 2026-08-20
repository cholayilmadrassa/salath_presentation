import { useEffect, useState } from "react";
import { api } from "../api.js";
import { useTenant } from "../context/TenantContext.jsx";
import { getHijriDate } from "../utils/hijri.js";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { Button } from "@/components/ui/button";
import {
  Sparkles, Award, TrendingUp, Plus, Heart, Moon, LogIn, Bell,
} from "lucide-react";
import Footer from "../components/Footer.jsx";
import SwalathCard from "../components/SwalathCard.jsx";
import LeaderboardSection from "../components/LeaderboardSection.jsx";
import PrayerTimesWidget from "../components/PrayerTimesWidget.jsx";
import DigitCountTicker from "../components/DigitCountTicker.jsx";
import SubmitSwalathModal from "../components/SubmitSwalathModal.jsx";
import {
  getCachedTotalSwalath,
  fetchAndCacheTotalSwalath,
  getTenantCacheKey,
  CACHE_EVENT_NAME,
} from "../utils/swalathCache.js";

function formatTitleCase(str) {
  if (!str) return '';
  return String(str).toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function EventHome() {
  const { activeTenant } = useTenant();
  const { user: authUser, token } = useAuth();
  const navigate = useNavigate();

  // Instant cache read for zero-loading counter
  const cachedTotal = getCachedTotalSwalath(activeTenant);
  const [totalEventCount, setTotalEventCount] = useState(() => cachedTotal?.total ?? 0);
  const [totalCountLoading, setTotalCountLoading] = useState(() => cachedTotal === null);

  const [leaders, setLeaders] = useState([]);
  const [leaderLoading, setLeaderLoading] = useState(true);
  const [leaderError, setLeaderError] = useState("");
  const [user, setUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const hijri = getHijriDate();

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) setUser(JSON.parse(savedUser));

    if (token) {
      api('/notifications/inbox', { token })
        .then((res) => {
          if (res && typeof res.unreadCount === 'number') setUnreadCount(res.unreadCount);
        })
        .catch(() => {});
    }

    if (activeTenant) {
      // 1. Immediately hydrate from tenant cache
      const cached = getCachedTotalSwalath(activeTenant);
      if (cached !== null) {
        setTotalEventCount(cached.total);
        setTotalCountLoading(false);
      } else {
        setTotalCountLoading(true);
      }

      // 2. Fetch Leaderboard for today
      setLeaderLoading(true);
      api("/counts/leaderboard/today?limit=5")
        .then((res) => setLeaders(res || []))
        .catch((e) => setLeaderError(e.message))
        .finally(() => setLeaderLoading(false));

      // 3. Background fetch fresh total count and update state/cache
      fetchAndCacheTotalSwalath(activeTenant)
        .then((fresh) => {
          if (fresh && typeof fresh.total === 'number') {
            setTotalEventCount(fresh.total);
          }
        })
        .catch(() => {})
        .finally(() => setTotalCountLoading(false));
    }
  }, [activeTenant, token]);

  // Listen to optimistic / cross-tab total count updates
  useEffect(() => {
    const tenantKey = getTenantCacheKey(activeTenant);
    const handleCacheUpdate = (e) => {
      if (e.detail?.tenantKey === tenantKey && typeof e.detail?.total === 'number') {
        setTotalEventCount(e.detail.total);
        setTotalCountLoading(false);
      }
    };
    window.addEventListener(CACHE_EVENT_NAME, handleCacheUpdate);
    return () => window.removeEventListener(CACHE_EVENT_NAME, handleCacheUpdate);
  }, [activeTenant]);

  if (!activeTenant) return null;

  return (
    <div className="min-h-screen flex flex-col">

      {/* ──────── MOBILE APP HEADER ──────── */}
      <header className="px-4 py-2.5 md:hidden safe-top bg-background">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/appLogo.png"
              alt="Swalath Portal"
              className="w-11 h-11 rounded-2xl object-cover shadow-md shrink-0 border border-primary/20"
            />
            <div>
              <h2 className="font-extrabold text-sm leading-tight text-foreground">
                {user ? user.name : 'Welcome!'}
              </h2>
              <span className="text-[10px] font-semibold flex items-center gap-1 text-muted-foreground">
                <Moon className="w-3 h-3 text-primary" />
                <span>{hijri.formattedMl}</span>
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
      </header>

      {/* ──────── HERO BANNER ──────── */}
      <section className="px-4 py-2 max-w-xl mx-auto w-full animate-slide-up">
        <div className="text-white rounded-[28px] p-5 sm:p-6 shadow-2xl relative overflow-hidden bg-gradient-to-br from-[#296E37] via-[#468B3A] to-[#7EC242] border border-white/20">
          <div className="absolute -top-16 -right-16 w-52 h-52 rounded-full blur-3xl pointer-events-none animate-pulse-glow bg-[#D4AF37]/20" />
          <div className="absolute -bottom-16 -left-16 w-52 h-52 rounded-full blur-3xl pointer-events-none animate-pulse-glow bg-primary/20" style={{ animationDelay: '1s' }} />

          {/* Tagline pill */}
          <div className="flex w-fit relative z-10 mb-4 bg-black/25 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/15">
            <span className="text-xs font-bold text-[#E6F4ED] tracking-wide">ഖൽബിലുണ്ട് എന്റെ നബി</span>
          </div>

          {/* Title & tagline */}
          <div className="space-y-1.5 relative z-10 mb-4 text-center">
            <h1 className="text-[22px] sm:text-3xl font-extrabold leading-tight text-white tracking-tight">
              {formatTitleCase(activeTenant?.branding?.title || activeTenant?.name) || 'സ്വലാത്തിലൂടെ ഹബീബിലണയാം'}
            </h1>
            <p className="text-xs font-medium leading-relaxed text-[#E6F4ED]">
              {activeTenant?.branding?.tagline || 'ദിനേനയുള്ള സ്വലാത്തുകൾ കൃത്യമായി രേഖപ്പെടുത്തൂ'}
            </p>
          </div>

          {/* Total count */}
          <div className="bg-black/25 backdrop-blur-md rounded-2xl p-4 border border-white/15 space-y-1.5 relative z-10 mb-4 text-center">
            <div className="flex items-center justify-center gap-1.5">
              <div className="w-7 h-7 rounded-xl flex items-center justify-center bg-[#D4AF37]/25">
                <Award className="w-4 h-4 text-[#D4AF37]" />
              </div>
              <span className="text-xs font-extrabold tracking-wider text-[#E6F4ED]">Total Swalath</span>
            </div>
            <DigitCountTicker value={totalEventCount} isLoading={totalCountLoading} />
            <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-[#D4AF37]">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Verified Activity</span>
            </div>
          </div>

          {/* CTA Button */}
          <Button
            onClick={() => {
              if (user || authUser) {
                setShowSubmitModal(true);
              } else {
                navigate('/login');
              }
            }}
            className="relative z-10 w-full max-w-sm mx-auto text-xs sm:text-sm font-extrabold h-11 px-4 rounded-xl shadow-md border border-[#F5E6B3]/40 bg-[#FFF449] text-[#07351F] hover:bg-[#FFDE42] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {user || authUser ? (
              <>
                <div className="w-6 h-6 rounded-lg bg-[#07351F]/15 flex items-center justify-center shrink-0">
                  <Plus className="w-3.5 h-3.5 stroke-[3] text-[#07351F]" />
                </div>
                <span className="tracking-wide">Submit Swalath</span>
              </>
            ) : (
              <>
                <div className="w-6 h-6 rounded-lg bg-[#07351F]/15 flex items-center justify-center shrink-0">
                  <LogIn className="w-3.5 h-3.5 stroke-[2.5] text-[#07351F]" />
                </div>
                <span className="tracking-wide">Login</span>
              </>
            )}
          </Button>
        </div>
      </section>

      {/* ──────── DYNAMIC ORDERED SECTIONS (Arabic Swalath, Prayer Times, Leaderboard) ──────── */}
      {(() => {
        const defaultOrder = ['swalath', 'prayerTimes', 'leaderboard'];
        const configuredOrder = Array.isArray(activeTenant?.settings?.homeSectionOrder) && activeTenant.settings.homeSectionOrder.length > 0
          ? activeTenant.settings.homeSectionOrder
          : defaultOrder;

        const sectionOrder = [
          ...configuredOrder.filter(id => defaultOrder.includes(id)),
          ...defaultOrder.filter(id => !configuredOrder.includes(id)),
        ];

        return sectionOrder.map((sectionId) => {
          if (sectionId === 'swalath' && activeTenant?.settings?.showSwalath !== false) {
            return (
              <section key="swalath" className="px-4 pt-3 max-w-xl mx-auto w-full animate-slide-up">
                <SwalathCard swalath={activeTenant?.swalath} />
              </section>
            );
          }

          if (sectionId === 'prayerTimes' && activeTenant?.settings?.showPrayerTimes !== false) {
            return (
              <div key="prayerTimes" className="animate-slide-up">
                <PrayerTimesWidget />
              </div>
            );
          }

          if (sectionId === 'leaderboard' && activeTenant?.settings?.showLeaderboard !== false) {
            return (
              <div key="leaderboard" className="max-w-xl mx-auto px-4 pt-3 w-full animate-slide-up">
                <LeaderboardSection leaders={leaders} loading={leaderLoading} error={leaderError} />
              </div>
            );
          }

          return null;
        });
      })()}

      {/* ──────── VIRTUES & BENEFIT HIGHLIGHTS ──────── */}
      <main className="max-w-xl mx-auto px-4 py-3 space-y-5 w-full flex-1">
        {/* Virtues Section */}
        <section className="text-white p-5 sm:p-6 rounded-[28px] space-y-4 shadow-xl relative overflow-hidden bg-gradient-to-br from-[#296E37] via-[#468B3A] to-[#7EC242] border border-white/20">
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

      {/* Quick Submit Swalath Modal */}
      <SubmitSwalathModal
        open={showSubmitModal}
        onOpenChange={setShowSubmitModal}
      />

      <Footer />
    </div>
  );
}
