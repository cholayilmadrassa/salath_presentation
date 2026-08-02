import express from 'express';
import NotificationHistory from '../models/NotificationHistory.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { sendBroadcast, sendToTenant, triggerDailyReminders } from '../services/pushNotificationService.js';

const router = express.Router();

// Require admin authentication
router.use(requireAuth, requireRole('tenant_admin', 'super_admin'));

// GET /api/admin/notifications - List notification history & scheduled notifications
router.get('/', async (req, res) => {
  try {
    const filter = {};

    // If tenant_admin, filter by tenantId unless super_admin
    if (req.user.role === 'tenant_admin') {
      const tenantId = req.tenant ? req.tenant._id : req.user.tenantId;
      if (tenantId) {
        filter.$or = [{ tenantId }, { targetType: 'all' }];
      }
    }

    const notifications = await NotificationHistory.find(filter)
      .populate('createdBy', 'name email')
      .populate('tenantId', 'name slug')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(notifications);
  } catch (err) {
    console.error('[ADMIN NOTIFICATIONS LIST ERROR]:', err);
    res.status(500).json({ error: 'Server error fetching notification history' });
  }
});

// POST /api/admin/notifications - Create and Send Now OR Schedule Notification
router.post('/', async (req, res) => {
  try {
    const { title, body, url, icon, targetType, tenantId, scheduledAt, isScheduled, category } = req.body;

    if (!title || !String(title).trim() || !body || !String(body).trim()) {
      return res.status(400).json({ error: 'Notification title and message body are required' });
    }

    const payload = {
      title: title.trim(),
      body: body.trim(),
      url: url || '/',
      icon: icon || '/appLogo.png',
      category: category || 'admin_broadcast',
    };

    let targetTenantId = null;
    let finalTargetType = targetType || 'all';

    // Restrict Tenant Admins strictly to their own tenant members!
    if (req.user.role === 'tenant_admin' || req.tenant) {
      finalTargetType = 'tenant';
      targetTenantId = req.tenant ? req.tenant._id : req.user.tenantId;
      if (!targetTenantId) {
        return res.status(400).json({ error: 'Event admin can only send notifications to their own organization members' });
      }
    } else if (targetType === 'tenant') {
      targetTenantId = tenantId || null;
    }

    // Handle Scheduled Notification
    if (isScheduled && scheduledAt) {
      const scheduledDate = new Date(scheduledAt);
      if (isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
        return res.status(400).json({ error: 'Scheduled date/time must be in the future' });
      }

      const notifRecord = await NotificationHistory.create({
        title: title.trim(),
        body: body.trim(),
        url: url || '/',
        icon: icon || '/appLogo.png',
        targetType: finalTargetType,
        tenantId: targetTenantId,
        createdBy: req.user.userId,
        status: 'scheduled',
        scheduledAt: scheduledDate,
        category: category || 'admin_broadcast',
        stats: { attempted: 0, success: 0, failure: 0 },
      });

      return res.status(201).json({
        message: 'Notification scheduled successfully',
        notification: notifRecord,
      });
    }

    // Send Immediately (Send Now)
    let deliveryRes = { attempted: 0, success: 0, failure: 0 };
    if (finalTargetType === 'tenant' && targetTenantId) {
      deliveryRes = await sendToTenant(targetTenantId, payload, category || 'admin_broadcast');
    } else {
      deliveryRes = await sendBroadcast(payload, category || 'admin_broadcast');
    }

    const notifRecord = await NotificationHistory.create({
      title: title.trim(),
      body: body.trim(),
      url: url || '/',
      icon: icon || '/appLogo.png',
      targetType: finalTargetType,
      tenantId: targetTenantId,
      createdBy: req.user.userId,
      status: deliveryRes.failure === 0 ? 'sent' : deliveryRes.success > 0 ? 'partially_failed' : 'failed',
      scheduledAt: null,
      sentAt: new Date(),
      category: category || 'admin_broadcast',
      stats: deliveryRes,
    });

    res.status(201).json({
      message: `Notification sent to ${deliveryRes.success} device(s) (${deliveryRes.failure} failed)`,
      notification: notifRecord,
    });
  } catch (err) {
    console.error('[ADMIN CREATE NOTIFICATION ERROR]:', err);
    res.status(500).json({ error: 'Server error delivering notification' });
  }
});

// POST /api/admin/notifications/:id/cancel - Cancel a scheduled notification
router.post('/:id/cancel', async (req, res) => {
  try {
    const notif = await NotificationHistory.findOne({ _id: req.params.id, status: 'scheduled' });
    if (!notif) {
      return res.status(404).json({ error: 'Scheduled notification not found or already processed' });
    }

    notif.status = 'cancelled';
    await notif.save();

    res.json({ message: 'Scheduled notification cancelled successfully', notification: notif });
  } catch (err) {
    console.error('[ADMIN CANCEL NOTIFICATION ERROR]:', err);
    res.status(500).json({ error: 'Server error cancelling scheduled notification' });
  }
});

// POST /api/admin/notifications/test-reminder - Manually trigger daily reminder test (Admin tool)
router.post('/test-reminder', async (_req, res) => {
  try {
    triggerDailyReminders(); // Async execution
    res.json({ message: 'Daily reminder check triggered in background.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to trigger reminder' });
  }
});

export default router;
