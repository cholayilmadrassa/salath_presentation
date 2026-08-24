import { useState, useEffect } from 'react';
import { getTimeRemaining, formatCutoffDateTime } from '../utils/submissionStatus.js';
import { Clock, Timer, Sparkles, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function SubmissionCountdown({
  cutoffDate,
  onExpire = null,
  variant = 'card', // 'card' | 'compact' | 'hero'
  className = '',
}) {
  const [time, setTime] = useState(() => getTimeRemaining(cutoffDate));

  useEffect(() => {
    if (!cutoffDate) return;

    // Immediately calculate initial
    const initial = getTimeRemaining(cutoffDate);
    setTime(initial);
    if (initial.isExpired && onExpire) {
      onExpire();
    }

    const interval = setInterval(() => {
      const updated = getTimeRemaining(cutoffDate);
      setTime(updated);

      if (updated.isExpired) {
        clearInterval(interval);
        if (onExpire) onExpire();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [cutoffDate, onExpire]);

  if (!cutoffDate) return null;

  const isUrgent = time.days === 0 && time.hours < 12 && !time.isExpired;
  const formattedDate = formatCutoffDateTime(cutoffDate);

  if (time.isExpired) {
    return (
      <div className={`p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-center space-y-1 ${className}`}>
        <div className="flex items-center justify-center gap-1.5 font-extrabold text-xs">
          <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span>സ്വലാത്ത് സമർപ്പണ സമയം അവസാനിച്ചിരിക്കുന്നു</span>
        </div>
        <p className="text-[11px] text-muted-foreground">
          നിശ്ചയിച്ച സമയപരിധി ({formattedDate}) പൂർത്തിയായി.
        </p>
      </div>
    );
  }

  // Compact variant for headers or forms
  if (variant === 'compact') {
    return (
      <div className={`flex items-center justify-between p-3 rounded-2xl bg-primary/10 border border-primary/20 ${className}`}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
            <Timer className="w-4 h-4 text-primary animate-pulse" />
          </div>
          <div>
            <span className="text-xs font-extrabold text-foreground block leading-tight">
              സമർപ്പണ സമയം അവസാനിക്കാൻ ഇനി
            </span>
            <span className="text-[10px] text-muted-foreground">
              {formattedDate} വരെ
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 font-mono text-xs font-black text-primary">
          {time.days > 0 && <span>{time.days}d :</span>}
          <span>{String(time.hours).padStart(2, '0')}h :</span>
          <span>{String(time.minutes).padStart(2, '0')}m :</span>
          <span className="text-foreground">{String(time.seconds).padStart(2, '0')}s</span>
        </div>
      </div>
    );
  }

  // Full Rich Card variant for User Home / Hero
  return (
    <div
      className={`rounded-3xl p-4 sm:p-5 relative overflow-hidden transition-all shadow-lg border ${
        isUrgent
          ? 'bg-gradient-to-br from-amber-500/15 via-rose-500/10 to-amber-600/15 border-amber-500/40 text-foreground'
          : 'bg-gradient-to-br from-[#0E7443]/15 via-primary/10 to-[#10B981]/15 border-primary/30 text-foreground'
      } ${className}`}
    >
      {/* Decorative ambient background glows */}
      <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full blur-2xl pointer-events-none bg-primary/20" />
      <div className="absolute -bottom-10 -left-10 w-28 h-28 rounded-full blur-2xl pointer-events-none bg-[#D4AF37]/20" />

      {/* Header Info */}
      <div className="flex items-center justify-between relative z-10 mb-3.5">
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-xs shrink-0 ${
              isUrgent ? 'bg-amber-500/25 text-amber-600 dark:text-amber-400' : 'bg-primary/25 text-primary'
            }`}
          >
            {isUrgent ? (
              <AlertTriangle className="w-4 h-4 animate-bounce" />
            ) : (
              <Timer className="w-4 h-4 animate-pulse" />
            )}
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-extrabold text-foreground leading-tight flex items-center gap-1.5">
              <span>സ്വലാത്ത് സമർപ്പണം അവസാനിക്കാൻ</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
            </h3>
            <p className="text-[10px] sm:text-[11px] font-medium text-muted-foreground">
              അവസാന സമയം: <span className="font-bold text-foreground">{formattedDate}</span>
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-background/80 backdrop-blur-md border border-border text-[10px] font-bold text-muted-foreground shadow-xs">
          <Sparkles className="w-3 h-3 text-primary" />
          <span>Live Countdown</span>
        </div>
      </div>

      {/* 4-Box Flip-style Digit Display */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3 relative z-10">
        {/* Days */}
        <div className="bg-card/90 dark:bg-card/80 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 text-center border border-border/80 shadow-xs flex flex-col items-center justify-center">
          <span className="text-xl sm:text-2xl font-black font-mono tracking-tight text-foreground">
            {String(time.days).padStart(2, '0')}
          </span>
          <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground mt-0.5">
            Days (ദിനം)
          </span>
        </div>

        {/* Hours */}
        <div className="bg-card/90 dark:bg-card/80 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 text-center border border-border/80 shadow-xs flex flex-col items-center justify-center">
          <span className="text-xl sm:text-2xl font-black font-mono tracking-tight text-foreground">
            {String(time.hours).padStart(2, '0')}
          </span>
          <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground mt-0.5">
            Hours (മണി)
          </span>
        </div>

        {/* Minutes */}
        <div className="bg-card/90 dark:bg-card/80 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 text-center border border-border/80 shadow-xs flex flex-col items-center justify-center">
          <span className="text-xl sm:text-2xl font-black font-mono tracking-tight text-foreground">
            {String(time.minutes).padStart(2, '0')}
          </span>
          <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground mt-0.5">
            Mins (മിനിറ്റ്)
          </span>
        </div>

        {/* Seconds */}
        <div
          className={`bg-card/90 dark:bg-card/80 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 text-center border shadow-xs flex flex-col items-center justify-center ${
            isUrgent ? 'border-amber-500/50 text-amber-600 dark:text-amber-400' : 'border-primary/40 text-primary'
          }`}
        >
          <span className="text-xl sm:text-2xl font-black font-mono tracking-tight animate-pulse">
            {String(time.seconds).padStart(2, '0')}
          </span>
          <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground mt-0.5">
            Secs (സെക്കൻഡ്)
          </span>
        </div>
      </div>
    </div>
  );
}
