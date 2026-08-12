import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';
import { Users } from 'lucide-react';

export default function AdminBrandingTab({
  brandingForm,
  setBrandingForm,
  handleUpdateBranding,
  fieldErrors = {},
  saveSuccess = '',
  error = '',
  tenant = null,
  onToggleMultipleAccounts = null,
}) {
  const allowMultipleAccounts = tenant?.settings?.allowMultipleAccounts === true;

  return (
    <div className="space-y-4">
      {/* ── Event Settings Card ── */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="text-base font-extrabold text-foreground">Event Settings</h2>

          {/* Allow Multiple Accounts Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/10">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mt-0.5 shrink-0">
                <Users className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-extrabold text-foreground">Allow Multiple Accounts</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                  Users can create up to 3 accounts per phone number. Login will show an account picker when multiple accounts exist.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onToggleMultipleAccounts && onToggleMultipleAccounts(!allowMultipleAccounts)}
              className={`relative shrink-0 ml-3 w-11 h-6 rounded-full transition-colors focus:outline-none ${
                allowMultipleAccounts ? 'bg-primary' : 'bg-muted border border-border'
              }`}
              aria-label="Toggle multiple accounts"
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                  allowMultipleAccounts ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <p className="text-[11px] text-muted-foreground px-1">
            Status: <span className={`font-bold ${allowMultipleAccounts ? 'text-green-600' : 'text-muted-foreground'}`}>
              {allowMultipleAccounts ? 'Enabled — Users can make multiple accounts' : 'Disabled — One account per phone number'}
            </span>
          </p>
        </CardContent>
      </Card>

      {/* ── Branding Card ── */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="text-base font-extrabold text-foreground">Event Branding</h2>
          {saveSuccess && <Alert variant="success">{saveSuccess}</Alert>}
          {error && <Alert variant="destructive">{error}</Alert>}

          <form onSubmit={handleUpdateBranding} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label>Event Title</Label>
              <Input
                type="text"
                value={brandingForm.title}
                onChange={(e) => setBrandingForm({ ...brandingForm, title: e.target.value })}
                className={fieldErrors.title ? 'border-destructive' : ''}
              />
              {fieldErrors.title && <p className="text-xs text-destructive">{fieldErrors.title}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Tagline / Description</Label>
              <Input
                type="text"
                value={brandingForm.tagline}
                onChange={(e) => setBrandingForm({ ...brandingForm, tagline: e.target.value })}
                className={fieldErrors.tagline ? 'border-destructive' : ''}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Primary Theme Color</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={brandingForm.themeColor}
                  onChange={(e) => setBrandingForm({ ...brandingForm, themeColor: e.target.value })}
                  className="w-12 h-10 rounded-xl cursor-pointer border border-input"
                />
                <Input
                  type="text"
                  value={brandingForm.themeColor}
                  onChange={(e) => setBrandingForm({ ...brandingForm, themeColor: e.target.value })}
                  className="font-mono text-xs max-w-xs"
                />
              </div>
            </div>

            <Button type="submit">Save Branding</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}


