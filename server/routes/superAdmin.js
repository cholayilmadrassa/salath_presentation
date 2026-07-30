import express from 'express';
import mongoose from 'mongoose';
import Tenant from '../models/Tenant.js';
import User from '../models/User.js';
import Registration from '../models/Registration.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { hashPassword } from '../utils/hash.js';
import { PLATFORM_ROOT_DOMAIN } from '../config.js';

const router = express.Router();

// Apply requireAuth and requireRole('super_admin') to all routes in superAdmin.js
router.use(requireAuth, requireRole('super_admin'));

// POST /api/super-admin/tenants - Direct creation of pre-approved event subdomain team by Super Admin
router.post('/tenants', async (req, res) => {
  try {
    const { name, slug, adminName, email, password } = req.body;
    if (!name || !slug || !adminName || !email || !password) {
      return res.status(400).json({ error: 'All fields are required (name, slug, adminName, email, password)' });
    }

    const normalizedSlug = slug.toLowerCase().trim();
    const normalizedEmail = email.toLowerCase().trim();

    if (!/^[a-z0-9-]+$/.test(normalizedSlug)) {
      return res.status(400).json({ error: 'Subdomain slug must contain only lowercase letters, numbers, and hyphens' });
    }

    const existingTenant = await Tenant.findOne({ slug: normalizedSlug });
    if (existingTenant) {
      return res.status(409).json({ error: 'Subdomain slug already exists' });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    const dummyTenantId = new mongoose.Types.ObjectId();
    const createdUser = await User.create({
      _id: new mongoose.Types.ObjectId(),
      name: adminName.trim(),
      email: normalizedEmail,
      passwordHash: hashPassword(password),
      role: 'tenant_admin',
      tenantId: dummyTenantId,
    });

    const createdTenant = await Tenant.create({
      _id: dummyTenantId,
      name: name.trim(),
      slug: normalizedSlug,
      status: 'approved',
      approvedBy: req.user.userId,
      approvedAt: new Date(),
      ownerId: createdUser._id,
      branding: {
        title: name.trim(),
        tagline: 'Event Organization Platform',
        logoUrl: '',
        themeColor: '#4f46e5',
      },
    });

    res.status(201).json({
      message: `Pre-approved event subdomain "${createdTenant.slug}" created successfully!`,
      tenant: createdTenant,
      subdomainUrl: `http://${createdTenant.slug}.${PLATFORM_ROOT_DOMAIN}:5173`,
      user: createdUser,
    });
  } catch (err) {
    console.error('SuperAdmin create tenant error:', err);
    res.status(500).json({ error: 'Server error creating tenant', details: err.message });
  }
});

// GET /api/super-admin/tenants?status=pending - list tenants, filterable by status
router.get('/tenants', async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) {
      filter.status = status;
    }

    const tenants = await Tenant.find(filter)
      .populate('ownerId', 'name email phone')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(tenants);
  } catch (err) {
    console.error('SuperAdmin fetch tenants error:', err);
    res.status(500).json({ error: 'Server error listing tenants', details: err.message });
  }
});

// GET /api/super-admin/tenants/:id - full tenant detail
router.get('/tenants/:id', async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id)
      .populate('ownerId', 'name email phone')
      .populate('approvedBy', 'name email');

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const registrationCount = await Registration.countDocuments({ tenantId: tenant._id });

    res.json({
      tenant,
      stats: {
        registrationCount,
      },
    });
  } catch (err) {
    console.error('SuperAdmin tenant detail error:', err);
    res.status(500).json({ error: 'Server error fetching tenant detail', details: err.message });
  }
});

// POST /api/super-admin/tenants/:id/approve - approve pending tenant
router.post('/tenants/:id/approve', async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    tenant.status = 'approved';
    tenant.approvedBy = req.user.userId;
    tenant.approvedAt = new Date();
    tenant.rejectionReason = '';

    await tenant.save();

    res.json({
      message: `Tenant "${tenant.name}" (${tenant.slug}) has been approved.`,
      tenant,
    });
  } catch (err) {
    console.error('SuperAdmin tenant approve error:', err);
    res.status(500).json({ error: 'Server error approving tenant', details: err.message });
  }
});

// POST /api/super-admin/tenants/:id/reject - reject pending tenant
router.post('/tenants/:id/reject', async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    tenant.status = 'rejected';
    tenant.rejectionReason = rejectionReason || 'Application rejected by platform administrator.';

    await tenant.save();

    res.json({
      message: `Tenant "${tenant.name}" has been rejected.`,
      tenant,
    });
  } catch (err) {
    console.error('SuperAdmin tenant reject error:', err);
    res.status(500).json({ error: 'Server error rejecting tenant', details: err.message });
  }
});

// POST /api/super-admin/tenants/:id/suspend - suspend tenant
router.post('/tenants/:id/suspend', async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    tenant.status = 'suspended';
    await tenant.save();

    res.json({
      message: `Tenant "${tenant.name}" has been suspended.`,
      tenant,
    });
  } catch (err) {
    console.error('SuperAdmin tenant suspend error:', err);
    res.status(500).json({ error: 'Server error suspending tenant', details: err.message });
  }
});

export default router;
