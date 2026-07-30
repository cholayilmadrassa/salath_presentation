import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate, Link } from 'react-router-dom';
import { Settings, X, LogOut, MapPin, Phone, ShieldCheck, LogIn, UserPlus, Download, Share } from 'lucide-react';

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

  if (!isOpen) return null;

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
      <div className="fixed inset-0 z-50 flex items-end justify-center select-none font-ml">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-stone-950/60 backdrop-blur-xs animate-fadeIn"
          onClick={onClose}
        />

        {/* Slide-Up Drawer Container */}
        <div className="relative z-10 w-full max-w-lg bg-white rounded-t-3xl p-6 shadow-2xl space-y-5 animate-slide-down border-t border-stone-200">
          
          {/* Modal Header */}
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div className="flex items-center gap-2 text-stone-900">
              <div className="w-8 h-8 rounded-xl bg-[#00703c] text-white flex items-center justify-center font-bold text-sm">
                ⚙️
              </div>
              <div>
                <h3 className="font-extrabold text-base text-stone-900">സെറ്റിങ്സ് (Settings)</h3>
                <p className="text-[10px] text-stone-500 font-medium">പ്രൊഫൈൽ വിവരങ്ങളും ക്രമീകരണങ്ങളും</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 hover:text-stone-900"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Profile Details */}
          {user ? (
            <div className="space-y-3">
              <div className="bg-[#f0f9f4] border border-[#b8e5cb] rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-3 pb-3 border-b border-[#b8e5cb]/60">
                  <div className="w-12 h-12 rounded-full bg-[#00703c] text-white flex items-center justify-center font-bold text-lg shadow-sm">
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-stone-900 text-sm">{user.name}</h4>
                    <span className="text-[11px] text-[#00703c] font-bold">അംഗത്വം (Registered Member)</span>
                  </div>
                </div>

                {/* Profile Details List */}
                <div className="grid grid-cols-2 gap-2 text-xs text-stone-700 font-medium">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#00703c]" />
                    <span>{user.phone}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#00703c]" />
                    <span>{user.place}</span>
                  </div>
                  {user.mahallu && (
                    <div className="col-span-2 text-[11px] text-stone-600">
                      <span className="font-bold">മഹല്ല്:</span> {user.mahallu}
                    </div>
                  )}
                  {user.district && (
                    <div className="col-span-2 text-[11px] text-stone-600">
                      <span className="font-bold">ജില്ല:</span> {user.district}, {user.state}
                    </div>
                  )}
                </div>
              </div>

              {/* Install App Button */}
              <button
                onClick={handleInstallApp}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-50 text-[#00703c] text-xs font-bold border border-emerald-200 active:scale-98 transition shadow-xs"
              >
                <Download className="w-4 h-4 text-[#00703c]" />
                <span>ആപ്പ് ഇൻസ്റ്റാൾ ചെയ്യൂ (Add as App)</span>
              </button>

              {isAdmin && (
                <Link
                  to="/admin/panel"
                  onClick={onClose}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-amber-50 text-amber-900 text-xs font-bold border border-amber-200"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-700" />
                  <span>അഡ്മിൻ പാനൽ (Admin Panel)</span>
                </Link>
              )}

              {/* Red Log Out Button */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-red-50 text-red-700 text-xs font-bold border border-red-200 active:scale-98 transition shadow-xs"
              >
                <LogOut className="w-4 h-4" />
                <span>ലോഗ് ഔട്ട് (Log Out)</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4 py-2 text-center">
              <p className="text-xs text-stone-600 font-medium">
                സ്വലാത്ത് സമർപ്പിക്കാനും നിങ്ങളുടെ കണക്കുകൾ സൂക്ഷിക്കാനും ലോഗിൻ ചെയ്യൂ.
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                <Link
                  to="/login"
                  onClick={onClose}
                  className="btn-primary py-3 text-xs font-bold rounded-2xl flex items-center justify-center gap-1.5"
                >
                  <LogIn className="w-4 h-4" />
                  <span>ലോഗിൻ</span>
                </Link>
                <Link
                  to="/signup"
                  onClick={onClose}
                  className="btn-secondary py-3 text-xs font-bold rounded-2xl flex items-center justify-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>റജിസ്റ്റർ</span>
                </Link>
              </div>

              {/* Install App Button for guests */}
              <button
                onClick={handleInstallApp}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-50 text-[#00703c] text-xs font-bold border border-emerald-200 active:scale-98 transition shadow-xs mt-2"
              >
                <Download className="w-4 h-4 text-[#00703c]" />
                <span>ആപ്പ് ഇൻസ്റ്റാൾ ചെയ്യൂ (Add as App)</span>
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Mobile Custom Instruction Modal */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-end justify-center select-none font-ml">
          <div
            className="absolute inset-0 bg-stone-950/60 backdrop-blur-xs animate-fadeIn"
            onClick={() => setShowGuide(false)}
          />

          <div className="relative z-10 w-full max-w-lg bg-white rounded-t-3xl p-6 shadow-2xl space-y-4 animate-slide-down border-t border-stone-200">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2.5 text-[#00703c]">
                <div className="w-9 h-9 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#00703c]">
                  <Share className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-base text-stone-900">ഹോം സ്‌ക്രീനിലേക്ക് ചേർക്കാൻ:</h3>
              </div>

              <button
                onClick={() => setShowGuide(false)}
                className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 hover:text-stone-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 bg-[#f0f9f4] border border-[#b8e5cb] p-4 rounded-2xl text-xs text-stone-800 font-medium">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#00703c] text-white flex items-center justify-center text-[10px] font-extrabold shrink-0 mt-0.5">1</span>
                <span>ഫോൺ ബ്രൗസർ മെനുവിലുള്ള <strong>Share (പങ്കുവെക്കുക)</strong> അല്ലെങ്കിൽ <strong>3 Dots (മൂന്ന് കുത്തുകൾ)</strong> ഐക്കൺ അമർത്തുക.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#00703c] text-white flex items-center justify-center text-[10px] font-extrabold shrink-0 mt-0.5">2</span>
                <span>വരുന്ന ഓപ്ഷനുകളിൽ നിന്ന് <strong>"Add to Home Screen"</strong> അല്ലെങ്കിൽ <strong>"Install App"</strong> എന്നത് തിരഞ്ഞെടുക്കുക.</span>
              </div>
            </div>

            <button
              onClick={() => setShowGuide(false)}
              className="w-full py-3.5 rounded-2xl bg-[#00703c] text-white text-xs font-extrabold shadow-md active:scale-95 transition"
            >
              മനസ്സിലായി (OK)
            </button>
          </div>
        </div>
      )}
    </>
  );
}
