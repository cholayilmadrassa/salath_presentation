/**
 * Prayer Time Notification Utility
 * Fetches daily prayer times strictly from live Aladhan API based on user's real geolocation.
 * Identifies city/locality directly from GPS latitude & longitude coordinates.
 * Uses ServiceWorker registration on mobile/Android/PWA and local Notification API fallback on Desktop.
 * Method 1 = Muslim World League (standard for India/Kerala)
 */

const PRAYER_TIME_KEY = 'prayerTimeNotifEnabled';
const PRAYER_TIMES_CACHE_KEY = 'prayerTimesCache';
const PRAYER_TIMES_CACHE_DATE_KEY = 'prayerTimesCacheDate';
const PRAYER_COORDS_CACHE_KEY = 'prayerCoordsCache';
const PRAYER_CITY_CACHE_KEY = 'prayerCityName';

// Method 1: Muslim World League (Fajr 18°, Isha 17° - Standard for Kerala/India)
const ALADHAN_METHOD = 1;

/** Islamic prayer names with Malayalam and English labels */
export const PRAYER_NAMES = [
  { key: 'Fajr',    label: 'ഫജ്ർ',    en: 'Fajr',    icon: 'Sunrise' },
  { key: 'Luhr',    label: 'ളുഹ്ർ',    en: 'Luhr',    icon: 'Sun'     },
  { key: 'Asr',     label: 'അസ്ർ',     en: 'Asr',     icon: 'CloudSun'},
  { key: 'Maghrib', label: 'മഗ്‌രിബ്', en: 'Maghrib', icon: 'Sunset'  },
  { key: 'Isha',    label: 'ഇശാഅ്',   en: 'Isha',    icon: 'Moon'    },
];

/** Get today's date string YYYY-MM-DD */
function getTodayStr() {
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

/**
 * Identify exact City / Locality from Latitude and Longitude coordinates
 * Uses BigDataCloud reverse geocoding API with Nominatim OpenStreetMap fallback.
 */
export async function fetchCityFromCoordinates(lat, lon) {
  if (!lat || !lon) return 'Kozhikode';

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

  return localStorage.getItem(PRAYER_CITY_CACHE_KEY) || 'Kozhikode';
}

/** Get city/place name for notification body (e.g. "Kozhikode", "Malappuram") */
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
  } catch {}
  return 'Kozhikode';
}

/** Build notification title & body formatted like:
 * Title: "3:37 PM Asr"
 * Body: "It's time for Asr prayer in Kozhikode"
 */
export function buildPrayerNotificationContent(prayerKey, timeStr) {
  const pObj = PRAYER_NAMES.find(p => p.key === prayerKey) || { en: prayerKey };
  const englishName = pObj.en || (prayerKey === 'Luhr' ? 'Luhr' : prayerKey);
  const formattedTime = formatTo12Hour(timeStr);
  const city = getPrayerCityName();

  return {
    title: `${formattedTime} ${englishName}`,
    body: `It's time for ${englishName} prayer in ${city}`,
  };
}

/** Invalidate the prayer times cache */
export function clearPrayerTimesCache() {
  try {
    localStorage.removeItem(PRAYER_TIMES_CACHE_KEY);
    localStorage.removeItem(PRAYER_TIMES_CACHE_DATE_KEY);
  } catch {}
}

/** Check if coordinates are already cached */
export function hasCachedLocation() {
  try {
    const cached = localStorage.getItem(PRAYER_COORDS_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      return Boolean(parsed?.lat && parsed?.lon);
    }
  } catch {}
  return false;
}

/** Convert prayer time string (HH:MM) to today's Date object in LOCAL time */
function prayerTimeToDate(timeStr) {
  if (!timeStr) return null;
  const [hours, minutes] = timeStr.split(':').map(Number);
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours || 0, minutes || 0, 0, 0);
}

/** Get user coordinates strictly via browser Geolocation API and identify city */
export async function getUserLocation(forcePrompt = false) {
  if (!forcePrompt) {
    try {
      const cached = localStorage.getItem(PRAYER_COORDS_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.lat && parsed?.lon) {
          // Identify city in background if not yet cached
          if (!localStorage.getItem(PRAYER_CITY_CACHE_KEY)) {
            fetchCityFromCoordinates(parsed.lat, parsed.lon).catch(() => {});
          }
          return parsed;
        }
      }
    } catch {}
  }

  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    throw new Error('Geolocation is not supported by your browser.');
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        try {
          localStorage.setItem(PRAYER_COORDS_CACHE_KEY, JSON.stringify(coords));
          // Reverse geocode exact city from latitude & longitude
          await fetchCityFromCoordinates(coords.lat, coords.lon).catch(() => {});
        } catch {}
        resolve(coords);
      },
      (err) => {
        let msg = 'Location permission is required to calculate prayer times.';
        if (err.code === 1) {
          msg = 'Location access denied. Please allow location access in your browser settings to view prayer times.';
        } else if (err.code === 2) {
          msg = 'Location unavailable. Please verify device GPS or network.';
        } else if (err.code === 3) {
          msg = 'Location request timed out. Please try again.';
        }
        reject(new Error(msg));
      },
      { timeout: 12000, enableHighAccuracy: false, maximumAge: 3600000 }
    );
  });
}

