import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Tenant from '../models/Tenant.js';
import Registration from '../models/Registration.js';
import { JWT_SECRET, PLATFORM_ROOT_DOMAIN } from '../config.js';
import { hashPassword, comparePassword } from '../utils/hash.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Helper to sign JWT payload
function generateToken(user) {
  return jwt.sign(
    {
      userId: user._id.toString(),
      role: user.role,
      tenantId: user.tenantId ? user.tenantId.toString() : null,
      name: user.name,
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// POST /api/auth/register - Register member under an active approved event
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, mobile, place, tenantSlug } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const rawPhone = phone || mobile || '';
    const cleanPhone = String(rawPhone).replace(/\D/g, '').trim();

    // Resolve target tenant
    let targetTenant = req.tenant;
    const requestedSlug = tenantSlug || req.headers['x-tenant-slug'] || req.query.tenantSlug;

    if (!targetTenant && requestedSlug) {
      targetTenant = await Tenant.findOne({ slug: String(requestedSlug).toLowerCase().trim() });
    }

    if (!targetTenant) {
      const approvedTenants = await Tenant.find({ status: 'approved' });
      if (approvedTenants.length === 1) {
        targetTenant = approvedTenants[0];
      } else if (approvedTenants.length > 1) {
        return res.status(400).json({
          error: 'Please select an event or register at an event subdomain (e.g. noorulislam.swalath.app)',
          code: 'TENANT_REQUIRED',
        });
      } else {
        return res.status(400).json({
          error: 'No active approved events found. An event must be registered and approved by Super Admin first.',
          code: 'NO_APPROVED_TENANTS',
        });
      }
    }

    // Enforce tenant approval check
    if (targetTenant.status !== 'approved') {
      return res.status(403).json({
        error: `This event ("${targetTenant.name}") is currently ${targetTenant.status.toUpperCase()}. Member registration is disabled until approved by Super Admin.`,
        code: 'TENANT_NOT_APPROVED',
      });
    }

    const cleanEmail = email ? email.toLowerCase().trim() : `${cleanPhone || Date.now()}@member.salath`;
    const cleanPassword = password || `pass_${cleanPhone || '123456'}`;

    let existingUser = await User.findOne({
      $or: [
        { email: cleanEmail },
        ...(cleanPhone ? [{ phone: cleanPhone }] : []),
      ],
    });

    if (existingUser) {
      if (existingUser.tenantId && existingUser.tenantId.toString() !== targetTenant._id.toString()) {
        const assignedTenant = await Tenant.findById(existingUser.tenantId);
        return res.status(409).json({
          error: `An account with this phone/email is already registered under event "${assignedTenant?.name || 'another event'}". You can only log in at your assigned event URL: ${assignedTenant?.slug}.${PLATFORM_ROOT_DOMAIN}`,
          assignedSlug: assignedTenant?.slug,
        });
      }

      if (!existingUser.tenantId) {
        existingUser.tenantId = targetTenant._id;
      }
      if (cleanPhone && !existingUser.phone) {
        existingUser.phone = cleanPhone;
      }
      if (place && !existingUser.place) {
        existingUser.place = String(place).trim();
      }
      await existingUser.save();

      await Registration.findOneAndUpdate(
        { tenantId: targetTenant._id, userId: existingUser._id },
        { status: 'registered', data: req.body },
        { upsert: true }
      ).catch(() => {});

      const token = generateToken(existingUser);
      return res.status(200).json({
        message: `Already registered. Logged in under "${targetTenant.name}".`,
        token,
        user: {
          id: existingUser._id,
          name: existingUser.name,
          email: existingUser.email,
          role: existingUser.role,
          tenantId: existingUser.tenantId,
          phone: existingUser.phone,
          place: existingUser.place,
        },
        tenant: targetTenant,
      });
    }

    const newUser = await User.create({
      name: name.trim(),
      email: cleanEmail,
      passwordHash: hashPassword(cleanPassword),
      role: 'member',
      tenantId: targetTenant._id,
      phone: cleanPhone,
      place: place ? String(place).trim() : '',
    });

    await Registration.create({
      tenantId: targetTenant._id,
      userId: newUser._id,
      status: 'registered',
      data: req.body,
    }).catch(() => {});

    const token = generateToken(newUser);

    res.status(201).json({
      message: `Account created successfully under "${targetTenant.name}"!`,
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        tenantId: newUser.tenantId,
        phone: newUser.phone,
        place: newUser.place,
      },
      tenant: targetTenant,
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error during registration', details: err.message });
  }
});

