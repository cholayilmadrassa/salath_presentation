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

// Helper to sign JWT payload with tenant scoping
function generateToken(user, tenantIdOverride = null) {
  const activeTenantId = tenantIdOverride
    ? tenantIdOverride.toString()
    : user.tenantId
    ? user.tenantId.toString()
    : null;

  const isMember = user.role === 'member' || Boolean(user.isRegisteredMember);

  return jwt.sign(
    {
      userId: user._id.toString(),
      role: user.role,
      tenantId: activeTenantId,
      name: user.name,
      email: user.email,
      isRegisteredMember: isMember,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// POST /api/auth/register - Register member under an active approved event
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, mobile, address, place, tenantSlug } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const rawPhone = phone || mobile || '';
    const cleanPhone = String(rawPhone).replace(/\D/g, '').trim();
    const cleanAddress = (address || place || '').toString().trim();

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
          error: 'Please select an event portal to register',
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
      if (!existingUser.tenantId) {
        existingUser.tenantId = targetTenant._id;
      }
      if (cleanPhone && !existingUser.phone) {
        existingUser.phone = cleanPhone;
      }
      if (cleanAddress) {
        existingUser.address = cleanAddress;
        existingUser.place = cleanAddress;
      }
      existingUser.isRegisteredMember = true;
      await existingUser.save();

      // Register membership record for targetTenant
      await Registration.findOneAndUpdate(
        { tenantId: targetTenant._id, userId: existingUser._id },
        { status: 'registered', data: req.body },
        { upsert: true }
      );

      const token = generateToken(existingUser, targetTenant._id);
      return res.status(200).json({
        message: `Registered successfully under "${targetTenant.name}"!`,
        token,
        user: {
          id: existingUser._id,
          name: existingUser.name,
          email: existingUser.email,
          role: existingUser.role,
          tenantId: targetTenant._id,
          phone: existingUser.phone,
          address: existingUser.address || existingUser.place,
          place: existingUser.place || existingUser.address,
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
      address: cleanAddress,
      place: cleanAddress,
    });

    // Create Registration record
    await Registration.create({
      tenantId: targetTenant._id,
      userId: newUser._id,
      status: 'registered',
      data: req.body,
    });

    const token = generateToken(newUser, targetTenant._id);

    res.status(201).json({
      message: `Account created successfully under "${targetTenant.name}"!`,
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        tenantId: targetTenant._id,
        phone: newUser.phone,
        address: newUser.address || newUser.place,
        place: newUser.place || newUser.address,
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
  const tenantName = req.body.name || req.body.tenantName;
  const slug = req.body.slug;
  const adminName = req.body.adminName;
  const adminPhone = req.body.adminPhone || req.body.phone || '';
  const email = req.body.email || req.body.adminEmail;
  const password = req.body.password || req.body.adminPassword;

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
      phone: adminPhone ? adminPhone.trim() : '',
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
        tagline: ' Organization',
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
    res.status(500).json({ error: 'Failed to  register swalath campain', details: err.message });
  }
});

// POST /api/auth/login - Subdomain & Multi-Event login with Registration Verification
router.post('/login', async (req, res) => {
  try {
    const { email, phone, mobile, password, tenantSlug } = req.body;
    const rawIdentifier = (email || phone || mobile || '').toString().trim().toLowerCase();
    const cleanPhone = rawIdentifier.replace(/\D/g, '');

    if (!rawIdentifier) {
      return res.status(400).json({ error: 'Email or phone number is required' });
    }

    // Resolve current tenant context first
    let currentTenant = req.tenant;
    const requestedSlug = (tenantSlug || req.body.tenantSlug || req.headers['x-tenant-slug'] || '').toString().trim().toLowerCase();
    if (requestedSlug) {
      const foundTenant = await Tenant.findOne({ slug: requestedSlug });
      if (!foundTenant) {
        return res.status(404).json({
          error: `Event subdomain/slug "${requestedSlug}" does not exist. Please verify the event slug and try again.`,
          code: 'TENANT_NOT_FOUND',
        });
      }
      currentTenant = foundTenant;
    }

    // Find target user
    const queryOr = [
      { email: rawIdentifier },
      ...(cleanPhone ? [{ phone: cleanPhone }] : []),
      ...(cleanPhone ? [{ email: `${cleanPhone}@member.salath` }] : []),
      ...(cleanPhone ? [{ email: new RegExp(`^${cleanPhone}\\.`, 'i') }] : []),
    ];

    const user = await User.findOne({ $or: queryOr });

    // If user does not exist in the database at all:
    if (!user) {
      const eventName = currentTenant ? currentTenant.name : 'this event';
      return res.status(403).json({
        error: `Account with identifier "${rawIdentifier}" is not registered in event "${eventName}" yet. Please register first to join this event portal.`,
        code: 'NOT_REGISTERED_IN_TENANT',
        targetSlug: currentTenant ? currentTenant.slug : null,
      });
    }

    if (password && !comparePassword(password, user.passwordHash) && user.role !== 'member') {
      return res.status(401).json({ error: 'Invalid email or password' });
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

    // tenant_admin matching and validation
    if (user.role === 'tenant_admin') {
      const userTenant = user.tenantId ? await Tenant.findById(user.tenantId) : null;

      // If a specific tenant slug was requested/contextualized, enforce slug matching with tenant_admin's tenant
      if (currentTenant && userTenant && currentTenant._id.toString() !== userTenant._id.toString()) {
        return res.status(403).json({
          error: `This admin account belongs to event "${userTenant.name}" (${userTenant.slug}). It cannot be used to log in under event "${currentTenant.name}" (${currentTenant.slug}).`,
          code: 'TENANT_MISMATCH',
          userTenantSlug: userTenant.slug,
          requestedSlug: currentTenant.slug,
        });
      }

      const targetTenant = currentTenant || userTenant;
      if (!targetTenant) {
        return res.status(400).json({ error: 'Tenant record for this admin account was not found.' });
      }

      if (targetTenant.status !== 'approved') {
        return res.status(403).json({
          error: `Event "${targetTenant.name}" is currently ${targetTenant.status.toUpperCase()}. Logging in is disabled until Super Admin approves the event.`,
          code: 'TENANT_NOT_APPROVED',
          status: targetTenant.status,
        });
      }

      const token = generateToken(user, targetTenant._id);
      return res.json({
        message: 'Login successful',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          tenantId: targetTenant._id,
          phone: user.phone,
          place: user.place,
        },
        tenant: {
          id: targetTenant._id,
          name: targetTenant.name,
          slug: targetTenant.slug,
          subdomainUrl: `http://${targetTenant.slug}.${PLATFORM_ROOT_DOMAIN}:5173`,
          status: targetTenant.status,
          branding: targetTenant.branding,
        },
      });
    }

    // Member role matching and registration validation
    const targetTenant = currentTenant || (user.tenantId ? await Tenant.findById(user.tenantId) : null);
    if (!targetTenant) {
      return res.status(400).json({ error: 'Please select an event portal to log in.' });
    }

    if (targetTenant.status !== 'approved') {
      return res.status(403).json({
        error: `Event "${targetTenant.name}" is currently ${targetTenant.status.toUpperCase()}. Logging in is disabled until Super Admin approves the event.`,
        code: 'TENANT_NOT_APPROVED',
      });
    }

    // STRICT REGISTRATION CHECK: If user exists but is NOT registered for targetTenant
    const isRegistered = await Registration.findOne({
      tenantId: targetTenant._id,
      userId: user._id,
    });

    if (!isRegistered) {
      return res.status(403).json({
        error: `You are not registered in event "${targetTenant.name}" yet. Please register first to join this event portal.`,
        code: 'NOT_REGISTERED_IN_TENANT',
        targetSlug: targetTenant.slug,
      });
    }

    const token = generateToken(user, targetTenant._id);
    return res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: targetTenant._id,
        phone: user.phone,
        place: user.place,
      },
      tenant: targetTenant
        ? {
            id: targetTenant._id,
            name: targetTenant.name,
            slug: targetTenant.slug,
            subdomainUrl: `http://${targetTenant.slug}.${PLATFORM_ROOT_DOMAIN}:5173`,
            status: targetTenant.status,
            branding: targetTenant.branding,
          }
        : null,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login', details: err.message });
  }
});

// POST /api/auth/enroll-member - Allow admin user to register as a campaign member
router.post('/enroll-member', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.isRegisteredMember = true;
    await user.save();

    const targetTenantId = req.user.tenantId || user.tenantId;
    if (targetTenantId) {
      await Registration.findOneAndUpdate(
        { tenantId: targetTenantId, userId: user._id },
        { status: 'registered', data: { name: user.name, email: user.email } },
        { upsert: true }
      );
    }

    const token = generateToken(user, targetTenantId);

    res.json({
      message: 'Successfully registered as a campaign member!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: targetTenantId,
        phone: user.phone,
        isRegisteredMember: true,
      },
    });
  } catch (err) {
    console.error('[ENROLL MEMBER ERROR]:', err);
    res.status(500).json({ error: 'Failed to enroll as member' });
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
    if (req.user.tenantId) {
      tenant = await Tenant.findById(req.user.tenantId);
    } else if (user.tenantId) {
      tenant = await Tenant.findById(user.tenantId);
    } else if (req.tenant) {
      tenant = req.tenant;
    }

    const isMember = user.role === 'member' || Boolean(user.isRegisteredMember);

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: req.user.tenantId || user.tenantId,
        phone: user.phone,
        address: user.address || user.place,
        place: user.place || user.address,
        isRegisteredMember: isMember,
      },
      tenant,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch current user profile' });
  }
});

export default router;