/** Fetch real prayer times from live Aladhan API with caching */
async function fetchPrayerTimes(lat, lon) {
  if (!lat || !lon) {
    throw new Error('Valid location coordinates are required.');
  }

  // Ensure city is identified from lat & lon
  if (!localStorage.getItem(PRAYER_CITY_CACHE_KEY)) {
    fetchCityFromCoordinates(lat, lon).catch(() => {});
  }

  const today = getTodayStr();
  const cachedDate = localStorage.getItem(PRAYER_TIMES_CACHE_DATE_KEY);
  const cachedData = localStorage.getItem(PRAYER_TIMES_CACHE_KEY);

  if (cachedDate === today && cachedData) {
    try {
      const parsed = JSON.parse(cachedData);
      if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
        return parsed;
      }
    } catch {}
  }

  const url = `https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lon}&method=${ALADHAN_METHOD}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch prayer times from server.');
  const json = await res.json();

  const timings = json?.data?.timings || {};
  const prayerMap = {};
  for (const p of PRAYER_NAMES) {
    const raw = timings[p.key] || (p.key === 'Luhr' || p.key === 'Dhuhr' ? (timings.Dhuhr || timings.Luhr) : '') || '';
    prayerMap[p.key] = raw.replace(/\s*\(.*\)/, '').trim() || null;
  }

  try {
    localStorage.setItem(PRAYER_TIMES_CACHE_DATE_KEY, today);
    localStorage.setItem(PRAYER_TIMES_CACHE_KEY, JSON.stringify(prayerMap));
  } catch {}

  return prayerMap;
}

/** Cross-browser notification trigger (ServiceWorker first, Window fallback) */
export async function showPrayerNotification(title, body, tag = 'prayer-notif') {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') return false;

  // Request permission if not already granted
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

  // 1. Try ServiceWorkerRegistration.showNotification (Mobile Android, PWA, Chrome)
  if ('serviceWorker' in navigator) {
    try {
      let reg = await navigator.serviceWorker.getRegistration();
      if (!reg) {
        reg = await navigator.serviceWorker.ready;
      }
      if (reg && typeof reg.showNotification === 'function') {
        await reg.showNotification(title, options);
        return true;
      }
    } catch (err) {
      console.warn('[Prayer Notif SW Fallback]:', err);
    }
  }

  // 2. Window Notification fallback for Desktop Safari / Firefox
  try {
    const notif = new Notification(title, options);
    setTimeout(() => notif.close(), 15000);
    return true;
  } catch (err) {
    console.warn('[Prayer Notif Window Error]:', err);
    return false;
  }
}

// In-memory active timeouts and heartbeat monitor
let scheduledTimeouts = [];
let heartbeatInterval = null;

/** Clear all active prayer timeouts and monitors */
export function clearPrayerNotifications() {
  for (const id of scheduledTimeouts) clearTimeout(id);
  scheduledTimeouts = [];
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}

/** Schedule a notification for a single prayer time */
export function scheduleNotification(prayerKey, timeStr) {
  const prayerDate = prayerTimeToDate(timeStr);
  if (!prayerDate) return;

  const msUntilPrayer = prayerDate.getTime() - Date.now();
  if (msUntilPrayer <= 0) return; // already passed today

  const { title, body } = buildPrayerNotificationContent(prayerKey, timeStr);

  const timeoutId = setTimeout(async () => {
    await showPrayerNotification(title, body, `prayer-${prayerKey}-${getTodayStr()}`);
  }, msUntilPrayer);

  scheduledTimeouts.push(timeoutId);
  console.log(`[Prayer Notif]: Scheduled ${title} in ${Math.round(msUntilPrayer / 60000)} min`);
}

/**
 * Start heartbeat monitor to trigger notifications for ALL prayer times
 */
function startPrayerHeartbeat(prayerMap) {
  if (heartbeatInterval) clearInterval(heartbeatInterval);

  const triggeredToday = new Set();

  heartbeatInterval = setInterval(async () => {
    if (!isPrayerNotifEnabled()) {
      clearPrayerNotifications();
      return;
    }

    const now = new Date();
    const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const todayStr = getTodayStr();

    for (const { key } of PRAYER_NAMES) {
      const pTime = prayerMap[key];
      const trigKey = `${key}-${todayStr}-${pTime}`;

      if (pTime && pTime === currentHHMM && !triggeredToday.has(trigKey)) {
        triggeredToday.add(trigKey);
        const { title, body } = buildPrayerNotificationContent(key, pTime);
        await showPrayerNotification(title, body, `prayer-${key}-${todayStr}`);
      }
    }
  }, 15000); // Check every 15 seconds
}

/**
 * Initialize prayer time notifications for ALL prayer times today.
 */
export async function initPrayerTimeNotifications(sendWelcomeNotice = false) {
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

  const { lat, lon } = await getUserLocation(true);
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
    const city = getPrayerCityName();

    await showPrayerNotification(
      `${nextFormatted} ${englishName}`,
      `It's time for ${englishName} prayer in ${city}`,
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

/** Enable prayer time notifications */
export async function enablePrayerNotifications() {
  clearPrayerTimesCache();
  const prayerMap = await initPrayerTimeNotifications(true);
  localStorage.setItem(PRAYER_TIME_KEY, 'true');
  return prayerMap;
}

/** Disable prayer time notifications */
export function disablePrayerNotifications() {
  clearPrayerNotifications();
  try { localStorage.setItem(PRAYER_TIME_KEY, 'false'); } catch {}
}

/** Get cached prayer times for today (if available) */
export function getCachedPrayerTimes() {
  if (typeof localStorage === 'undefined') return null;
  const today = getTodayStr();
  if (localStorage.getItem(PRAYER_TIMES_CACHE_DATE_KEY) === today) {
    const data = localStorage.getItem(PRAYER_TIMES_CACHE_KEY);
    if (data) {
      try { return JSON.parse(data); } catch {}
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
