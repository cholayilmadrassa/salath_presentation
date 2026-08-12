import { useState } from "react";
import { api } from "../api.js";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Clock, ArrowRight, AlertCircle } from "lucide-react";
import { eventTeamRegisterSchema } from "../schemas/validationSchemas.js";

export default function EventTeamRegister() {
  const [form, setForm] = useState({
    name: "",
    slug: "",
    title: "",
    tagline: "",
    adminName: "",
    adminPhone: "",
    adminEmail: "",
    adminPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [registeredTenant, setRegisteredTenant] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
    }
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
    setFieldErrors({});

    const validationResult = eventTeamRegisterSchema.safeParse(form);
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
      const data = await api("/auth/register-tenant", {
        method: "POST",
        body: {
          ...form,
          email: form.adminEmail,
          password: form.adminPassword,
        },
      });

      setRegisteredTenant(data.tenant);
    } catch (err) {
      setError(err.message || "Event team registration failed");
    } finally {
      setLoading(false);
    }
  };

  const rootDomain = import.meta.env.VITE_PLATFORM_ROOT_DOMAIN 

  const FieldError = ({ error }) => error ? (
    <p className="text-xs text-destructive font-bold mt-1 flex items-center gap-1 animate-slide-down">
      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
      <span>{error}</span>
    </p>
  ) : null;

  return (
    <main className="max-w-xl mx-auto px-4 safe-top pb-10 sm:py-10 font-ml min-h-screen">
      {/* Header */}
      <div className="text-center mb-6 space-y-2">
        <img
          src="/appLogo.png"
          alt="Swalath Portal"
          className="w-14 h-14 rounded-2xl object-cover mx-auto mb-3 shadow-md"
        />
        <Badge variant="muted" className="uppercase font-mono text-[10px] tracking-wider">
          Organization Portal
        </Badge>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">
Register Swalath Campain        </h1>
        <p className="text-xs font-medium max-w-md mx-auto text-muted-foreground">
          Create a dedicated subdomain portal for your organization, mahallu, or campaign team.
        </p>
      </div>

      {registeredTenant ? (
        <Card className="text-center">
          <CardContent className="p-8 space-y-5">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-md bg-primary/15 text-primary">
              <Clock className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-extrabold text-foreground">
                Application Submitted! (Pending Approval)
              </h2>
              <p className="text-xs font-medium leading-relaxed text-muted-foreground">
                Your application for <strong className="font-extrabold text-foreground">{registeredTenant.name}</strong> is under Super Admin review. Your portal will be activated upon approval.
              </p>
            </div>

            <div className="p-4 rounded-2xl text-left space-y-2 text-xs font-mono bg-muted/10 border border-border">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground"> Assigned Subdomain:</span>
                <span className="font-bold text-primary">{registeredTenant.slug}.{rootDomain}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground"> Status:</span>
                <Badge variant="warning">
                  PENDING APPROVAL
                </Badge>
              </div>
            </div>

            <div className="pt-2">
              <Button asChild>
                <Link to="/">
                  <span>Return to Home</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6 sm:p-8 space-y-5">
            {error && (
              <Alert variant="destructive">{error}</Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* Event Name */}
              <div className="space-y-1.5">
                <Label>Event / Organization Name:</Label>
                <Input
                  type="text"
                  name="name"
                  placeholder="e.g. Noorul Islam Swalath Wing"
                  value={form.name}
                  onChange={handleChange}
                  className={fieldErrors.name ? 'border-destructive ring-2 ring-destructive/20' : ''}
                />
                <FieldError error={fieldErrors.name} />
              </div>

              {/* Subdomain Slug */}
              <div className="space-y-1.5">
                <Label>Event Short Code / URL:</Label>
                <div className="relative flex items-center">
                  <Input
                    type="text"
                    name="slug"
                    placeholder="noorulislam"
                    value={form.slug}
                    onChange={handleChange}
                    className={`font-mono pr-28 ${fieldErrors.slug ? 'border-destructive ring-2 ring-destructive/20' : ''}`}
                  />
                  <span className="absolute right-4 text-xs font-mono font-bold text-muted-foreground">
                    .{rootDomain}
                  </span>
                </div>
                <FieldError error={fieldErrors.slug} />
              </div>

              {/* Admin Name */}
              <div className="space-y-1.5">
                <Label>Admin Name:</Label>
                <Input
                  type="text"
                  name="adminName"
                  placeholder="Event Admin Full Name"
                  value={form.adminName}
                  onChange={handleChange}
                  className={fieldErrors.adminName ? 'border-destructive ring-2 ring-destructive/20' : ''}
                />
                <FieldError error={fieldErrors.adminName} />
              </div>

              {/* Admin Mobile Number */}
              <div className="space-y-1.5">
                <Label>Admin Mobile Number:</Label>
                <Input
                  type="tel"
                  name="adminPhone"
                  placeholder="e.g. 9876543210"
                  value={form.adminPhone}
                  onChange={handleChange}
                  maxLength={10}
                  className={fieldErrors.adminPhone ? 'border-destructive ring-2 ring-destructive/20' : ''}
                />
                <FieldError error={fieldErrors.adminPhone} />
              </div>

              {/* Admin Email */}
              <div className="space-y-1.5">
                <Label>Admin Email:</Label>
                <Input
                  type="email"
                  name="adminEmail"
                  placeholder="admin@noorulislam.com"
                  value={form.adminEmail}
                  onChange={handleChange}
                  className={fieldErrors.adminEmail ? 'border-destructive ring-2 ring-destructive/20' : ''}
                />
                <FieldError error={fieldErrors.adminEmail} />
              </div>

              {/* Admin Password */}
              <div className="space-y-1.5">
                <Label>Admin Password:</Label>
                <Input
                  type="password"
                  name="adminPassword"
                  placeholder="••••••••"
                  value={form.adminPassword}
                  onChange={handleChange}
                  className={fieldErrors.adminPassword ? 'border-destructive ring-2 ring-destructive/20' : ''}
                />
                <FieldError error={fieldErrors.adminPassword} />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full mt-2"
              >
                {loading ? "Submitting..." : "Submit Event Application"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