// POST /api/auth/register-tenant - Event Team Application (Requires Super Admin Approval)
router.post('/register-tenant', async (req, res) => {
  const { name: tenantName, slug, adminName, email, password } = req.body;

  if (!tenantName || !slug || !adminName || !email || !password) {
    return res.status(400).json({ error: 'All fields are required (tenant name, slug, admin name, email, password)' });
  }

  const normalizedSlug = slug.toLowerCase().trim();
  const normalizedEmail = email.toLowerCase().trim();

  if (!/^[a-z0-9-]+$/.test(normalizedSlug)) {
    return res.status(400).json({ error: 'Subdomain slug must contain only lowercase letters, numbers, and hyphens' });
  }

  const existingTenant = await Tenant.findOne({ slug: normalizedSlug });
  if (existingTenant) {
    return res.status(409).json({ error: `Subdomain slug "${normalizedSlug}" is already taken by another event` });
  }

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    return res.status(409).json({ error: 'An account with this admin email already exists' });
  }

  const passwordHash = hashPassword(password);
  const dummyTenantId = new mongoose.Types.ObjectId();
  let createdUser = null;
  let createdTenant = null;

  try {
    createdUser = await User.create({
      _id: new mongoose.Types.ObjectId(),
      name: adminName.trim(),
      email: normalizedEmail,
      passwordHash,
      role: 'tenant_admin',
      tenantId: dummyTenantId,
    });

    createdTenant = await Tenant.create({
      _id: dummyTenantId,
      name: tenantName.trim(),
      slug: normalizedSlug,
      status: 'pending',
      ownerId: createdUser._id,
      branding: {
        title: tenantName.trim(),
        tagline: 'Event Organization Platform',
        logoUrl: '',
        themeColor: '#0E7443',
      },
    });

    res.status(201).json({
      message: 'Event team registered successfully! Application submitted for Super Admin approval.',
      tenant: {
        id: createdTenant._id,
        name: createdTenant.name,
        slug: createdTenant.slug,
        subdomainUrl: `http://${createdTenant.slug}.${PLATFORM_ROOT_DOMAIN}:5173`,
        status: createdTenant.status,
      },
      user: {
        id: createdUser._id,
        name: createdUser.name,
        email: createdUser.email,
        role: createdUser.role,
        tenantId: createdUser.tenantId,
      },
    });
  } catch (err) {
    if (createdUser && !createdTenant) {
      await User.deleteOne({ _id: createdUser._id }).catch(() => {});
    }
    console.error('Register Tenant Error:', err);
    res.status(500).json({ error: 'Failed to register event team', details: err.message });
  }
});

