import express from 'express';
import dns from 'dns/promises';
import crypto from 'crypto';
import Tenant from '../models/Tenant.js';
import User from '../models/User.js';
import Registration from '../models/Registration.js';
import Count from '../models/Count.js';
import { requireAuth, requireRole, requireTenantMatch } from '../middleware/auth.js';

const router = express.Router();

// Apply requireAuth, requireRole('tenant_admin', 'super_admin'), and requireTenantMatch
router.use(requireAuth, requireRole('tenant_admin', 'super_admin'), requireTenantMatch);

// GET /api/admin/me/tenant - the caller's own tenant record
router.get('/me/tenant', async (req, res) => {
  try {
    const tenantId = req.tenant ? req.tenant._id : req.user.tenantId;
    if (!tenantId) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant record not found' });
    }

    res.json(tenant);
  } catch (err) {
    console.error('Fetch tenant error:', err);
    res.status(500).json({ error: 'Server error fetching tenant record' });
  }
});

// PUT & PATCH /api/admin/me/tenant/branding - update tenant branding
router.put('/me/tenant/branding', async (req, res) => {
  try {
    const tenantId = req.tenant ? req.tenant._id : req.user.tenantId;
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const { title, tagline, logoUrl, themeColor } = req.body;
    tenant.branding = {
      ...tenant.branding,
      title: title !== undefined ? title : tenant.branding.title,
      tagline: tagline !== undefined ? tagline : tenant.branding.tagline,
      logoUrl: logoUrl !== undefined ? logoUrl : tenant.branding.logoUrl,
      themeColor: themeColor !== undefined ? themeColor : tenant.branding.themeColor,
    };

    await tenant.save();
    res.json(tenant);
  } catch (err) {
    console.error('Update branding error:', err);
    res.status(500).json({ error: 'Server error updating branding' });
  }
});

// PUT /api/admin/me/tenant/swalath - update tenant swalath details
router.put('/me/tenant/swalath', async (req, res) => {
  try {
    const tenantId = req.tenant ? req.tenant._id : req.user.tenantId;
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const { title, arabicText, translation, imageUrl } = req.body;
    tenant.swalath = {
      title: title !== undefined ? title : (tenant.swalath?.title || 'സ്വലാത്ത്'),
      arabicText: arabicText !== undefined ? arabicText : (tenant.swalath?.arabicText || ''),
      translation: translation !== undefined ? translation : (tenant.swalath?.translation || ''),
      imageUrl: imageUrl !== undefined ? imageUrl : (tenant.swalath?.imageUrl || ''),
    };

    await tenant.save();
    res.json(tenant);
  } catch (err) {
    console.error('Update swalath error:', err);
    res.status(500).json({ error: 'Server error updating swalath' });
  }
});

// PATCH /api/admin/me/tenant - update branding, swalath and settings
router.patch('/me/tenant', async (req, res) => {
  try {
    const tenantId = req.tenant ? req.tenant._id : req.user.tenantId;
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const { branding, swalath, settings, name } = req.body;

    if (name && typeof name === 'string') {
      tenant.name = name.trim();
    }

    if (branding && typeof branding === 'object') {
      tenant.branding = {
        ...tenant.branding,
        title: branding.title !== undefined ? branding.title : tenant.branding.title,
        tagline: branding.tagline !== undefined ? branding.tagline : tenant.branding.tagline,
        logoUrl: branding.logoUrl !== undefined ? branding.logoUrl : tenant.branding.logoUrl,
        themeColor: branding.themeColor !== undefined ? branding.themeColor : tenant.branding.themeColor,
      };
    }

    if (swalath && typeof swalath === 'object') {
      tenant.swalath = {
        ...(tenant.swalath || {}),
        title: swalath.title !== undefined ? swalath.title : tenant.swalath?.title,
        arabicText: swalath.arabicText !== undefined ? swalath.arabicText : tenant.swalath?.arabicText,
        translation: swalath.translation !== undefined ? swalath.translation : tenant.swalath?.translation,
        imageUrl: swalath.imageUrl !== undefined ? swalath.imageUrl : tenant.swalath?.imageUrl,
      };
    }

    if (settings && typeof settings === 'object') {
      tenant.settings = {
        ...(tenant.settings || {}),
        ...settings,
      };
    }

    await tenant.save();

    res.json({
      message: 'Tenant customization saved successfully',
      tenant,
    });
  } catch (err) {
    console.error('Update tenant error:', err);
    res.status(500).json({ error: 'Server error updating tenant settings' });
  }
});

