import webpush from 'web-push';
import PushSubscription from '../models/PushSubscription.js';
import NotificationHistory from '../models/NotificationHistory.js';
import Count from '../models/Count.js';
import User from '../models/User.js';
import { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } from '../config.js';

const formattedSubject = (VAPID_SUBJECT && (VAPID_SUBJECT.startsWith('mailto:') || VAPID_SUBJECT.startsWith('http')))
  ? VAPID_SUBJECT
  : `mailto:${VAPID_SUBJECT }`;

// Initialize web-push VAPID details
try {
  webpush.setVapidDetails(formattedSubject, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
} catch (e) {
  console.warn('[PUSH SERVICE]: VAPID setup warning:', e.message);
}

export const MILESTONES = [1000, 5000, 10000, 25000, 50000, 100000];

function getTodayKey() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Dispatch web push to an array of PushSubscription documents.
 * Automatically cleans up expired/invalid endpoints (404, 410).
 */
export async function sendPushToSubscriptions(subscriptions, payload) {
  if (!Array.isArray(subscriptions) || subscriptions.length === 0) {
    return { attempted: 0, success: 0, failure: 0 };
  }

  const payloadString = JSON.stringify(payload);
  let successCount = 0;
  let failureCount = 0;

  const promises = subscriptions.map(async (sub) => {
    const pushConfig = {
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
      },
    };

    const options = {
      TTL: 86400,
      vapidDetails: {
        subject: formattedSubject,
        publicKey: VAPID_PUBLIC_KEY,
        privateKey: VAPID_PRIVATE_KEY,
      },
    };

    try {
      const res = await webpush.sendNotification(pushConfig, payloadString, options);
      console.log(`[PUSH DISPATCH SUCCESS]: Delivered to ${sub.endpoint.slice(0, 35)}... (Status: ${res.statusCode})`);
      successCount++;
      sub.failureCount = 0;
      sub.lastSuccessAt = new Date();
      await sub.save().catch(() => {});
    } catch (err) {
      failureCount++;
      console.error(`[PUSH DISPATCH ERROR] (Endpoint: ${sub.endpoint.slice(0, 40)}...): Status: ${err.statusCode || err.name} - Message: ${err.message}`);
      if (err.body) console.error('[PUSH DISPATCH ERROR BODY]:', err.body);
      // Clean up 404 Not Found or 410 Gone subscriptions
      if (err.statusCode === 404 || err.statusCode === 410) {
        console.log(`[PUSH CLEANUP]: Subscription expired/gone (${sub.endpoint.slice(0, 30)}...). Deleting.`);
        await PushSubscription.deleteOne({ _id: sub._id }).catch(() => {});
      } else {
        sub.failureCount = (sub.failureCount || 0) + 1;
        if (sub.failureCount >= 5) {
          sub.enabled = false;
        }
        await sub.save().catch(() => {});
      }
    }
  });

  await Promise.all(promises);

  return {
    attempted: subscriptions.length,
    success: successCount,
    failure: failureCount,
  };
}

/**
 * Send push notification to a specific user
 */
export async function sendToUser(userId, payload, category = 'admin_broadcast') {
  if (!userId) return { attempted: 0, success: 0, failure: 0 };

  const subscriptions = await PushSubscription.find({ userId, enabled: true });
  return sendPushToSubscriptions(subscriptions, payload);
}

/**
 * Send push notification to a specific tenant/event team
 */
export async function sendToTenant(tenantId, payload, category = 'admin_broadcast') {
  if (!tenantId) return sendBroadcast(payload, category);

  const tenantUsers = await User.find({ tenantId }).select('_id');
  const tenantUserIds = tenantUsers.map((u) => u._id);

  let subscriptions = await PushSubscription.find({
    $or: [{ tenantId }, { userId: { $in: tenantUserIds } }],
    enabled: true,
  });

  if (subscriptions.length === 0) {
    console.log(`[PUSH TENANT]: No tenant-specific subscriptions for ${tenantId}. Falling back to all active subscriptions.`);
    subscriptions = await PushSubscription.find({ enabled: true });
  }

  return sendPushToSubscriptions(subscriptions, payload);
}

/**
 * Send push notification to all platform users
 */
export async function sendBroadcast(payload, category = 'admin_broadcast') {
  const subscriptions = await PushSubscription.find({ enabled: true });
  console.log(`[PUSH BROADCAST]: Found ${subscriptions.length} active subscription(s) in DB.`);
  return sendPushToSubscriptions(subscriptions, payload);
}

