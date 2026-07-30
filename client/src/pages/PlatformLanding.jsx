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
      .catch(() => {});
  }, []);

  const rootDomain = import.meta.env.VITE_PLATFORM_ROOT_DOMAIN || 'salath.vercel.app';

  return (
    <div className="min-h-screen flex flex-col pb-24 md:pb-0" style={{ backgroundColor: '#F7F5EC', color: '#1A1A1A' }}>
      
      {/* Platform Top Bar */}
      <header className="sticky top-0 z-30 px-4 pb-4 backdrop-blur-lg border-b safe-top" style={{ backgroundColor: 'rgba(247, 245, 236, 0.95)', borderColor: '#E8EDE2' }}>
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
            <p className="text-sm sm:text-base font-medium leading-relaxed" style={{ color: '#E8EDE2' }}>
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
                  href={`http://${ev.slug}.${rootDomain}`}
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
