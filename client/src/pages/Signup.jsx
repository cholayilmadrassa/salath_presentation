import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useTenant } from "../context/TenantContext.jsx";
import { api } from "../api.js";
import { User, Phone, MapPin, Building2, CheckCircle2, Lock, ArrowRight, Star } from "lucide-react";

export default function Signup() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { activeTenant } = useTenant();

  const [approvedEvents, setApprovedEvents] = useState([]);
  const [selectedTenantSlug, setSelectedTenantSlug] = useState("");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [place, setPlace] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!activeTenant) {
      api("/events/public-approved")
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Please enter your full name");
      return;
    }
    if (!mobile.trim() || mobile.trim().length < 10) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }
    if (!place.trim()) {
      setError("Please enter your place / Mahallu");
      return;
    }

    const targetSlug = activeTenant ? activeTenant.slug : selectedTenantSlug;
    if (!targetSlug) {
      setError("Please select an event portal to join");
      return;
    }

    setLoading(true);

    try {
      const sanitizedMobile = mobile.replace(/\D/g, "");
      const generatedEmail = `${sanitizedMobile}.${targetSlug}@salath.app`;
      const generatedPassword = `Salath@${sanitizedMobile.slice(-4) || '1234'}`;

      const payload = {
        name: name.trim(),
        mobile: sanitizedMobile,
        place: place.trim(),
        email: generatedEmail,
        password: generatedPassword,
        tenantSlug: targetSlug,
      };

      const data = await api("/auth/register", { method: "POST", body: payload });
      login(data.token, data.user);

      navigate("/dashboard");
    } catch (e) {
      setError(e.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const currentEventTitle = activeTenant ? activeTenant.name : (approvedEvents.find(e => e.slug === selectedTenantSlug)?.name || 'Event Registration');

  return (
    <main className="max-w-lg mx-auto px-4 safe-top pb-6 sm:py-10 font-ml" style={{ backgroundColor: '#DDF4E7', color: '#124170' }}>

      {/* Header */}
      <div className="text-center mb-6">
        <img
          src="/logo.png"
          alt="Swalath Portal"
          className="w-14 h-14 rounded-2xl object-cover mx-auto mb-3 shadow-md"
        />
        <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider" style={{ backgroundColor: 'rgba(38, 102, 127, 0.12)', color: '#26667F' }}>
          {activeTenant ? activeTenant.slug : 'Member Registration'}
        </span>
        <h1 className="text-2xl font-extrabold mt-1" style={{ color: '#124170' }}>
          Member Registration
        </h1>
        <p className="text-xs font-medium mt-1" style={{ color: '#26667F' }}>
          Join {currentEventTitle} Portal
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm space-y-5" style={{ border: '1px solid rgba(38, 102, 127, 0.15)' }}>
        {error && (
          <div className="p-3.5 bg-red-50 text-red-700 text-xs rounded-2xl border border-red-200 font-bold leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Event Selector Dropdown if on root platform */}
          {!activeTenant && (
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold flex items-center gap-1.5" style={{ color: '#124170' }}>
                <Building2 className="w-4 h-4" style={{ color: '#67C090' }} />
                <span>Select Event:</span>
              </label>

              {approvedEvents.length === 0 ? (
                <div className="p-3 rounded-2xl text-xs font-bold text-center" style={{ backgroundColor: '#DDF4E7', color: '#26667F' }}>
                  Searching active approved events...
                </div>
              ) : (
                <select
                  value={selectedTenantSlug}
                  onChange={(e) => setSelectedTenantSlug(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#67C090] transition"
                  style={{ backgroundColor: '#DDF4E7', color: '#124170', border: '1.5px solid rgba(38, 102, 127, 0.2)' }}
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

          {/* Name Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold flex items-center gap-1.5" style={{ color: '#124170' }}>
              <User className="w-4 h-4" style={{ color: '#67C090' }} />
              <span>Full Name:</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Muhammed Faisal"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#67C090] transition"
              style={{ backgroundColor: '#DDF4E7', color: '#124170', border: '1.5px solid rgba(38, 102, 127, 0.2)' }}
            />
          </div>

          {/* Mobile Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold flex items-center gap-1.5" style={{ color: '#124170' }}>
              <Phone className="w-4 h-4" style={{ color: '#67C090' }} />
              <span>Mobile Number:</span>
            </label>
            <input
              type="tel"
              required
              maxLength="10"
              placeholder="10-digit mobile number"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#67C090] transition"
              style={{ backgroundColor: '#DDF4E7', color: '#124170', border: '1.5px solid rgba(38, 102, 127, 0.2)' }}
            />
          </div>

          {/* Place Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold flex items-center gap-1.5" style={{ color: '#124170' }}>
              <MapPin className="w-4 h-4" style={{ color: '#67C090' }} />
              <span>Place / Mahallu:</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Padinjarathara"
              value={place}
              onChange={(e) => setPlace(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#67C090] transition"
              style={{ backgroundColor: '#DDF4E7', color: '#124170', border: '1.5px solid rgba(38, 102, 127, 0.2)' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 text-white font-extrabold text-sm rounded-2xl shadow-md transition active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            style={{ backgroundColor: '#67C090' }}
          >
            {loading ? (
              <span>Registering...</span>
            ) : (
              <>
                <span>Complete Registration</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-3 border-t border-stone-100 text-center space-y-2">
          <p className="text-xs font-medium" style={{ color: '#26667F' }}>
            Already registered?
          </p>
          <Link
            to="/login"
            className="inline-block text-xs font-extrabold hover:underline"
            style={{ color: '#67C090' }}
          >
            Log In
          </Link>
        </div>
      </div>
    </main>
  );
}
