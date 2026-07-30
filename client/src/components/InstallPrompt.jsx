import { useState, useEffect } from 'react';
import { Download, X, Smartphone, Share } from 'lucide-react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);

  useEffect(() => {
    // Check if app is already running in standalone mode (installed as app)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;

    // Check if user previously dismissed prompt in this session
    const dismissed = sessionStorage.getItem('pwa_prompt_dismissed');

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!isStandalone && !dismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // If not running as standalone app and prompt not dismissed, trigger popup after 1.5s delay
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
      {/* Mobile Suitable Bottom Drawer Install Prompt (Triggers when NOT installed) */}
      {showPrompt && (
        <div className="fixed inset-0 z-50 flex items-end justify-center select-none font-ml">
          <div
            className="absolute inset-0 bg-stone-950/60 backdrop-blur-xs animate-fadeIn"
            onClick={handleDismiss}
          />

          <div className="relative z-10 w-full max-w-lg bg-white rounded-t-3xl p-6 shadow-2xl space-y-4 animate-slide-down border-t border-stone-200">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#00703c] text-white flex items-center justify-center font-bold text-xl shadow-md border border-emerald-600">
                  ☪
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-stone-900 leading-tight">
                    സ്വലാത്ത് ആപ്പ് ഇൻസ്റ്റാൾ ചെയ്യൂ
                  </h3>
                  <span className="text-[11px] text-[#00703c] font-bold">
                    ഉമ്മുൽ ഖുറാ അക്കാദമി പടിഞ്ഞാറത്തറ
                  </span>
                </div>
              </div>

              <button
                onClick={handleDismiss}
                className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 hover:text-stone-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#f0f9f4] border border-[#b8e5cb] p-3.5 rounded-2xl flex items-center gap-3">
              <Smartphone className="w-6 h-6 text-[#00703c] shrink-0" />
              <p className="text-xs text-stone-700 font-medium leading-relaxed">
                നിങ്ങളുടെ ഫോൺ ഹോം സ്‌ക്രീനിലേക്ക് നേരിട്ട് ആപ്പായി ഇൻസ്റ്റാൾ ചെയ്ത് കൂടുതൽ വേഗത്തിലും എളുപ്പത്തിലും ഉപയോഗിക്കൂ!
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                onClick={handleDismiss}
                className="py-3 px-4 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition border border-stone-200"
              >
                ഇപ്പോൾ വേണ്ട (Later)
              </button>

              <button
                onClick={handleInstallClick}
                className="py-3 px-4 rounded-2xl bg-[#00703c] hover:bg-[#00572e] text-white text-xs font-extrabold transition shadow-md active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>ഇൻസ്റ്റാൾ ചെയ്യൂ</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Custom Instruction Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center select-none font-ml">
          <div
            className="absolute inset-0 bg-stone-950/60 backdrop-blur-xs animate-fadeIn"
            onClick={() => setShowGuideModal(false)}
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
                onClick={() => setShowGuideModal(false)}
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
              onClick={() => setShowGuideModal(false)}
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
