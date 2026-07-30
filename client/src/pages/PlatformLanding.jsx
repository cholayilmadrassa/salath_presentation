import { useEffect, useState } from "react";
import { api } from "../api.js";
import { getHijriDate } from "../utils/hijri.js";
import { Link } from "react-router-dom";
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
      .catch(() => {});

    api("/counts/leaderboard/all?limit=100")
      .then((allRows) => {
        if (Array.isArray(allRows)) {
          const sum = allRows.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
          setTotalEventCount(sum);
        }
      })
      .catch(() => {});
  }, []);

  const rootDomain = import.meta.env.VITE_PLATFORM_ROOT_DOMAIN || 'salath.vercel.app';

  return (
    <div className="min-h-screen flex flex-col pb-24 md:pb-0" style={{ backgroundColor: '#DDF4E7', color: '#124170' }}>
      
      {/* Platform Top Bar */}
      <header className="sticky top-0 z-30 px-4 pb-4 backdrop-blur-lg border-b safe-top" style={{ backgroundColor: 'rgba(221, 244, 231, 0.95)', borderColor: 'rgba(38, 102, 127, 0.2)' }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="Swalath Portal"
              className="w-10 h-10 rounded-2xl object-cover shadow-md shrink-0"
            />
            <div>
              <h1 className="font-extrabold text-base leading-none" style={{ color: '#124170' }}>
                സ്വലാത്ത് സമർപ്പണ പോർട്ടൽ
              </h1>
              <span className="text-[10px] font-semibold" style={{ color: '#26667F' }}>
                Multi-Tenant Event Platform
              </span>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <Link
              to="/login"
              className="px-3.5 py-2 rounded-xl text-xs font-bold transition"
              style={{ backgroundColor: 'rgba(38, 102, 127, 0.12)', color: '#124170' }}
            >
              Login
            </Link>
            <Link
              to="/register-team"
              className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md transition active:scale-95 flex items-center gap-1"
              style={{ backgroundColor: '#67C090' }}
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
            background: 'linear-gradient(135deg, #124170, #26667F, #67C090)',
            boxShadow: '0 25px 60px rgba(38, 102, 127, 0.35)',
            border: '1px solid rgba(221, 244, 231, 0.2)'
          }}
        >
          {/* Decorative glows */}
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl pointer-events-none" style={{ backgroundColor: 'rgba(103, 192, 144, 0.25)' }} />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full blur-3xl pointer-events-none" style={{ backgroundColor: 'rgba(221, 244, 231, 0.2)' }} />

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-extrabold bg-white/15 backdrop-blur-md border border-white/20 uppercase tracking-wider mx-auto" style={{ color: '#67C090' }}>
            <Sparkles className="w-4 h-4 text-emerald-300 animate-spin" />
            <span>ഡിജിറ്റൽ സ്വലാത്ത് ഏകോപന പ്രസ്ഥാനം</span>
          </div>

          <div className="max-w-2xl mx-auto space-y-3">
            <h1 className="text-3xl sm:text-5xl font-bold leading-tight tracking-tight text-white font-ml">
              നിങ്ങളുടെ ഈവന്റിനായി സ്വന്തം സബ്ഡൊമൈൻ പോർട്ടൽ ആരംഭിക്കൂ
            </h1>
            <p className="text-sm sm:text-base font-medium leading-relaxed" style={{ color: '#DDF4E7' }}>
              സംഘടനകൾ, മഹല്ല് സമിതികൾ, കാമ്പയിൻ ടീമുകൾ എന്നിവർക്ക് തത്സമയ കൗണ്ടർ, ലീഡർബോർഡ്, വ്യക്തിഗത വിവരശേഖരണം എന്നിവയോടെ സൗജന്യമായി പോർട്ടൽ സ്വന്തമാക്കാം.
            </p>
          </div>

          {/* Total Counter Summary */}
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 bg-black/25 backdrop-blur-md p-4 rounded-2xl border border-white/15 mx-auto max-w-lg w-full justify-around">
            <div className="text-center">
              <span className="text-[10px] uppercase tracking-wider font-extrabold block" style={{ color: '#DDF4E7' }}>
                Total Platform Salath Count
              </span>
              <span className="text-2xl sm:text-3xl font-black" style={{ color: '#67C090' }}>
                {Number(totalEventCount).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="w-px h-8 bg-white/20 hidden sm:block" />
            <div className="text-center">
              <span className="text-[10px] uppercase tracking-wider font-extrabold block" style={{ color: '#DDF4E7' }}>
                Today's Hijri Date
              </span>
              <span className="text-lg sm:text-xl font-extrabold font-arabic" dir="rtl" style={{ color: '#67C090' }}>
                {hijri.formattedAr}
              </span>
            </div>
          </div>

          {/* Marketing Hero CTA Grid */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 max-w-md mx-auto">
            <Link
              to="/register-team"
              className="w-full sm:w-auto px-6 py-4 rounded-2xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 shadow-xl transition transform active:scale-95 text-white"
              style={{ backgroundColor: '#67C090' }}
            >
              <Building2 className="w-4 h-4" />
              <span>Register Event Team</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/signup"
              className="w-full sm:w-auto px-6 py-4 rounded-2xl text-xs sm:text-sm font-bold bg-white/15 hover:bg-white/25 border border-white/20 text-white flex items-center justify-center gap-2 transition active:scale-95"
            >
              <Users className="w-4 h-4" />
              <span>Register Member</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="px-4 py-8 max-w-5xl mx-auto w-full space-y-6">
        <div className="text-center space-y-1">
          <span className="text-xs font-extrabold uppercase tracking-wider" style={{ color: '#26667F' }}>
            Key Platform Features
          </span>
          <h2 className="text-xl sm:text-2xl font-black" style={{ color: '#124170' }}>
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
              desc: 'സുരക്ഷിതമായ അഡ്മിൻ വേരിഫിക്കേഷന് ശേഷം മാത്രം ഈവന്റ് പ്രവേശനം ഉറപ്പുവരുത്തുന്നു.',
            },
          ].map((feat, i) => (
            <div
              key={i}
              className="bg-white rounded-3xl p-6 shadow-xs space-y-3 border"
              style={{ borderColor: 'rgba(38, 102, 127, 0.15)' }}
            >
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-xs" style={{ backgroundColor: '#DDF4E7', color: '#26667F' }}>
                {feat.icon}
              </div>
              <h3 className="text-base font-extrabold" style={{ color: '#124170' }}>{feat.title}</h3>
              <p className="text-xs font-medium leading-relaxed" style={{ color: '#26667F' }}>{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Approved Events Directory */}
      <section className="px-4 py-6 max-w-5xl mx-auto w-full space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold" style={{ color: '#124170' }}>
              Active Approved Events
            </h2>
            <p className="text-xs font-medium" style={{ color: '#26667F' }}>
              Join active campaign portals
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold font-mono" style={{ backgroundColor: 'rgba(38, 102, 127, 0.12)', color: '#26667F' }}>
            {approvedEvents.length} Active Events
          </span>
        </div>

        {approvedEvents.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl text-center space-y-3 border" style={{ borderColor: 'rgba(38, 102, 127, 0.15)' }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto" style={{ backgroundColor: '#DDF4E7', color: '#26667F' }}>
              <Building2 className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold" style={{ color: '#124170' }}>No active approved events available currently.</p>
            <p className="text-[11px]" style={{ color: '#26667F' }}>Be the first to register your event team!</p>
            <Link
              to="/register-team"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-sm mt-2"
              style={{ backgroundColor: '#67C090' }}
            >
              <Plus className="w-4 h-4" />
              <span>Register Event Team</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {approvedEvents.map((ev) => (
              <div
                key={ev._id || ev.slug}
                className="bg-white rounded-3xl p-5 shadow-xs border flex flex-col justify-between space-y-4 transition"
                style={{ borderColor: 'rgba(38, 102, 127, 0.15)' }}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-xl text-white flex items-center justify-center font-bold text-sm" style={{ backgroundColor: '#67C090' }}>
                      ☪
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold" style={{ backgroundColor: '#DDF4E7', color: '#26667F' }}>
                      {ev.slug}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-sm" style={{ color: '#124170' }}>{ev.name}</h3>
                  <p className="text-[11px] font-medium leading-relaxed line-clamp-2" style={{ color: '#26667F' }}>
                    {ev.branding?.tagline || 'സ്വലാത്ത് ഏകോപന കാമ്പയിൻ'}
                  </p>
                </div>

                <a
                  href={`http://${ev.slug}.${rootDomain}`}
                  className="w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 text-white shadow-sm transition active:scale-95"
                  style={{ backgroundColor: '#67C090' }}
                >
                  <span>Enter Event Portal</span>
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
          style={{ color: '#26667F' }}
        >
          <ShieldCheck className="w-4 h-4" style={{ color: '#67C090' }} />
          <span>Platform Master Access (Super Admin Login)</span>
        </Link>
      </section>

      <Footer />
    </div>
  );
}
