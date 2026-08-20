import { useState, useEffect } from 'react';
import { Clock, MapPin, Navigation, AlertCircle, HelpCircle, CheckCircle2, Settings } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  PRAYER_NAMES,
  getCachedPrayerTimes,
  hasCachedLocation,
  fetchAndCachePrayerTimes,
  getPrayerCityName,
} from '../utils/prayerTimeNotifier.js';
import { PRAYER_ICON_MAP, getNextPrayerKey } from '../utils/prayerIcons.js';

/** Skeleton row shown while prayer times are loading */
function PrayerTimesWidgetSkeleton() {
  return (
    <div className="bg-card border border-border rounded-[22px] p-4 shadow-sm animate-pulse">
      <div className="h-3.5 w-28 bg-muted rounded mb-3.5" />
      <div className="grid grid-cols-5 gap-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="rounded-2xl p-2.5 bg-muted/50 space-y-2 text-center">
            <div className="w-7 h-7 rounded-xl bg-muted mx-auto" />
            <div className="h-2.5 bg-muted rounded mx-auto w-6" />
            <div className="h-4 bg-muted/80 rounded mx-auto w-10" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Self-contained prayer times widget for the home page.
 * Uses clean non-overflowing Radix Dialog for location enablement.
 */
export default function PrayerTimesWidget() {
  const [prayerTimes, setPrayerTimes] = useState(() => getCachedPrayerTimes());
  const [loading, setLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showSettingsGuide, setShowSettingsGuide] = useState(false);

  useEffect(() => {
    // If today's times are already cached in localStorage, load immediately
    if (getCachedPrayerTimes()) return;

    // If location coordinates were previously allowed, fetch silently
    if (hasCachedLocation()) {
      setLoading(true);
      fetchAndCachePrayerTimes(false)
        .then((times) => {
          setPrayerTimes(times);
          setLocationError('');
        })
        .catch((err) => {
          console.warn('[Prayer Widget silent load]:', err?.message);
          setShowLocationModal(true);
        })
        .finally(() => setLoading(false));
    } else {
      // Check if user dismissed popup in this session
      const dismissed = sessionStorage.getItem('prayer_loc_dismissed');
      if (!dismissed) {
        setShowLocationModal(true);
      }
    }
  }, []);

  const handleEnableLocation = async () => {
    setLoading(true);
    setLocationError('');
    try {
      const times = await fetchAndCachePrayerTimes(true);
      setPrayerTimes(times);
      setLocationError('');
      setShowLocationModal(false);
      setShowSettingsGuide(false);
    } catch (err) {
      setLocationError(err.message || 'Location access was not granted. Please allow location in your browser.');
    } finally {
      setLoading(false);
    }
  };

  const handleDismissModal = () => {
    setShowLocationModal(false);
    try {
      sessionStorage.setItem('prayer_loc_dismissed', 'true');
    } catch { }
  };

  if (loading && !prayerTimes) {
    return (
      <section className="px-4 pt-2 max-w-xl mx-auto w-full">
        <PrayerTimesWidgetSkeleton />
      </section>
    );
  }

  const cityName = getPrayerCityName();

  return (
    <section className="px-4 pt-2 max-w-xl mx-auto w-full animate-slide-up">
      {/* ── If Prayer Times Are Available: Render Full Grid ── */}
      {prayerTimes ? (
        <div className="bg-card border border-border rounded-[22px] p-3.5 sm:p-4 shadow-sm font-sans">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Clock className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-sm font-extrabold text-foreground tracking-tight">നമസ്കാര സമയം</span>
                {cityName && (
                  <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-0.5 bg-muted/60 px-1.5 py-0.5 rounded-md">
                    <MapPin className="w-2.5 h-2.5 text-primary" />
                    <span>{cityName}</span>
                  </span>
                )}
              </div>
            </div>

            {(() => {
              const nextKey = getNextPrayerKey(prayerTimes, PRAYER_NAMES);
              if (!nextKey) return null;
              return (
                <Badge variant="outline" className="text-[10px] font-extrabold border-primary/40 text-primary gap-1.5 py-0.5 px-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse inline-block" />
                  {PRAYER_NAMES.find(p => p.key === nextKey)?.label} Next
                </Badge>
              );
            })()}
          </div>

          {/* 5-column prayer grid with large, bold prayer times */}
          <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
            {PRAYER_NAMES.map(({ key, label, icon }) => {
              const { Icon, color, bg } = PRAYER_ICON_MAP[icon] ?? PRAYER_ICON_MAP.Moon;
              const nextKey = getNextPrayerKey(prayerTimes, PRAYER_NAMES);
              const isNext = key === nextKey;
              const timeStr = prayerTimes[key] ? prayerTimes[key].slice(0, 5) : '--:--';

              return (
                <div
                  key={key}
                  className={`rounded-2xl p-2 sm:p-2.5 text-center space-y-1.5 transition-all ${isNext
                    ? 'bg-primary text-primary-foreground ring-2 ring-primary/40 shadow-md scale-[1.02]'
                    : 'bg-muted/40 border border-border/80 hover:bg-muted/60'
                    }`}
                >
                  {/* Icon */}
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center mx-auto ${isNext ? 'bg-white/20' : bg
                    }`}>
                    <Icon className={`w-3.5 h-3.5 ${isNext ? 'text-white' : color}`} />
                  </div>

                  {/* Prayer Name */}
                  <div className={`text-[10px] sm:text-[11px] font-bold tracking-tight ${isNext ? 'text-white/90 font-extrabold' : 'text-muted-foreground'
                    }`}>
                    {label}
                  </div>

                  {/* Large Bold Prayer Time */}
                  <div className={`text-xs sm:text-sm font-black tracking-tight font-mono ${isNext ? 'text-white' : 'text-foreground'
                    }`}>
                    {timeStr}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ── Fallback Card When Location Not Enabled Yet ── */
        <div className="bg-card border border-border rounded-[22px] p-4 shadow-sm space-y-3 font-sans">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Clock className="w-4 h-4" />
              </div>
              <span className="text-xs sm:text-sm font-extrabold text-foreground tracking-tight">നമസ്കാര സമയം</span>
            </div>
            <Badge variant="outline" className="text-[10px] font-bold text-muted-foreground border-border">
              Location Required
            </Badge>
          </div>

          <div className="bg-muted/40 border border-border/80 rounded-2xl p-4 text-center space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/15 text-primary flex items-center justify-center mx-auto shadow-xs">
              <MapPin className="w-5 h-5" />
            </div>

            <div className="space-y-1">
              <p className="text-xs sm:text-sm font-extrabold text-foreground leading-snug">
                നിങ്ങളുടെ പ്രദേശത്തെ കൃത്യമായ നമസ്കാര സമയം അറിയാൻ ലൊക്കേഷൻ ഓൺ ചെയ്യുക
              </p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Allow location access to view accurate daily prayer times for your current area.
              </p>
            </div>

            <Button
              type="button"
              size="sm"
              disabled={loading}
              onClick={() => setShowLocationModal(true)}
              className="w-full sm:w-auto rounded-xl text-xs font-bold gap-2 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-5 shadow-xs"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Enable Location / ലൊക്കേഷൻ ഓൺ ചെയ്യുക</span>
            </Button>
          </div>
        </div>
      )}

      {/* ── 📍 POPUP MODAL FOR LOCATION PERMISSION (Non-overflowing layout) ── */}
      <Dialog open={showLocationModal} onOpenChange={(open) => { if (!open) handleDismissModal(); }}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-sm max-h-[85vh] overflow-y-auto p-5 sm:p-6 text-center rounded-3xl border border-border shadow-2xl flex flex-col gap-3 font-sans">
          {/* Glowing MapPin Icon */}
          <div className="w-12 h-12 rounded-2xl bg-primary/15 text-primary flex items-center justify-center mx-auto ring-4 ring-primary/10 shadow-xs mt-0.5 shrink-0">
            <MapPin className="w-6 h-6 text-primary" />
          </div>

          {/* Modal Header */}
          <DialogHeader className="space-y-1 text-center p-0 m-0">
            <DialogTitle className="font-extrabold text-base text-foreground text-center">
              ലൊക്കേഷൻ അനുവദിക്കുക
            </DialogTitle>
            <DialogDescription className="text-xs font-extrabold text-primary text-center">
              Enable Location Access
            </DialogDescription>
          </DialogHeader>

          <p className="text-xs text-muted-foreground leading-relaxed">
            നിങ്ങളുടെ പ്രദേശത്തെ കൃത്യമായ നിസ്കാര സമയങ്ങൾ (ഫജ്ർ, ളുഹ്ർ, അസ്ർ, മഗ്‌രിബ്, ഇശാഅ്) അറിയാൻ ലൊക്കേഷൻ ഓൺ ചെയ്യുക.
          </p>

          {/* Error Display */}
          {locationError && (
            <div className="space-y-2 text-left w-full">
              <Alert variant="destructive" className="text-xs py-2 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-snug">{locationError}</span>
              </Alert>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowLocationModal(false);
                  setShowSettingsGuide(true);
                }}
                className="w-full text-xs font-bold gap-1.5 h-8 border-primary/30 text-primary hover:bg-primary/10"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>How to Allow in Browser </span>
              </Button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 pt-1 w-full">
            <Button
              type="button"
              disabled={loading}
              onClick={handleEnableLocation}
              className="w-full rounded-xl text-xs font-bold gap-2 bg-primary text-primary-foreground hover:bg-primary/90 h-9.5 shadow-xs"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>{loading ? 'Fetching Location...' : 'Allow Location / ലൊക്കേഷൻ ഓൺ ചെയ്യുക'}</span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={handleDismissModal}
              className="w-full rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground h-8"
            >
              Later (പിന്നീട്)
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── 🔒 BROWSER SETTINGS GUIDE MODAL (Non-overflowing layout) ── */}
      <Dialog open={showSettingsGuide} onOpenChange={setShowSettingsGuide}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-sm max-h-[85vh] overflow-y-auto p-5 space-y-3 text-foreground rounded-3xl font-sans border border-border shadow-2xl flex flex-col gap-3">
          <DialogHeader className="border-b border-border pb-2.5 text-left p-0 m-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center text-primary shrink-0">
                <Settings className="w-4 h-4" />
              </div>
              <div>
                <DialogTitle className="font-extrabold text-sm text-foreground">
                  Browser Permission Guide
                </DialogTitle>
                <DialogDescription className="text-[10px] text-muted-foreground">
                  How to allow Location access
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-2 text-xs">
            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-muted/40 border border-border/70">
              <span className="w-4.5 h-4.5 rounded-full bg-primary/20 text-primary font-mono font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</span>
              <p className="text-muted-foreground leading-relaxed text-[11px]">
                ബ്രൗസറിന്റെ മുകളിലുള്ള <strong className="text-foreground">🔒 (ലോക്ക് / Tune)</strong> ഐക്കണിൽ ക്ലിക്ക് ചെയ്യുക.
                <span className="block text-[10px] text-muted-foreground/80 mt-0.5">Tap the 🔒 lock/settings icon in address bar.</span>
              </p>
            </div>

            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-muted/40 border border-border/70">
              <span className="w-4.5 h-4.5 rounded-full bg-primary/20 text-primary font-mono font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</span>
              <p className="text-muted-foreground leading-relaxed text-[11px]">
                <strong className="text-foreground">Permissions</strong> എന്നതിൽ <strong className="text-emerald-600 dark:text-emerald-400">Location</strong> <strong className="text-foreground">Allow</strong> ചെയ്യുക.
                <span className="block text-[10px] text-muted-foreground/80 mt-0.5">Set Location to Allow.</span>
              </p>
            </div>

            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-muted/40 border border-border/70">
              <span className="w-4.5 h-4.5 rounded-full bg-primary/20 text-primary font-mono font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">3</span>
              <p className="text-muted-foreground leading-relaxed text-[11px]">
                പേജ് ഒന്നുകൂടി <strong className="text-foreground">Reload / Refresh</strong> ചെയ്യുക.
                <span className="block text-[10px] text-muted-foreground/80 mt-0.5">Refresh the page to activate.</span>
              </p>
            </div>
          </div>

          <Button
            type="button"
            onClick={() => {
              setShowSettingsGuide(false);
              handleEnableLocation();
            }}
            className="w-full rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 h-9 shrink-0 mt-1"
          >
            <CheckCircle2 className="w-4 h-4 mr-1.5" />
            Done, Try Again
          </Button>
        </DialogContent>
      </Dialog>
    </section>
  );
}
