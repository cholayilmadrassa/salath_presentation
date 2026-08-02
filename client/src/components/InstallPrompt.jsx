import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Download, Smartphone, Share, Bell, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { subscribeUserToPush } from '../utils/pushManager.js';

export default function InstallPrompt() {
  const { token } = useAuth();
  const [deferredPrompt, setDeferredPrompt] = useState(window.deferredInstallPrompt || null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);

  const [isStandalone, setIsStandalone] = useState(false);
  const [notifGranted, setNotifGranted] = useState(false);
  const [enablingNotif, setEnablingNotif] = useState(false);

  const checkStatus = () => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;

    const granted = typeof Notification !== 'undefined' && Notification.permission === 'granted';

    setIsStandalone(standalone);
    setNotifGranted(granted);

    return { standalone, granted };
  };

  useEffect(() => {
    const { standalone, granted } = checkStatus();
    const isCompleted = localStorage.getItem('app_setup_completed') === 'true';
    const isDismissed = sessionStorage.getItem('pwa_prompt_dismissed') === 'true';

    // If both installed & notifications enabled, mark as completed
    if (standalone && granted) {
      localStorage.setItem('app_setup_completed', 'true');
      return;
    }

    // Do not show if setup is marked completed or dismissed in this session
    if (isCompleted || isDismissed) {
      return;
    }

    const handleAvailable = (e) => {
      const promptEvent = e?.detail || window.deferredInstallPrompt;
      if (promptEvent) {
        setDeferredPrompt(promptEvent);
      }
    };

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      window.deferredInstallPrompt = e;
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('pwa-install-available', handleAvailable);

    // Show popup after 1.5s delay if not installed OR notifications not enabled
    const timer = setTimeout(() => {
      setShowPrompt(true);
    }, 1500);

    return () => {
      clearTimeout(timer);
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
      setShowGuideModal(true);
      setShowPrompt(false);
      return;
    }

    try {
      await promptObj.prompt();
      const { outcome } = await promptObj.userChoice;
      if (outcome === 'accepted') {
        setIsStandalone(true);
        if (notifGranted) {
          localStorage.setItem('app_setup_completed', 'true');
          setShowPrompt(false);
        }
      }
      window.deferredInstallPrompt = null;
      setDeferredPrompt(null);
    } catch (err) {
      console.warn('Native install prompt fallback to guide modal:', err);
      setShowGuideModal(true);
      setShowPrompt(false);
    }
  };

  const handleEnableNotifications = async () => {
    setEnablingNotif(true);
    try {
      if (token) {
        await subscribeUserToPush(token);
      } else if (typeof Notification !== 'undefined') {
        await Notification.requestPermission();
      }
      setNotifGranted(typeof Notification !== 'undefined' && Notification.permission === 'granted');
      if (isStandalone) {
        localStorage.setItem('app_setup_completed', 'true');
        setShowPrompt(false);
      }
    } catch (err) {
      console.error('Failed to enable notifications from setup modal:', err);
    } finally {
      setEnablingNotif(false);
    }
  };

  return (
    <>
      {/* Setup & Install Popup Dialog */}
      <Dialog open={showPrompt} onOpenChange={(open) => !open && handleDismiss()}>
        <DialogContent className="max-w-md font-sans">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <img
                src="/appLogo.png"
                alt="Swalath App"
                className="w-11 h-11 rounded-2xl object-cover shadow-md border border-primary/30 shrink-0"
              />
              <div>
                <span className="font-extrabold text-base block text-foreground leading-tight">
                  App Setup & Quick Access
                </span>
                <span className="text-[11px] text-muted-foreground font-medium block">
                  മികച്ച അനുഭവം ലഭിക്കാൻ താഴെപ്പറയുന്നവ ചെയ്യുക
                </span>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 pt-1">
            {/* Step 1: Install App */}
            <div className="bg-card border border-border p-3.5 rounded-xl flex items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Smartphone className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-foreground">Install App</span>
                    {isStandalone && (
                      <Badge variant="success" className="text-[9px] py-0 px-1">Active</Badge>
                    )}
                  </div>
                  <span className="text-[11px] text-muted-foreground font-medium block">
                    Add to Home Screen for fast access
                  </span>
                </div>
              </div>

              {isStandalone ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <Button size="sm" onClick={handleInstallClick} className="h-8 text-xs font-bold px-3 shrink-0">
                  <Download className="w-3.5 h-3.5 mr-1" />
                  <span>Install</span>
                </Button>
              )}
            </div>

            {/* Step 2: Enable Notifications */}
            <div className="bg-card border border-border p-3.5 rounded-xl flex items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Bell className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-foreground">Push Notifications</span>
                    {notifGranted && (
                      <Badge variant="success" className="text-[9px] py-0 px-1">Enabled</Badge>
                    )}
                  </div>
                  <span className="text-[11px] text-muted-foreground font-medium block">
                    Receive daily reminders & updates
                  </span>
                </div>
              </div>

              {notifGranted ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={enablingNotif}
                  onClick={handleEnableNotifications}
                  className="h-8 text-xs font-bold px-3 shrink-0"
                >
                  {enablingNotif ? 'Enabling...' : 'Enable'}
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handleDismiss}
              className="text-xs text-muted-foreground hover:text-foreground font-semibold px-2"
            >
              Later
            </button>
            <Button
              onClick={() => {
                localStorage.setItem('app_setup_completed', 'true');
                setShowPrompt(false);
              }}
              className="text-xs font-extrabold px-5"
            >
              Got It
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Guide Dialog for iOS/Manual Install */}
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
