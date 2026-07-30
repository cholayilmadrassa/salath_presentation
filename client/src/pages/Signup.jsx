import { useState, useEffect } from "react";
import { api } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useTenant } from "../context/TenantContext.jsx";
import { useNavigate, Link } from "react-router-dom";
import Card from "../components/Card.jsx";
import { User, Phone, MapPin, UserPlus, LogIn, Building2, CheckCircle2, ShieldCheck } from "lucide-react";

export default function Signup() {
  const { login } = useAuth();
  const { activeTenant } = useTenant();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(1);

  const [approvedEvents, setApprovedEvents] = useState([]);
  const [selectedTenantSlug, setSelectedTenantSlug] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    whatsapp: "",
    place: "",
    mahallu: "",
    panchayath: "",
    district: "",
    state: "",
    country: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!activeTenant) {
      api('/events/public-approved')
        .then((res) => {
          if (Array.isArray(res)) {
            setApprovedEvents(res);
            if (res.length > 0) {
              setSelectedTenantSlug(res[0].slug);
            }
          }
        })
        .catch(() => {});
    }
  }, [activeTenant]);

  const handleNumberChange = (field) => (e) => {
    const value = e.target.value;
    if (/^\d{0,10}$/.test(value)) {
      const updatedPhone = field === 'phone' ? value : form.phone;
      const updatedWhatsapp = field === 'whatsapp' ? value : form.whatsapp;

      setForm((prev) => ({
        ...prev,
        [field]: value,
        email: prev.email || `${updatedPhone || updatedWhatsapp || Date.now()}@member.salath`,
        password: prev.password || `pass_${updatedPhone || '123456'}`,
      }));
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const targetSlug = activeTenant ? activeTenant.slug : selectedTenantSlug;
      if (!targetSlug) {
        throw new Error("ദയവായി ഒരു ഈവന്റ് തിരഞ്ഞെടുക്കുക (Please select an approved event)");
      }

      const generatedEmail = form.email || `${form.phone || form.whatsapp || Date.now()}@member.salath`;
      const generatedPassword = form.password || `pass_${form.phone || '123456'}`;

      const payload = {
        ...form,
        email: generatedEmail,
        password: generatedPassword,
        tenantSlug: targetSlug,
      };

      const data = await api("/auth/register", { method: "POST", body: payload });
      login(data.token, data.user);

      navigate("/dashboard");
    } catch (e) {
      setError(e.message || "റജിസ്ട്രേഷൻ പരാജയപ്പെട്ടു. ദയവായി വീണ്ടും ശ്രമിക്കുക.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-lg mx-auto px-4 py-6 sm:py-10 font-ml" style={{ color: '#1A1A1A' }}>

      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-2xl text-white flex items-center justify-center font-bold text-xl mx-auto mb-3 shadow-md" style={{ backgroundColor: '#6E9B37' }}>
          ☪
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold" style={{ color: '#1A1A1A' }}>
          {activeTenant ? `${activeTenant.name} - അംഗത്വം` : 'അംഗത്വ റജിസ്ട്രേഷൻ'}
        </h1>
        <p className="text-xs font-medium mt-1" style={{ color: '#8C8C8C' }}>
          {activeTenant ? `Register as a participant for ${activeTenant.name}` : 'അംഗീകൃത ഈവന്റിൽ പങ്കാളിയാകൂ'}
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-3 mb-5">
        <button
          type="button"
          onClick={() => setActiveStep(1)}
          className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-full transition"
          style={{
            backgroundColor: activeStep === 1 ? '#6E9B37' : '#E8EDE2',
            color: activeStep === 1 ? '#FFFFFF' : '#1A1A1A',
          }}
        >
          <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px]" style={{ backgroundColor: activeStep === 1 ? '#FFC107' : '#FFFFFF', color: '#1A1A1A' }}>1</span>
          <span>വ്യക്തിഗത വിവരങ്ങൾ</span>
        </button>

        <span className="text-xs" style={{ color: '#8C8C8C' }}>→</span>

        <button
          type="button"
          onClick={() => setActiveStep(2)}
          className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-full transition"
          style={{
            backgroundColor: activeStep === 2 ? '#6E9B37' : '#E8EDE2',
            color: activeStep === 2 ? '#FFFFFF' : '#1A1A1A',
          }}
        >
          <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px]" style={{ backgroundColor: activeStep === 2 ? '#FFC107' : '#FFFFFF', color: '#1A1A1A' }}>2</span>
          <span>സ്ഥലം / മഹല്ല്</span>
        </button>
      </div>

      <Card className="!p-5 sm:!p-7 shadow-touch space-y-5" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8EDE2' }}>
        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 text-red-700 text-xs font-semibold border border-red-200">
            {error}
          </div>
        )}

        {/* Event Banner or Event Selection Dropdown */}
        {activeTenant ? (
          <div className="p-3 rounded-2xl flex items-center justify-between text-xs font-bold" style={{ backgroundColor: '#E8EDE2', color: '#6E9B37', border: '1px solid #6E9B37' }}>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              <span>{activeTenant.name}</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white text-emerald-800 border border-emerald-200">
              {activeTenant.slug}
            </span>
          </div>
        ) : (
          <div className="space-y-1.5">
            <label className="block text-xs font-bold flex items-center gap-1.5" style={{ color: '#1A1A1A' }}>
              <Building2 className="w-4 h-4" style={{ color: '#6E9B37' }} />
              <span>ഈവന്റ് ടീം തിരഞ്ഞെടുക്കുക (Select Approved Event) *</span>
            </label>
            {approvedEvents.length === 0 ? (
              <div className="p-3 rounded-xl bg-amber-50 text-amber-800 text-xs font-medium border border-amber-200">
                ശ്രദ്ധിക്കുക: നിലവിൽ അംഗീകൃത ഈവന്റുകൾ ലഭ്യമല്ല. ആദ്യം Super Admin പുതിയ ഈവന്റ് അംഗീകരിക്കേണ്ടതാണ്.
              </div>
            ) : (
              <select
                className="input font-semibold"
                value={selectedTenantSlug}
                onChange={(e) => setSelectedTenantSlug(e.target.value)}
                required
              >
                {approvedEvents.map((ev) => (
                  <option key={ev.slug} value={ev.slug}>
                    {ev.name} ({ev.slug})
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">

          {/* Step 1: Personal Info */}
          {activeStep === 1 && (
            <div className="space-y-4 animate-slide-down">
              <div>
                <label className="block text-xs font-bold mb-1 flex items-center gap-1.5" style={{ color: '#1A1A1A' }}>
                  <User className="w-3.5 h-3.5" style={{ color: '#6E9B37' }} />
                  <span>നിങ്ങളുടെ പേര് (Name) *</span>
                </label>
                <input
                  className="input font-medium"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="മുഴുവൻ പേര് രേഖപ്പെടുത്തുക"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1 flex items-center gap-1.5" style={{ color: '#1A1A1A' }}>
                  <Phone className="w-3.5 h-3.5" style={{ color: '#6E9B37' }} />
                  <span>ഫോൺ നമ്പർ (Phone No) *</span>
                </label>
                <input
                  className="input font-medium"
                  type="tel"
                  inputMode="numeric"
                  value={form.phone}
                  onChange={handleNumberChange("phone")}
                  minLength={10}
                  maxLength={10}
                  required
                  placeholder="10 അക്ക ഫോൺ നമ്പർ"
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1 flex items-center gap-1.5" style={{ color: '#1A1A1A' }}>
                  <Phone className="w-3.5 h-3.5" style={{ color: '#6E9B37' }} />
                  <span>വാട്സ്ആപ് നമ്പർ (WhatsApp No) *</span>
                </label>
                <input
                  className="input font-medium"
                  type="tel"
                  inputMode="numeric"
                  value={form.whatsapp}
                  onChange={handleNumberChange("whatsapp")}
                  minLength={10}
                  maxLength={10}
                  required
                  placeholder="10 അക്ക വാട്സ്ആപ് നമ്പർ"
                />
              </div>

              <button
                type="button"
                onClick={() => setActiveStep(2)}
                className="btn-primary w-full py-3.5 text-xs font-bold rounded-xl mt-2"
                style={{ backgroundColor: '#6E9B37', color: '#FFFFFF' }}
              >
                അടുത്തത്: സ്ഥല വിവരങ്ങൾ →
              </button>
            </div>
          )}

          {/* Step 2: Location Details */}
          {activeStep === 2 && (
            <div className="space-y-3.5 animate-slide-down">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1" style={{ color: '#1A1A1A' }}>
                    സ്ഥലം (Place) *
                  </label>
                  <input
                    className="input"
                    value={form.place}
                    onChange={(e) => setForm({ ...form, place: e.target.value })}
                    placeholder="ഉദാ: പടിഞ്ഞാറത്തറ"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1" style={{ color: '#1A1A1A' }}>
                    മഹല്ല് (Mahallu) *
                  </label>
                  <input
                    className="input"
                    value={form.mahallu}
                    onChange={(e) => setForm({ ...form, mahallu: e.target.value })}
                    placeholder="മഹല്ല് പേര്"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1" style={{ color: '#1A1A1A' }}>
                    പഞ്ചായത്ത്‌ (Panchayath) *
                  </label>
                  <input
                    className="input"
                    value={form.panchayath}
                    onChange={(e) => setForm({ ...form, panchayath: e.target.value })}
                    placeholder="പഞ്ചായത്ത്"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1" style={{ color: '#1A1A1A' }}>
                    ജില്ല (District) *
                  </label>
                  <input
                    className="input"
                    value={form.district}
                    onChange={(e) => setForm({ ...form, district: e.target.value })}
                    placeholder="ഉദാ: വയനാട്"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1" style={{ color: '#1A1A1A' }}>
                    സംസ്ഥാനം (State) *
                  </label>
                  <input
                    className="input"
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    placeholder="ഉദാ: കേരളം"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1" style={{ color: '#1A1A1A' }}>
                    രാജ്യം (Country) *
                  </label>
                  <input
                    className="input"
                    value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                    placeholder="ഉദാ: ഇന്ത്യ"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveStep(1)}
                  className="btn-secondary py-3.5 px-4 text-xs font-bold shrink-0 rounded-xl"
                >
                  ← തിരികെ
                </button>
                <button
                  type="submit"
                  className="w-full py-3.5 text-xs font-bold shadow-md rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95"
                  style={{ backgroundColor: '#6E9B37', color: '#FFFFFF' }}
                  disabled={loading}
                >
                  <UserPlus className="w-4 h-4 text-white" />
                  <span>{loading ? "റജിസ്റ്റർ ചെയ്യുന്നു..." : "റജിസ്ട്രേഷൻ പൂർത്തിയാക്കൂ"}</span>
                </button>
              </div>
            </div>
          )}

        </form>

        <div className="pt-4 border-t text-center" style={{ borderColor: '#E8EDE2' }}>
          <p className="text-xs font-medium" style={{ color: '#8C8C8C' }}>
            നേരത്തെ അക്കൗണ്ട് ഉണ്ടോ?{" "}
            <Link to="/login" className="font-bold hover:underline inline-flex items-center gap-1" style={{ color: '#6E9B37' }}>
              <span>ലോഗിൻ ചെയ്യൂ</span>
              <LogIn className="w-3.5 h-3.5" />
            </Link>
          </p>
        </div>
      </Card>
    </main>
  );
}
