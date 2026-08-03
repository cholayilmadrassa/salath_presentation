import Tenant from '../models/Tenant.js';
import { PLATFORM_ROOT_DOMAIN } from '../config.js';

/**
 * Middleware to resolve the current tenant from request hostname, custom domain, or fallback header.
 * Attaches req.tenant if resolved.
 */
export async function resolveTenant(req, res, next) {
  try {
    const isPlatformRoute =
      req.path === '/' ||
      req.path.startsWith('/api/super-admin') ||
      req.path.startsWith('/api/auth/register-tenant') ||
      req.path.startsWith('/api/auth/login') ||
      req.path.startsWith('/api/events/public-approved') ||
      req.path.startsWith('/api/events/active-tenant');

    let rawHost = (req.headers['x-forwarded-host'] || req.headers.host || '').toString();
    const host = rawHost.split(':')[0].toLowerCase().trim();

    let tenant = null;

    // Check explicit header or query
    const headerSlug = req.headers['x-tenant-slug'] || req.query.tenantSlug;
    if (headerSlug) {
      tenant = await Tenant.findOne({ slug: String(headerSlug).toLowerCase().trim() });
    }

    if (!tenant && host) {
      const rootDomain = PLATFORM_ROOT_DOMAIN.toLowerCase().trim();
      const cleanHost = host.replace(/^www\./, '');

      // Check if host is a subdomain of root domain (e.g. noorulislam.localhost or team1.swalath.online)
      if (host !== rootDomain && host !== `www.${rootDomain}` && (host.endsWith(`.${rootDomain}`) || host.includes('.localhost'))) {
        const subdomainParts = host.split('.');
        const slug = subdomainParts[0];
        if (slug && slug !== 'www' && slug !== 'localhost' && slug !== '127') {
          tenant = await Tenant.findOne({ slug });
        }
      }

      // If still not found by subdomain, try custom domain match (supports example.com & www.example.com)
      if (!tenant && host !== rootDomain && host !== `www.${rootDomain}` && host !== 'localhost') {
        tenant = await Tenant.findOne({
          $or: [{ customDomain: host }, { customDomain: cleanHost }],
        });
      }
    }

    if (tenant) {
      if (tenant.status === 'suspended' || tenant.status === 'rejected') {
        if (!isPlatformRoute) {
          return res.status(403).json({ error: `Tenant account is currently ${tenant.status}` });
        }
      }
      req.tenant = tenant;
    }

    // Require tenant ONLY for strict event-scoped private endpoints
    const isPublicRoute =
      isPlatformRoute ||
      req.path.startsWith('/api/counts/leaderboard');

    const requiresTenant =
      (req.path.startsWith('/api/events') || req.path.startsWith('/api/admin/me')) &&
      !isPublicRoute;

    if (requiresTenant && !req.tenant) {
      return res.status(404).json({ error: 'Tenant not found for requested domain or slug' });
    }

    next();
  } catch (err) {
    console.error('Tenant resolution error:', err);
    next(err);
  }
}
