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
      mustChangePassword: Boolean(user.mustChangePassword),
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Helper: generate unique email for a new account
// Format: {sanitized_name}{last4digits}@{tenantSlug}.swalath.online
async function generateUniqueEmail(name, phone, tenantSlug) {
  const sanitizedName = name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9]/g, '');
  const last4 = String(phone).replace(/\D/g, '').slice(-4) || '0000';
  const base = `${sanitizedName}${last4}@${tenantSlug}.swalath.online`;

  const existing = await User.findOne({ email: base });
  if (!existing) return base;

  for (let i = 2; i <= 20; i++) {
    const candidate = `${sanitizedName}${last4}.${i}@${tenantSlug}.swalath.online`;
    const taken = await User.findOne({ email: candidate });
    if (!taken) return candidate;
  }
  return `${sanitizedName}${last4}.${Date.now()}@${tenantSlug}.swalath.online`;
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

    const allowMultipleAccounts = targetTenant.settings?.allowMultipleAccounts === true;

    if (allowMultipleAccounts) {
      // ── Multiple accounts mode: always create a new account ──
      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Name is required' });
      }

      const existingCount = cleanPhone
        ? await User.countDocuments({ phone: cleanPhone, tenantId: targetTenant._id, role: 'member' })
        : 0;

      if (existingCount >= 3) {
        return res.status(409).json({
          error: 'Maximum 3 accounts allowed per phone number for this event.',
          code: 'MAX_ACCOUNTS_REACHED',
        });
      }

      const uniqueEmail = await generateUniqueEmail(name, cleanPhone, targetTenant.slug);
      const cleanPassword = password || `pass_${cleanPhone || '123456'}`;

      const newUser = await User.create({
        name: name.trim(),
        email: uniqueEmail,
        passwordHash: hashPassword(cleanPassword),
        role: 'member',
        tenantId: targetTenant._id,
        phone: cleanPhone,
        address: cleanAddress,
        place: cleanAddress,
        isRegisteredMember: true,
      });

      await Registration.create({
        tenantId: targetTenant._id,
        userId: newUser._id,
        status: 'registered',
        data: req.body,
      });

      const token = generateToken(newUser, targetTenant._id);
      return res.status(201).json({
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
    }

    // ── Single account mode (default) ──
    const cleanEmail = email ? email.toLowerCase().trim() : `${cleanPhone || Date.now()}@member.salath`;
    const cleanPassword = password || `pass_${cleanPhone || '123456'}`;

    let existingUser = await User.findOne({
      $or: [
        { email: cleanEmail },
        ...(cleanPhone ? [{ phone: cleanPhone, tenantId: targetTenant._id }] : []),
      ],
    });

    if (existingUser) {
      if (!existingUser.tenantId) existingUser.tenantId = targetTenant._id;
      if (cleanPhone && !existingUser.phone) existingUser.phone = cleanPhone;
      if (cleanAddress) {
        existingUser.address = cleanAddress;
        existingUser.place = cleanAddress;
      }
      existingUser.isRegisteredMember = true;
      await existingUser.save();

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

    await Registration.create({
      tenantId: targetTenant._id,
      userId: newUser._id,
      status: 'registered',
      data: req.body,
    });

    const token = generateToken(newUser, targetTenant._id);
    return res.status(201).json({
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

    const emailPrefix = rawIdentifier.includes('@') ? rawIdentifier.split('@')[0] : '';

    // Find ALL users matching email, phone, or email prefix
    const queryOr = [
      { email: rawIdentifier },
      ...(emailPrefix && emailPrefix.length >= 3 ? [{ email: new RegExp(`^${emailPrefix}`, 'i') }] : []),
      ...(cleanPhone ? [{ phone: cleanPhone }] : []),
      ...(cleanPhone ? [{ email: `${cleanPhone}@member.salath` }] : []),
      ...(cleanPhone ? [{ email: new RegExp(`^${cleanPhone}\\.`, 'i') }] : []),
    ];

    // Broad search across all users — tenant filtering is applied downstream
    // for member-specific multi-account detection (via tenantMembers filter)
    const allMatchingUsers = await User.find({ $or: queryOr });

    // If no users found at all:
    if (!allMatchingUsers.length) {
      const eventName = currentTenant ? currentTenant.name : 'this event';
      return res.status(403).json({
        error: `Account with identifier "${rawIdentifier}" is not registered in event "${eventName}" yet. Please register first to join this event portal.`,
        code: 'NOT_REGISTERED_IN_TENANT',
        targetSlug: currentTenant ? currentTenant.slug : null,
      });
    }

    // ── ADMIN LOGIN PATH (when password is provided) ──
    if (password) {
      let adminUser = null;
      if (currentTenant) {
        adminUser = allMatchingUsers.find(
          u => u.role === 'tenant_admin' && u.tenantId && u.tenantId.toString() === currentTenant._id.toString()
        ) || allMatchingUsers.find(u => u.role === 'super_admin');
      }
      if (!adminUser) {
        adminUser = allMatchingUsers.find(u => u.role !== 'member');
      }

      if (!adminUser) {
        return res.status(403).json({
          error: `No admin account found with identifier "${rawIdentifier}". Please check your email/phone or register an event team.`,
          code: 'ADMIN_NOT_FOUND',
        });
      }

      if (!comparePassword(password, adminUser.passwordHash)) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      if (!adminUser.isActive) {
        return res.status(403).json({ error: 'Account has been deactivated' });
      }

      if (
        adminUser.mustChangePassword &&
        adminUser.passwordExpiresAt &&
        Date.now() > new Date(adminUser.passwordExpiresAt).getTime()
      ) {
        return res.status(403).json({
          error: 'Temporary password has expired. Please contact Super Admin to request a password reset.',
          code: 'TEMPORARY_PASSWORD_EXPIRED',
        });
      }

      // Super Admin login
      if (adminUser.role === 'super_admin') {
        const token = generateToken(adminUser);
        return res.json({
          message: 'Super Admin Login successful',
          token,
          user: {
            id: adminUser._id,
            name: adminUser.name,
            email: adminUser.email,
            role: adminUser.role,
            tenantId: null,
            phone: adminUser.phone,
            place: adminUser.place,
            mustChangePassword: Boolean(adminUser.mustChangePassword),
          },
        });
      }

      // Tenant Admin login
      if (adminUser.role === 'tenant_admin') {
        const userTenant = adminUser.tenantId ? await Tenant.findById(adminUser.tenantId) : null;

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

        const token = generateToken(adminUser, targetTenant._id);
        return res.json({
          message: 'Login successful',
          token,
          user: {
            id: adminUser._id,
            name: adminUser.name,
            email: adminUser.email,
            role: adminUser.role,
            tenantId: targetTenant._id,
            phone: adminUser.phone,
            place: adminUser.place,
            mustChangePassword: Boolean(adminUser.mustChangePassword),
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
    }

    // ── MEMBER LOGIN PATH (when password is omitted) ──
    // Filter members for the resolved tenant
    const memberUsers = allMatchingUsers.filter(
      u => u.role === 'member' && u.tenantId && currentTenant &&
           u.tenantId.toString() === currentTenant._id.toString()
    );

    // Fallback: if no tenant context yet, use the user's own tenant
    const targetTenant = currentTenant ||
      (user.tenantId ? await Tenant.findById(user.tenantId) : null);
    if (!targetTenant) {
      return res.status(400).json({ error: 'Please select an event portal to log in.' });
    }

    if (targetTenant.status !== 'approved') {
      return res.status(403).json({
        error: `Event "${targetTenant.name}" is currently ${targetTenant.status.toUpperCase()}. Logging in is disabled until Super Admin approves the event.`,
        code: 'TENANT_NOT_APPROVED',
      });
    }

    // Filter by tenant more precisely
    const tenantMembers = allMatchingUsers.filter(
      u => u.role === 'member' && u.tenantId &&
           u.tenantId.toString() === targetTenant._id.toString()
    );

    if (!tenantMembers.length) {
      return res.status(403).json({
        error: `You are not registered in event "${targetTenant.name}" yet. Please register first to join this event portal.`,
        code: 'NOT_REGISTERED_IN_TENANT',
        targetSlug: targetTenant.slug,
      });
    }

    // Multiple accounts: require account selection
    if (tenantMembers.length > 1) {
      return res.status(200).json({
        requiresAccountSelection: true,
        message: 'Multiple accounts found. Please select an account to continue.',
        accounts: tenantMembers.map(u => ({
          id: u._id,
          name: u.name,
          phone: u.phone,
          address: u.address || u.place || '',
          initial: u.name ? u.name.charAt(0).toUpperCase() : '?',
        })),
        tenantSlug: targetTenant.slug,
        phone: cleanPhone,
        tenant: {
          id: targetTenant._id,
          name: targetTenant.name,
          slug: targetTenant.slug,
          branding: targetTenant.branding,
        },
      });
    }

    // Single member account — standard login
    const memberUser = tenantMembers[0];
    if (!memberUser.isActive) {
      return res.status(403).json({ error: 'Account has been deactivated' });
    }

    // STRICT REGISTRATION CHECK
    const isRegistered = await Registration.findOne({
      tenantId: targetTenant._id,
      userId: memberUser._id,
    });

    if (!isRegistered) {
      return res.status(403).json({
        error: `You are not registered in event "${targetTenant.name}" yet. Please register first to join this event portal.`,
        code: 'NOT_REGISTERED_IN_TENANT',
        targetSlug: targetTenant.slug,
      });
    }

    const token = generateToken(memberUser, targetTenant._id);
    return res.json({
      message: 'Login successful',
      token,
      user: {
        id: memberUser._id,
        name: memberUser.name,
        email: memberUser.email,
        role: memberUser.role,
        tenantId: targetTenant._id,
        phone: memberUser.phone,
        place: memberUser.place,
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
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login', details: err.message });
  }
});

// POST /api/auth/login-select - Finalize login after account selection
router.post('/login-select', async (req, res) => {
  try {
    const { userId, phone, tenantSlug } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'Account not found' });
    if (!user.isActive) return res.status(403).json({ error: 'Account has been deactivated' });

    // Security: verify phone matches
    const cleanPhone = String(phone || '').replace(/\D/g, '');
    if (cleanPhone && user.phone && user.phone !== cleanPhone) {
      return res.status(403).json({ error: 'Phone number does not match this account' });
    }

    let targetTenant = tenantSlug ? await Tenant.findOne({ slug: tenantSlug.toLowerCase().trim() }) : null;
    if (!targetTenant && user.tenantId) targetTenant = await Tenant.findById(user.tenantId);
    if (!targetTenant) return res.status(400).json({ error: 'Event portal not found' });

    if (targetTenant.status !== 'approved') {
      return res.status(403).json({ error: `Event "${targetTenant.name}" is not approved yet.`, code: 'TENANT_NOT_APPROVED' });
    }

    const isRegistered = await Registration.findOne({ tenantId: targetTenant._id, userId: user._id });
    if (!isRegistered) {
      return res.status(403).json({ error: `You are not registered in event "${targetTenant.name}" yet.`, code: 'NOT_REGISTERED_IN_TENANT' });
    }

    let userAddress = (user.address || user.place || '').trim();
    if (!userAddress && user.phone) {
      const primaryUser = await User.findOne({ phone: user.phone, address: { $ne: '' } }).sort({ createdAt: 1 });
      if (primaryUser) userAddress = (primaryUser.address || primaryUser.place || '').trim();
    }

    const token = generateToken(user, targetTenant._id);
    return res.json({
      message: 'Login successful',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, tenantId: targetTenant._id, phone: user.phone, place: userAddress, address: userAddress },
      tenant: { id: targetTenant._id, name: targetTenant.name, slug: targetTenant.slug, branding: targetTenant.branding },
    });
  } catch (err) {
    console.error('Login-select error:', err);
    res.status(500).json({ error: 'Server error during account selection login', details: err.message });
  }
});

// POST /api/auth/add-account - Create an additional account with the same phone (authenticated)
router.post('/add-account', requireAuth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.userId);
    if (!currentUser) return res.status(404).json({ error: 'Current user not found' });

    const { name, address } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required for the new account' });

    const tenantId = req.user.tenantId || currentUser.tenantId;
    if (!tenantId) return res.status(400).json({ error: 'No event tenant context found' });

    const targetTenant = await Tenant.findById(tenantId);
    if (!targetTenant) return res.status(404).json({ error: 'Event not found' });

    if (!targetTenant.settings?.allowMultipleAccounts) {
      return res.status(403).json({ error: 'Multiple accounts are not allowed for this event.', code: 'FEATURE_DISABLED' });
    }

    const phone = currentUser.phone;
    const existingCount = phone
      ? await User.countDocuments({ phone, tenantId: targetTenant._id, role: 'member' })
      : 1;

    if (existingCount >= 3) {
      return res.status(409).json({ error: 'Maximum 3 accounts allowed per phone number for this event.', code: 'MAX_ACCOUNTS_REACHED' });
    }

    const uniqueEmail = await generateUniqueEmail(name, phone, targetTenant.slug);

    let cleanAddress = (address || '').trim();
    if (!cleanAddress && phone) {
      const firstUserWithPhone = await User.findOne({ phone }).sort({ createdAt: 1 });
      if (firstUserWithPhone) {
        cleanAddress = (firstUserWithPhone.address || firstUserWithPhone.place || '').trim();
      }
    }
    if (!cleanAddress) {
      cleanAddress = (currentUser.address || currentUser.place || '').trim();
    }

    const newUser = await User.create({
      name: name.trim(),
      email: uniqueEmail,
      passwordHash: currentUser.passwordHash,
      role: 'member',
      tenantId: targetTenant._id,
      phone,
      address: cleanAddress,
      place: cleanAddress,
      isRegisteredMember: true,
    });

    await Registration.create({
      tenantId: targetTenant._id,
      userId: newUser._id,
      status: 'registered',
      data: { name: name.trim(), phone, address: cleanAddress },
    });

    const token = generateToken(newUser, targetTenant._id);
    return res.status(201).json({
      message: `New account "${name.trim()}" created successfully!`,
      token,
      user: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role, tenantId: targetTenant._id, phone: newUser.phone, address: newUser.address, place: newUser.place },
    });
  } catch (err) {
    console.error('Add-account error:', err);
    res.status(500).json({ error: 'Server error creating new account', details: err.message });
  }
});

// GET /api/auth/my-accounts - List all accounts for the current user's phone in their tenant
router.get('/my-accounts', requireAuth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.userId);
    if (!currentUser) return res.status(404).json({ error: 'User not found' });

    const tenantId = req.user.tenantId || currentUser.tenantId;
    const phone = currentUser.phone;

    if (!phone || !tenantId) {
      return res.json({ accounts: [], currentUserId: currentUser._id });
    }

    const accounts = await User.find({ phone, tenantId, role: 'member' }).select('_id name phone address place createdAt');

    const firstUser = await User.findOne({ phone, address: { $ne: '' } }).sort({ createdAt: 1 });
    const sharedAddress = (firstUser?.address || firstUser?.place || '').trim();

    return res.json({
      accounts: accounts.map(u => ({
        id: u._id,
        name: u.name,
        phone: u.phone,
        address: (u.address || u.place || sharedAddress).trim(),
        initial: u.name ? u.name.charAt(0).toUpperCase() : '?',
        isCurrentAccount: u._id.toString() === currentUser._id.toString(),
      })),
      currentUserId: currentUser._id,
      allowMultipleAccounts: (await Tenant.findById(tenantId))?.settings?.allowMultipleAccounts === true,
    });
  } catch (err) {
    console.error('My-accounts error:', err);
    res.status(500).json({ error: 'Server error fetching accounts', details: err.message });
  }
});

