import { api } from '../api.js';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function isIOS() {
  if (typeof window === 'undefined') return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

export function isStandalonePWA() {
  if (typeof window === 'undefined') return false;
  return (
    window.navigator.standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches
  );
}

export function isPushSupported() {
  if (typeof window === 'undefined') return false;
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export async function getVapidPublicKey() {
  try {
    const res = await api('/push/vapid-public-key');
    if (res && res.publicKey) return res.publicKey;
  } catch (e) {
    console.warn('Could not fetch server VAPID key via API, using fallback:', e);
  }
  return import.meta.env.VITE_VAPID_PUBLIC_KEY || 'BGiWMbxl3_s_U1T2_yS-csp-msS0wttV_M5rSDD6X0XeisiqDKYr5f9sOk7kMCXUjaHi-lVIrmlM75a8bb-aXII';
}

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return null;
  try {
    let reg = await navigator.serviceWorker.getRegistration('/sw.js');
    if (!reg) {
      reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    }
    return reg;
  } catch (e) {
    console.error('SW registration error:', e);
    return null;
  }
}

export async function subscribeUserToPush(token) {
  if (!isPushSupported()) {
    throw new Error('Push notifications are not supported by your current browser.');
  }

  // iOS specific check
  if (isIOS() && !isStandalonePWA()) {
    throw new Error('IOS_PWA_REQUIRED');
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Notification permission denied by user.');
  }

  const swReg = await registerServiceWorker();
  if (!swReg) {
    throw new Error('Service Worker registration failed.');
  }

  const vapidPublicKey = await getVapidPublicKey();
  if (!vapidPublicKey) {
    throw new Error('VAPID public key unavailable.');
  }

  const convertedKey = urlBase64ToUint8Array(vapidPublicKey);

  // Unsubscribe stale subscription if needed to renew with fresh VAPID key
  let subscription = await swReg.pushManager.getSubscription();
  if (subscription) {
    try {
      await subscription.unsubscribe();
    } catch (e) {}
  }

  subscription = await swReg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: convertedKey,
  });

  const subJson = subscription.toJSON();

  // Send subscription object to backend server
  await api('/push/subscribe', {
    method: 'POST',
    token,
    body: {
      endpoint: subJson.endpoint,
      keys: subJson.keys,
      userAgent: navigator.userAgent,
    },
  });

  return subscription;
}

export async function unsubscribeUserFromPush(token) {
  if (!isPushSupported()) return;

  const swReg = await registerServiceWorker();
  if (swReg) {
    const subscription = await swReg.pushManager.getSubscription();
    if (subscription) {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe().catch(() => {});
      if (token && endpoint) {
        await api('/push/unsubscribe', {
          method: 'DELETE',
          token,
          body: { endpoint },
        }).catch(() => {});
      }
    }
  }
}

export async function getPushSubscriptionState(token) {
  if (!isPushSupported()) {
    return {
      supported: false,
      isIOS: isIOS(),
      isStandalone: isStandalonePWA(),
      permission: 'denied',
      isSubscribed: false,
      preferences: null,
    };
  }

  const permission = Notification.permission;
  let isSubscribed = false;

  const swReg = await registerServiceWorker();
  if (swReg) {
    const subscription = await swReg.pushManager.getSubscription();
    isSubscribed = !!subscription;
  }

  let preferences = null;
  if (token) {
    try {
      const statusRes = await api('/push/status', { token });
      preferences = statusRes.preferences;
    } catch (e) {}
  }

  return {
    supported: true,
    isIOS: isIOS(),
    isStandalone: isStandalonePWA(),
    permission,
    isSubscribed,
    preferences,
  };
}

export async function syncPushSubscription(token) {
  if (!token || !isPushSupported()) return;
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

  try {
    const swReg = await registerServiceWorker();
    if (!swReg) return;

    const vapidPublicKey = await getVapidPublicKey();
    if (!vapidPublicKey) return;

    const convertedKey = urlBase64ToUint8Array(vapidPublicKey);

    let subscription = await swReg.pushManager.getSubscription();
    if (!subscription) {
      subscription = await swReg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey,
      });
    }

    const subJson = subscription.toJSON();
    if (subJson && subJson.endpoint && subJson.keys) {
      await api('/push/subscribe', {
        method: 'POST',
        token,
        body: {
          endpoint: subJson.endpoint,
          keys: subJson.keys,
          userAgent: navigator.userAgent,
        },
      }).catch(() => {});
    }
  } catch (e) {
    console.warn('Background push sync skipped:', e);
  }
}
