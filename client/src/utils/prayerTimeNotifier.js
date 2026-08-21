/**
 * Prayer Time Notification Utility
 * Fetches daily prayer times strictly from live Aladhan API based on user's real geolocation.
 * Identifies city/locality directly from GPS latitude & longitude coordinates.
 * Seamlessly integrates client-side alarms with server-side Web Push for background delivery when app is closed.
 * Method 1 = Muslim World League (standard for India/Kerala)
 */

import { subscribeUserToPush, updatePushPreferences } from './pushManager.js';

const PRAYER_TIME_KEY = 'prayerTimeNotifEnabled';
const PRAYER_TIMES_CACHE_KEY = 'prayerTimesCache';
const PRAYER_TIMES_CACHE_DATE_KEY = 'prayerTimesCacheDate';
const PRAYER_COORDS_CACHE_KEY = 'prayerCoordsCache';
const PRAYER_CITY_CACHE_KEY = 'prayerCityName';
const PRAYER_TRIGGERED_PREFIX = 'prayer_triggered_';

// Default fallback coordinates (Kozhikode, Kerala, India)
const DEFAULT_COORDS = { lat: 11.2588, lon: 75.7804 };
const DEFAULT_CITY = 'Kozhikode';

// Method 1: Muslim World League (Fajr 18°, Isha 17° - Standard for Kerala/India)
const ALADHAN_METHOD = 1;

/** Islamic prayer names with Malayalam and English labels */
export const PRAYER_NAMES = [
  { key: 'Fajr', label: 'ഫജ്ർ', en: 'Fajr', icon: 'Sunrise' },
  { key: 'Luhr', label: 'ളുഹ്ർ', en: 'Luhr', icon: 'Sun' },
  { key: 'Asr', label: 'അസ്ർ', en: 'Asr', icon: 'CloudSun' },
  { key: 'Maghrib', label: 'മഗ്‌രിബ്', en: 'Maghrib', icon: 'Sunset' },
  { key: 'Isha', label: 'ഇശാഅ്', en: 'Isha', icon: 'Moon' },
];

/** Get today's date string YYYY-MM-DD */
export function getTodayStr() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Convert "HH:MM" (24h) to "h:mm AM/PM" (e.g. "15:37" -> "3:37 PM") */
export function formatTo12Hour(timeStr) {
  if (!timeStr) return '';
  const [hStr, mStr] = timeStr.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr ? mStr.slice(0, 2) : '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  h = h ? h : 12;
  return `${h}:${m} ${ampm}`;
}

/** Normalize time string to strict "HH:MM" (24h) */
export function normalizeTimeStr(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const clean = raw.replace(/\s*\(.*\)/, '').trim();
  if (clean.includes(':')) {
    const [h, m] = clean.split(':');
    return `${h.padStart(2, '0')}:${m.slice(0, 2).padStart(2, '0')}`;
  }
  return null;
}

/**
 * Identify exact City / Locality from Latitude and Longitude coordinates
 */
