import express from 'express';
import Registration from '../models/Registration.js';
import Count from '../models/Count.js';
import Tenant from '../models/Tenant.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// GET /api/events/public-approved - List all approved event teams for public selection
router.get('/public-approved', async (_req, res) => {
  try {
    const tenants = await Tenant.find({ status: 'approved' })
      .select('name slug branding swalath settings customDomain createdAt')
      .sort({ createdAt: -1 });

    res.json(tenants);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch public approved events' });
  }
});

// GET /api/events/active-tenant - Public endpoint to resolve current active tenant by subdomain/slug
router.get('/active-tenant', async (req, res) => {
  try {
    if (!req.tenant) {
      const querySlug = req.query.slug;
      const queryHost = req.query.host || req.query.domain;
      let tenant = null;

      if (querySlug) {
        tenant = await Tenant.findOne({ slug: String(querySlug).toLowerCase().trim() });
      }

      if (!tenant && queryHost) {
        const cleanHost = String(queryHost).toLowerCase().trim().replace(/^www\./, '');
        tenant = await Tenant.findOne({
          $or: [
            { customDomain: cleanHost },
            { slug: cleanHost.split('.')[0] }
          ]
        });
      }

      if (tenant) {
        if (tenant.status !== 'approved') {
          return res.status(403).json({
            error: `Event "${tenant.name}" is currently ${tenant.status.toUpperCase()}. Super Admin approval required.`,
            code: 'TENANT_NOT_APPROVED',
            status: tenant.status,
          });
        }

        return res.json({
          id: tenant._id,
          name: tenant.name,
          slug: tenant.slug,
          branding: tenant.branding,
          swalath: tenant.swalath,
          settings: tenant.settings,
          status: tenant.status,
          customDomain: tenant.customDomain,
          customDomainVerified: tenant.customDomainVerified,
          customDomainVerificationToken: tenant.customDomainVerificationToken,
        });
      }

      return res.status(404).json({
        error: 'Invalid or unapproved event subdomain',
        code: 'TENANT_NOT_FOUND',
      });
    }

    if (req.tenant.status !== 'approved') {
      return res.status(403).json({
        error: `This event team application is currently ${req.tenant.status.toUpperCase()}`,
        code: 'TENANT_NOT_APPROVED',
        status: req.tenant.status,
      });
    }

    res.json({
      id: req.tenant._id,
      name: req.tenant.name,
      slug: req.tenant.slug,
      branding: req.tenant.branding,
      swalath: req.tenant.swalath,
      settings: req.tenant.settings,
      status: req.tenant.status,
      customDomain: req.tenant.customDomain,
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching active tenant info' });
  }
});

// All routes below this line require authentication
router.use(requireAuth);

// POST /api/events/register - Create a Registration for req.user under req.tenant
router.post('/register', async (req, res) => {
  try {
    if (!req.tenant) {
      return res.status(404).json({ error: 'Tenant context missing for event registration' });
    }

    const tenantId = req.tenant._id;
    const userId = req.user.userId;
    const { data } = req.body;

    const existing = await Registration.findOne({ tenantId, userId });
    if (existing) {
      return res.status(409).json({
        error: `You are already registered for the "${req.tenant.name}" event.`,
        registration: existing,
      });
    }

    const registration = await Registration.create({
      tenantId,
      userId,
      data: data || {},
      status: 'registered',
    });

    res.status(201).json({
      message: `Successfully registered for "${req.tenant.name}"!`,
      registration,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        error: `You are already registered for this event.`,
      });
    }
    console.error('Member event registration error:', err);
    res.status(500).json({ error: 'Server error registering for event', details: err.message });
  }
});

// GET /api/events/my-registration - caller's registration in current tenant
router.get('/my-registration', async (req, res) => {
  try {
    if (!req.tenant) {
      return res.status(404).json({ error: 'Tenant context missing' });
    }

    const registration = await Registration.findOne({
      tenantId: req.tenant._id,
      userId: req.user.userId,
    }).populate('tenantId', 'name slug branding');

    if (!registration) {
      return res.status(404).json({ error: 'You are not registered for this event yet' });
    }

    res.json(registration);
  } catch (err) {
    console.error('Fetch registration error:', err);
    res.status(500).json({ error: 'Server error fetching registration details' });
  }
});

// GET /api/events/leaderboard - top registrations for current tenant
router.get('/leaderboard', async (req, res) => {
  try {
    if (!req.tenant) {
      return res.status(404).json({ error: 'Tenant context missing' });
    }

    const tenantId = req.tenant._id;
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 10));

    const counts = await Count.find({ tenantId }).populate('user', 'name email place');

    const userTotalsMap = {};
    counts.forEach((item) => {
      if (item.user) {
        const uid = item.user._id ? item.user._id.toString() : String(item.user);
        const name = item.user.name || 'Member';
        const place = item.user.place || '';
        if (!userTotalsMap[uid]) {
          userTotalsMap[uid] = { userId: uid, name, place, total: 0 };
        }
        userTotalsMap[uid].total += Number(item.value) || 0;
      }
    });

    const leaderboard = Object.values(userTotalsMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, limit);

    res.json({
      tenant: {
        id: req.tenant._id,
        name: req.tenant.name,
        branding: req.tenant.branding,
      },
      leaderboard,
    });
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ error: 'Server error generating leaderboard' });
  }
});

export default router;
