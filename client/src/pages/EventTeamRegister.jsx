import { useState } from "react";
import { api } from "../api.js";
import { Link } from "react-router-dom";
import { Building2, Sparkles, User, Mail, ShieldCheck, CheckCircle2, Globe, Clock, ArrowRight } from "lucide-react";
import Card from "../components/Card.jsx";

export default function EventTeamRegister() {
  const [form, setForm] = useState({
    name: "",
    slug: "",
    title: "",
    tagline: "",
    adminName: "",
    adminEmail: "",
    adminPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [registeredTenant, setRegisteredTenant] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "slug") {
      setForm((prev) => ({
        ...prev,
        slug: value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await api("/auth/register-tenant", {
        method: "POST",
        body: form,
      });

      setRegisteredTenant(data.tenant);
    } catch (err) {
      setError(err.message || "Event team registration failed");
    } finally {
      setLoading(false);
    }
  };

  const rootDomain = import.meta.env.VITE_PLATFORM_ROOT_DOMAIN || "salath.vercel.app";

  return (
    <main className="max-w-xl mx-auto px-4 safe-top pb-10 sm:py-10 font-ml min-h-screen" style={{ backgroundColor: '#DDF4E7', color: '#124170' }}>
      
      {/* Header */}
      <div className="text-center mb-6 space-y-2">
        <img
          src="/logo.png"
          alt="Swalath Portal"
          className="w-14 h-14 rounded-2xl object-cover mx-auto shadow-md"
        />
        <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider" style={{ backgroundColor: 'rgba(38, 102, 127, 0.12)', color: '#26667F' }}>
          Organization Portal
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold" style={{ color: '#124170' }}>
          Register Event Team
        </h1>
        <p className="text-xs font-medium max-w-md mx-auto" style={{ color: '#26667F' }}>
          Create a dedicated subdomain portal for your organization, mahallu, or campaign team.
        </p>
      </div>

      {registeredTenant ? (
        <Card className="!p-8 text-center space-y-5 bg-white shadow-xl" style={{ border: '1px solid rgba(38, 102, 127, 0.15)' }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-md" style={{ backgroundColor: '#DDF4E7', color: '#67C090' }}>
            <Clock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-extrabold" style={{ color: '#124170' }}>
              Application Submitted! (Pending Approval)
            </h2>
            <p className="text-xs font-medium leading-relaxed" style={{ color: '#26667F' }}>
              Your application for <strong className="font-extrabold text-[#124170]">{registeredTenant.name}</strong> is under Super Admin review. Your portal will be activated upon approval.
            </p>
          </div>

          <div className="p-4 rounded-2xl text-left space-y-2 text-xs font-mono" style={{ backgroundColor: '#DDF4E7', border: '1px solid rgba(38, 102, 127, 0.2)' }}>
            <div className="flex items-center justify-between">
              <span style={{ color: '#26667F' }}> Assigned Subdomain:</span>
              <span className="font-bold" style={{ color: '#67C090' }}>{registeredTenant.slug}.{rootDomain}</span>
            </div>
            <div className="flex items-center justify-between">
              <span style={{ color: '#26667F' }}> Status:</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800">
                PENDING APPROVAL
              </span>
            </div>
          </div>

          <div className="pt-2">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl text-white text-xs font-bold shadow-md transition"
              style={{ backgroundColor: '#67C090' }}
            >
              <span>Return to Home</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </Card>
      ) : (
        <Card className="!p-6 sm:!p-8 bg-white shadow-sm space-y-5" style={{ border: '1px solid rgba(38, 102, 127, 0.15)' }}>
          {error && (
            <div className="p-3.5 bg-red-50 text-red-700 text-xs rounded-2xl border border-red-200 font-bold leading-relaxed">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Event Name */}
            <div className="space-y-1">
              <label className="text-xs font-extrabold" style={{ color: '#124170' }}>Event / Organization Name:</label>
              <input
                type="text"
                name="name"
                required
                placeholder="e.g. Noorul Islam Salath Wing"
                value={form.name}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#67C090]"
                style={{ backgroundColor: '#DDF4E7', color: '#124170', border: '1.5px solid rgba(38, 102, 127, 0.2)' }}
              />
            </div>

            {/* Subdomain Slug */}
            <div className="space-y-1">
              <label className="text-xs font-extrabold" style={{ color: '#124170' }}>Subdomain Slug:</label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  name="slug"
                  required
                  placeholder="noorulislam"
                  value={form.slug}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-2xl text-sm font-bold font-mono focus:outline-none focus:ring-2 focus:ring-[#67C090]"
                  style={{ backgroundColor: '#DDF4E7', color: '#124170', border: '1.5px solid rgba(38, 102, 127, 0.2)' }}
                />
                <span className="absolute right-4 text-xs font-mono font-bold" style={{ color: '#26667F' }}>
                  .{rootDomain}
                </span>
              </div>
            </div>

            {/* Admin Name */}
            <div className="space-y-1">
              <label className="text-xs font-extrabold" style={{ color: '#124170' }}>Admin Name:</label>
              <input
                type="text"
                name="adminName"
                required
                placeholder="Event Admin Full Name"
                value={form.adminName}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#67C090]"
                style={{ backgroundColor: '#DDF4E7', color: '#124170', border: '1.5px solid rgba(38, 102, 127, 0.2)' }}
              />
            </div>

            {/* Admin Email */}
            <div className="space-y-1">
              <label className="text-xs font-extrabold" style={{ color: '#124170' }}>Admin Email:</label>
              <input
                type="email"
                name="adminEmail"
                required
                placeholder="admin@noorulislam.com"
                value={form.adminEmail}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#67C090]"
                style={{ backgroundColor: '#DDF4E7', color: '#124170', border: '1.5px solid rgba(38, 102, 127, 0.2)' }}
              />
            </div>

            {/* Admin Password */}
            <div className="space-y-1">
              <label className="text-xs font-extrabold" style={{ color: '#124170' }}>Admin Password:</label>
              <input
                type="password"
                name="adminPassword"
                required
                placeholder="••••••••"
                value={form.adminPassword}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#67C090]"
                style={{ backgroundColor: '#DDF4E7', color: '#124170', border: '1.5px solid rgba(38, 102, 127, 0.2)' }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 text-white text-sm font-extrabold rounded-2xl shadow-md transition active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
              style={{ backgroundColor: '#67C090' }}
            >
              {loading ? "Submitting..." : "Submit Event Application"}
            </button>
          </form>
        </Card>
      )}

    </main>
  );
}
