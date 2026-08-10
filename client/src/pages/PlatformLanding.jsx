import { useEffect, useState } from "react";
import { api } from "../api.js";
import { getHijriDate } from "../utils/hijri.js";
import { Link } from "react-router-dom";
import { useTenant } from "../context/TenantContext.jsx";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles, Users, Building2, Flame, Globe, ShieldCheck,
  Plus, ArrowRight, Bell, Trophy
} from "lucide-react";
import Footer from "../components/Footer.jsx";

function DigitCountTicker({ value, isLoading, textColor = 'text-[#D4AF37]' }) {
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
      <span className={`text-2xl sm:text-3xl font-black ${textColor} opacity-30 animate-pulse font-mono tracking-wider select-none`}>
        00,000,000
      </span>
    );
  }

  return (
    <span className={`text-2xl sm:text-3xl font-black ${textColor} font-mono`}>
      {displayValue.toLocaleString('en-IN')}
    </span>
  );
}

export default function PlatformLanding() {
  const { activeTenant } = useTenant();
  const [totalEventCount, setTotalEventCount] = useState(0);
  const [totalMemberCount, setTotalMemberCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const hijri = activeTenant ? getHijriDate() : null;

  useEffect(() => {
    setLoading(true);

    if (activeTenant) {
      api("/counts/leaderboard/all?limit=100")
        .then((allRows) => {
          if (Array.isArray(allRows)) {
            const sum = allRows.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
            setTotalEventCount(sum);
            setTotalMemberCount(allRows.length);
          }
        })
        .catch(() => { })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [activeTenant]);

  const rootDomain = import.meta.env.VITE_PLATFORM_ROOT_DOMAIN


  return (
    <div className="min-h-screen flex flex-col font-ml">
      {/* Platform Top Bar */}
      <header className="sticky top-0 z-30 px-4 py-3 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/appLogo.png"
              alt="Platform Logo"
              className="w-10 h-10 rounded-2xl object-cover shadow-sm border border-primary/20"
            />
            <div>
              <h1 className="font-extrabold text-sm leading-tight text-foreground">
                സ്വലാത്ത് പോർട്ടൽ
              </h1>
              <p className="text-[10px] text-muted-foreground font-semibold">
                Salath Campaign Network
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Platform Hero Banner */}
      <section className="px-4 py-8 max-w-5xl mx-auto w-full text-center">
        <div className="text-white rounded-[32px] p-6 sm:p-10 shadow-2xl relative overflow-hidden bg-gradient-to-br from-[#296E37] via-[#468B3A] to-[#7EC242] border border-white/20 space-y-6">
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl pointer-events-none animate-pulse-glow bg-[#D4AF37]/20" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full blur-3xl pointer-events-none animate-pulse-glow bg-primary/20" />

          <div className="inline-flex items-center gap-2 bg-black/25 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20 text-xs font-bold text-[#F5E6B3]">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>മീലാദ് കാമ്പയിൻ 2026</span>
          </div>

          <div className="space-y-2 max-w-2xl mx-auto">
            <h1 className="text-3xl sm:text-5xl font-black leading-tight text-white ">
              നാടൊന്നാകെ സ്വലാത്തിൽ നിറയട്ടെ
              <br />
              <span className="text-[#F5E6B3]">നിങ്ങളുടെ ക്യാമ്പയിൻ ഇന്ന് തന്നെ ആരംഭിക്കൂ...</span>
            </h1>
            <p className="text-sm sm:text-base font-medium text-[#E6F4ED] max-w-lg mx-auto">
              വിവിധ മഹല്ലുകൾക്കും സ്ഥാപനങ്ങൾക്കുമായി സജ്ജീകരിച്ച ഡിജിറ്റൽ സ്വലാത്ത് പോർട്ടൽ ശൃംഖല.
            </p>
          </div>

          {/* Total Counter Summary — only shown when an active tenant exists */}
          {activeTenant && (
            <div className="inline-flex flex-col sm:flex-row items-center gap-4 bg-black/25 backdrop-blur-md p-4 rounded-2xl border border-white/15 mx-auto max-w-lg w-full justify-around">
              <div className="text-center">
                <span className="text-[10px] uppercase tracking-wider font-extrabold block text-[#E6F4ED]">
                  Total Swalath Count
                </span>
                <DigitCountTicker value={totalEventCount} isLoading={loading} textColor="text-[#D4AF37]" />
              </div>

              <div className="w-px h-8 bg-white/20 hidden sm:block" />

              <div className="text-center">
                <span className="text-[10px] uppercase tracking-wider font-extrabold block text-[#E6F4ED]">
                  Registered Members
                </span>
                <DigitCountTicker value={totalMemberCount} isLoading={loading} textColor="text-white" />
              </div>

              <div className="w-px h-8 bg-white/20 hidden sm:block" />

              <div className="text-center">
                <span className="text-[10px] uppercase tracking-wider font-extrabold block text-[#E6F4ED]">
                  Today's Hijri Date
                </span>
                <span className="text-lg sm:text-xl font-extrabold font-arabic text-[#F5E6B3]" dir="rtl">
                  {hijri?.formattedAr}
                </span>
              </div>
            </div>
          )}

          {/* Marketing Hero CTA Grid */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 max-w-md mx-auto">
            <Button asChild size="lg" className="w-full sm:w-auto bg-[#D4AF37] text-[#07351F] hover:bg-[#E2BE46]">
              <Link to="/register-team">
                <Building2 className="w-4 h-4 mr-2" />
                <span>Register Swalath Campain</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="px-4 py-8 max-w-5xl mx-auto w-full space-y-6">
        <div className="text-center space-y-1">
          <Badge variant="muted">Features</Badge>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            നിങ്ങൾക്ക് ലഭിക്കുന്ന പ്രധാന സേവനങ്ങൾ
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              icon: <Globe className="w-6 h-6 text-primary" />,
              title: 'സ്വന്തം സബ്ഡൊമൈൻ URL',
              desc: 'നിങ്ങളുടെ സംഘടനയുടെ പേരിൽ ഉദാ: noorulislam.swalath.online പോലെ സബ്ഡൊമൈൻ ലഭിക്കുന്നു.',
            },
            {
              icon: <Flame className="w-6 h-6 text-primary" />,
              title: 'തത്സമയ ലീഡർബോർഡ്',
              desc: 'പ്രവർത്തകർ നൽകുന്ന സ്വലാത്തുകൾ തത്സമയം ടോപ്പ് സ്കോറർ പട്ടികയായി കാണാം.',
            },
            {
              icon: <Trophy className="w-6 h-6 text-primary" />,
              title: 'വിജയികളുടെ പട്ടിക (Winners)',
              desc: 'ഏറ്റവും കൂടുതൽ സ്വലാത്ത് രേഖപ്പെടുത്തിയ മുന്നേറ്റക്കാരെയും റാങ്ക് വിജയികളെയും തത്സമയം അറിയാം.',
            },
            {
              icon: <Bell className="w-6 h-6 text-primary" />,
              title: 'തത്സമയ അറിയിപ്പുകൾ (Notifications)',
              desc: 'ക്യാമ്പയിൻ അറിയിപ്പുകളും പ്രധാന അപ്‌ഡേറ്റുകളും തത്സമയം വാർത്തകളായി ലഭിക്കുന്നു.',
            },
            {
              icon: <ShieldCheck className="w-6 h-6 text-primary" />,
              title: 'സുരക്ഷിത അഡ്മിൻ പാനൽ',
              desc: 'പഞ്ചായത്ത്, മഹല്ല് തിരിച്ചുള്ള കണക്കുകളും വിവരങ്ങളും അഡ്മിന് ലഭ്യമാണ്.',
            },
          ].map((feat, i) => (
            <Card key={i} className="bg-card">
              <CardContent className="p-6 space-y-2">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-primary/10 mb-2">
                  {feat.icon}
                </div>
                <h3 className="font-bold text-base text-foreground">{feat.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{feat.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Super Admin Quick Link Footer Bar */}
      <section className="px-4 py-4 max-w-5xl mx-auto w-full text-center">
        <Link
          to="/super-admin"
          className="inline-flex items-center gap-1.5 text-xs font-bold hover:underline text-muted-foreground"
        >
          <ShieldCheck className="w-4 h-4 text-primary" />
          <span>Platform Master Access (Super Admin Login)</span>
        </Link>
      </section>

      <Footer />
    </div>
  );
}
