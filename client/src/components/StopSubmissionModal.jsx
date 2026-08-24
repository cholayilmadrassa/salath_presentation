import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { formatCutoffDateTime, getTimeRemaining } from '../utils/submissionStatus.js';
import {
  CalendarClock,
  Ban,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Calendar as CalendarIcon,
} from 'lucide-react';

function getTodayDateString(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export default function StopSubmissionModal({
  open,
  onOpenChange,
  onConfirm,
  currentCutoff = null,
}) {
  const [mode, setMode] = useState('immediately'); // 'immediately' | 'schedule'
  const [selectedDate, setSelectedDate] = useState(() => getTodayDateString(1));
  const [selectedTime, setSelectedTime] = useState('23:59');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Initialize or reset form when modal opens
  useEffect(() => {
    if (open) {
      setError('');
      if (currentCutoff) {
        setMode('schedule');
        const d = new Date(currentCutoff);
        if (!isNaN(d.getTime())) {
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          const hh = String(d.getHours()).padStart(2, '0');
          const min = String(d.getMinutes()).padStart(2, '0');
          setSelectedDate(`${yyyy}-${mm}-${dd}`);
          setSelectedTime(`${hh}:${min}`);
        }
      } else {
        setMode('immediately');
        setSelectedDate(getTodayDateString(1));
        setSelectedTime('23:59');
      }
    }
  }, [open, currentCutoff]);

  // Compute combined ISO Date
  const getComputedCutoff = () => {
    if (mode !== 'schedule' || !selectedDate || !selectedTime) return null;
    const [year, month, day] = selectedDate.split('-').map(Number);
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const dateObj = new Date(year, month - 1, day, hours, minutes, 0, 0);
    return dateObj;
  };

  const computedDateObj = getComputedCutoff();
  const timeRemaining = computedDateObj ? getTimeRemaining(computedDateObj) : null;
  const isPastTime = timeRemaining ? timeRemaining.isExpired : false;

  const handleApplyPreset = (daysOffset, time = '23:59') => {
    setSelectedDate(getTodayDateString(daysOffset));
    setSelectedTime(time);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (mode === 'immediately') {
      setLoading(true);
      try {
        await onConfirm('immediately', null);
        onOpenChange(false);
      } catch (err) {
        setError(err.message || 'Failed to stop submissions');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Mode is 'schedule'
    if (!selectedDate || !selectedTime) {
      setError('Please select both a date and time');
      return;
    }

    if (!computedDateObj || isNaN(computedDateObj.getTime())) {
      setError('Invalid date or time selected');
      return;
    }

    if (isPastTime) {
      setError('The scheduled cutoff must be a future date and time');
      return;
    }

    setLoading(true);
    try {
      await onConfirm('schedule', computedDateObj.toISOString());
      onOpenChange(false);
    } catch (err) {
      setError(err.message || 'Failed to schedule submission cutoff');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[calc(100%-2rem)] p-5 sm:p-6 rounded-3xl border border-border shadow-2xl font-sans max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-1.5 text-left">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <CalendarClock className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-extrabold text-foreground">
                Stop Adding Swalath
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                സ്വലാത്ത് രേഖപ്പെടുത്തുന്നത് നിർത്തുക അല്ലെങ്കിൽ ഷെഡ്യൂൾ ചെയ്യുക
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="text-xs py-2 animate-slide-down">
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Choice Mode Selector: Immediately vs Schedule */}
          <div className="space-y-2">
            <Label className="text-xs font-extrabold text-foreground">
              Select Action (എങ്ങനെ നിർത്തണം?):
            </Label>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Option 1: Immediately */}
              <button
                type="button"
                onClick={() => {
                  setMode('immediately');
                  setError('');
                }}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  mode === 'immediately'
                    ? 'border-destructive bg-destructive/10 text-destructive shadow-xs ring-2 ring-destructive/20'
                    : 'border-border bg-card hover:bg-muted/40 text-muted-foreground'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <Ban className={`w-4 h-4 ${mode === 'immediately' ? 'text-destructive' : 'text-muted-foreground'}`} />
                  {mode === 'immediately' && (
                    <span className="w-2 h-2 rounded-full bg-destructive" />
                  )}
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-foreground">Immediately</h4>
                  <p className="text-[10px] text-muted-foreground mt-0.5">ഉടൻ നിർത്തുക</p>
                </div>
              </button>

              {/* Option 2: Schedule */}
              <button
                type="button"
                onClick={() => {
                  setMode('schedule');
                  setError('');
                }}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  mode === 'schedule'
                    ? 'border-primary bg-primary/10 text-primary shadow-xs ring-2 ring-primary/20'
                    : 'border-border bg-card hover:bg-muted/40 text-muted-foreground'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <CalendarClock className={`w-4 h-4 ${mode === 'schedule' ? 'text-primary' : 'text-muted-foreground'}`} />
                  {mode === 'schedule' && (
                    <span className="w-2 h-2 rounded-full bg-primary" />
                  )}
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-foreground">Schedule</h4>
                  <p className="text-[10px] text-muted-foreground mt-0.5">സമയം നിശ്ചയിക്കുക</p>
                </div>
              </button>
            </div>
          </div>

          {/* If Mode == Immediately: Info Alert */}
          {mode === 'immediately' && (
            <div className="p-3 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs space-y-1 animate-slide-down">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Submissions will stop immediately</span>
              </div>
              <p className="text-[11px] text-destructive/80 leading-relaxed">
                ഉടൻ തന്നെ ഉപയോക്താക്കൾക്ക് പുതിയ സ്വലാത്തുകൾ രേഖപ്പെടുത്താൻ സാധിക്കില്ല. നിങ്ങൾ വീണ്ടും ഓൺ ചെയ്യുന്നത് വരെ ഇത് നിർത്തിവെക്കപ്പെടും.
              </p>
            </div>
          )}

          {/* If Mode == Schedule: Date & Time Picker + Quick Presets */}
          {mode === 'schedule' && (
            <div className="space-y-3.5 pt-1 animate-slide-down">
              {/* Quick Presets */}
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold text-muted-foreground">
                  Quick Shortcuts (വേഗത്തിൽ തിരഞ്ഞെടുക്കാം):
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleApplyPreset(0, '23:59')}
                    className="text-[10px] h-7 rounded-xl px-2.5 font-bold"
                  >
                    Tonight 11:59 PM
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleApplyPreset(1, '23:59')}
                    className="text-[10px] h-7 rounded-xl px-2.5 font-bold"
                  >
                    Tomorrow 11:59 PM
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleApplyPreset(3, '23:59')}
                    className="text-[10px] h-7 rounded-xl px-2.5 font-bold"
                  >
                    In 3 Days
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleApplyPreset(7, '23:59')}
                    className="text-[10px] h-7 rounded-xl px-2.5 font-bold"
                  >
                    In 7 Days
                  </Button>
                </div>
              </div>

              {/* Date and Time Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <CalendarIcon className="w-3.5 h-3.5 text-primary" />
                    <span>Cutoff Date (തീയതി)</span>
                  </Label>
                  <Input
                    type="date"
                    value={selectedDate}
                    min={getTodayDateString(0)}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setError('');
                    }}
                    className="rounded-xl h-10 font-bold"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    <span>Cutoff Time (സമയം)</span>
                  </Label>
                  <Input
                    type="time"
                    value={selectedTime}
                    onChange={(e) => {
                      setSelectedTime(e.target.value);
                      setError('');
                    }}
                    className="rounded-xl h-10 font-bold"
                    required
                  />
                </div>
              </div>

              {/* Live Preview Card */}
              {computedDateObj && !isNaN(computedDateObj.getTime()) && (
                <div className="p-3.5 rounded-2xl bg-muted/40 border border-border space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-muted-foreground flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      <span>Cutoff Deadline:</span>
                    </span>
                    {isPastTime ? (
                      <Badge variant="destructive" className="text-[9px]">Time has passed</Badge>
                    ) : (
                      <Badge variant="success" className="text-[9px]">
                        {timeRemaining.days}d {timeRemaining.hours}h {timeRemaining.minutes}m remaining
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs font-extrabold text-foreground">
                    {formatCutoffDateTime(computedDateObj)}
                  </p>
                  <p className="text-[10px] text-muted-foreground leading-snug">
                    ഈ സമയപരിധി വരെ ഉപയോക്താക്കൾക്ക് സ്വലാത്ത് രേഖപ്പെടുത്താം. അതിനു ശേഷം സമർപ്പണം തനിയെ അവസാനിക്കുകയും ഹോം പേജിൽ പൂർത്തിയായ സന്ദേശം കാണിക്കുകയും ചെയ്യും.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="flex-1 rounded-xl font-bold h-10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || (mode === 'schedule' && isPastTime)}
              variant={mode === 'immediately' ? 'destructive' : 'default'}
              className="flex-1 rounded-xl font-bold h-10"
            >
              {loading
                ? 'Saving...'
                : mode === 'immediately'
                ? 'Stop Immediately'
                : 'Confirm Schedule'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
