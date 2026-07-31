import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Download, Smartphone, Share } from 'lucide-react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(window.deferredInstallPrompt || null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;

    const dismissed = sessionStorage.getItem('pwa_prompt_dismissed');

    const handleAvailable = (e) => {
      const promptEvent = e?.detail || window.deferredInstallPrompt;
      if (promptEvent) {
        setDeferredPrompt(promptEvent);
      }
      if (!isStandalone && !dismissed) {
        setShowPrompt(true);
      }
    };

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      window.deferredInstallPrompt = e;
      setDeferredPrompt(e);
      if (!isStandalone && !dismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('pwa-install-available', handleAvailable);

    // If not running as standalone app and prompt not dismissed, trigger popup after 1.5s delay
    if (!isStandalone && !dismissed) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 1500);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('pwa-install-available', handleAvailable);
    };
  }, []);

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  const handleInstallClick = async () => {
    const promptObj = deferredPrompt || window.deferredInstallPrompt;
    if (!promptObj) {
      // If native browser prompt is unavailable (e.g. iOS Safari), show guide modal
      setShowGuideModal(true);
      setShowPrompt(false);
      return;
    }

    try {
      // Trigger native browser installation prompt automatically
      await promptObj.prompt();
      const { outcome } = await promptObj.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
        sessionStorage.setItem('pwa_prompt_dismissed', 'true');
      }
      window.deferredInstallPrompt = null;
      setDeferredPrompt(null);
    } catch (err) {
      console.warn('Native install prompt failed, fallback to guide modal:', err);
      setShowGuideModal(true);
      setShowPrompt(false);
    }
  };

  return (
    <>
      {/* Install Prompt Dialog */}
      <Dialog open={showPrompt} onOpenChange={(open) => !open && handleDismiss()}>
        <DialogContent className="max-w-md font-sans">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <img
                src="/appLogo.png"
                alt="Swalath App"
                className="w-12 h-12 rounded-2xl object-cover shadow-md border border-primary/30 shrink-0"
              />
              <div>
                <span className="font-extrabold text-base block text-foreground leading-tight">
                  Install Swalath App
                </span>
                <Badge variant="success" className="mt-0.5 text-[10px]">
                  Fast & Offline Accessible
                </Badge>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="bg-primary/10 border border-primary/30 p-3.5 rounded-xl flex items-center gap-3">
            <Smartphone className="w-6 h-6 text-primary shrink-0" />
            <p className="text-xs text-foreground font-medium leading-relaxed">
              Install directly to your phone home screen for faster and easier access!
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="soft" onClick={handleDismiss}>
              Later
            </Button>
            <Button onClick={handleInstallClick}>
              <Download className="w-4 h-4 mr-1.5" />
              <span>Install App</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Guide Dialog */}
      <Dialog open={showGuideModal} onOpenChange={setShowGuideModal}>
        <DialogContent className="max-w-md font-sans">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center text-primary">
                <Share className="w-5 h-5" />
              </div>
              <span className="text-foreground">To Add to Home Screen:</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 bg-primary/10 border border-primary/30 p-4 rounded-xl text-xs text-foreground font-medium">
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-extrabold shrink-0 mt-0.5">1</span>
              <span>Open browser menu and tap <strong>Share</strong> or <strong>Three Dots</strong> icon.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-extrabold shrink-0 mt-0.5">2</span>
              <span>Select <strong>"Add to Home Screen"</strong> or <strong>"Install App"</strong> option.</span>
            </div>
          </div>

          <Button onClick={() => setShowGuideModal(false)} className="w-full text-xs font-extrabold">
            Got It
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
