import { useState, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { api } from "../api.js";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import {
  CheckCircle2,
  Copy,
  Check,
  QrCode,
  Smartphone,
  ExternalLink,
  ShieldCheck,
  Clock,
  ArrowRight,
  UploadCloud,
  Sparkles,
  Loader2,
  Image as ImageIcon,
  X,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function UPIPaymentCard({ tenant, onPaymentSubmitted }) {
  const [copied, setCopied] = useState(false);
  const [utr, setUtr] = useState(tenant?.paymentUtr || "");
  const [loading, setLoading] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState(
    tenant?.status === "approved" || tenant?.paymentStatus === "verified"
      ? `Payment verified & event portal automatically approved!`
      : tenant?.paymentStatus === "submitted"
      ? `Payment UTR (${tenant.paymentUtr}) submitted successfully.`
      : ""
  );

  const [currentTenant, setCurrentTenant] = useState(tenant);
  const [currentPaymentStatus, setCurrentPaymentStatus] = useState(
    tenant?.paymentStatus || "pending"
  );
  const [currentTenantStatus, setCurrentTenantStatus] = useState(
    tenant?.status || "pending"
  );
  const [currentUtr, setCurrentUtr] = useState(tenant?.paymentUtr || "");

  // Screenshot upload states
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showManualUtr, setShowManualUtr] = useState(false);
  const fileInputRef = useRef(null);

  const upiId = "shafeequemk80-2@okhdfcbank";
  const payeeName = "Swalath Portal";
  const amount = tenant?.paymentAmount || 250;
  const rootDomain = import.meta.env.VITE_PLATFORM_ROOT_DOMAIN || "localhost";
  const note = `Fee for ${tenant?.name || "Event"} Registration`;

  // Standard UPI Deep Link specification
  const upiUrl = `upi://pay?pa=${encodeURIComponent(
    upiId
  )}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(
    note
  )}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (PNG, JPG, JPEG, WEBP).");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Image file size must be less than 10MB.");
      return;
    }

    setError("");
    setSuccessMsg("");
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleClearImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle Gemini AI Screenshot Verification
  const handleVerifyScreenshot = async () => {
    if (!imagePreview) {
      setError("Please select or upload your ₹250 payment receipt screenshot first.");
      return;
    }

    setError("");
    setSuccessMsg("");
    setAiAnalyzing(true);

    try {
      const res = await api("/auth/verify-payment-screenshot", {
        method: "POST",
        body: {
          tenantId: currentTenant.id || currentTenant._id,
          imageBase64: imagePreview,
          mimeType: selectedFile?.type || "image/png",
        },
      });

      setSuccessMsg(
        res.message || "Payment verified! Your event portal has been automatically approved and activated."
      );
      setCurrentPaymentStatus("verified");
      setCurrentTenantStatus("approved");
      setCurrentUtr(res.tenant?.paymentUtr || "AI_VERIFIED");
      setCurrentTenant(res.tenant);

      if (onPaymentSubmitted) {
        onPaymentSubmitted(res.tenant);
      }
    } catch (err) {
      setError(
        err.message ||
          "AI screenshot verification failed. Please ensure the screenshot clearly shows a SUCCESSFUL payment of ₹250."
      );
    } finally {
      setAiAnalyzing(false);
    }
  };

  // Manual UTR submission fallback
  const handleSubmitUtr = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    const cleanUtr = utr.trim();
    if (!cleanUtr) {
      setError("Please enter the 12-digit UTR or Transaction Reference number.");
      return;
    }

    if (cleanUtr.length < 6) {
      setError("UTR / Reference number must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const res = await api("/auth/tenant-payment", {
        method: "POST",
        body: {
          tenantId: currentTenant.id || currentTenant._id,
          utr: cleanUtr,
          paymentMethod: "UPI",
        },
      });

      setSuccessMsg(
        res.message ||
          "Payment UTR submitted! Super Admin will review your ₹250 payment and approve your event."
      );
      setCurrentPaymentStatus("submitted");
      setCurrentUtr(cleanUtr);
      if (onPaymentSubmitted) {
        onPaymentSubmitted(res.tenant);
      }
    } catch (err) {
      setError(err.message || "Failed to submit UTR reference number.");
    } finally {
      setLoading(false);
    }
  };

  const isApproved = currentTenantStatus === "approved" || currentPaymentStatus === "verified";

  return (
    <Card className="shadow-lg border-primary/20 bg-card overflow-hidden">
      {/* Top Banner */}
      <div className={`p-5 text-center space-y-1 ${
        isApproved
          ? "bg-gradient-to-r from-emerald-600 to-teal-700 text-white"
          : "bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white"
      }`}>
        <div className="flex items-center justify-center gap-2">
          {isApproved ? (
            <CheckCircle2 className="w-6 h-6 text-emerald-200" />
          ) : (
            <ShieldCheck className="w-5 h-5" />
          )}
          <h2 className="text-lg font-bold">
            {isApproved ? "Event Registration Approved!" : "Complete Registration Payment"}
          </h2>
        </div>
        <p className="text-xs text-emerald-100 font-medium">
          {isApproved
            ? "Your ₹250 payment is verified and your portal is active."
            : `Pay ₹${amount} & upload screenshot for Instant AI Auto-Approval`}
        </p>
      </div>

      <CardContent className="p-6 space-y-6">
        {/* Assigned Domain Info */}
        <div className="p-3.5 rounded-xl bg-muted/30 border border-border flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          <div>
            <span className="text-muted-foreground">Assigned Event Portal: </span>
            <strong className="font-bold text-foreground">{currentTenant?.name}</strong>
          </div>
          <Badge variant="outline" className="font-mono text-primary border-primary/30">
            {currentTenant?.slug}.{rootDomain}
          </Badge>
        </div>

        {/* Status Alert Banner */}
        {isApproved ? (
          <Alert className="bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2">
                <div className="font-extrabold text-sm">Portal Automatically Approved!</div>
                <Badge className="bg-emerald-600 text-white text-[10px] uppercase font-mono flex items-center gap-1">
                  <Zap className="w-3 h-3 fill-white" /> AI Verified
                </Badge>
              </div>
              <div>
                Transaction Ref: <span className="font-mono font-bold">{currentUtr}</span>
              </div>
              <div className="text-[11px] text-muted-foreground">
                Your ₹{amount} payment was verified by Gemini AI. Members can now register and view your event portal.
              </div>
              <div className="pt-2">
                <a
                  href={`http://${currentTenant?.slug}.${rootDomain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors"
                >
                  <span>Open {currentTenant?.slug}.{rootDomain}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </Alert>
        ) : currentPaymentStatus === "submitted" ? (
          <Alert className="bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <div className="space-y-1 text-xs">
              <div className="font-extrabold text-sm">UTR Submitted Successfully!</div>
              <div>
                Reference Number: <span className="font-mono font-bold">{currentUtr}</span>
              </div>
              <div className="text-[11px] text-muted-foreground">
                Your ₹{amount} UPI payment is under Super Admin review. Portal activation pending approval.
              </div>
            </div>
          </Alert>
        ) : (
          <Alert className="bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300">
            <Clock className="w-4 h-4 text-amber-600" />
            <div className="text-xs">
              <div className="font-bold flex items-center gap-1.5">
                <span>Step 2: Pay ₹{amount} & Upload Payment Screenshot</span>
                <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-700 dark:text-amber-300 font-mono">
                  Instant Auto-Approve
                </Badge>
              </div>
              <div className="text-[11px] opacity-90">
                Scan QR or pay using UPI (Google Pay, PhonePe, Paytm). Upload receipt screenshot below for instant Gemini AI verification.
              </div>
            </div>
          </Alert>
        )}

        {!isApproved && (
          <>
            {/* QR Code Section */}
            <div className="flex flex-col items-center justify-center space-y-3 p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <QrCode className="w-4 h-4 text-primary" />
                <span>Scan QR Code to Pay ₹{amount}</span>
              </div>

              <div className="p-3 bg-white rounded-2xl shadow-md border border-slate-100 flex items-center justify-center">
                <QRCodeSVG
                  value={upiUrl}
                  size={180}
                  level="H"
                  includeMargin={true}
                  imageSettings={{
                    src: "/appLogo.png",
                    x: undefined,
                    y: undefined,
                    height: 32,
                    width: 32,
                    excavate: true,
                  }}
                />
              </div>

              {/* Amount Pill */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium">Amount:</span>
                <Badge className="text-base font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-0.5">
                  ₹{amount}.00 INR
                </Badge>
              </div>

              {/* Copy UPI ID */}
              <div className="flex items-center gap-2 bg-background p-1.5 pl-3 rounded-xl border border-border text-xs w-full max-w-xs justify-between shadow-xs">
                <div className="truncate font-mono font-semibold text-foreground">
                  <span className="text-muted-foreground font-normal">UPI ID: </span>
                  {upiId}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="h-7 text-xs px-2.5 gap-1 shrink-0 font-bold"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Direct UPI App launch buttons */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5 text-primary" />
                  <span>Or Open Directly in UPI App:</span>
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <a
                  href={upiUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl border border-border bg-background hover:bg-muted text-xs font-bold transition-all text-center"
                >
                  <span className="text-emerald-600">Google Pay</span>
                  <ExternalLink className="w-3 h-3 text-muted-foreground" />
                </a>
                <a
                  href={upiUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl border border-border bg-background hover:bg-muted text-xs font-bold transition-all text-center"
                >
                  <span className="text-purple-600">PhonePe</span>
                  <ExternalLink className="w-3 h-3 text-muted-foreground" />
                </a>
                <a
                  href={upiUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl border border-border bg-background hover:bg-muted text-xs font-bold transition-all text-center"
                >
                  <span className="text-sky-600">Paytm</span>
                  <ExternalLink className="w-3 h-3 text-muted-foreground" />
                </a>
                <a
                  href={upiUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl border border-border bg-background hover:bg-muted text-xs font-bold transition-all text-center"
                >
                  <span className="text-amber-600">BHIM / Other</span>
                  <ExternalLink className="w-3 h-3 text-muted-foreground" />
                </a>
              </div>
            </div>

            <hr className="border-border" />

            {/* AI PAYMENT SCREENSHOT VERIFICATION SECTION */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600 fill-emerald-100" />
                  <span>Upload Payment Screenshot (AI Auto-Approve)</span>
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowManualUtr(!showManualUtr)}
                  className="text-[11px] h-6 text-muted-foreground underline hover:text-foreground"
                >
                  {showManualUtr ? "Use AI Upload" : "Type UTR manually"}
                </Button>
              </div>

              {!showManualUtr ? (
                <div className="space-y-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  {imagePreview ? (
                    <div className="relative rounded-2xl border-2 border-primary/40 bg-muted/20 p-3 flex flex-col sm:flex-row items-center gap-4">
                      <div className="relative w-28 h-28 shrink-0 rounded-xl overflow-hidden border border-border bg-background shadow-xs">
                        <img
                          src={imagePreview}
                          alt="Payment Screenshot Preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={handleClearImage}
                          className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-1 hover:bg-black"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="space-y-2 text-center sm:text-left flex-1">
                        <div className="flex items-center gap-2 justify-center sm:justify-start">
                          <ImageIcon className="w-4 h-4 text-primary" />
                          <span className="text-xs font-bold text-foreground truncate max-w-[180px]">
                            {selectedFile?.name || "Payment Receipt Screenshot"}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Ready for AI verification. Click below to verify amount (₹250) and status.
                        </p>
                        <Button
                          type="button"
                          onClick={handleVerifyScreenshot}
                          disabled={aiAnalyzing}
                          className="w-full sm:w-auto text-xs font-bold gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                        >
                          {aiAnalyzing ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Analyzing with Gemini AI...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4" />
                              <span>Verify & Auto-Approve</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-primary/30 hover:border-primary/60 rounded-2xl p-6 text-center space-y-2 cursor-pointer bg-slate-50/50 dark:bg-slate-900/30 hover:bg-muted/40 transition-all"
                    >
                      <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-foreground">
                          Click or drag payment screenshot here
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Supports PNG, JPG, WEBP (Max 10MB). Image is discarded immediately after AI check.
                        </p>
                      </div>
                    </div>
                  )}

                  {error && <p className="text-xs text-destructive font-bold">{error}</p>}
                  {successMsg && <p className="text-xs text-emerald-600 font-bold">{successMsg}</p>}
                </div>
              ) : (
                /* Fallback Manual UTR Form */
                <form onSubmit={handleSubmitUtr} className="space-y-3 p-4 rounded-xl border border-border bg-muted/20">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold flex items-center justify-between">
                      <span>Enter 12-Digit UPI Transaction UTR / Ref No:</span>
                      <span className="text-[10px] text-muted-foreground font-normal">
                        (From your payment receipt)
                      </span>
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder="e.g. 423456789012"
                        value={utr}
                        onChange={(e) => setUtr(e.target.value)}
                        className="font-mono text-sm uppercase"
                      />
                      <Button type="submit" disabled={loading} className="shrink-0 font-bold">
                        {loading ? "Submitting..." : currentPaymentStatus === "submitted" ? "Update UTR" : "Submit UTR"}
                      </Button>
                    </div>
                  </div>

                  {error && <p className="text-xs text-destructive font-bold">{error}</p>}
                  {successMsg && <p className="text-xs text-emerald-600 font-bold">{successMsg}</p>}
                </form>
              )}
            </div>
          </>
        )}

        {/* Footer Navigation */}
        <div className="pt-2 flex items-center justify-between text-xs border-t border-border">
          <span className="text-muted-foreground">Application Status:</span>
          <Badge
            variant={
              isApproved
                ? "success"
                : currentPaymentStatus === "submitted"
                ? "secondary"
                : "warning"
            }
          >
            {isApproved
              ? "APPROVED & ACTIVE"
              : currentPaymentStatus === "submitted"
              ? "PAYMENT SUBMITTED (PENDING VERIFICATION)"
              : "PENDING PAYMENT"}
          </Badge>
        </div>

        <div className="text-center pt-2">
          <Button asChild variant="outline" className="w-full">
            <Link to="/">
              <span>Return to Home</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
