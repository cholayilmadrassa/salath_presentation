/**
 * Shared prayer icon map used by PrayerTimesWidget and SettingsPage.
 * Maps the icon key from PRAYER_NAMES → { Icon (Lucide component), color, bg }.
 */
import { Sunrise, Sun, CloudSun, Sunset, Moon } from 'lucide-react';

export const PRAYER_ICON_MAP = {
  Sunrise:  { Icon: Sunrise,  color: 'text-indigo-400', bg: 'bg-indigo-500/15'  },
  Sun:      { Icon: Sun,      color: 'text-amber-400',  bg: 'bg-amber-500/15'   },
  CloudSun: { Icon: CloudSun, color: 'text-orange-400', bg: 'bg-orange-500/15'  },
  Sunset:   { Icon: Sunset,   color: 'text-rose-400',   bg: 'bg-rose-500/15'    },
  Moon:     { Icon: Moon,     color: 'text-violet-400', bg: 'bg-violet-500/15'  },
};

/** Return which prayer key is next (or null if all prayers have passed today) */
export function getNextPrayerKey(prayerTimes, PRAYER_NAMES) {
  if (!prayerTimes || !PRAYER_NAMES) return null;
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  for (const { key } of PRAYER_NAMES) {
    const timeStr = prayerTimes[key];
    if (!timeStr) continue;
    const [h, m] = timeStr.split(':').map(Number);
    if (h * 60 + m > nowMins) return key;
  }
  return null; // all passed; next is Fajr tomorrow
}
