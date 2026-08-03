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

  const isOwnershipVerified = tenant?.customDomainVerified;
  const isTrafficConnected = tenant?.customDomainConnected;
  const isFullyConnected = isOwnershipVerified && isTrafficConnected;

  return (
    <Card className="border border-border shadow-xs rounded-3xl overflow-hidden">
      <CardContent className="p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <Globe className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-sm font-extrabold text-foreground">Custom Domain</h2>
          </div>
          {tenant?.customDomain && (
            <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${isFullyConnected ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30' : isOwnershipVerified ? 'bg-amber-500/10 text-amber-700 border-amber-500/30' : 'bg-muted text-muted-foreground border-border'}`}>
              {isFullyConnected ? '● Connected & Active' : isOwnershipVerified ? '● Ownership Verified' : '● Pending Verification'}
            </span>
          )}
        </div>

        {saveSuccess && <Alert variant="success">{saveSuccess}</Alert>}
        {error && <Alert variant="destructive">{error}</Alert>}

        {/* Connected Success Card */}
        {isFullyConnected && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="text-sm font-mono font-bold text-foreground">{tenant.customDomain}</p>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">Domain live & active</p>
              </div>
            </div>
            <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-300">
              ✓ Active
            </span>
          </div>
        )}

        <form onSubmit={handleRequestCustomDomain} className="space-y-3" noValidate>
          <div className="space-y-1">
            <Label className="text-xs font-extrabold">Domain Name</Label>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="example.com"
                value={domainInput}
                onChange={(e) => setDomainInput(e.target.value)}
                className={`flex-1 font-mono text-xs ${fieldErrors.domain ? 'border-destructive' : ''}`}
              />
              <Button type="submit" className="font-extrabold text-xs cursor-pointer shrink-0">
                {tenant?.customDomain ? 'Update' : 'Save Domain'}
              </Button>
            </div>
            {fieldErrors.domain && <p className="text-xs text-destructive">{fieldErrors.domain}</p>}
          </div>
        </form>

        {/* Minimal DNS Records Card */}
        {(domainDnsInfo || tenant?.customDomain) && (
          <div className="pt-3 border-t border-border space-y-4">
            <p className="text-xs font-extrabold text-foreground">Add DNS Records in Hostinger / Registrar:</p>

            <div className="bg-muted/10 p-3.5 rounded-2xl border border-border space-y-2.5 text-xs font-mono">
              {/* Record 1: A Record */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground bg-muted px-2 py-0.5 rounded-md">A</span>
                  <span className="text-muted-foreground font-sans text-xs">Host: <b className="text-foreground font-mono">@</b></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-foreground font-mono">{targetA}</span>
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

              {/* Record 2: TXT Record */}
              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground bg-muted px-2 py-0.5 rounded-md">TXT</span>
                  <span className="text-muted-foreground font-sans text-xs">Host: <b className="text-foreground font-mono">_verify</b></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-primary truncate max-w-[140px] sm:max-w-xs">{txtToken}</span>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => copyToClipboard(txtToken, 'txtValue')}
                    className="h-5 w-5 cursor-pointer"
                  >
                    {copiedField === 'txtValue' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button
                type="button"
                onClick={handleVerifyDomain}
                variant="outline"
                className="font-bold text-xs cursor-pointer w-full"
              >
                Verify Ownership
              </Button>
              <Button
                type="button"
                onClick={handleCheckDnsConnection}
                className="font-bold text-xs cursor-pointer w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Check Connection
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
