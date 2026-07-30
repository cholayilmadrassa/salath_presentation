import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api.js';
import { useNavigate } from 'react-router-dom';
import { RotateCcw, Save, CheckCircle2, ArrowLeft, Sparkles, AlertTriangle, X } from 'lucide-react';

export default function Counter() {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  // Load saved unsubmitted live count from localStorage
  const [count, setCount] = useState(() => {
    const saved = localStorage.getItem('salath_live_counter');
    return saved ? Number(saved) : 0;
  });

  const [showResetModal, setShowResetModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');

  // Persist live count state on every change
  useEffect(() => {
    localStorage.setItem('salath_live_counter', String(count));
  }, [count]);

  const increment = () => {
    setCount((prev) => prev + 1);
  };

  const openResetModal = (e) => {
    if (e) e.stopPropagation();
    if (count > 0) {
      setShowResetModal(true);
    }
  };

  const confirmReset = () => {
    setCount(0);
    localStorage.removeItem('salath_live_counter');
    setShowResetModal(false);
    setSuccessMsg('');
    setError('');
  };

  const submitAsEntry = async (e) => {
    if (e) e.stopPropagation();

    if (count <= 0) {
      setError('ദയവായി എണ്ണി തിട്ടപ്പെടുത്തിയ ശേഷം സമർപ്പിക്കുക.');
      return;
    }

    if (!user) {
      navigate('/login');
      return;
    }

    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      await api('/counts/entry', {
        method: 'POST',
        token,
        body: { value: count }
      });
      setSuccessMsg(`വിജയകരമായി +${count.toLocaleString('en-IN')} സ്വലാത്ത് സമർപ്പിച്ചു!`);
      setCount(0);
      localStorage.removeItem('salath_live_counter');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-xl mx-auto px-4 safe-top pb-24 md:py-6 flex flex-col font-ml min-h-screen select-none space-y-4" style={{ backgroundColor: '#F7F5EC', color: '#1A1A1A' }}>
      
      {/* Top Header Bar */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-xs active:scale-95 transition"
            style={{ border: '1px solid #E8EDE2', color: '#1A1A1A' }}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-extrabold text-base leading-tight" style={{ color: '#1A1A1A' }}>
              ഡിജിറ്റൽ തസ്ബീഹ് കൗണ്ടർ
            </h1>
            <span className="text-[11px] font-medium" style={{ color: '#8C8C8C' }}>
              എവിടെ തൊട്ടാലും എണ്ണാം (+1)
            </span>
          </div>
        </div>
      </div>

      {/* Top Count Display Card */}
      <div className="text-white rounded-3xl p-5 shadow-lg text-center space-y-3 shrink-0" style={{ background: 'linear-gradient(135deg, #5c852e, #6E9B37, #4e7225)', boxShadow: '0 12px 30px rgba(110, 155, 55, 0.25)' }}>
        <div className="flex items-center justify-center gap-1.5 text-xs font-bold px-3.5 py-1 rounded-full w-fit mx-auto" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)', color: '#FFC107' }}>
          <Sparkles className="w-3.5 h-3.5" />
          <span>തസ്ബീഹ് കൗണ്ടർ</span>
        </div>

        {/* Count Digit Display */}
        <div className="py-1">
          <span className="text-6xl sm:text-7xl font-extrabold tracking-tight text-white block font-sora">
            {count.toLocaleString('en-IN')}
          </span>
          <span className="text-xs font-medium block mt-1" style={{ color: '#E8EDE2' }}>എണ്ണിയ സ്വലാത്തുകൾ</span>
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
            <span>റീസെറ്റ് (Reset)</span>
          </button>

          <button
            type="button"
            onClick={submitAsEntry}
            disabled={loading || count === 0}
            className="py-3 px-4 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition disabled:opacity-40"
            style={{ backgroundColor: '#FFC107', color: '#1A1A1A' }}
          >
            <Save className="w-4 h-4" />
            <span>{loading ? '...' : 'സമർപ്പിക്കൂ (Save)'}</span>
          </button>
        </div>
      </div>

      {/* Feedback Messages */}
      {error && <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl text-center font-bold shrink-0">{error}</div>}
      {successMsg && (
        <div className="p-3.5 bg-white text-xs rounded-xl text-center font-bold flex items-center justify-center gap-2 shrink-0" style={{ border: '1px solid #6E9B37', color: '#6E9B37' }}>
          <CheckCircle2 className="w-4 h-4" style={{ color: '#6E9B37' }} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Full View Light Background Tap Area */}
      <div
        onClick={increment}
        className="w-full flex-1 min-h-[340px] rounded-3xl p-6 shadow-xs active:scale-[0.98] transition-all duration-100 flex flex-col items-center justify-center text-center cursor-pointer space-y-4 touch-manipulation"
        style={{ backgroundColor: '#E8EDE2', border: '1px solid #E8EDE2', color: '#6E9B37' }}
      >
        <div className="w-24 h-24 rounded-full bg-white shadow-md flex flex-col items-center justify-center gap-0.5 active:scale-90 transition" style={{ border: '1px solid #6E9B37', color: '#6E9B37' }}>
          <span className="text-3xl font-black">+1</span>
          <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-80">TAP</span>
        </div>

        <div className="space-y-1">
          <h2 className="text-xl font-extrabold" style={{ color: '#1A1A1A' }}>ഇവിടെ എവിടെയും തൊടാം</h2>
          <p className="text-xs font-medium" style={{ color: '#8C8C8C' }}>
            (TAP ANYWHERE IN THIS LIGHT AREA TO COUNT +1)
          </p>
        </div>

        <span className="text-[11px] font-extrabold px-4 py-1.5 text-white rounded-full shadow-xs" style={{ backgroundColor: '#6E9B37' }}>
          ഓരോ സ്പർശനത്തിലും +1 കൂടുന്നു
        </span>
      </div>

      {/* Mobile Reset Confirmation Drawer Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center select-none font-ml">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setShowResetModal(false)}
          />

          <div className="relative z-10 w-full max-w-lg bg-white rounded-t-3xl p-6 shadow-2xl space-y-4 animate-slide-down" style={{ borderTop: '1px solid #E8EDE2' }}>
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2 text-red-600">
                <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="font-extrabold text-base" style={{ color: '#1A1A1A' }}>കൗണ്ടർ റീസെറ്റ് ചെയ്യണോ?</h3>
              </div>
              <button
                onClick={() => setShowResetModal(false)}
                className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 hover:text-stone-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs font-medium leading-relaxed" style={{ color: '#8C8C8C' }}>
              ഇതുവരെ എണ്ണിയ <strong className="font-extrabold" style={{ color: '#1A1A1A' }}>({count.toLocaleString('en-IN')})</strong> സ്വലാത്തുകൾ പൂജ്യമാകും. റീസെറ്റ് ചെയ്യണമെന്ന് ഉറപ്പാണോ?
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setShowResetModal(false)}
                className="py-3 px-4 rounded-2xl text-xs font-bold transition"
                style={{ backgroundColor: '#E8EDE2', color: '#1A1A1A' }}
              >
                റദ്ദാക്കുക (Cancel)
              </button>

              <button
                onClick={confirmReset}
                className="py-3 px-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold transition shadow-sm active:scale-95"
              >
                അതെ, റീസെറ്റ് ചെയ്യൂ
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
