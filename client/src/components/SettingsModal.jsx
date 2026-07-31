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
  const isAdmin = sessionStorage.getItem('isAdmin') === '1';
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
        <DialogContent className="max-w-md font-ml">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                ⚙️
              </span>
              <div>
                <span className="font-extrabold text-base block text-foreground">സെറ്റിങ്സ് (Settings)</span>
                <span className="text-[10px] text-muted-foreground font-medium block">പ്രൊഫൈൽ വിവരങ്ങളും ക്രമീകരണങ്ങളും</span>
              </div>
            </DialogTitle>
          </DialogHeader>

          {/* User Profile Details */}
          {user ? (
            <div className="space-y-3 pt-2">
              <div className="bg-primary/10 border border-primary/30 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-3 pb-3 border-b border-primary/20">
                  <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg shadow-sm">
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-foreground text-sm">{user.name}</h4>
                    <Badge variant="success" className="mt-0.5">
                      അംഗത്വം (Registered Member)
                    </Badge>
                  </div>
                </div>

                {/* Profile Details List */}
                <div className="grid grid-cols-2 gap-2 text-xs text-foreground font-medium">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-primary" />
                    <span>{user.phone}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    <span>{user.place}</span>
                  </div>
                  {user.mahallu && (
                    <div className="col-span-2 text-[11px] text-muted-foreground">
                      <span className="font-bold">മഹല്ല്:</span> {user.mahallu}
                    </div>
                  )}
                  {user.district && (
                    <div className="col-span-2 text-[11px] text-muted-foreground">
                      <span className="font-bold">ജില്ല:</span> {user.district}, {user.state}
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
                <span>ആപ്പ് ഇൻസ്റ്റാൾ ചെയ്യൂ (Add as App)</span>
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
                    <span>അഡ്മിൻ പാനൽ (Admin Panel)</span>
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
                <span>ലോഗ് ഔട്ട് (Log Out)</span>
              </Button>
            </div>
          ) : (
            <div className="space-y-4 py-2 text-center">
              <p className="text-xs text-muted-foreground font-medium">
                സ്വലാത്ത് സമർപ്പിക്കാനും നിങ്ങളുടെ കണക്കുകൾ സൂക്ഷിക്കാനും ലോഗിൻ ചെയ്യൂ.
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                <Button asChild onClick={onClose} className="w-full text-xs">
                  <Link to="/login">
                    <LogIn className="w-4 h-4 mr-1.5" />
                    <span>ലോഗിൻ</span>
                  </Link>
                </Button>
                <Button variant="soft" asChild onClick={onClose} className="w-full text-xs">
                  <Link to="/signup">
                    <UserPlus className="w-4 h-4 mr-1.5" />
                    <span>റജിസ്റ്റർ</span>
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
                <span>ആപ്പ് ഇൻസ്റ്റാൾ ചെയ്യൂ (Add as App)</span>
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Custom Instruction Dialog */}
      <Dialog open={showGuide} onOpenChange={setShowGuide}>
        <DialogContent className="max-w-md font-ml">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <div className="w-9 h-9 rounded-2xl bg-primary/15 flex items-center justify-center">
                <Share className="w-5 h-5 text-primary" />
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

          <Button
            onClick={() => setShowGuide(false)}
            className="w-full text-xs font-extrabold"
          >
            മനസ്സിലായി (OK)
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