export async function fetchCityFromCoordinates(lat, lon) {
  if (!lat || !lon) return DEFAULT_CITY;

  // 1. Primary: BigDataCloud Reverse Geocoding Client API
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const detectedCity = data.city || data.locality || data.principalSubdivision;
      if (detectedCity && typeof detectedCity === 'string') {
        const cleanCity = detectedCity.trim();
        localStorage.setItem(PRAYER_CITY_CACHE_KEY, cleanCity);
        console.log(`[Prayer Location]: 📍 Identified City from (${lat}, ${lon}) -> ${cleanCity}`);
        return cleanCity;
      }
    }
  } catch (err) {
    console.warn('[Prayer Location BigDataCloud Error]:', err?.message);
  }

  // 2. Fallback: OpenStreetMap Nominatim
  try {
    const osmUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=10`;
    const res = await fetch(osmUrl, { headers: { 'Accept-Language': 'en' } });
    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const detectedCity = addr.city || addr.town || addr.village || addr.suburb || addr.county || addr.state_district;
      if (detectedCity) {
        const cleanCity = detectedCity.trim();
        localStorage.setItem(PRAYER_CITY_CACHE_KEY, cleanCity);
        console.log(`[Prayer Location]: 📍 Identified City from OSM -> ${cleanCity}`);
        return cleanCity;
      }
    }
  } catch (err) {
    console.warn('[Prayer Location OSM Error]:', err?.message);
  }

  return localStorage.getItem(PRAYER_CITY_CACHE_KEY) || DEFAULT_CITY;
}

/** Get city/place name for notification body */
export function getPrayerCityName() {
  try {
    const cachedCity = localStorage.getItem(PRAYER_CITY_CACHE_KEY);
    if (cachedCity) return cachedCity;

    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (user?.address || user?.place) {
      const place = (user.address || user.place).split(',')[0].trim();
      if (place) return place;
    }

    const tenant = JSON.parse(localStorage.getItem('activeTenant') || 'null');
    if (tenant?.city || tenant?.place) return tenant.city || tenant.place;
  } catch { }
  return DEFAULT_CITY;
}

/** Build notification title & body */
export function buildPrayerNotificationContent(prayerKey, timeStr) {
  const pObj = PRAYER_NAMES.find(p => p.key === prayerKey) || { en: prayerKey, label: prayerKey };
  const englishName = pObj.en || (prayerKey === 'Luhr' ? 'Luhr' : prayerKey);
  const malayalamName = pObj.label || prayerKey;
  const formattedTime = formatTo12Hour(timeStr);
  const city = getPrayerCityName();

  return {
    title: `${formattedTime} ${englishName}`,
    body: `${malayalamName} നമസ്കാര സമയമായി 🕌 · It's time for ${englishName} prayer in ${city}`,
  };
}

/** Invalidate the prayer times cache */
export function clearPrayerTimesCache() {
  try {
    localStorage.removeItem(PRAYER_TIMES_CACHE_KEY);
    localStorage.removeItem(PRAYER_TIMES_CACHE_DATE_KEY);
  } catch { }
}

/** Check if coordinates are already cached */
export function hasCachedLocation() {
  try {
    const cached = localStorage.getItem(PRAYER_COORDS_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      return Boolean(parsed?.lat && parsed?.lon);
    }
  } catch { }
  return false;
}

/** Convert prayer time string (HH:MM) to today's Date object in LOCAL time */
export function prayerTimeToDate(timeStr) {
  if (!timeStr) return null;
  const [hours, minutes] = timeStr.split(':').map(Number);
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours || 0, minutes || 0, 0, 0);
}

/** Get user coordinates with cache check and non-blocking fallback */
export async function getUserLocation(forcePrompt = false) {
  if (!forcePrompt) {
    try {
      const cached = localStorage.getItem(PRAYER_COORDS_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.lat && parsed?.lon) {
          if (!localStorage.getItem(PRAYER_CITY_CACHE_KEY)) {
            fetchCityFromCoordinates(parsed.lat, parsed.lon).catch(() => { });
          }
          return parsed;
        }
      }
    } catch { }
  }

  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    console.warn('[Prayer Location]: Geolocation unsupported, using default Kerala coordinates.');
    return DEFAULT_COORDS;
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        try {
          localStorage.setItem(PRAYER_COORDS_CACHE_KEY, JSON.stringify(coords));
          await fetchCityFromCoordinates(coords.lat, coords.lon).catch(() => { });
        } catch { }
        resolve(coords);
      },
      (err) => {
        console.warn('[Prayer Location]: Geolocation error/denied (' + err.message + '). Falling back to default.');
        const cached = localStorage.getItem(PRAYER_COORDS_CACHE_KEY);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (parsed?.lat && parsed?.lon) return resolve(parsed);
          } catch { }
        }
        resolve(DEFAULT_COORDS);
      },
      { timeout: 8000, enableHighAccuracy: false, maximumAge: 3600000 }
    );
  });
}