// POST /api/auth/login - Subdomain and Event isolated login
router.post('/login', async (req, res) => {
  try {
    const { email, phone, mobile, password, tenantSlug } = req.body;
    const rawIdentifier = (email || phone || mobile || '').toString().trim().toLowerCase();
    const cleanPhone = rawIdentifier.replace(/\D/g, '');

    if (!rawIdentifier) {
      return res.status(400).json({ error: 'Email or phone number is required' });
    }

    const queryOr = [
      { email: rawIdentifier },
      ...(cleanPhone ? [{ phone: cleanPhone }] : []),
      ...(cleanPhone ? [{ email: `${cleanPhone}@member.salath` }] : []),
      ...(cleanPhone ? [{ email: new RegExp(`^${cleanPhone}\\.`, 'i') }] : []),
    ];

    const user = await User.findOne({ $or: queryOr });

    if (!user) {
      return res.status(401).json({ error: 'Account not found. Please register first.' });
    }

    if (password && !comparePassword(password, user.passwordHash) && user.role !== 'member') {
      return res.status(401).json({ error: 'Invalid password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Account has been deactivated' });
    }

    // Super Admin can log in from anywhere
    if (user.role === 'super_admin') {
      const token = generateToken(user);
      return res.json({
        message: 'Super Admin Login successful',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          tenantId: null,
          phone: user.phone,
          place: user.place,
        },
      });
    }

    // Resolve current tenant context (from hostname/header/body)
    let currentTenant = req.tenant;
    const requestedSlug = (tenantSlug || req.body.tenantSlug || req.headers['x-tenant-slug'] || '').toString().trim().toLowerCase();
    if (!currentTenant && requestedSlug) {
      currentTenant = await Tenant.findOne({ slug: requestedSlug });
    }

    // Check if requested/current tenant context is pending approval
    if (currentTenant && currentTenant.status !== 'approved') {
      return res.status(403).json({
        error: `Event "${currentTenant.name}" is currently ${currentTenant.status.toUpperCase()}. You can only log in after the Super Admin approves the event.`,
        code: 'TENANT_NOT_APPROVED',
        status: currentTenant.status,
      });
    }

    // Check user's assigned tenant against current tenant context
    if (user.tenantId) {
      const assignedTenant = await Tenant.findById(user.tenantId);

      if (!assignedTenant) {
        return res.status(404).json({ error: 'Your assigned event tenant could not be found' });
      }

      if (assignedTenant.status !== 'approved') {
        return res.status(403).json({
          error: `Your event "${assignedTenant.name}" is currently ${assignedTenant.status.toUpperCase()}. Logging in is disabled until Super Admin approves the event.`,
          code: 'TENANT_NOT_APPROVED',
        });
      }

      // Strict Subdomain Match Verification
      const targetSlug = currentTenant ? currentTenant.slug : requestedSlug;
      if (targetSlug && targetSlug !== assignedTenant.slug) {
        return res.status(403).json({
          error: `Access Denied: You are attempting to log into event "${targetSlug}", but your account belongs to "${assignedTenant.name}". Please log in at your assigned event URL: ${assignedTenant.slug}.${PLATFORM_ROOT_DOMAIN}`,
          assignedSlug: assignedTenant.slug,
        });
      }

      const token = generateToken(user);
      return res.json({
        message: 'Login successful',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          tenantId: user.tenantId,
          phone: user.phone,
          place: user.place,
        },
        tenant: {
          id: assignedTenant._id,
          name: assignedTenant.name,
          slug: assignedTenant.slug,
          subdomainUrl: `http://${assignedTenant.slug}.${PLATFORM_ROOT_DOMAIN}:5173`,
          status: assignedTenant.status,
          branding: assignedTenant.branding,
        },
      });
    }

    // If user has no explicit tenantId yet but currentTenant is approved, bind them to currentTenant
    if (currentTenant && currentTenant.status === 'approved') {
      user.tenantId = currentTenant._id;
      await user.save();

      const token = generateToken(user);
      return res.json({
        message: 'Login successful',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          tenantId: user.tenantId,
          phone: user.phone,
          place: user.place,
        },
        tenant: currentTenant,
      });
    }

    const token = generateToken(user);
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: null,
        phone: user.phone,
        place: user.place,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login', details: err.message });
  }
});

// GET /api/auth/me - Current user profile
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let tenant = null;
    if (user.tenantId) {
      tenant = await Tenant.findById(user.tenantId);
    } else if (req.tenant) {
      tenant = req.tenant;
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        phone: user.phone,
        place: user.place,
      },
      tenant,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch current user profile' });
  }
});

export default router;
