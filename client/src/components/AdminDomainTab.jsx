import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';
import { Check, Copy, Globe, CheckCircle2 } from 'lucide-react';

export default function AdminDomainTab({
  domainInput,
  setDomainInput,
  handleRequestCustomDomain,
  handleVerifyDomain,
  handleCheckDnsConnection,
  domainDnsInfo,
  tenant,
  copiedField,
  copyToClipboard,
  fieldErrors = {},
  saveSuccess = '',
  error = '',
}) {
  const dnsConfig = tenant?.requiredDnsConfig || domainDnsInfo?.requiredDnsConfig;

  const txtToken =
    domainDnsInfo?.txtRecordValue ||
    dnsConfig?.txtRecord?.value ||
    tenant?.customDomainVerificationToken ||
    tenant?.settings?.domainVerificationToken ||
    'verify_pending';

  const targetA = dnsConfig?.aRecord?.value || domainDnsInfo?.targetA || '76.76.21.21';
  const targetCname = dnsConfig?.cnameRecord?.value || domainDnsInfo?.targetCname || 'cname.vercel-dns.com';

  const isOwnershipVerified = tenant?.customDomainVerified;
  const isTrafficConnected = tenant?.customDomainConnected;
  const isFullyConnected = isOwnershipVerified && isTrafficConnected;

  return (
    <Card className="border border-border shadow-xs rounded-3xl overflow-hidden">
      <CardContent className="p-6 space-y-6">
        <div className="flex items-center gap-3 pb-3 border-b border-border">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-foreground">Connect Custom Domain</h2>
            <p className="text-xs text-muted-foreground">
              Connect your own custom domain (e.g. <code>example.com</code>) to your event portal.
            </p>
          </div>
        </div>

        {saveSuccess && <Alert variant="success">{saveSuccess}</Alert>}
        {error && <Alert variant="destructive">{error}</Alert>}

        {/* Fully Connected Success Banner */}
        {isFullyConnected && (
          <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-3">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-extrabold text-sm">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>✓ Domain Connected</span>
            </div>
            <div className="space-y-1">
              <p className="text-base font-mono font-bold text-foreground">{tenant.customDomain}</p>
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-300">
                  Ownership Verified
                </span>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-300">
                  DNS Connected
                </span>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-300">
                  Active
                </span>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleRequestCustomDomain} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label className="text-xs font-extrabold">Custom Domain Name</Label>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="example.com"
                value={domainInput}
                onChange={(e) => setDomainInput(e.target.value)}
                className={`flex-1 font-mono text-xs ${fieldErrors.domain ? 'border-destructive' : ''}`}
              />
              <Button type="submit" className="font-extrabold text-xs cursor-pointer shrink-0">
                {tenant?.customDomain ? 'Update Domain' : 'Add Domain'}
              </Button>
            </div>
            {fieldErrors.domain && <p className="text-xs text-destructive">{fieldErrors.domain}</p>}
          </div>
        </form>

        {/* 3-Step Setup Instructions */}
        {(domainDnsInfo || tenant?.customDomain) && (
          <div className="pt-4 border-t border-border space-y-5">
            {/* Step 1 — Verify Domain Ownership */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-foreground flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold">1</span>
                  Step 1 — Verify Domain Ownership
                </h3>
                <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${isOwnershipVerified ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30' : 'bg-amber-500/10 text-amber-700 border-amber-500/30'}`}>
                  {isOwnershipVerified ? '● Ownership Verified' : '● Pending Verification'}
                </span>
              </div>

              <div className="bg-muted/10 p-3.5 rounded-2xl border border-border space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground font-sans text-xs">Record Type:</span>
                  <span className="font-bold text-foreground bg-muted px-2 py-0.5 rounded-md">TXT</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground font-sans text-xs">Host / Name:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-md font-mono">_verify</span>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => copyToClipboard('_verify', 'hostName')}
                      className="h-6 w-6 cursor-pointer"
                      title="Copy _verify"
                    >
                      {copiedField === 'hostName' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground font-sans text-xs">TXT Record Value:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-primary truncate max-w-[180px] sm:max-w-xs">
                      {txtToken}
                    </span>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => copyToClipboard(txtToken, 'txtValue')}
                      className="h-6 w-6 cursor-pointer"
                    >
                      {copiedField === 'txtValue' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                </div>
              </div>

              <Button
                type="button"
                onClick={handleVerifyDomain}
                variant={isOwnershipVerified ? 'outline' : 'default'}
                className="w-full font-bold text-xs cursor-pointer"
              >
                {isOwnershipVerified ? 'Re-Verify Domain Ownership' : 'Verify Domain Ownership'}
              </Button>
            </div>

            {/* Step 2 — Point Domain to Portal */}
            <div className="space-y-2">
              <h3 className="text-xs font-extrabold text-foreground flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold">2</span>
                Step 2 — Point Domain to Your Portal
              </h3>

              <div className="bg-muted/10 p-3.5 rounded-2xl border border-border space-y-2.5 text-xs font-mono">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground font-sans text-xs font-bold">A Record (Root Traffic):</span>
                    <span className="font-bold text-foreground bg-muted px-2 py-0.5 rounded-md">A</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground font-sans">Host:</span>
                    <span className="font-bold text-foreground">@</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground font-sans">Points To Value:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-foreground">{targetA}</span>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => copyToClipboard(targetA, 'targetA')}
                        className="h-5 w-5 cursor-pointer"
                      >
                        {copiedField === 'targetA' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-border/60 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground font-sans text-xs font-bold">CNAME (Optional - Enable www):</span>
                    <span className="font-bold text-foreground bg-muted px-2 py-0.5 rounded-md">CNAME</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground font-sans">Host:</span>
                    <span className="font-bold text-foreground">www</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground font-sans">Points To Value:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-foreground">{targetCname}</span>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => copyToClipboard(targetCname, 'targetCname')}
                        className="h-5 w-5 cursor-pointer"
                      >
                        {copiedField === 'targetCname' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3.5 h-3" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground font-medium">
                Add these records at your existing DNS provider/registrar (Hostinger, Cloudflare, GoDaddy, Namecheap).
              </p>
            </div>

            {/* Step 3 — Check Connection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-foreground flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold">3</span>
                  Step 3 — Check Connection
                </h3>
                <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${isTrafficConnected ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30' : isOwnershipVerified ? 'bg-amber-500/10 text-amber-700 border-amber-500/30' : 'bg-muted text-muted-foreground border-border'}`}>
                  {isTrafficConnected ? '● Connected & Active' : isOwnershipVerified ? '● Ownership Verified — DNS Required' : '● DNS Not Configured'}
                </span>
              </div>

              <Button
                type="button"
                onClick={handleCheckDnsConnection}
                className="w-full font-bold text-xs cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Check DNS Connection
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
