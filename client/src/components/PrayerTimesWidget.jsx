import { useState, useEffect } from 'react';
import { Clock, MapPin, Navigation, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import {
  PRAYER_NAMES,
  getCachedPrayerTimes,
  hasCachedLocation,
  fetchAndCachePrayerTimes,
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
 * Requires user geolocation to calculate accurate local times.
 * Displays an "Enable Location" action card if location access has not been granted yet.
 */
export default function PrayerTimesWidget() {
  const [prayerTimes, setPrayerTimes] = useState(() => getCachedPrayerTimes());
  const [loading, setLoading] = useState(false);
  const [locationError, setLocationError] = useState('');

  useEffect(() => {
    // If today's times are already cached in localStorage, load immediately
    if (getCachedPrayerTimes()) return;

    // If location coordinates were previously allowed and cached, fetch silently
    if (hasCachedLocation()) {
      setLoading(true);
      fetchAndCachePrayerTimes(false)
        .then((times) => {
          setPrayerTimes(times);
          setLocationError('');
        })
        .catch((err) => {
          console.warn('[Prayer Widget silent load]:', err?.message);
        })
        .finally(() => setLoading(false));
    }
  }, []);

  const handleEnableLocation = async () => {
    setLoading(true);
    setLocationError('');
    try {
      const times = await fetchAndCachePrayerTimes(true);
      setPrayerTimes(times);
      setLocationError('');
    } catch (err) {
      setLocationError(err.message || 'Location access was not granted. Please allow location access.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !prayerTimes) {
    return (
      <section className="px-4 pt-2 max-w-xl mx-auto w-full">
        <PrayerTimesWidgetSkeleton />
      </section>
    );
  }

  // If prayer times are not yet available (location needed / denied), show "Enable Location" card
  if (!prayerTimes) {
    return (
      <section className="px-4 pt-2 max-w-xl mx-auto w-full animate-slide-up">
        <div className="bg-card border border-border rounded-[22px] p-4 shadow-sm space-y-3 font-sans">
          {/* Header */}
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

          {/* Location Request Box */}
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

            {locationError && (
              <Alert variant="destructive" className="text-xs py-2 text-left flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{locationError}</span>
              </Alert>
            )}

            <Button
              type="button"
              size="sm"
              disabled={loading}
              onClick={handleEnableLocation}
              className="w-full sm:w-auto rounded-xl text-xs font-bold gap-2 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-5 shadow-xs"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>{loading ? 'Fetching Location...' : 'Enable Location / ലൊക്കേഷൻ ഓൺ ചെയ്യുക'}</span>
            </Button>
          </div>
        </div>
      </section>
    );
  }

  const nextKey = getNextPrayerKey(prayerTimes, PRAYER_NAMES);

  return (
    <section className="px-4 pt-2 max-w-xl mx-auto w-full animate-slide-up">
      <div className="bg-card border border-border rounded-[22px] p-3.5 sm:p-4 shadow-sm font-sans">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Clock className="w-4 h-4" />
            </div>
            <span className="text-xs sm:text-sm font-extrabold text-foreground tracking-tight">നമസ്കാര സമയം</span>
          </div>

          {nextKey && (
            <Badge variant="outline" className="text-[10px] font-extrabold border-primary/40 text-primary gap-1.5 py-0.5 px-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse inline-block" />
              {PRAYER_NAMES.find(p => p.key === nextKey)?.label} Next
            </Badge>
          )}
        </div>

        {/* 5-column prayer grid with large, bold prayer times */}
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
          {PRAYER_NAMES.map(({ key, label, icon }) => {
            const { Icon, color, bg } = PRAYER_ICON_MAP[icon] ?? PRAYER_ICON_MAP.Moon;
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
    </section>
  );
}
