/**
 * Prayer Time Notification Utility
 * Fetches daily prayer times from Aladhan API and schedules local browser notifications.
 * Method 1 = Muslim World League (standard for India/Kerala)
 */

const PRAYER_TIME_KEY = 'prayerTimeNotifEnabled';
const PRAYER_TIMES_CACHE_KEY = 'prayerTimesCache';
const PRAYER_TIMES_CACHE_DATE_KEY = 'prayerTimesCacheDate';

// Method 1: Muslim World League — standard for India/South Asia
// Fajr angle: 18°, Isha angle: 17°
const ALADHAN_METHOD = 1;

/** Islamic prayer names with Malayalam labels */
export const PRAYER_NAMES = [
  { key: 'Fajr',    label: 'ഫജ്ർ',     icon: 'Sunrise' },
  { key: 'Dhuhr',   label: 'ദുഹ്ർ',     icon: 'Sun'     },
  { key: 'Asr',     label: 'അസ്ർ',      icon: 'CloudSun'},
  { key: 'Maghrib', label: 'മഗ്‌രിബ്',  icon: 'Sunset'  },
  { key: 'Isha',    label: 'ഇശ',        icon: 'Moon'    },
];

/** Get today's date string YYYY-MM-DD */
function getTodayStr() {
  return new Date().toISOString().slice(0, 10);
}

/** Invalidate the prayer times cache (call when changing method / location) */
export function clearPrayerTimesCache() {
  localStorage.removeItem(PRAYER_TIMES_CACHE_KEY);
  localStorage.removeItem(PRAYER_TIMES_CACHE_DATE_KEY);
}

/** Convert prayer time string (HH:MM) to today's Date object in LOCAL time */
function prayerTimeToDate(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0);
}

/** Fetch prayer times from Aladhan API with localStorage caching */
async function fetchPrayerTimes(lat, lon) {
  const today = getTodayStr();
  const cachedDate = localStorage.getItem(PRAYER_TIMES_CACHE_DATE_KEY);
  const cachedData = localStorage.getItem(PRAYER_TIMES_CACHE_KEY);

  if (cachedDate === today && cachedData) {
    try { return JSON.parse(cachedData); } catch {}
  }

  // Use method=1 (Muslim World League) — accurate for India/Kerala
  const url = `https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lon}&method=${ALADHAN_METHOD}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch prayer times');
  const json = await res.json();

  const timings = json.data.timings;
  const prayerMap = {};
  for (const p of PRAYER_NAMES) {
    // Strip the timezone suffix if present (e.g. "05:30 (IST)" -> "05:30")
    const raw = timings[p.key] || '';
    prayerMap[p.key] = raw.replace(/\s*\(.*\)/, '').trim() || null;
  }

  localStorage.setItem(PRAYER_TIMES_CACHE_DATE_KEY, today);
  localStorage.setItem(PRAYER_TIMES_CACHE_KEY, JSON.stringify(prayerMap));
  return prayerMap;
}

/** Get user coordinates via Geolocation API */
function getUserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => reject(new Error('Location access denied. Please allow location for prayer times.')),
      { timeout: 10000 }
    );
  });
}

// Store scheduled notification timeouts so we can cancel them
let scheduledTimeouts = [];

/** Clear all scheduled prayer time notifications */
export function clearPrayerNotifications() {
  for (const id of scheduledTimeouts) clearTimeout(id);
  scheduledTimeouts = [];
}

/** Schedule a local notification for a single prayer time */
function scheduleNotification(prayerName, prayerLabel, timeStr) {
  const prayerDate = prayerTimeToDate(timeStr);
  const msUntilPrayer = prayerDate.getTime() - Date.now();
  if (msUntilPrayer < 30000) return; // skip past / too-close times

  const timeoutId = setTimeout(() => {
    if (Notification.permission === 'granted') {
      try {
        const notif = new Notification(`☪️ ${prayerLabel} - നമസ്കാര സമയം`, {
          body: `${prayerLabel} നമസ്കാരം ആയി.\nAllahu Akbar!`,
          icon: '/appLogo.png',
          badge: '/appLogo.png',
          tag: `prayer-${prayerName}`,
          requireInteraction: false,
        });
        setTimeout(() => notif.close(), 10000);
      } catch (e) {
        console.warn('[Prayer Notif]: Could not show notification', e);
      }
    }
  }, msUntilPrayer);

  scheduledTimeouts.push(timeoutId);
  console.log(`[Prayer Notif]: Scheduled ${prayerLabel} in ${Math.round(msUntilPrayer / 60000)} min`);
}

/**
 * Initialize prayer time notifications for today.
 * Requests permission, fetches times, schedules notifications.
 */
export async function initPrayerTimeNotifications() {
  clearPrayerNotifications();

  if (Notification.permission !== 'granted') {
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') throw new Error('Notification permission not granted.');
  }

  const { lat, lon } = await getUserLocation();
  const prayerMap = await fetchPrayerTimes(lat, lon);

  for (const { key, label } of PRAYER_NAMES) {
    if (prayerMap[key]) scheduleNotification(key, label, prayerMap[key]);
  }

  return prayerMap;
}

/** Check if prayer time notifications are enabled */
export function isPrayerNotifEnabled() {
  return localStorage.getItem(PRAYER_TIME_KEY) === 'true';
}

/** Enable prayer time notifications (clears stale cache first) */
export async function enablePrayerNotifications() {
  clearPrayerTimesCache(); // force fresh fetch with correct method
  const prayerMap = await initPrayerTimeNotifications();
  localStorage.setItem(PRAYER_TIME_KEY, 'true');
  return prayerMap;
}

/** Disable prayer time notifications */
export function disablePrayerNotifications() {
  clearPrayerNotifications();
  localStorage.setItem(PRAYER_TIME_KEY, 'false');
}

/** Get cached prayer times for today (if available) */
export function getCachedPrayerTimes() {
  const today = getTodayStr();
  if (localStorage.getItem(PRAYER_TIMES_CACHE_DATE_KEY) === today) {
    const data = localStorage.getItem(PRAYER_TIMES_CACHE_KEY);
    if (data) try { return JSON.parse(data); } catch {}
  }
  return null;
}

/**
 * Fetch and cache today's prayer times silently (no notification permission needed).
 * Used to show prayer times on the home page widget.
 */
export async function fetchAndCachePrayerTimes() {
  const { lat, lon } = await getUserLocation();
  return fetchPrayerTimes(lat, lon);
}
