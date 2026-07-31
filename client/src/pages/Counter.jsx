import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api.js';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { RotateCcw, Save, ArrowLeft, Sparkles, AlertTriangle } from 'lucide-react';
import { salathCountSchema } from '../schemas/validationSchemas.js';

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
    if (count >= 100000) {
      setError('Single entry count cannot exceed 100,000 (1 Lakh)');
      return;
    }
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
    if (count <= 0) {
      setError('Please tap the counter button to record at least 1 count before saving.');
      return;
    }
    const validationResult = salathCountSchema.safeParse({ value: count });
    if (!validationResult.success) {
      setError(validationResult.error.errors[0].message);
      return;
    }
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
    <main className="max-w-xl mx-auto px-4 safe-top pb-16 md:py-6 flex flex-col font-sans min-h-screen select-none space-y-4">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full border-primary/30"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </Button>
          <div>
            <h1 className="font-bold text-base leading-tight text-foreground">
              Digital Tasbeeh Counter
            </h1>
            <span className="text-[11px] font-medium text-muted-foreground">
              Tap Anywhere to Count (+1)
            </span>
          </div>
        </div>
      </div>

      {/* Top Count Display Card (Madinah Palette) */}
      <div className="text-white rounded-2xl p-5 shadow-lg text-center space-y-3 shrink-0 bg-gradient-to-br from-[#296E37] via-[#468B3A] to-[#7EC242] border border-white/20">
        <div className="flex items-center justify-center gap-1.5 text-xs font-bold px-3.5 py-1 rounded-full w-fit mx-auto bg-black/25 text-[#F5E6B3] border border-[#D4AF37]/30">
          <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>Tasbeeh Counter</span>
        </div>

        {/* Count Digit Display */}
        <div className="py-1">
          <span className="text-6xl sm:text-7xl font-bold tracking-tight text-white block font-mono">
            {count.toLocaleString('en-IN')}
          </span>
          <span className="text-xs font-medium block mt-1 text-[#E6F4ED]">Salath Count</span>
        </div>

        {/* Reset & Save Buttons */}
        <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-white/20">
          <Button
            type="button"
            variant="ghost"
            onClick={openResetModal}
            disabled={count === 0}
            className="border border-white/20 text-white hover:bg-white/20 font-bold"
          >
            <RotateCcw className="w-4 h-4 mr-1.5" />
            <span>Reset</span>
          </Button>

          <Button
            type="button"
            variant="gold"
            onClick={submitAsEntry}
            disabled={loading || count === 0}
            className="font-bold"
          >
            <Save className="w-4 h-4 mr-1.5" />
            <span>{loading ? 'Saving...' : 'Save Count'}</span>
          </Button>
        </div>
      </div>

      {/* Feedback Messages */}
      {error && <Alert variant="destructive">{error}</Alert>}
      {successMsg && <Alert variant="success">{successMsg}</Alert>}

      {/* Full View Light Background Tap Area */}
      <div
        onClick={increment}
        className="w-full flex-1 min-h-[340px] rounded-2xl p-6 shadow-sm active:scale-[0.98] transition-all duration-100 flex flex-col items-center justify-center text-center cursor-pointer space-y-4 touch-manipulation bg-card border border-border text-foreground"
      >
        <div className="w-24 h-24 rounded-full bg-primary/15 shadow-md flex flex-col items-center justify-center gap-0.5 active:scale-90 transition border-2 border-primary text-primary">
          <span className="text-3xl font-bold">+1</span>
          <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">TAP</span>
        </div>

        <div className="space-y-1">
          <h2 className="text-xl font-bold text-foreground">Tap Anywhere to Count</h2>
          <p className="text-xs font-medium text-muted-foreground">
            (TAP ANYWHERE IN THIS AREA TO COUNT +1)
          </p>
        </div>

        <Badge variant="success" className="px-4 py-1.5 text-[11px] font-bold">
          +1 for each tap
        </Badge>
      </div>

      {/* Reset Confirmation Dialog */}
      <Dialog open={showResetModal} onOpenChange={setShowResetModal}>
        <DialogContent className="max-w-md font-sans">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              <span>Reset Counter?</span>
            </DialogTitle>
            <DialogDescription>
              Your current count of <strong>({count.toLocaleString('en-IN')})</strong> will be reset to 0. Are you sure?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="soft" onClick={() => setShowResetModal(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmReset}>
              Yes, Reset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
