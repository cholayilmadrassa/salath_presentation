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

        {/* DNS Verification Details */}
        {(domainDnsInfo || tenant?.customDomain) && (
          <div className="pt-4 border-t border-border space-y-3">
            <h3 className="text-sm font-extrabold text-foreground">Required DNS Record (Hostinger / Registrar)</h3>
            <div className="bg-muted/10 p-4 rounded-2xl border border-border space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">TXT Record Name:</span>
                <span className="font-bold text-foreground">{domainDnsInfo?.txtRecordName || `_verify.${tenant?.customDomain}`}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">TXT Record Value:</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-primary truncate max-w-xs">{domainDnsInfo?.txtRecordValue || tenant?.customDomainVerificationToken}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => copyToClipboard(domainDnsInfo?.txtRecordValue || tenant?.customDomainVerificationToken, 'txtValue')}
                    className="h-6 w-6"
                  >
                    {copiedField === 'txtValue' ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              </div>
            </div>

            <Button onClick={handleVerifyDomain} variant="outline" className="w-full">
              Verify DNS Record Now
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