/** Fetch real prayer times from live Aladhan API with daily caching */
export async function fetchPrayerTimes(lat, lon) {
  const effectiveLat = lat || DEFAULT_COORDS.lat;
  const effectiveLon = lon || DEFAULT_COORDS.lon;

  if (!localStorage.getItem(PRAYER_CITY_CACHE_KEY)) {
    fetchCityFromCoordinates(effectiveLat, effectiveLon).catch(() => { });
  }

  const today = getTodayStr();
  const cachedDate = localStorage.getItem(PRAYER_TIMES_CACHE_DATE_KEY);
  const cachedData = localStorage.getItem(PRAYER_TIMES_CACHE_KEY);

  if (cachedDate === today && cachedData) {
    try {
      const parsed = JSON.parse(cachedData);
      if (parsed && typeof parsed === 'object' && Object.keys(parsed).length >= 5) {
        return parsed;
      }
    } catch { }
  }

  const url = `https://api.aladhan.com/v1/timings?latitude=${effectiveLat}&longitude=${effectiveLon}&method=${ALADHAN_METHOD}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch prayer times from Aladhan API.');
  const json = await res.json();

  const timings = json?.data?.timings || {};
  const prayerMap = {};
  for (const p of PRAYER_NAMES) {
    const raw = timings[p.key] || (p.key === 'Luhr' || p.key === 'Dhuhr' ? (timings.Dhuhr || timings.Luhr) : '') || '';
    prayerMap[p.key] = normalizeTimeStr(raw) || null;
  }

  try {
    localStorage.setItem(PRAYER_TIMES_CACHE_DATE_KEY, today);
    localStorage.setItem(PRAYER_TIMES_CACHE_KEY, JSON.stringify(prayerMap));
  } catch { }

  return prayerMap;
}

/** Cross-browser notification trigger (ServiceWorker first, Window fallback) */
export async function showPrayerNotification(title, body, tag = 'prayer-notif') {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') return false;

  if (Notification.permission !== 'granted') {
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') return false;
  }

  const options = {
    body,
    icon: '/appLogo.png',
    badge: '/appLogo.png',
    vibrate: [300, 150, 300, 150, 400],
    tag,
    renotify: true,
    requireInteraction: true,
    data: { url: '/' },
  };

  // 1. ServiceWorkerRegistration.showNotification (PWA / Android / Chrome / iOS standalone)
  if ('serviceWorker' in navigator) {
    try {
      let reg = await navigator.serviceWorker.ready;
      if (!reg) {
        reg = await navigator.serviceWorker.getRegistration('/');
      }
      if (reg && typeof reg.showNotification === 'function') {
        await reg.showNotification(title, options);
        console.log(`[Prayer Notif SW]: Displayed "${title}"`);
        return true;
      }
    } catch (err) {
      console.warn('[Prayer Notif SW Error]:', err);
    }
  }

  // 2. Window Notification fallback for Desktop Safari / Firefox
  try {
    const notif = new Notification(title, options);
    setTimeout(() => notif.close(), 15000);
    console.log(`[Prayer Notif Window]: Displayed "${title}"`);
    return true;
  } catch (err) {
    console.warn('[Prayer Notif Window Error]:', err);
    return false;
  }
}

// In-memory active timeouts and heartbeat monitor
let scheduledTimeouts = [];
let heartbeatInterval = null;
let activeListenersBound = false;

/** Clear all active prayer timeouts and monitors */
export function clearPrayerNotifications() {
  for (const id of scheduledTimeouts) clearTimeout(id);
  scheduledTimeouts = [];
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}

/** Helper to get set of triggered prayer keys for today from localStorage */
function getTriggeredPrayersToday() {
  try {
    const raw = localStorage.getItem(`${PRAYER_TRIGGERED_PREFIX}${getTodayStr()}`);
    if (raw) return new Set(JSON.parse(raw));
  } catch { }
  return new Set();
}

/** Record a prayer key as triggered today in localStorage */
function markPrayerTriggeredToday(prayerKey) {
  try {
    const today = getTodayStr();
    const set = getTriggeredPrayersToday();
    set.add(prayerKey);
    localStorage.setItem(`${PRAYER_TRIGGERED_PREFIX}${today}`, JSON.stringify([...set]));
  } catch { }
}

/** Schedule a notification for a single prayer time */
export function scheduleNotification(prayerKey, timeStr) {
  const prayerDate = prayerTimeToDate(timeStr);
  if (!prayerDate) return;

  const msUntilPrayer = prayerDate.getTime() - Date.now();
  if (msUntilPrayer <= 0) return; // already passed

  const { title, body } = buildPrayerNotificationContent(prayerKey, timeStr);

  const timeoutId = setTimeout(async () => {
    const triggered = getTriggeredPrayersToday();
    if (!triggered.has(prayerKey)) {
      markPrayerTriggeredToday(prayerKey);
      await showPrayerNotification(title, body, `prayer-${prayerKey}-${getTodayStr()}`);
    }
  }, msUntilPrayer);

  scheduledTimeouts.push(timeoutId);
  console.log(`[Prayer Notif]: Scheduled ${title} in ${Math.round(msUntilPrayer / 60000)} min`);
}

/**
 * Robust heartbeat monitor: Checks every 15s, catches missed prayer windows (15 min), and handles day rollover
 */
function startPrayerHeartbeat(prayerMap) {
  if (heartbeatInterval) clearInterval(heartbeatInterval);

  heartbeatInterval = setInterval(async () => {
    if (!isPrayerNotifEnabled()) {
      clearPrayerNotifications();
      return;
    }

    const todayStr = getTodayStr();
    const cachedDate = localStorage.getItem(PRAYER_TIMES_CACHE_DATE_KEY);

    // Day rollover: automatically re-initialize for the new day
    if (cachedDate && cachedDate !== todayStr) {
      console.log('[Prayer Notif]: Day rollover detected. Re-initializing for today...');
      clearPrayerTimesCache();
      initPrayerTimeNotifications(false, false).catch(() => { });
      return;
    }

    const now = new Date();
    const nowMs = now.getTime();
    const triggeredSet = getTriggeredPrayersToday();

    for (const { key } of PRAYER_NAMES) {
      const pTime = prayerMap[key];
      if (!pTime || triggeredSet.has(key)) continue;

      const pDate = prayerTimeToDate(pTime);
      if (!pDate) continue;

      const diffMs = nowMs - pDate.getTime();

      // Trigger if current time is within [prayerTime, prayerTime + 15 minutes]
      if (diffMs >= 0 && diffMs <= 15 * 60 * 1000) {
        markPrayerTriggeredToday(key);
        const { title, body } = buildPrayerNotificationContent(key, pTime);
        await showPrayerNotification(title, body, `prayer-${key}-${todayStr}`);
      }
    }
  }, 15000);

  // Bind visibility and focus event listeners once
  if (!activeListenersBound && typeof window !== 'undefined') {
    activeListenersBound = true;
    const recheckHandler = () => {
      if (isPrayerNotifEnabled()) {
        const cached = getCachedPrayerTimes();
        if (cached) {
          const nowMs = Date.now();
          const triggeredSet = getTriggeredPrayersToday();
          for (const { key } of PRAYER_NAMES) {
            const pTime = cached[key];
            if (!pTime || triggeredSet.has(key)) continue;
            const pDate = prayerTimeToDate(pTime);
            if (pDate && nowMs >= pDate.getTime() && nowMs - pDate.getTime() <= 15 * 60 * 1000) {
              markPrayerTriggeredToday(key);
              const { title, body } = buildPrayerNotificationContent(key, pTime);
              showPrayerNotification(title, body, `prayer-${key}-${getTodayStr()}`);
            }
          }
        }
      }
    };

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') recheckHandler();
    });
    window.addEventListener('focus', recheckHandler);
  }
}

/**
 * Initialize prayer time notifications for ALL daily prayers.
 * Non-blocking by default (uses cached coords on startup).
 */
export async function initPrayerTimeNotifications(sendWelcomeNotice = false, forcePrompt = false) {
  clearPrayerNotifications();

  if (typeof window === 'undefined' || typeof Notification === 'undefined') {
    throw new Error('Notifications are not supported on this device/browser.');
  }

  let permission = Notification.permission;
  if (permission !== 'granted') {
    permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Notification permission was denied. Please allow notifications in browser settings.');
    }
  }

  const { lat, lon } = await getUserLocation(forcePrompt);
  const prayerMap = await fetchPrayerTimes(lat, lon);

  // Schedule future prayer times for ALL 5 prayers
  for (const { key } of PRAYER_NAMES) {
    if (prayerMap[key]) {
      scheduleNotification(key, prayerMap[key]);
    }
  }

  // Start background heartbeat monitor
  startPrayerHeartbeat(prayerMap);

  if (sendWelcomeNotice) {
    const nextPrayer = PRAYER_NAMES.find(p => {
      const d = prayerTimeToDate(prayerMap[p.key]);
      return d && d.getTime() > Date.now();
    });

    const nextTime = nextPrayer ? prayerMap[nextPrayer.key] : '05:12';
    const nextFormatted = formatTo12Hour(nextTime);
    const englishName = nextPrayer?.en || 'Fajr';
    const malayalamName = nextPrayer?.label || 'ഫജ്ർ';
    const city = getPrayerCityName();

    await showPrayerNotification(
      `${nextFormatted} ${englishName}`,
      `നമസ്കാര അറിയിപ്പുകൾ പ്രവർത്തനക്ഷമമാക്കി (${city}) 🕌 · ${malayalamName} അടുത്തുതന്നെ`,
      'prayer-welcome'
    );
  }

  return prayerMap;
}

/** Check if prayer time notifications are enabled */
export function isPrayerNotifEnabled() {
  if (typeof localStorage === 'undefined') return false;
  return localStorage.getItem(PRAYER_TIME_KEY) === 'true';
}

/**
 * Enable prayer notifications:
 * 1. Activates client-side precision timers & heartbeat.
 * 2. Seamlessly subscribes to server Web Push so notifications are delivered even when the app is completely closed.
 */
export async function enablePrayerNotifications(token = null) {
  clearPrayerTimesCache();
  const prayerMap = await initPrayerTimeNotifications(true, true);
  localStorage.setItem(PRAYER_TIME_KEY, 'true');

  // Register with backend Web Push for closed-app delivery
  try {
    const coords = await getUserLocation(false);
    const city = getPrayerCityName();
    await subscribeUserToPush(token, {
      prayerNotifEnabled: true,
      location: { lat: coords.lat, lon: coords.lon, city },
    });
    console.log('[Prayer Notif]: Web Push background subscription registered for closed app delivery.');
  } catch (err) {
    console.warn('[Prayer Notif Web Push Setup Warn]:', err?.message || err);
  }

  return prayerMap;
}

/** Disable prayer time notifications */
export async function disablePrayerNotifications(token = null) {
  clearPrayerNotifications();
  try { localStorage.setItem(PRAYER_TIME_KEY, 'false'); } catch { }

  // Update backend preferences
  try {
    await updatePushPreferences(token, { prayerNotifEnabled: false });
  } catch { }
}

/** Get cached prayer times for today (if available) */
export function getCachedPrayerTimes() {
  if (typeof localStorage === 'undefined') return null;
  const today = getTodayStr();
  if (localStorage.getItem(PRAYER_TIMES_CACHE_DATE_KEY) === today) {
    const data = localStorage.getItem(PRAYER_TIMES_CACHE_KEY);
    if (data) {
      try { return JSON.parse(data); } catch { }
    }
  }
  return null;
}

/**
 * Fetch and cache today's prayer times from live API.
 */
export async function fetchAndCachePrayerTimes(forcePrompt = false) {
  const { lat, lon } = await getUserLocation(forcePrompt);
  return fetchPrayerTimes(lat, lon);
}

/** Send immediate test prayer alert */
export async function sendTestPrayerNotification(prayerKey = 'Asr', timeStr = '15:37') {
  const { title, body } = buildPrayerNotificationContent(prayerKey, timeStr);
  return showPrayerNotification(title, body, `prayer-test-${Date.now()}`);
}
