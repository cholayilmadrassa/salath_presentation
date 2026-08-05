import express from 'express';
import PushSubscription from '../models/PushSubscription.js';
import NotificationHistory from '../models/NotificationHistory.js';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';
import { VAPID_PUBLIC_KEY } from '../config.js';

const router = express.Router();

// GET /api/push/vapid-public-key - Public endpoint to retrieve frontend VAPID public key
router.get('/vapid-public-key', (_req, res) => {
  res.json({ publicKey: VAPID_PUBLIC_KEY });
});

// GET /api/push/debug - Diagnostic status endpoint to verify production push setup
router.get('/debug', async (req, res) => {
  try {
    const totalSubs = await PushSubscription.countDocuments();
    const activeSubs = await PushSubscription.countDocuments({ enabled: true });
    const sampleSubs = await PushSubscription.find()
      .limit(5)
      .select('endpoint enabled failureCount createdAt lastSuccessAt userAgent');

    res.json({
      vapidPublicKeyConfigured: !!VAPID_PUBLIC_KEY,
      vapidPublicKeyPrefix: VAPID_PUBLIC_KEY ? VAPID_PUBLIC_KEY.slice(0, 15) + '...' : 'NONE',
      totalSubscriptionsInDB: totalSubs,
      activeSubscriptionsInDB: activeSubs,
      sampleEndpoints: sampleSubs.map((s) => ({
        id: s._id,
        host: new URL(s.endpoint).hostname,
        enabled: s.enabled,
        failureCount: s.failureCount,
        lastSuccessAt: s.lastSuccessAt,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// All endpoints below require authentication
router.use(requireAuth);

// POST /api/push/subscribe - Register or update a Web Push device subscription
router.post('/subscribe', async (req, res) => {
  try {
    const { endpoint, keys, userAgent } = req.body;

    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return res.status(400).json({ error: 'Invalid push subscription payload (missing endpoint or keys)' });
    }

    const userId = req.user.userId;
    const dbUser = await User.findById(userId);
    const tenantId = req.tenant ? req.tenant._id : (dbUser?.tenantId || req.user.tenantId || null);

    const subscription = await PushSubscription.findOneAndUpdate(
      { endpoint },
      {
        userId,
        tenantId,
        endpoint,
        keys: {
          p256dh: keys.p256dh,
          auth: keys.auth,
        },
        userAgent: userAgent || req.headers['user-agent'] || '',
        enabled: true,
        failureCount: 0,
        lastSuccessAt: new Date(),
      },
      { upsert: true, new: true }
    );

    res.status(201).json({
      message: 'Push notification subscription saved successfully',
      subscriptionId: subscription._id,
    });
  } catch (err) {
    console.error('[PUSH SUBSCRIBE ERROR]:', err);
    res.status(500).json({ error: 'Server error saving push subscription' });
  }
});

// DELETE /api/push/unsubscribe - Unsubscribe/Disable device endpoint
router.delete('/unsubscribe', async (req, res) => {
  try {
    const { endpoint } = req.body;
    if (!endpoint) {
      return res.status(400).json({ error: 'Endpoint is required to unsubscribe' });
    }

    await PushSubscription.deleteOne({ endpoint, userId: req.user.userId });

    res.json({ message: 'Push subscription removed successfully' });
  } catch (err) {
    console.error('[PUSH UNSUBSCRIBE ERROR]:', err);
    res.status(500).json({ error: 'Server error removing push subscription' });
  }
});

// GET /api/push/status - Check if current endpoint/user is subscribed
router.get('/status', async (req, res) => {
  try {
    const endpoint = req.query.endpoint;
    let isSubscribed = false;

    if (endpoint) {
      const existing = await PushSubscription.findOne({ endpoint, userId: req.user.userId, enabled: true });
      isSubscribed = !!existing;
    } else {
      const count = await PushSubscription.countDocuments({ userId: req.user.userId, enabled: true });
      isSubscribed = count > 0;
    }

    res.json({
      isSubscribed,
    });
  } catch (err) {
    console.error('[PUSH STATUS ERROR]:', err);
    res.status(500).json({ error: 'Server error checking push status' });
  }
});

// GET /api/notifications/inbox - Fetch user notification inbox feed with read/unread status
router.get('/inbox', async (req, res) => {
  try {
    const dbUser = await User.findById(req.user.userId);
    const tenantId = req.tenant ? req.tenant._id : (dbUser?.tenantId || req.user.tenantId || null);

    const filter = {
      status: { $in: ['sent', 'partially_failed'] },
    };

    if (tenantId) {
      filter.tenantId = tenantId;
    } else {
      filter.targetType = 'all';
    }

    const rawNotifications = await NotificationHistory.find(filter)
      .select('title body url icon category createdAt sentAt targetType')
      .sort({ createdAt: -1 })
      .limit(30);

    const readSet = new Set((dbUser?.readNotifications || []).map((id) => id.toString()));

    const notifications = rawNotifications.map((item) => {
      const isRead = readSet.has(item._id.toString());
      return {
        ...item.toObject(),
        isRead,
      };
    });

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    res.json({
      notifications,
      unreadCount,
    });
  } catch (err) {
    console.error('[NOTIF INBOX ERROR]:', err);
    res.status(500).json({ error: 'Server error fetching notification inbox' });
  }
});

// POST /api/notifications/mark-read - Mark notification(s) as read for current user
router.post('/mark-read', async (req, res) => {
  try {
    const { notificationId, markAll } = req.body;
    const userId = req.user.userId;

    if (markAll) {
      const dbUser = await User.findById(userId);
      const tenantId = req.tenant ? req.tenant._id : (dbUser?.tenantId || req.user.tenantId || null);
      const filter = { status: { $in: ['sent', 'partially_failed'] } };
      if (tenantId) {
        filter.tenantId = tenantId;
      } else {
        filter.targetType = 'all';
      }

      const allSent = await NotificationHistory.find(filter).select('_id');
      const allIds = allSent.map((n) => n._id);

      await User.findByIdAndUpdate(userId, {
        $addToSet: { readNotifications: { $each: allIds } },
      });
    } else if (notificationId) {
      await User.findByIdAndUpdate(userId, {
        $addToSet: { readNotifications: notificationId },
      });
    }

    res.json({ message: 'Marked as read' });
  } catch (err) {
    console.error('[MARK READ ERROR]:', err);
    res.status(500).json({ error: 'Server error marking notification as read' });
  }
});

export default router;