// GET /api/admin/users - list users registered under tenant with total Swalath count
router.get('/users', async (req, res) => {
  try {
    const tenantId = req.tenant ? req.tenant._id : req.user.tenantId;
    if (!tenantId) {
      return res.status(404).json({ error: 'Tenant context missing' });
    }

    // 1. Direct users matching user.tenantId
    const directUsers = await User.find({ tenantId, role: 'member' }).select('name email phone place address createdAt');

    // 2. Registrations under this tenantId
    const registrations = await Registration.find({ tenantId }).populate('userId', 'name email phone place address createdAt role');

    // 3. Counts recorded under this tenantId
    const counts = await Count.find({ tenantId }).populate('user', 'name email phone place address createdAt role');

    const userMap = {};
    const countMap = {};

    // Calculate total count per user using exact "user" field reference
    counts.forEach((c) => {
      const val = Number(c.value) || 0;
      if (c && c.user) {
        const u = c.user;
        const uid = u._id ? u._id.toString() : String(u);
        countMap[uid] = (countMap[uid] || 0) + val;

        if (typeof u === 'object' && u._id) {
          userMap[uid] = u;
        }
      }
    });

    directUsers.forEach((u) => {
      if (u && u._id) {
        const uid = u._id.toString();
        userMap[uid] = userMap[uid] || u;
      }
    });

    registrations.forEach((r) => {
      if (r && r.userId && r.userId._id) {
        const uid = r.userId._id.toString();
        userMap[uid] = userMap[uid] || r.userId;
      }
    });

    const allMembersList = Object.values(userMap);

    const result = allMembersList.map(u => ({
      _id: u._id,
      id: u._id,
      name: u.name || 'Member',
      email: u.email || '',
      phone: u.phone || '',
      place: u.place || u.address || '',
      address: u.address || u.place || '',
      totalCount: countMap[u._id.toString()] || 0,
      amount: countMap[u._id.toString()] || 0,
      createdAt: u.createdAt || new Date(),
    }));

    res.json(result);
  } catch (err) {
    console.error('List users error:', err);
    res.status(500).json({ error: 'Server error fetching tenant members' });
  }
});

// GET /api/admin/registrations - list registrations for req.tenant._id only (paginated)
router.get('/registrations', async (req, res) => {
  try {
    const tenantId = req.tenant ? req.tenant._id : req.user.tenantId;
    if (!tenantId) {
      return res.status(404).json({ error: 'Tenant context missing' });
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const query = { tenantId };
    if (req.query.status) {
      query.status = req.query.status;
    }

    const total = await Registration.countDocuments(query);
    const registrations = await Registration.find(query)
      .populate('userId', 'name email phone place address')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      total,
      registrations,
    });
  } catch (err) {
    console.error('List registrations error:', err);
    res.status(500).json({ error: 'Server error fetching registrations' });
  }
});

// PATCH /api/admin/registrations/:id - update a registration's data/status (scoped to own tenant)
router.patch('/registrations/:id', async (req, res) => {
  try {
    const tenantId = req.tenant ? req.tenant._id : req.user.tenantId;
    if (!tenantId) {
      return res.status(404).json({ error: 'Tenant context missing' });
    }

    // Must query with tenantId to enforce scoping and return 404 if belonging to another tenant
    const registration = await Registration.findOne({ _id: req.params.id, tenantId });

    if (!registration) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    const { status, data } = req.body;
    if (status) {
      registration.status = status;
    }
    if (data && typeof data === 'object') {
      registration.data = {
        ...(registration.data || {}),
        ...data,
      };
    }

    await registration.save();

    res.json({
      message: 'Registration updated successfully',
      registration,
    });
  } catch (err) {
    console.error('Update registration error:', err);
    res.status(500).json({ error: 'Server error updating registration' });
  }
});

