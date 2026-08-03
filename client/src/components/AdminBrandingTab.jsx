import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';

export default function AdminBrandingTab({
  brandingForm,
  setBrandingForm,
  handleUpdateBranding,
  fieldErrors = {},
  saveSuccess = '',
  error = '',
}) {
  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <h2 className="text-base font-extrabold text-foreground">Customize Event Branding</h2>
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
  );
}
