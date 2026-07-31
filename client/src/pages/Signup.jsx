import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useTenant } from "../context/TenantContext.jsx";
import { api } from "../api.js";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { User, Phone, MapPin, Building2, ArrowRight, AlertCircle } from "lucide-react";
import { signupSchema } from "../schemas/validationSchemas.js";

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
  const [fieldErrors, setFieldErrors] = useState({});

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
    setFieldErrors({});

    const targetSlug = activeTenant ? activeTenant.slug : selectedTenantSlug;
    const sanitizedMobile = mobile.replace(/\D/g, "");

    const validationResult = signupSchema.safeParse({
      name,
      mobile: sanitizedMobile,
      place,
      tenantSlug: targetSlug,
    });

    if (!validationResult.success) {
      const errMap = {};
      validationResult.error.errors.forEach((err) => {
        if (err.path[0]) {
          errMap[err.path[0]] = err.message;
        }
      });
      setFieldErrors(errMap);
      setError("Please fix the highlighted field errors below.");
      return;
    }

    setLoading(true);

    try {
      const sanitizedMobile = mobile.replace(/\D/g, "");
      const generatedEmail = `${sanitizedMobile}.${targetSlug}@salath.app`;
      const generatedPassword = `Salath@${sanitizedMobile.slice(-4) || '1234'}`;

      const payload = {
        name: name.trim(),
        phone: sanitizedMobile,
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

  const FieldError = ({ error }) => error ? (
    <p className="text-xs text-destructive font-bold mt-1 flex items-center gap-1 animate-slide-down">
      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
      <span>{error}</span>
    </p>
  ) : null;

  return (
    <main className="max-w-lg mx-auto px-4 safe-top pb-6 sm:py-10 font-ml">
      {/* Header */}
      <div className="text-center mb-6">
        <img
          src="/logo.png"
          alt="Swalath Portal"
          className="w-14 h-14 rounded-2xl object-cover mx-auto mb-3 shadow-md"
        />
        <Badge variant="muted" className="font-mono uppercase tracking-wider text-[10px]">
          {activeTenant ? activeTenant.slug : 'Member Registration'}
        </Badge>
        <h1 className="text-2xl font-extrabold mt-1 text-foreground">
          Member Registration
        </h1>
        <p className="text-xs font-medium mt-1 text-muted-foreground">
          Join {currentEventTitle} Portal
        </p>
      </div>

      <Card>
        <CardContent className="p-6 sm:p-8 space-y-5">
          {error && (
            <Alert variant="destructive">{error}</Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Event Selector */}
            {!activeTenant && (
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-primary" />
                  <span>Select Event:</span>
                </Label>
                {approvedEvents.length === 0 ? (
                  <div className="p-3 rounded-2xl text-xs font-bold text-center bg-background text-muted-foreground">
                    Searching active approved events...
                  </div>
                ) : (
                  <Select value={selectedTenantSlug} onValueChange={setSelectedTenantSlug}>
                    <SelectTrigger className={fieldErrors.tenantSlug ? 'border-destructive ring-2 ring-destructive/20' : ''}>
                      <SelectValue placeholder="Select an event" />
                    </SelectTrigger>
                    <SelectContent>
                      {approvedEvents.map((ev) => (
                        <SelectItem key={ev.slug} value={ev.slug}>
                          {ev.name} ({ev.slug})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <FieldError error={fieldErrors.tenantSlug} />
              </div>
            )}

            {/* Name Input */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <User className="w-4 h-4 text-primary" />
                <span>Full Name:</span>
              </Label>
              <Input
                type="text"
                placeholder="e.g. Muhammed Faisal"
                value={name}
                onChange={(e) => {
                  if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: null }));
                  setName(e.target.value);
                }}
                className={fieldErrors.name ? 'border-destructive ring-2 ring-destructive/20' : ''}
              />
              <FieldError error={fieldErrors.name} />
            </div>

            {/* Mobile Input */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-primary" />
                <span>Mobile Number:</span>
              </Label>
              <Input
                type="tel"
                maxLength="10"
                placeholder="10-digit mobile number"
                value={mobile}
                onChange={(e) => {
                  if (fieldErrors.mobile) setFieldErrors((prev) => ({ ...prev, mobile: null }));
                  setMobile(e.target.value);
                }}
                className={fieldErrors.mobile ? 'border-destructive ring-2 ring-destructive/20' : ''}
              />
              <FieldError error={fieldErrors.mobile} />
            </div>

            {/* Place Input */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-primary" />
                <span>Place / Mahallu:</span>
              </Label>
              <Input
                type="text"
                placeholder="e.g. Padinjarathara"
                value={place}
                onChange={(e) => {
                  if (fieldErrors.place) setFieldErrors((prev) => ({ ...prev, place: null }));
                  setPlace(e.target.value);
                }}
                className={fieldErrors.place ? 'border-destructive ring-2 ring-destructive/20' : ''}
              />
              <FieldError error={fieldErrors.place} />
            </div>

            <Button type="submit" disabled={loading} className="w-full mt-2">
              {loading ? (
                <span>Registering...</span>
              ) : (
                <>
                  <span>Complete Registration</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>

          <Separator />

          <div className="text-center space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Already registered?
            </p>
            <Link
              to="/login"
              className="inline-block text-xs font-extrabold text-primary hover:underline"
            >
              Log In
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
