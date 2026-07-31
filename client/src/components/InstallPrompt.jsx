import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Download, Smartphone, Share } from 'lucide-react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;

    const dismissed = sessionStorage.getItem('pwa_prompt_dismissed');

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!isStandalone && !dismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (!isStandalone && !dismissed) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 1500);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      setShowGuideModal(true);
      setShowPrompt(false);
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
      sessionStorage.setItem('pwa_prompt_dismissed', 'true');
    }
    setDeferredPrompt(null);
  };

  return (
    <>
      {/* Install Prompt Dialog */}
      <Dialog open={showPrompt} onOpenChange={(open) => !open && handleDismiss()}>
        <DialogContent className="max-w-md font-ml">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl shadow-md border border-primary/80 shrink-0">
                ☪
              </div>
              <div>
                <span className="font-extrabold text-base block text-foreground leading-tight">
                  സ്വലാത്ത് ആപ്പ് ഇൻസ്റ്റാൾ ചെയ്യൂ
                </span>
                <Badge variant="success" className="mt-0.5 text-[10px]">
                  ഉമ്മുൽ ഖുറാ അക്കാദമി പടിഞ്ഞാറത്തറ
                </Badge>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="bg-primary/10 border border-primary/30 p-3.5 rounded-2xl flex items-center gap-3">
            <Smartphone className="w-6 h-6 text-primary shrink-0" />
            <p className="text-xs text-foreground font-medium leading-relaxed">
              നിങ്ങളുടെ ഫോൺ ഹോം സ്‌ക്രീനിലേക്ക് നേരിട്ട് ആപ്പായി ഇൻസ്റ്റാൾ ചെയ്ത് കൂടുതൽ വേഗത്തിലും എളുപ്പത്തിലും ഉപയോഗിക്കൂ!
            </p>
          </div>

          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="soft" onClick={handleDismiss}>
              ഇപ്പോൾ വേണ്ട (Later)
            </Button>
            <Button onClick={handleInstallClick}>
              <Download className="w-4 h-4 mr-1.5" />
              <span>ഇൻസ്റ്റാൾ ചെയ്യൂ</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Guide Dialog */}
      <Dialog open={showGuideModal} onOpenChange={setShowGuideModal}>
        <DialogContent className="max-w-md font-ml">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-primary">
              <div className="w-9 h-9 rounded-2xl bg-primary/15 flex items-center justify-center text-primary">
                <Share className="w-5 h-5" />
              </div>
              <span className="text-foreground">ഹോം സ്‌ക്രീനിലേക്ക് ചേർക്കാൻ:</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 bg-primary/10 border border-primary/30 p-4 rounded-2xl text-xs text-foreground font-medium">
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-extrabold shrink-0 mt-0.5">1</span>
              <span>ഫോൺ ബ്രൗസർ മെനുവിലുള്ള <strong>Share (പങ്കുവെക്കുക)</strong> അല്ലെങ്കിൽ <strong>3 Dots (മൂന്ന് കുത്തുകൾ)</strong> ഐക്കൺ അമർത്തുക.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-extrabold shrink-0 mt-0.5">2</span>
              <span>വരുന്ന ഓപ്ഷനുകളിൽ നിന്ന് <strong>"Add to Home Screen"</strong> അല്ലെങ്കിൽ <strong>"Install App"</strong> എന്നത് തിരഞ്ഞെടുക്കുക.</span>
            </div>
          </div>

          <Button onClick={() => setShowGuideModal(false)} className="w-full text-xs font-extrabold">
            മനസ്സിലായി (OK)
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
