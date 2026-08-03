import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';
import { Check, Copy } from 'lucide-react';

export default function AdminDomainTab({
  domainInput,
  setDomainInput,
  handleRequestCustomDomain,
  handleVerifyDomain,
  domainDnsInfo,
  tenant,
  copiedField,
  copyToClipboard,
  fieldErrors = {},
  saveSuccess = '',
  error = '',
}) {
  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <h2 className="text-base font-extrabold text-foreground">Connect Custom Domain</h2>
        <p className="text-xs text-muted-foreground">
          Connect your own domain (e.g. <code>example.com</code>) to this event portal.
        </p>

        {saveSuccess && <Alert variant="success">{saveSuccess}</Alert>}
        {error && <Alert variant="destructive">{error}</Alert>}

        <form onSubmit={handleRequestCustomDomain} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label>Custom Domain Name</Label>
            <Input
              type="text"
              placeholder="example.com"
              value={domainInput}
              onChange={(e) => setDomainInput(e.target.value)}
              className={fieldErrors.domain ? 'border-destructive' : ''}
            />
            {fieldErrors.domain && <p className="text-xs text-destructive">{fieldErrors.domain}</p>}
          </div>

          <Button type="submit">Add Domain</Button>
        </form>

        {/* DNS Verification & Traffic Setup Details */}
        {(domainDnsInfo || tenant?.customDomain) && (
          <div className="pt-4 border-t border-border space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-foreground">Required DNS Records (Registrar Settings)</h3>
              <span className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full border ${tenant?.customDomainVerified ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30' : 'bg-amber-500/10 text-amber-700 border-amber-500/30'}`}>
                {tenant?.customDomainVerified ? '● Verified & Active' : '● Pending Verification'}
              </span>
            </div>

            {/* Step 1: TXT Verification Record */}
            <div className="space-y-1.5">
              <p className="text-xs font-bold text-foreground">1. Ownership Verification Record (TXT)</p>
              <div className="bg-muted/10 p-3.5 rounded-2xl border border-border space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground font-sans text-xs">Record Type:</span>
                  <span className="font-bold text-foreground bg-muted px-2 py-0.5 rounded-md">TXT</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground font-sans text-xs">Record Name / Host:</span>
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
                      {domainDnsInfo?.txtRecordValue || tenant?.customDomainVerificationToken || tenant?.settings?.domainVerificationToken || 'verify_pending'}
                    </span>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => copyToClipboard(domainDnsInfo?.txtRecordValue || tenant?.customDomainVerificationToken || tenant?.settings?.domainVerificationToken, 'txtValue')}
                      className="h-6 w-6 cursor-pointer"
                    >
                      {copiedField === 'txtValue' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Traffic Pointing Record (A Record / CNAME) */}
            <div className="space-y-1.5">
              <p className="text-xs font-bold text-foreground">2. Domain Traffic Pointing Record (A Record)</p>
              <div className="bg-muted/10 p-3.5 rounded-2xl border border-border space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground font-sans text-xs">Record Type:</span>
                  <span className="font-bold text-foreground bg-muted px-2 py-0.5 rounded-md">A</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground font-sans text-xs">Record Name / Host:</span>
                  <span className="font-bold text-foreground font-mono">@</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground font-sans text-xs">Points To (Server IP):</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground font-mono">216.198.79.1</span>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => copyToClipboard('216.198.79.1', 'ipAddress')}
                      className="h-6 w-6 cursor-pointer"
                    >
                      {copiedField === 'ipAddress' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <Button onClick={handleVerifyDomain} variant="outline" className="w-full font-bold cursor-pointer">
              Verify DNS Record Now
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