// PUT /api/auth/update-account/:accountId - Update name/address for user's account
router.put('/update-account/:accountId', requireAuth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.userId);
    if (!currentUser) return res.status(404).json({ error: 'Current user session not found' });

    const targetAccountId = req.params.accountId;
    const targetUser = await User.findById(targetAccountId);
    if (!targetUser) return res.status(404).json({ error: 'Target account not found' });

    // Auth check: target user must be current user OR share same phone in same tenant
    const isSelf = currentUser._id.toString() === targetUser._id.toString();
    const isSamePhoneTenant =
      currentUser.phone &&
      targetUser.phone &&
      currentUser.phone === targetUser.phone &&
      (currentUser.tenantId?.toString() === targetUser.tenantId?.toString() ||
        req.user.tenantId?.toString() === targetUser.tenantId?.toString());

    if (!isSelf && !isSamePhoneTenant) {
      return res.status(403).json({ error: 'Not authorized to update this account' });
    }

    const { name, address, place } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Account name cannot be empty' });
    }

    targetUser.name = name.trim();
    if (address !== undefined) {
      targetUser.address = address.trim();
    }
    if (place !== undefined) {
      targetUser.place = place.trim();
    } else if (address !== undefined) {
      targetUser.place = address.trim();
    }

    await targetUser.save();

    // Also update Registration record data if exists
    if (targetUser.tenantId) {
      await Registration.findOneAndUpdate(
        { tenantId: targetUser.tenantId, userId: targetUser._id },
        { $set: { 'data.name': targetUser.name, 'data.address': targetUser.address } }
      );
    }

    // If updating current active account session, generate updated token
    let freshToken = null;
    if (isSelf) {
      freshToken = generateToken(targetUser, req.user.tenantId || targetUser.tenantId);
    }

    return res.json({
      message: `Account "${targetUser.name}" updated successfully!`,
      token: freshToken,
      account: {
        id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
        tenantId: req.user.tenantId || targetUser.tenantId,
        phone: targetUser.phone,
        address: targetUser.address || targetUser.place,
        place: targetUser.place || targetUser.address,
        isRegisteredMember: targetUser.role === 'member' || Boolean(targetUser.isRegisteredMember),
      },
    });
  } catch (err) {
    console.error('Update-account error:', err);
    res.status(500).json({ error: 'Server error updating account', details: err.message });
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
        mustChangePassword: Boolean(user.mustChangePassword),
      },
      tenant,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch current user profile' });
  }
});

// POST /api/auth/change-password - Change password for authenticated user (e.g. forced temp password change)
router.post('/change-password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }
    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User account not found' });
    }

    if (!comparePassword(currentPassword, user.passwordHash)) {
      return res.status(400).json({ error: 'Incorrect current/temporary password' });
    }

    user.passwordHash = hashPassword(newPassword);
    user.mustChangePassword = false;
    user.passwordExpiresAt = null;
    await user.save();

    const targetTenantId = req.user.tenantId || user.tenantId;
    const token = generateToken(user, targetTenantId);

    return res.json({
      message: 'Password updated successfully!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: targetTenantId,
        phone: user.phone,
        place: user.place,
        mustChangePassword: false,
      },
    });
  } catch (err) {
    console.error('Change password error:', err);
    return res.status(500).json({ error: 'Failed to update password', details: err.message });
  }
});

export default router;
