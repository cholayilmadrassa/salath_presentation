import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { PRAYER_NAMES, getCachedPrayerTimes, fetchAndCachePrayerTimes } from '../utils/prayerTimeNotifier.js';
import { PRAYER_ICON_MAP, getNextPrayerKey } from '../utils/prayerIcons.js';

/** Skeleton row shown while prayer times are loading */
function PrayerTimesWidgetSkeleton() {
  return (
    <div className="bg-card border border-border rounded-[20px] p-3.5 shadow-sm animate-pulse">
      <div className="h-3 w-24 bg-muted rounded mb-3" />
      <div className="grid grid-cols-5 gap-1.5">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="rounded-xl p-2 bg-muted/50 space-y-1.5">
            <div className="w-6 h-6 rounded-lg bg-muted mx-auto" />
            <div className="h-2 bg-muted rounded mx-auto w-5" />
            <div className="h-2 bg-muted/70 rounded mx-auto w-7" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Self-contained prayer times widget for the home page.
 * Fetches times silently via geolocation — no notification permission required.
 * Shows a skeleton while loading; hides entirely if location is denied.
 */
export default function PrayerTimesWidget() {
  const [prayerTimes, setPrayerTimes] = useState(() => getCachedPrayerTimes());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getCachedPrayerTimes()) return; // already cached, no need to fetch
    setLoading(true);
    fetchAndCachePrayerTimes()
      .then(setPrayerTimes)
      .catch(() => {}) // location denied or API error — widget stays hidden
      .finally(() => setLoading(false));
  }, []);

  if (loading && !prayerTimes) {
    return (
      <section className="px-4 pt-2 max-w-xl mx-auto w-full">
        <PrayerTimesWidgetSkeleton />
      </section>
    );
  }

  if (!prayerTimes) return null;

  const nextKey = getNextPrayerKey(prayerTimes, PRAYER_NAMES);

  return (
    <section className="px-4 pt-2 max-w-xl mx-auto w-full animate-slide-up">
      <div className="bg-card border border-border rounded-[20px] p-3.5 shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="text-[11px] font-extrabold text-foreground">നമസ്കാര സമയം</span>
          </div>

          {nextKey && (
            <Badge variant="outline" className="text-[9px] font-bold border-primary/40 text-primary gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse inline-block" />
              {PRAYER_NAMES.find(p => p.key === nextKey)?.label} Next
            </Badge>
          )}
        </div>

        {/* 5-column prayer grid */}
        <div className="grid grid-cols-5 gap-1.5">
          {PRAYER_NAMES.map(({ key, label, icon }) => {
            const { Icon, color, bg } = PRAYER_ICON_MAP[icon] ?? PRAYER_ICON_MAP.Moon;
            const isNext = key === nextKey;

            return (
              <div
                key={key}
                className={`rounded-xl p-2 text-center space-y-1 transition-all ${
                  isNext
                    ? 'bg-primary ring-2 ring-primary/40 shadow-sm'
                    : 'bg-muted/50 border border-border'
                }`}
              >
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center mx-auto ${
                  isNext ? 'bg-white/20' : bg
                }`}>
                  <Icon className={`w-3 h-3 ${isNext ? 'text-white' : color}`} />
                </div>
                <div className={`text-[9px] font-extrabold ${isNext ? 'text-white' : 'text-foreground'}`}>
                  {label}
                </div>
                <div className={`text-[9px] font-mono ${isNext ? 'text-white/80' : 'text-muted-foreground'}`}>
                  {prayerTimes[key] ? prayerTimes[key].slice(0, 5) : '--:--'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
