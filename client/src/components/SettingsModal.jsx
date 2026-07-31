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
import { LogOut, MapPin, Phone, ShieldCheck, LogIn, UserPlus, Download, Share } from 'lucide-react';

export default function SettingsModal({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = sessionStorage.getItem('isAdmin') === '1' || user?.role === 'tenant_admin' || user?.role === 'super_admin';
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showGuide, setShowGuide] = useState(false);

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
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
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
                src="/appLogo.svg"
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