/**
 * Trigger milestone check when user submits a Swalath count
 */
export async function triggerMilestone(userId, tenantId, totalUserCount) {
  try {
    if (!userId || !totalUserCount) return;

    const user = await User.findById(userId);
    if (!user) return;

    const notifiedSet = new Set(user.notifiedMilestones || []);
    const crossedMilestones = MILESTONES.filter((m) => totalUserCount >= m && !notifiedSet.has(m));

    if (crossedMilestones.length === 0) return;

    // Pick highest crossed milestone
    const highestMilestone = Math.max(...crossedMilestones);

    user.notifiedMilestones = user.notifiedMilestones || [];
    user.notifiedMilestones.push(highestMilestone);
    await user.save();

    const payload = {
      title: 'സ്വലാത്ത് നേട്ടം! 🎉',
      body: `മാഷാ അല്ലാഹ്! 🎉\n${highestMilestone.toLocaleString('en-IN')} സ്വലാത്ത് പൂർത്തിയായി.`,
      url: '/dashboard',
      icon: '/appLogo.png',
      category: 'milestone',
    };

    await sendToUser(userId, payload, 'milestone');
  } catch (err) {
    console.error('[PUSH SERVICE]: Milestone trigger error:', err);
  }
}

/**
 * Trigger daily reminder check (runs via scheduled background job)
 */
export async function triggerDailyReminders() {
  try {
    const today = getTodayKey();

    // 1. Find user IDs who ALREADY recorded a count today
    const updatedUserIds = await Count.distinct('user', { date: today });
    const updatedUserSet = new Set(updatedUserIds.map((id) => id.toString()));

    // 2. Find all subscriptions for users who have NOT recorded a count today
    const subscriptions = await PushSubscription.find({ enabled: true });
    const targetUserIds = [...new Set(subscriptions.map((s) => s.userId.toString()))].filter(
      (uid) => !updatedUserSet.has(uid)
    );

    if (targetUserIds.length === 0) {
      console.log('[DAILY REMINDER]: All active users updated count today. No reminder needed.');
      return;
    }

    const payload = {
      title: 'സ്വലാത്ത് ഓർമ്മപ്പെടുത്തൽ',
      body: 'ഇന്നത്തെ സ്വലാത്ത് അപ്ഡേറ്റ് ചെയ്തോ?',
      url: '/counter',
      icon: '/appLogo.png',
      category: 'reminder',
    };

    let totalSent = 0;
    for (const uid of targetUserIds) {
      const res = await sendToUser(uid, payload, 'reminder');
      totalSent += res.success;
    }

    console.log(`[DAILY REMINDER]: Sent daily reminder to ${totalSent} device(s).`);
  } catch (err) {
    console.error('[PUSH SERVICE]: Daily reminder error:', err);
  }
}

/**
 * Process due scheduled admin notifications
 */
export async function processDueNotifications() {
  try {
    const now = new Date();
    const dueNotifications = await NotificationHistory.find({
      status: 'scheduled',
      scheduledAt: { $lte: now },
    });

    for (const notif of dueNotifications) {
      // Atomic claim to prevent double sending in multi-process setups
      const claimed = await NotificationHistory.findOneAndUpdate(
        { _id: notif._id, status: 'scheduled' },
        { status: 'processing' },
        { new: true }
      );

      if (!claimed) continue;

      const payload = {
        title: claimed.title,
        body: claimed.body,
        url: claimed.url || '/dashboard',
        icon: claimed.icon || '/appLogo.png',
        category: claimed.category || 'admin_broadcast',
      };

      let deliveryRes = { attempted: 0, success: 0, failure: 0 };

      if (claimed.targetType === 'tenant' && claimed.tenantId) {
        deliveryRes = await sendToTenant(claimed.tenantId, payload, claimed.category);
      } else {
        deliveryRes = await sendBroadcast(payload, claimed.category);
      }

      claimed.stats = deliveryRes;
      claimed.sentAt = new Date();
      claimed.status = deliveryRes.failure === 0 ? 'sent' : deliveryRes.success > 0 ? 'partially_failed' : 'failed';

      await claimed.save();
      console.log(`[SCHEDULED PUSH]: Processed "${claimed.title}". Success: ${deliveryRes.success}, Failed: ${deliveryRes.failure}`);
    }
  } catch (err) {
    console.error('[PUSH SERVICE]: Scheduled processing error:', err);
  }
}
