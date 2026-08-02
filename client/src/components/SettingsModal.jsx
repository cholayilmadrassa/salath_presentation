import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { LogOut, MapPin, Phone, ShieldCheck, LogIn, UserPlus, Download, Share, Bell, AlertCircle } from 'lucide-react';
import { api } from '../api.js';
import {
  subscribeUserToPush,
  unsubscribeUserFromPush,
  getPushSubscriptionState,
} from '../utils/pushManager.js';

export default function SettingsModal({ isOpen, onClose }) {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = sessionStorage.getItem('isAdmin') === '1' || user?.role === 'tenant_admin' || user?.role === 'super_admin';
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showGuide, setShowGuide] = useState(false);

  const [pushState, setPushState] = useState({ isSubscribed: false, isIOS: false, isStandalone: true });
  const [preferences, setPreferences] = useState(null);
  const [pushLoading, setPushLoading] = useState(false);
  const [pushError, setPushError] = useState('');

  useEffect(() => {
    if (isOpen && token) {
      getPushSubscriptionState(token).then((res) => {
        setPushState(res);
        if (res.preferences) {
          setPreferences(res.preferences);
        }
      });
    }
  }, [isOpen, token]);

  const togglePushSubscription = async () => {
    setPushLoading(true);
    setPushError('');
    try {
      if (pushState.isSubscribed) {
        await unsubscribeUserFromPush(token);
        setPushState((prev) => ({ ...prev, isSubscribed: false }));
      } else {
        await subscribeUserToPush(token);
        const res = await getPushSubscriptionState(token);
        setPushState(res);
        if (res.preferences) setPreferences(res.preferences);
      }
    } catch (err) {
      if (err.message === 'IOS_PWA_REQUIRED') {
        setShowGuide(true);
      } else {
        setPushError(err.message || 'Push subscription failed.');
      }
    } finally {
      setPushLoading(false);
    }
  };

  const updatePreference = async (key, val) => {
    if (!token) return;
    const updated = { ...preferences, [key]: val };
    setPreferences(updated);
    try {
      await api('/notifications/preferences', {
        method: 'PATCH',
        token,
        body: { [key]: val },
      });
    } catch (e) {
      console.error('Failed to update preference:', e);
    }
  };

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleLogout = () => {
    logout();
    onClose();
    navigate('/login');
  };

  const handleInstallApp = async () => {
    const promptObj = deferredPrompt || window.deferredInstallPrompt;
    if (promptObj) {
      try {
        await promptObj.prompt();
        const { outcome } = await promptObj.userChoice;
        if (outcome === 'accepted') {
          setDeferredPrompt(null);
          window.deferredInstallPrompt = null;
        }
      } catch (err) {
        setShowGuide(true);
      }
    } else {
      setShowGuide(true);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-md font-sans">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <img
                src="/appLogo.png"
                alt="App Settings"
                className="w-8 h-8 rounded-xl object-cover shadow-sm shrink-0 border border-primary/20"
              />
              <div>
                <span className="font-extrabold text-base block text-foreground">Settings</span>
                <span className="text-[10px] text-muted-foreground font-medium block">Profile details and app configuration</span>
              </div>
            </DialogTitle>
          </DialogHeader>

          {/* User Profile Details */}
          {user ? (
            <div className="space-y-3 pt-2">
              <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-3 pb-3 border-b border-primary/20">
                  <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg shadow-sm">
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-foreground text-sm">{user.name}</h4>
                    <Badge variant="success" className="mt-0.5">
                      Registered Member
                    </Badge>
                  </div>
                </div>

                {/* Profile Details List */}
                <div className="grid grid-cols-2 gap-2 text-xs text-foreground font-medium">
                  {user.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-primary" />
                      <span>{user.phone}</span>
                    </div>
                  )}
                  {(user.address || user.place) && (
                    <div className="flex items-center gap-1.5 col-span-2">
                      <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>{user.address || user.place}</span>
                    </div>
                  )}
                  {user.mahallu && (
                    <div className="col-span-2 text-[11px] text-muted-foreground">
                      <span className="font-bold">Mahallu:</span> {user.mahallu}
                    </div>
                  )}
                  {user.district && (
                    <div className="col-span-2 text-[11px] text-muted-foreground">
                      <span className="font-bold">District:</span> {user.district}, {user.state}
                    </div>
                  )}
                </div>
              </div>

              {/* Web Push Notifications Settings */}
              <div className="bg-card border border-border rounded-xl p-3.5 space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Bell className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-foreground">Push Notifications</h4>
                      <span className="text-[10px] text-muted-foreground block">
                        {pushState.isSubscribed ? 'Notifications Enabled' : 'Notifications Disabled'}
                      </span>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant={pushState.isSubscribed ? 'outline' : 'default'}
                    disabled={pushLoading}
                    onClick={togglePushSubscription}
                    className="h-8 text-xs font-bold px-3"
                  >
                    {pushLoading ? 'Saving...' : pushState.isSubscribed ? 'Disable' : 'Enable'}
                  </Button>
                </div>

                {pushState.isIOS && !pushState.isStandalone && (
                  <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-lg p-2.5 text-[11px] font-medium space-y-1">
                    <div className="flex items-center gap-1 font-bold text-amber-800">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>iOS Setup Required</span>
                    </div>
                    <p className="leading-snug">
                      നോട്ടിഫിക്കേഷൻ ലഭിക്കാൻ ആദ്യം ഈ ആപ്പ് Home Screen-ലേക്ക് Add ചെയ്യുക (Safari Share → Add to Home Screen).
                    </p>
                  </div>
                )}

                {pushError && (
                  <div className="text-[11px] text-destructive font-medium bg-destructive/10 p-2 rounded-lg">
                    {pushError}
                  </div>
                )}

                {/* Granular Preference Toggles */}
                {pushState.isSubscribed && preferences && (
                  <div className="pt-2 border-t border-border space-y-2">
                    <span className="text-[11px] font-extrabold text-foreground block">Notification Preferences:</span>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      {[
                        { key: 'dailyReminders', label: 'Daily Reminders' },
                        { key: 'milestones', label: 'Milestones' },
                        { key: 'campaignAnnouncements', label: 'Campaign Info' },
                        { key: 'results', label: 'Result Updates' },
                      ].map((item) => (
                        <label key={item.key} className="flex items-center gap-1.5 cursor-pointer font-medium text-foreground">
                          <input
                            type="checkbox"
                            checked={!!preferences[item.key]}
                            onChange={(e) => updatePreference(item.key, e.target.checked)}
                            className="rounded border-input text-primary focus:ring-primary h-3.5 w-3.5"
                          />
                          <span>{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Install App Button */}
              <Button
                variant="soft"
                onClick={handleInstallApp}
                className="w-full text-xs font-bold"
              >
                <Download className="w-4 h-4 mr-1.5 text-primary" />
                <span>Install App (Add to Home Screen)</span>
              </Button>

              {isAdmin && (
                <Button
                  variant="outline"
                  asChild
                  onClick={onClose}
                  className="w-full text-xs font-bold text-amber-700 border-amber-300 bg-amber-50 hover:bg-amber-100"
                >
                  <Link to="/admin/panel">
                    <ShieldCheck className="w-4 h-4 mr-1.5 text-amber-700" />
                    <span>Admin Panel</span>
                  </Link>
                </Button>
              )}

              {/* Red Log Out Button */}
              <Button
                variant="destructive"
                onClick={handleLogout}
                className="w-full text-xs font-bold"
              >
                <LogOut className="w-4 h-4 mr-1.5" />
                <span>Log Out</span>
              </Button>
            </div>
          ) : (
            <div className="space-y-4 py-2 text-center">
              <p className="text-xs text-muted-foreground font-medium">
                Log in to submit Swalath counts and track your personal history.
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                <Button asChild onClick={onClose} className="w-full text-xs">
                  <Link to="/login">
                    <LogIn className="w-4 h-4 mr-1.5" />
                    <span>Log In</span>
                  </Link>
                </Button>
                <Button variant="soft" asChild onClick={onClose} className="w-full text-xs">
                  <Link to="/signup">
                    <UserPlus className="w-4 h-4 mr-1.5" />
                    <span>Register</span>
                  </Link>
                </Button>
              </div>

              {/* Install App Button for guests */}
              <Button
                variant="soft"
                onClick={handleInstallApp}
                className="w-full text-xs font-bold mt-2"
              >
                <Download className="w-4 h-4 mr-1.5 text-primary" />
                <span>Install App (Add to Home Screen)</span>
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Custom Instruction Dialog */}
      <Dialog open={showGuide} onOpenChange={setShowGuide}>
        <DialogContent className="max-w-md font-sans">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
                <Share className="w-5 h-5 text-primary" />
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

          <Button
            onClick={() => setShowGuide(false)}
            className="w-full text-xs font-extrabold"
          >
            Got It
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
