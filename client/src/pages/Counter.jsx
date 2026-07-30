import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api.js';
import { RotateCcw, Save, CheckCircle2, ArrowLeft, Sparkles, AlertTriangle, X } from 'lucide-react';

export default function Counter() {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token || !user) {
      navigate('/login', { replace: true });
    }
  }, [token, user, navigate]);

  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);

  if (!token || !user) {
    return null;
  }

  const increment = () => {
    setCount((c) => c + 1);
    if (error) setError('');
    if (successMsg) setSuccessMsg('');

    if (navigator.vibrate) {
      navigator.vibrate(25);
    }
  };

  const openResetModal = () => {
    if (count === 0) return;
    setShowResetModal(true);
  };

  const confirmReset = () => {
    setCount(0);
    setShowResetModal(false);
    setSuccessMsg('');
  };

  const submitAsEntry = async () => {
    if (count <= 0) return;
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      await api('/counts/entry', {
        method: 'POST',
        token,
        body: { value: count },
      });
      setSuccessMsg(`+${count.toLocaleString('en-IN')} Salath submitted successfully!`);
      setCount(0);
    } catch (e) {
      setError(e.message || 'Salath submission failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-xl mx-auto px-4 safe-top pb-24 md:py-6 flex flex-col font-ml min-h-screen select-none space-y-4" style={{ backgroundColor: '#DDF4E7', color: '#124170' }}>
      
      {/* Top Header Bar */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-xs active:scale-95 transition"
            style={{ border: '1px solid rgba(38, 102, 127, 0.2)', color: '#124170' }}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-extrabold text-base leading-tight" style={{ color: '#124170' }}>
              ഡിജിറ്റൽ തസ്ബീഹ് കൗണ്ടർ
            </h1>
            <span className="text-[11px] font-medium" style={{ color: '#26667F' }}>
              Tap Anywhere to Count (+1)
            </span>
          </div>
        </div>
      </div>

      {/* Top Count Display Card */}
      <div className="text-white rounded-3xl p-5 shadow-lg text-center space-y-3 shrink-0" style={{ background: 'linear-gradient(135deg, #124170, #26667F, #67C090)', boxShadow: '0 12px 30px rgba(38, 102, 127, 0.35)' }}>
        <div className="flex items-center justify-center gap-1.5 text-xs font-bold px-3.5 py-1 rounded-full w-fit mx-auto" style={{ backgroundColor: 'rgba(0, 0, 0, 0.25)', color: '#67C090' }}>
          <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
          <span>Tasbeeh Counter</span>
        </div>

        {/* Count Digit Display */}
        <div className="py-1">
          <span className="text-6xl sm:text-7xl font-extrabold tracking-tight text-white block">
            {count.toLocaleString('en-IN')}
          </span>
          <span className="text-xs font-medium block mt-1" style={{ color: '#DDF4E7' }}>Salath Count</span>
        </div>

        {/* Reset & Save Buttons */}
        <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-white/20">
          <button
            type="button"
            onClick={openResetModal}
            disabled={count === 0}
            className="py-3 px-4 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/20 text-xs font-bold text-white flex items-center justify-center gap-1.5 active:scale-95 transition disabled:opacity-40"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>

          <button
            type="button"
            onClick={submitAsEntry}
            disabled={loading || count === 0}
            className="py-3 px-4 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition disabled:opacity-40 text-white"
            style={{ backgroundColor: '#67C090' }}
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Saving...' : 'Save Count'}</span>
          </button>
        </div>
      </div>

      {/* Feedback Messages */}
      {error && <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl text-center font-bold shrink-0">{error}</div>}
      {successMsg && (
        <div className="p-3.5 bg-white text-xs rounded-xl text-center font-bold flex items-center justify-center gap-2 shrink-0" style={{ border: '1px solid #67C090', color: '#67C090' }}>
          <CheckCircle2 className="w-4 h-4" style={{ color: '#67C090' }} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Full View Light Background Tap Area */}
      <div
        onClick={increment}
        className="w-full flex-1 min-h-[340px] rounded-3xl p-6 shadow-xs active:scale-[0.98] transition-all duration-100 flex flex-col items-center justify-center text-center cursor-pointer space-y-4 touch-manipulation"
        style={{ backgroundColor: 'rgba(38, 102, 127, 0.12)', border: '1px solid rgba(38, 102, 127, 0.2)', color: '#26667F' }}
      >
        <div className="w-24 h-24 rounded-full bg-white shadow-md flex flex-col items-center justify-center gap-0.5 active:scale-90 transition" style={{ border: '1.5px solid #67C090', color: '#67C090' }}>
          <span className="text-3xl font-black">+1</span>
          <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-80">TAP</span>
        </div>

        <div className="space-y-1">
          <h2 className="text-xl font-extrabold" style={{ color: '#124170' }}>Tap Anywhere to Count</h2>
          <p className="text-xs font-medium" style={{ color: '#26667F' }}>
            (TAP ANYWHERE IN THIS AREA TO COUNT +1)
          </p>
        </div>

        <span className="text-[11px] font-extrabold px-4 py-1.5 text-white rounded-full shadow-xs" style={{ backgroundColor: '#67C090' }}>
          +1 for each tap
        </span>
      </div>

      {/* Mobile Reset Confirmation Drawer Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center select-none font-ml">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setShowResetModal(false)}
          />

          <div className="relative z-10 w-full max-w-lg bg-white rounded-t-3xl p-6 shadow-2xl space-y-4 animate-slide-down" style={{ borderTop: '1px solid rgba(38, 102, 127, 0.2)' }}>
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2 text-red-600">
                <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="font-extrabold text-base" style={{ color: '#124170' }}>Reset Counter?</h3>
              </div>
              <button
                onClick={() => setShowResetModal(false)}
                className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 hover:text-stone-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs font-medium leading-relaxed" style={{ color: '#26667F' }}>
              Your current count of <strong className="font-extrabold" style={{ color: '#124170' }}>({count.toLocaleString('en-IN')})</strong> will be reset to 0. Are you sure?
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setShowResetModal(false)}
                className="py-3 px-4 rounded-2xl bg-stone-100 text-stone-700 text-xs font-bold active:scale-95 transition"
              >
                Cancel
              </button>

              <button
                onClick={confirmReset}
                className="py-3 px-4 rounded-2xl bg-red-600 text-white text-xs font-extrabold shadow-md active:scale-95 transition"
              >
                Yes, Reset
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
