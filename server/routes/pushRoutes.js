import express from 'express';
import PushSubscription from '../models/PushSubscription.js';
import NotificationPreference from '../models/NotificationPreference.js';
import NotificationHistory from '../models/NotificationHistory.js';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';
import { VAPID_PUBLIC_KEY } from '../config.js';

const router = express.Router();

// GET /api/push/vapid-public-key - Public endpoint to retrieve frontend VAPID public key
router.get('/vapid-public-key', (_req, res) => {
  res.json({ publicKey: VAPID_PUBLIC_KEY });
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

    // Initialize default notification preferences if not existing
    await NotificationPreference.findOneAndUpdate(
      { userId },
      { $setOnInsert: { userId } },
      { upsert: true }
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

    const pref = await NotificationPreference.findOne({ userId: req.user.userId });

    res.json({
      isSubscribed,
      preferences: pref || {
        dailyReminders: true,
        milestones: true,
        campaignAnnouncements: true,
        results: true,
      },
    });
  } catch (err) {
    console.error('[PUSH STATUS ERROR]:', err);
    res.status(500).json({ error: 'Server error checking push status' });
  }
});

// GET /api/notifications/preferences - Fetch user notification preferences
router.get('/preferences', async (req, res) => {
  try {
    let pref = await NotificationPreference.findOne({ userId: req.user.userId });
    if (!pref) {
      pref = await NotificationPreference.create({ userId: req.user.userId });
    }
    res.json(pref);
  } catch (err) {
    console.error('[NOTIF PREF ERROR]:', err);
    res.status(500).json({ error: 'Server error fetching preferences' });
  }
});

// PATCH /api/notifications/preferences - Update user notification preferences
router.patch('/preferences', async (req, res) => {
  try {
    const { dailyReminders, milestones, campaignAnnouncements, results } = req.body;
    const update = {};

    if (typeof dailyReminders === 'boolean') update.dailyReminders = dailyReminders;
    if (typeof milestones === 'boolean') update.milestones = milestones;
    if (typeof campaignAnnouncements === 'boolean') update.campaignAnnouncements = campaignAnnouncements;
    if (typeof results === 'boolean') update.results = results;

    const pref = await NotificationPreference.findOneAndUpdate(
      { userId: req.user.userId },
      { $set: update },
      { new: true, upsert: true }
    );

    res.json({ message: 'Notification preferences updated', preferences: pref });
  } catch (err) {
    console.error('[NOTIF PREF UPDATE ERROR]:', err);
    res.status(500).json({ error: 'Server error updating preferences' });
  }
});

// GET /api/notifications/inbox - Fetch user notification inbox feed
router.get('/inbox', async (req, res) => {
  try {
    const dbUser = await User.findById(req.user.userId);
    const tenantId = req.tenant ? req.tenant._id : (dbUser?.tenantId || req.user.tenantId || null);

    const filter = {
      status: 'sent',
      $or: [{ targetType: 'all' }],
    };

    if (tenantId) {
      filter.$or.push({ tenantId });
    }

    const notifications = await NotificationHistory.find(filter)
      .select('title body url icon category createdAt sentAt targetType')
      .sort({ createdAt: -1 })
      .limit(30);

    res.json(notifications);
  } catch (err) {
    console.error('[NOTIF INBOX ERROR]:', err);
    res.status(500).json({ error: 'Server error fetching notification inbox' });
  }
});

export default router;
