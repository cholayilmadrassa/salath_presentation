import express from 'express';
import dns from 'dns/promises';
import crypto from 'crypto';
import Tenant from '../models/Tenant.js';
import User from '../models/User.js';
import Registration from '../models/Registration.js';
import Count from '../models/Count.js';
import { requireAuth, requireRole, requireTenantMatch } from '../middleware/auth.js';
import { TARGET_A_RECORD, TARGET_CNAME_RECORD, VERCEL_AUTH_TOKEN, VERCEL_PROJECT_ID, VERCEL_TEAM_ID } from '../config.js';

const router = express.Router();

// Apply requireAuth, requireRole('tenant_admin', 'super_admin'), and requireTenantMatch
router.use(requireAuth, requireRole('tenant_admin', 'super_admin'), requireTenantMatch);

/**
 * Automatic Vercel API Domain Provisioning Helper
 */
async function addDomainToVercel(domain) {
  if (!VERCEL_AUTH_TOKEN || !VERCEL_PROJECT_ID) {
    console.log('[VERCEL AUTO-REGISTRATION]: Skipping. Set VERCEL_AUTH_TOKEN and VERCEL_PROJECT_ID in .env to enable automatic Vercel API domain provisioning.');
    return { success: false, reason: 'unconfigured' };
  }

  try {
    const url = `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/domains${VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : ''}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${VERCEL_AUTH_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: domain }),
    });

    const data = await response.json();
    if (!response.ok && data.error?.code !== 'domain_already_in_use') {
      console.warn('[VERCEL API WARNING]: Could not auto-register domain on Vercel:', data.error?.message || data);
      return { success: false, error: data.error?.message };
    }

    console.log(`[VERCEL API SUCCESS]: Successfully registered domain "${domain}" on Vercel project.`);
    return { success: true, data };
  } catch (err) {
    console.warn('[VERCEL API EXCEPTION]:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Verify Domain on Vercel Project via API
 */
async function verifyVercelDomain(domain) {
  if (!VERCEL_AUTH_TOKEN || !VERCEL_PROJECT_ID) {
    return { success: false, reason: 'unconfigured' };
  }

  try {
    const url = `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/domains/${domain}/verify${VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : ''}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${VERCEL_AUTH_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return { success: response.ok && (data.verified || data.name === domain), data };
  } catch (err) {
    console.warn('[VERCEL VERIFY EXCEPTION]:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Remove Domain from Vercel Project via API
 */
async function removeDomainFromVercel(domain) {
  if (!VERCEL_AUTH_TOKEN || !VERCEL_PROJECT_ID) {
    console.log('[VERCEL AUTO-DELETION]: Skipping. Set VERCEL_AUTH_TOKEN and VERCEL_PROJECT_ID in .env to enable automatic Vercel API domain removal.');
    return { success: false, reason: 'unconfigured' };
  }

  try {
    const url = `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/domains/${domain}${VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : ''}`;
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${VERCEL_AUTH_TOKEN}`,
      },
    });

    const data = await response.json();
    if (!response.ok) {
      console.warn(`[VERCEL API WARNING]: Could not remove domain "${domain}" on Vercel:`, data.error?.message || data);
      return { success: false, error: data.error?.message };
    }

    console.log(`[VERCEL API SUCCESS]: Successfully removed domain "${domain}" from Vercel project.`);
    return { success: true, data };
  } catch (err) {
    console.warn('[VERCEL API DELETION EXCEPTION]:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Domain Normalization & Strict Validation Helper
 */
function validateDomainName(rawDomain) {
  if (!rawDomain || typeof rawDomain !== 'string') {
    return { valid: false, error: 'Domain name is required' };
  }

  const domain = rawDomain
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/.*$/, '')
    .replace(/:\d+$/, '')
    .trim();

  if (!domain) {
    return { valid: false, error: 'Domain name cannot be empty' };
  }

  // Reject localhost & IP addresses (IPv4 & IPv6)
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Regex.test(domain) || domain === 'localhost' || domain === '127.0.0.1') {
    return { valid: false, error: 'IP addresses and localhost cannot be used as custom domains' };
  }

  // Reject internal / reserved TLDs
  const reservedTlds = ['.local', '.internal', '.lan', '.home', '.test', '.example', '.invalid', '.localhost'];
  if (reservedTlds.some((tld) => domain.endsWith(tld))) {
    return { valid: false, error: 'Private, internal, or reserved TLD domains are not supported' };
  }

  // Enforce standard domain hostname format (e.g. example.com)
  const domainRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/i;
  if (!domainRegex.test(domain)) {
    return { valid: false, error: 'Invalid domain format. Example: example.com' };
  }

  return { valid: true, domain };
}

/**
 * Rate Limiter for Verification Operations (max 5 per minute per tenant)
 */
function checkVerificationRateLimit(tenant) {
  const now = new Date();
  const windowMs = 60 * 1000; // 60 seconds
  const maxAttempts = 5;

  if (tenant.lastVerifyAttemptAt && (now - new Date(tenant.lastVerifyAttemptAt)) < windowMs) {
    if ((tenant.verifyAttemptsCount || 0) >= maxAttempts) {
      const waitSeconds = Math.ceil((windowMs - (now - new Date(tenant.lastVerifyAttemptAt))) / 1000);
      return { allowed: false, error: `Too many verification attempts. Please wait ${waitSeconds} seconds.` };
    }
    tenant.verifyAttemptsCount = (tenant.verifyAttemptsCount || 0) + 1;
  } else {
    tenant.lastVerifyAttemptAt = now;
    tenant.verifyAttemptsCount = 1;
  }
  return { allowed: true };
}

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

    const tenantObj = tenant.toObject();
    if (tenant.customDomain) {
      tenantObj.requiredDnsConfig = {
        txtRecord: {
          type: 'TXT',
          name: '_verify',
          fqdn: `_verify.${tenant.customDomain}`,
          value: tenant.customDomainVerificationToken || tenant.settings?.domainVerificationToken || '',
        },
        aRecord: {
          type: 'A',
          name: '@',
          value: TARGET_A_RECORD,
        },
        cnameRecord: {
          type: 'CNAME',
          name: 'www',
          value: TARGET_CNAME_RECORD,
        },
      };
    }

    res.json(tenantObj);
  } catch (err) {
    console.error('Get me tenant error:', err);
    res.status(500).json({ error: 'Server error retrieving tenant record' });
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

// GET /api/admin/users/:userId/counts - get member history for a specific user under tenant
router.get('/users/:userId/counts', async (req, res) => {
  try {
    const tenantId = req.tenant ? req.tenant._id : req.user.tenantId;
    const filter = { user: req.params.userId };
    if (tenantId) {
      filter.tenantId = tenantId;
    }

    const items = await Count.find(filter).sort({ date: -1, createdAt: -1 });
    const totalCount = items.reduce((sum, item) => sum + (Number(item.value) || 0), 0);
    res.json({
      totalCount,
      items,
    });
  } catch (err) {
    console.error('Get user counts error:', err);
    res.status(500).json({ error: 'Server error fetching user counts' });
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

    const { valid, domain, error } = validateDomainName(req.body.customDomain || req.body.domain);
    if (!valid) {
      return res.status(400).json({ error });
    }

    // Check if domain is already registered by another tenant
    const existing = await Tenant.findOne({ customDomain: domain, _id: { $ne: tenant._id } });
    if (existing) {
      return res.status(409).json({ error: 'This custom domain is already registered by another organization' });
    }

    // Reset verification & connection statuses if domain changed or new
    const isNewDomain = tenant.customDomain !== domain;
    let token = (isNewDomain ? null : (tenant.customDomainVerificationToken || tenant.settings?.domainVerificationToken)) || null;
    if (!token) {
      token = `verify_${crypto.randomBytes(16).toString('hex')}`;
    }

    tenant.customDomain = domain;
    tenant.customDomainVerified = isNewDomain ? false : tenant.customDomainVerified;
    tenant.customDomainConnected = isNewDomain ? false : tenant.customDomainConnected;
    tenant.customDomainVerificationToken = token;
    tenant.settings = {
      ...(tenant.settings || {}),
      domainVerificationToken: token,
    };

    await tenant.save();

    // Trigger automatic Vercel API domain provisioning (non-blocking)
    addDomainToVercel(domain).catch((err) => console.warn('Vercel auto-registration error:', err));
    addDomainToVercel(`www.${domain}`).catch((err) => console.warn('Vercel www auto-registration error:', err));

    res.json({
      message: 'Custom domain saved. Please configure the required DNS records below.',
      customDomain: domain,
      customDomainVerified: tenant.customDomainVerified,
      customDomainConnected: tenant.customDomainConnected,
      requiredDnsConfig: {
        txtRecord: {
          type: 'TXT',
          name: '_verify',
          fqdn: `_verify.${domain}`,
          value: token,
        },
        aRecord: {
          type: 'A',
          name: '@',
          value: TARGET_A_RECORD,
        },
        cnameRecord: {
          type: 'CNAME',
          name: 'www',
          value: TARGET_CNAME_RECORD,
        },
      },
    });
  } catch (err) {
    console.error('Submit domain error:', err);
    res.status(500).json({ error: 'Server error submitting custom domain' });
  }
});

// POST /api/admin/me/tenant/domain/verify - verify TXT DNS record for ownership
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

    // Rate Limiting Check
    const rateCheck = checkVerificationRateLimit(tenant);
    await tenant.save();
    if (!rateCheck.allowed) {
      return res.status(429).json({ error: rateCheck.error });
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

    const isTxtMatched = cleanRecords.some(
      (rec) => (expectedToken && (rec === expectedToken || rec.includes(expectedToken) || expectedToken.includes(rec))) || rec.startsWith('verify_')
    );

    // Also attempt verification directly via Vercel REST API
    const vercelVerification = await verifyVercelDomain(tenant.customDomain);
    const isVercelMatched = vercelVerification.success;

    const isMatched = isTxtMatched || isVercelMatched;

    if (isMatched) {
      tenant.customDomainVerified = true;

      // Check if DNS A Record actually resolves to target IP
      const targetIp = TARGET_A_RECORD || '76.76.21.21';
      const [aResults] = await Promise.allSettled([dns.resolve4(tenant.customDomain)]);
      const hasTargetIp = aResults.status === 'fulfilled' && Array.isArray(aResults.value) && aResults.value.includes(targetIp);
      
      tenant.customDomainConnected = hasTargetIp;
      await tenant.save();

      return res.json({
        message: tenant.customDomainConnected
          ? `✓ Custom domain ${tenant.customDomain} connected & active!`
          : `Ownership verified for ${tenant.customDomain}! Next, point your domain A Record (@) to ${targetIp}.`,
        customDomain: tenant.customDomain,
        customDomainVerified: true,
        customDomainConnected: tenant.customDomainConnected,
        ownershipStatus: 'Ownership Verified',
      });
    }

    // Verification Failure
    tenant.customDomainVerified = false;
    tenant.customDomainConnected = false;
    await tenant.save();

    return res.status(400).json({
      error: `Ownership verification pending for ${tenant.customDomain}. Could not find verification token at "_verify.${tenant.customDomain}". Please add the TXT or A record in your DNS settings and allow 2-5 minutes for propagation.`,
      customDomainVerified: false,
      customDomainConnected: false,
      ownershipStatus: 'Pending Verification',
    });
  } catch (err) {
    console.error('Verify domain error:', err);
    res.status(500).json({ error: 'Server error verifying custom domain' });
  }
});

// POST /api/admin/me/tenant/domain/check-connection - verify traffic DNS A/CNAME record setup
router.post('/me/tenant/domain/check-connection', async (req, res) => {
  try {
    const tenantId = req.tenant ? req.tenant._id : req.user?.tenantId;
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    if (!tenant.customDomain) {
      return res.status(400).json({ error: 'No custom domain submitted' });
    }

    // Rate Limiting Check
    const rateCheck = checkVerificationRateLimit(tenant);
    await tenant.save();
    if (!rateCheck.allowed) {
      return res.status(429).json({ error: rateCheck.error });
    }

    const domain = tenant.customDomain;
    const targetIp = TARGET_A_RECORD || '76.76.21.21';
    const targetCname = TARGET_CNAME_RECORD || 'cname.vercel-dns.com';

    // Perform parallel DNS lookups & Vercel API check
    const [aResults, cnameResults, vercelRes] = await Promise.allSettled([
      dns.resolve4(domain),
      dns.resolveCname(`www.${domain}`),
      verifyVercelDomain(domain),
    ]);

    const hasTargetIp = aResults.status === 'fulfilled' && Array.isArray(aResults.value) && aResults.value.includes(targetIp);
    const hasTargetCname = cnameResults.status === 'fulfilled' && Array.isArray(cnameResults.value) && cnameResults.value.some(c => String(c).toLowerCase().includes(targetCname.toLowerCase()));
    const isVercelVerified = vercelRes.status === 'fulfilled' && vercelRes.value.data?.verified === true;

    const isConnected = hasTargetIp || hasTargetCname || isVercelVerified;

    if (isConnected) {
      tenant.customDomainVerified = true;
      tenant.customDomainConnected = true;
      await tenant.save();
      return res.json({
        message: `✓ Domain Connected! ${domain} is live and active.`,
        customDomain: domain,
        customDomainVerified: true,
        customDomainConnected: true,
        connectionStatus: 'Connected & Active',
      });
    }

    tenant.customDomainConnected = false;
    await tenant.save();

    return res.status(400).json({
      error: `DNS Check Pending for ${domain}. Could not detect A Record pointing to ${targetIp} on global DNS. Please allow 5-15 minutes for Hostinger TTL (14400) propagation.`,
      customDomainVerified: tenant.customDomainVerified,
      customDomainConnected: false,
      connectionStatus: 'DNS Configuration Required',
    });
  } catch (err) {
    console.error('Check connection error:', err);
    res.status(500).json({ error: 'Server error checking domain DNS connection' });
  }
});

// DELETE /api/admin/me/tenant/domain - cancel and remove custom domain
router.delete('/me/tenant/domain', async (req, res) => {
  try {
    const tenantId = req.tenant ? req.tenant._id : req.user?.tenantId;
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    if (!tenant.customDomain) {
      return res.status(400).json({ error: 'No custom domain is currently configured for this event team' });
    }

    const domainToRemove = tenant.customDomain;

    // Reset custom domain fields
    tenant.customDomain = null;
    tenant.customDomainVerified = false;
    tenant.customDomainConnected = false;
    tenant.customDomainVerificationToken = null;
    if (tenant.settings) {
      tenant.settings.domainVerificationToken = null;
    }

    await tenant.save();

    // Trigger automatic Vercel API domain removal (non-blocking)
    removeDomainFromVercel(domainToRemove).catch((err) => console.warn('Vercel auto-removal error:', err));
    removeDomainFromVercel(`www.${domainToRemove}`).catch((err) => console.warn('Vercel www auto-removal error:', err));

    return res.json({
      message: `Custom domain "${domainToRemove}" has been cancelled and removed successfully.`,
      customDomain: null,
      customDomainVerified: false,
      customDomainConnected: false,
    });
  } catch (err) {
    console.error('Cancel domain error:', err);
    res.status(500).json({ error: 'Server error cancelling custom domain' });
  }
});

export default router;

