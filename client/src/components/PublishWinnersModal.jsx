import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Trophy, Bell, BellOff, Sparkles, CheckCircle2 } from 'lucide-react';

export default function PublishWinnersModal({
  open,
  onOpenChange,
  onConfirm,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    setError('');
    setLoading(true);
    try {
      await onConfirm(true);
      onOpenChange(false);
    } catch (err) {
      setError(err.message || 'Failed to publish winners');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[calc(100vw-2rem)] p-5 sm:p-6 rounded-3xl font-ml border border-amber-500/30">
        <DialogHeader className="text-left space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs">
            <Trophy className="w-6 h-6 text-[#D4AF37]" />
          </div>
          <div>
            <DialogTitle className="text-base sm:text-lg font-extrabold text-foreground flex items-center gap-2">
              <span>വിജയികളെ പ്രഖ്യാപിക്കുക</span>
              <span className="text-xs font-normal text-muted-foreground font-sans">
                (Publish Winners)
              </span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1 leading-relaxed">
              വിജയികളെ ഔദ്യോഗികമായി പ്രഖ്യാപിക്കാൻ താഴെയുള്ള വിവരങ്ങൾ പരിശോധിക്കുക.
            </DialogDescription>
          </div>
        </DialogHeader>

        {error && <Alert variant="destructive" className="text-xs">{error}</Alert>}

        <div className="space-y-3.5 py-1">
          {/* Info Card */}
          <div className="p-3.5 rounded-2xl bg-primary/10 border border-primary/20 text-xs space-y-1.5">
            <div className="flex items-center gap-2 font-extrabold text-foreground">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>ഹോം ഡാഷ്‌ബോർഡ് അപ്‌ഡേറ്റ്</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              ഹോം പേജിൽ daily leaderboard-ന് പകരം കാമ്പയിനിലെ മുൻനിര ചാമ്പ്യന്മാരുടെ വിജയി പട്ടികയും മെഡലുകളും (🥇 🥈 🥉) പ്രദർശിപ്പിക്കപ്പെടും.
            </p>
          </div>

          {/* Notice: No push notifications sent */}
          <div className="p-3.5 rounded-2xl border border-border bg-muted/40 flex items-start gap-2.5 text-xs text-muted-foreground">
            <BellOff className="w-4 h-4 shrink-0 text-muted-foreground mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              സ്വലാത്ത് രേഖപ്പെടുത്തുന്നത് അവസാനിച്ചതിനാൽ പുഷ് അറിയിപ്പുകൾ അയക്കില്ല. ഹോം പേജിൽ മാത്രം ഔദ്യോഗിക വിജയികളുടെ പട്ടിക പ്രദർശിപ്പിക്കപ്പെടും.
            </p>
          </div>
        </div>

        <DialogFooter className="flex-row items-center justify-end gap-2 pt-2 sm:pt-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="rounded-xl text-xs font-bold h-9"
          >
            റദ്ദാക്കുക (Cancel)
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleConfirm}
            disabled={loading}
            className="rounded-xl text-xs font-bold h-9 bg-primary text-primary-foreground gap-1.5 shadow-md"
          >
            {loading ? (
              <div className="w-4 h-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>പ്രഖ്യാപിക്കുക (Publish)</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
