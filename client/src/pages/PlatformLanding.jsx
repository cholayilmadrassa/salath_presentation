import { useEffect, useState } from "react";
import { api } from "../api.js";
import { getHijriDate } from "../utils/hijri.js";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles, Users, Building2, Flame, Globe, ShieldCheck,
  Plus, ArrowRight
} from "lucide-react";
import Footer from "../components/Footer.jsx";

export default function PlatformLanding() {
  const [totalEventCount, setTotalEventCount] = useState(0);
  const [approvedEvents, setApprovedEvents] = useState([]);

  const hijri = getHijriDate();

  useEffect(() => {
    api('/events/public-approved')
      .then((res) => {
        if (Array.isArray(res)) setApprovedEvents(res);
      })
      .catch(() => { });

    api("/counts/leaderboard/all?limit=100")
      .then((allRows) => {
        if (Array.isArray(allRows)) {
          const sum = allRows.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
          setTotalEventCount(sum);
        }
      })
      .catch(() => { });
  }, []);

  const rootDomain = import.meta.env.VITE_PLATFORM_ROOT_DOMAIN || 'salath.vercel.app';

  return (
    <div className="min-h-screen flex flex-col pb-16 md:pb-0 font-ml">
      {/* Platform Top Bar */}
      <header className="sticky top-0 z-30 px-4 py-2.5 backdrop-blur-lg border-b border-border safe-top bg-background/95">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src="/appLogo.png"
              alt="Swalath Portal"
              className="w-10 h-10 rounded-2xl object-cover shadow-md shrink-0 border border-primary/20"
            />
            <div>
              <h1 className="font-extrabold text-base leading-none text-foreground">
                സ്വലാത്ത് സമർപ്പണ പോർട്ടൽ
              </h1>
              <span className="text-[10px] font-semibold text-muted-foreground">
                Multi-Tenant Event Platform
              </span>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <Button variant="soft" size="sm" asChild>
              <Link to="/login">Login</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/register-team">
                <Building2 className="w-3.5 h-3.5 mr-1" />
                <span>Event Register</span>
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Marketing Hero Banner */}
      <section className="px-4 pt-8 pb-6 max-w-5xl mx-auto w-full">
        <div
          className="text-white rounded-[32px] p-6 sm:p-10 shadow-2xl relative overflow-hidden text-center space-y-6 bg-gradient-to-br from-[#296E37] via-[#468B3A] to-[#7EC242] border border-white/20"
        >
          {/* Decorative glows */}
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl pointer-events-none bg-[#D4AF37]/20" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full blur-3xl pointer-events-none bg-primary/20" />

          <Badge variant="muted" className="bg-black/25 backdrop-blur-md border-[#D4AF37]/40 text-[#F5E6B3] gap-2 py-1.5 px-4 text-xs font-extrabold uppercase tracking-wider mx-auto">
            <Sparkles className="w-4 h-4 text-[#D4AF37] animate-spin" />
            <span>ഡിജിറ്റൽ സ്വലാത്ത് ഏകോപന പ്രസ്ഥാനം</span>
          </Badge>

          <div className="max-w-2xl mx-auto space-y-3">
            <h1 className="text-3xl sm:text-5xl font-bold leading-tight tracking-tight text-white font-ml">
              നിങ്ങളുടെ സ്വന്തം നാട്ടിൽ ഒരു <span className="text-[#FFFF00]">സ്വലാത്ത് ക്യാമ്പയിൻ</span> നടത്തിയാലോ<span className="text-[#FFFF00]">?</span></h1>
            <p className="text-sm sm:text-base font-medium leading-relaxed text-[#E6F4ED]">
സംഘടനകൾക്കും മഹല്ല് കമ്മിറ്റികൾക്കും കാമ്പയിൻ ടീമുകൾക്കും അവരുടെ പ്രവർത്തനങ്ങൾ കൂടുതൽ എളുപ്പത്തിലും കാര്യക്ഷമമായും നടത്താൻ സ്വന്തം ഓൺലൈൻ പോർട്ടൽ — തത്സമയ കൗണ്ട് , ടോപ്പ് സ്കോർ , വിവരശേഖരണം തുടങ്ങി ആവശ്യമായ എല്ലാം ഒരിടത്ത്.            </p>
          </div>

          {/* Total Counter Summary */}
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 bg-black/25 backdrop-blur-md p-4 rounded-2xl border border-white/15 mx-auto max-w-lg w-full justify-around">
            <div className="text-center">
              <span className="text-[10px] uppercase tracking-wider font-extrabold block text-[#E6F4ED]">
                Total Platform Swalath Count
              </span>
              <span className="text-2xl sm:text-3xl font-black text-[#D4AF37]">
                {Number(totalEventCount).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="w-px h-8 bg-white/20 hidden sm:block" />
            <div className="text-center">
              <span className="text-[10px] uppercase tracking-wider font-extrabold block text-[#E6F4ED]">
                Today's Hijri Date
              </span>
              <span className="text-lg sm:text-xl font-extrabold font-arabic text-[#F5E6B3]" dir="rtl">
                {hijri.formattedAr}
              </span>
            </div>
          </div>

          {/* Marketing Hero CTA Grid */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 max-w-md mx-auto">
            <Button asChild size="lg" className="w-full sm:w-auto bg-[#D4AF37] text-[#07351F] hover:bg-[#E2BE46]">
              <Link to="/register-team">
                <Building2 className="w-4 h-4 mr-2" />
                <span>Register Event Team</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>

            <Button variant="ghost" size="lg" asChild className="w-full sm:w-auto bg-white/15 hover:bg-white/25 border border-white/20 text-white">
              <Link to="/signup">
                <Users className="w-4 h-4 mr-2" />
                <span>Register Member</span>
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="px-4 py-8 max-w-5xl mx-auto w-full space-y-6">
        <div className="text-center space-y-1">
          <span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
            Key Platform Features
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-foreground">
            ഡിജിറ്റൽ സ്വലാത്ത് പ്ലാറ്റ്‌ഫോം നൽകുന്ന സൗകര്യങ്ങൾ
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              icon: <Globe className="w-6 h-6 text-primary" />,
              title: 'സ്വന്തം സബ്ഡൊമൈൻ URL',
              desc: 'നിങ്ങളുടെ സംഘടനയുടെ പേരിൽ ഉദാ: noorulislam.swalath.app പോലെ സബ്ഡൊമൈൻ ലഭിക്കുന്നു.',
            },
            {
              icon: <Flame className="w-6 h-6 text-primary" />,
              title: 'തത്സമയ ലൈവ് കൗണ്ടർ',
              desc: 'മൊബൈൽ ഡിജിറ്റൽ തസ്ബീഹ് കൗണ്ടർ വഴി ഓരോ അംഗത്തിന്റെയും സ്വലാത്തുകൾ തത്സമയം കൂട്ടിച്ചേർക്കാം.',
            },
            {
              icon: <ShieldCheck className="w-6 h-6 text-primary" />,
              title: 'Super Admin അംഗീകാരം',
              desc: 'സുരക്ഷിതമായ അഡ്മിൻ വേരിഫിക്കേഷന് ശേഷം മാത്രം ഈവന്റ് പ്രവേശനം ഉറപ്പുവരുത്തുന്നു.',
            },
          ].map((feat, i) => (
            <Card key={i}>
              <CardContent className="p-6 space-y-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-xs bg-primary/15 text-primary">
                  {feat.icon}
                </div>
                <h3 className="text-base font-extrabold text-foreground">{feat.title}</h3>
                <p className="text-xs font-medium leading-relaxed text-muted-foreground">{feat.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Approved Events Directory */}
      <section className="px-4 py-6 max-w-5xl mx-auto w-full space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-foreground">
              Active Approved Events
            </h2>
            <p className="text-xs font-medium text-muted-foreground">
              Join active campaign portals
            </p>
          </div>
          <Badge variant="muted" className="font-mono text-xs font-bold">
            {approvedEvents.length} Active Events
          </Badge>
        </div>

        {approvedEvents.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto bg-primary/15 text-primary">
                <Building2 className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-foreground">No active approved events available currently.</p>
              <p className="text-[11px] text-muted-foreground">Be the first to register your event team!</p>
              <Button asChild size="sm" className="mt-2">
                <Link to="/register-team">
                  <Plus className="w-4 h-4 mr-1.5" />
                  <span>Register Event Team</span>
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {approvedEvents.map((ev) => (
              <Card key={ev._id || ev.slug} className="flex flex-col justify-between">
                <CardContent className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                        ☪
                      </div>
                      <Badge variant="muted" className="font-mono text-[10px]">
                        {ev.slug}
                      </Badge>
                    </div>

                    <h3 className="font-extrabold text-sm text-foreground">{ev.name}</h3>
                    <p className="text-[11px] font-medium leading-relaxed line-clamp-2 text-muted-foreground">
                      {ev.branding?.tagline || 'സ്വലാത്ത് ഏകോപന കാമ്പയിൻ'}
                    </p>
                  </div>

                  <Button asChild size="sm" className="w-full mt-2">
                    <a href={`http://${ev.slug}.${rootDomain}`}>
                      <span>Enter Event Portal</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
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