// POST /api/admin/me/tenant/domain - submit custom domain and generate verification TXT instructions
router.post('/me/tenant/domain', async (req, res) => {
  try {
    const tenantId = req.tenant ? req.tenant._id : req.user?.tenantId;
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const rawDomain = req.body.customDomain || req.body.domain;
    if (!rawDomain || typeof rawDomain !== 'string') {
      return res.status(400).json({ error: 'Valid custom domain string is required' });
    }

    const domain = rawDomain.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '').trim();

    // Check if domain is already registered by another tenant
    const existing = await Tenant.findOne({ customDomain: domain, _id: { $ne: tenant._id } });
    if (existing) {
      return res.status(409).json({ error: 'This custom domain is already registered by another event team' });
    }

    // Reset verification status if domain changed or new
    const isNewDomain = tenant.customDomain !== domain;
    let token = isNewDomain ? null : (tenant.customDomainVerificationToken || tenant.settings?.domainVerificationToken);
    if (!token) {
      token = `verify_${crypto.randomBytes(16).toString('hex')}`;
    }

    tenant.customDomain = domain;
    tenant.customDomainVerified = isNewDomain ? false : tenant.customDomainVerified;
    tenant.customDomainVerificationToken = token;
    tenant.settings = {
      ...(tenant.settings || {}),
      domainVerificationToken: token,
    };

    await tenant.save();

    res.json({
      message: 'Custom domain saved. Please create the TXT DNS record in Hostinger to verify ownership.',
      customDomain: domain,
      dnsInfo: {
        txtRecordName: `_verify.${domain}`,
        txtRecordValue: token,
      },
      dnsRecord: {
        type: 'TXT',
        name: `_verify.${domain}`,
        value: token,
      },
    });
  } catch (err) {
    console.error('Submit domain error:', err);
    res.status(500).json({ error: 'Server error submitting custom domain' });
  }
});

// POST /api/admin/me/tenant/domain/verify - verify TXT DNS record
router.post('/me/tenant/domain/verify', async (req, res) => {
  try {
    const tenantId = req.tenant ? req.tenant._id : req.user?.tenantId;
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    if (!tenant.customDomain) {
      return res.status(400).json({ error: 'No custom domain submitted for verification' });
    }

    const expectedToken = tenant.customDomainVerificationToken || tenant.settings?.domainVerificationToken;
    if (!expectedToken) {
      return res.status(400).json({ error: 'Verification token missing. Please re-submit domain request.' });
    }

    const verifyHost = `_verify.${tenant.customDomain}`;
    const apexHost = tenant.customDomain;

    // Perform parallel DNS TXT lookups on _verify sub-name and apex domain
    const [verifyResults, apexResults] = await Promise.allSettled([
      dns.resolveTxt(verifyHost),
      dns.resolveTxt(apexHost),
    ]);

    const allTxtRecords = [];
    if (verifyResults.status === 'fulfilled') {
      allTxtRecords.push(...verifyResults.value.flat());
    }
    if (apexResults.status === 'fulfilled') {
      allTxtRecords.push(...apexResults.value.flat());
    }

    const cleanRecords = allTxtRecords.map((r) => String(r).trim().replace(/^"|"$/g, ''));

    const isMatched = cleanRecords.some(
      (rec) => rec === expectedToken || rec.includes(expectedToken) || expectedToken.includes(rec)
    );

    if (isMatched) {
      tenant.customDomainVerified = true;
      await tenant.save();
      return res.json({
        message: `Custom domain ${tenant.customDomain} verified and activated successfully!`,
        customDomain: tenant.customDomain,
        verified: true,
      });
    }

    // Strict Verification Failure - keep customDomainVerified = false
    tenant.customDomainVerified = false;
    await tenant.save();

    return res.status(400).json({
      error: `DNS TXT record verification failed for ${tenant.customDomain}. Could not find verification token at "_verify.${tenant.customDomain}". Please add the TXT record in Hostinger/Registrar DNS settings and allow 2-5 minutes for propagation.`,
      verified: false,
    });
  } catch (err) {
    console.error('Verify domain error:', err);
    res.status(500).json({ error: 'Server error verifying custom domain' });
  }
});

export default router;
