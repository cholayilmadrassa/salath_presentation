import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useTenant } from '../context/TenantContext.jsx';
import { api } from '../api.js';
import { incrementCachedTotalSwalath } from '../utils/swalathCache.js';
import { getSubmissionStatus } from '../utils/submissionStatus.js';
import { salathCountSchema } from '../schemas/validationSchemas.js';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { Plus, Save, CheckCircle2, Ban, Lock, Timer } from 'lucide-react';

function todayKey() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export default function SubmitSwalathModal({ open, onOpenChange, onSuccess }) {
  const { token } = useAuth();
  const { activeTenant } = useTenant();
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const submissionStatus = getSubmissionStatus(activeTenant);

  const handleClose = () => {
    if (!loading) {
      onOpenChange(false);
      setError('');
      setSuccess('');
      setValue('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (submissionStatus.isClosed) {
      setError('സ്വലാത്ത് സമർപ്പണ സമയപരിധി അവസാനിച്ചിരിക്കുന്നു.');
      return;
    }

    if (!value || !String(value).trim()) {
      setError('Please enter a Swalath count number');
      return;
    }

    const num = Number(value);
    if (isNaN(num) || num <= 0) {
      setError('Please enter a valid Swalath count');
      return;
    }

    const validationResult = salathCountSchema.safeParse({ value: num });
    if (!validationResult.success) {
      setError(validationResult.error.errors[0].message);
      return;
    }

    setLoading(true);
    try {
      await api('/counts/entry', {
        method: 'POST',
        token,
        body: { value: num, date: todayKey() },
      });

      incrementCachedTotalSwalath(activeTenant, num);
      setSuccess(`+${num.toLocaleString('en-IN')} Swalath submitted successfully!`);
      setValue('');
      if (onSuccess) onSuccess(num);

      setTimeout(() => {
        handleClose();
      }, 650);
    } catch (err) {
      setError(err.message || 'Failed to submit Swalath count');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else onOpenChange(v); }}>
      <DialogContent className="top-14 sm:top-20 translate-y-0 w-[calc(100%-2rem)] max-w-sm p-5 sm:p-6 rounded-3xl border border-border shadow-2xl font-sans">
        <DialogHeader className="space-y-1.5 text-center">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-1 ring-4 ${
              submissionStatus.isClosed
                ? 'bg-destructive/15 text-destructive ring-destructive/10'
                : 'bg-primary/15 text-primary ring-primary/10'
            }`}
          >
            {submissionStatus.isClosed ? (
              <Ban className="w-6 h-6 stroke-[2.5]" />
            ) : (
              <Plus className="w-6 h-6 stroke-[2.5]" />
            )}
          </div>
          <DialogTitle className="text-base sm:text-lg font-black text-foreground">
            {submissionStatus.isClosed ? 'സമർപ്പണം അവസാനിച്ചു' : 'സ്വലാത്ത് രേഖപ്പെടുത്തുക'}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground font-medium">
            {submissionStatus.isClosed
              ? 'ഈ ക്യാമ്പയിനിലെ സ്വലാത്ത് സമർപ്പണം പൂർത്തിയായി.'
              : submissionStatus.isScheduled
              ? `Cutoff: ${submissionStatus.formattedCutoff}`
              : "Enter your Swalath count to add to today's total"}
          </DialogDescription>
        </DialogHeader>

        {submissionStatus.isClosed ? (
          <div className="space-y-4 pt-2 text-center">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-1.5 text-foreground">
              <p className="font-extrabold text-amber-800 dark:text-amber-300">
                സ്വലാത്ത് രേഖപ്പെടുത്തുന്നത് അവസാനിച്ചിരിക്കുന്നു
              </p>
              <p className="text-[11px] text-muted-foreground">
                പങ്കെടുത്ത എല്ലാവർക്കും നന്ദി! അല്ലാഹു സ്വീകരിക്കുമാറാകട്ടെ.
              </p>
              <p className="text-sm font-arabic font-bold text-primary pt-1" dir="rtl">
                🌸 جزاكم اللهُ خيرًا 🌸
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="w-full rounded-xl font-bold h-11"
            >
              Close (അടയ്ക്കുക)
            </Button>
          </div>
        ) : (
          <>
            {error && <Alert variant="destructive" className="text-xs py-2 animate-slide-down">{error}</Alert>}
            {success && (
              <div className="bg-emerald-50 text-emerald-900 border border-emerald-200/80 rounded-xl p-2.5 shadow-xs flex items-center gap-2 animate-slide-down">
                <div className="w-5 h-5 rounded-md bg-emerald-100 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <span className="text-xs font-bold">{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 pt-1">
              {/* Count Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-foreground block text-center">
                  Enter Swalath Count (എണ്ണം):
                </label>
                <Input
                  type="number"
                  placeholder="e.g. 1000"
                  value={value}
                  maxLength={6}
                  onInput={(e) => {
                    if (e.target.value.length > 6) {
                      e.target.value = e.target.value.slice(0, 6);
                    }
                  }}
                  onChange={(e) => {
                    if (error) setError('');
                    setValue(e.target.value);
                  }}
                  autoFocus
                  className="text-2xl font-black text-center tracking-wide h-14 rounded-2xl border-input"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={loading}
                  className="flex-1 rounded-xl font-bold h-11"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !value}
                  className="flex-1 rounded-xl font-bold h-11 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Save className="w-4 h-4 mr-1.5" />
                  <span>{loading ? 'Saving...' : 'Save Count'}</span>
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
